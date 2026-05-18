import { create } from "zustand";

export interface User {
  email: string;
  username: string;
  nickname: string;
  bio: string;
  avatar: string | null;
  is_2fa_enabled: boolean;
}

export interface TwoFactorEnableResponse {
  otp_secret: string;
  otp_uri: string;
  backup_codes: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  twoFactorRequired: boolean;
  preAuthToken: string | null;
  qrCodeData: TwoFactorEnableResponse | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  verify2FA: (code: string) => Promise<boolean>;
  register: (email: string, password: string, nickname: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (nickname: string, bio: string, avatar: File | null) => Promise<boolean>;
  enable2FA: () => Promise<TwoFactorEnableResponse | null>;
  confirm2FA: (code: string) => Promise<boolean>;
  disable2FA: (password: string, code: string) => Promise<boolean>;
  clearError: () => void;
}

const getApiUrl = (path: string) => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  return `${envUrl.replace(/\/$/, "")}${path}`;
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Helper for authenticated requests with auto-refresh
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = get().accessToken;
    
    // Attempt refresh if token looks missing but refresh token exists
    if (!token && get().refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = get().accessToken;
      }
    }

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(url, { ...options, headers });

    // Handle token expired (401 Unauthorized)
    if (res.status === 401 && get().refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newHeaders = new Headers(options.headers || {});
        newHeaders.set("Authorization", `Bearer ${get().accessToken}`);
        return fetch(url, { ...options, headers: newHeaders });
      }
    }

    return res;
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    const refresh = get().refreshToken;
    if (!refresh) return false;

    try {
      const res = await fetch(getApiUrl("/auth/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        const access = data.access;
        localStorage.setItem("walkway_access_token", access);
        set({ accessToken: access, isAuthenticated: true });
        return true;
      } else {
        // Refresh token invalid or expired
        get().logout();
        return false;
      }
    } catch {
      return false;
    }
  };

  return {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    twoFactorRequired: false,
    preAuthToken: null,
    qrCodeData: null,

    clearError: () => set({ error: null }),

    initialize: async () => {
      if (typeof window === "undefined") return;
      
      const access = localStorage.getItem("walkway_access_token");
      const refresh = localStorage.getItem("walkway_refresh_token");

      if (access && refresh) {
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
        try {
          await get().fetchProfile();
        } catch {
          // If fetch fails, try to refresh
          const success = await refreshAccessToken();
          if (success) {
            await get().fetchProfile();
          }
        }
      }
    },

    login: async (email, password) => {
      set({ isLoading: true, error: null, twoFactorRequired: false, preAuthToken: null });
      try {
        const res = await fetch(getApiUrl("/auth/login/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || data.error || "Неверный email или пароль");
        }

        if (data.2fa_required || data.two_factor_required) {
          set({
            twoFactorRequired: true,
            preAuthToken: data.pre_auth_token,
            isLoading: false,
          });
          return false;
        }

        const { access, refresh } = data.tokens;
        localStorage.setItem("walkway_access_token", access);
        localStorage.setItem("walkway_refresh_token", refresh);

        set({
          accessToken: access,
          refreshToken: refresh,
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });

        return true;
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        return false;
      }
    },

    verify2FA: async (code) => {
      const preAuthToken = get().preAuthToken;
      if (!preAuthToken) {
        set({ error: "Сессия истекла, войдите заново" });
        return false;
      }

      set({ isLoading: true, error: null });
      try {
        const res = await fetch(getApiUrl("/auth/2fa/verify/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pre_auth_token: preAuthToken, code }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Неверный код подтверждения");
        }

        const { access, refresh } = data.tokens;
        localStorage.setItem("walkway_access_token", access);
        localStorage.setItem("walkway_refresh_token", refresh);

        set({
          accessToken: access,
          refreshToken: refresh,
          user: data.user,
          isAuthenticated: true,
          twoFactorRequired: false,
          preAuthToken: null,
          isLoading: false,
        });

        return true;
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        return false;
      }
    },

    register: async (email, password, nickname) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(getApiUrl("/auth/register/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, nickname }),
        });

        const data = await res.json();

        if (!res.ok) {
          // If we receive a dict of validation errors
          if (typeof data === "object") {
            const keys = Object.keys(data);
            if (keys.length > 0) {
              const msg = data[keys[0]];
              throw new Error(Array.isArray(msg) ? msg[0] : msg);
            }
          }
          throw new Error("Не удалось зарегистрироваться");
        }

        // Successfully registered, now log in automatically
        set({ isLoading: false });
        return get().login(email, password);
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        return false;
      }
    },

    logout: async () => {
      const refresh = get().refreshToken;
      if (refresh) {
        try {
          await fetch(getApiUrl("/auth/logout/"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          });
        } catch {
          // Ignore logout api errors to ensure local clean logout
        }
      }

      localStorage.removeItem("walkway_access_token");
      localStorage.removeItem("walkway_refresh_token");

      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        twoFactorRequired: false,
        preAuthToken: null,
        qrCodeData: null,
        error: null,
      });
    },

    fetchProfile: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetchWithAuth(getApiUrl("/profiles/me/"));
        if (!res.ok) {
          throw new Error("Не удалось загрузить данные профиля");
        }
        const data = await res.json();
        set({ user: data, isLoading: false });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        throw err;
      }
    },

    updateProfile: async (nickname, bio, avatar) => {
      set({ isLoading: true, error: null });
      try {
        const formData = new FormData();
        formData.append("nickname", nickname);
        formData.append("bio", bio);
        if (avatar) {
          formData.append("avatar", avatar);
        }

        const res = await fetchWithAuth(getApiUrl("/profiles/me/"), {
          method: "PATCH",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          if (typeof data === "object") {
            const keys = Object.keys(data);
            if (keys.length > 0) {
              const msg = data[keys[0]];
              throw new Error(Array.isArray(msg) ? msg[0] : msg);
            }
          }
          throw new Error("Не удалось обновить профиль");
        }

        set({ user: data, isLoading: false });
        return true;
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        return false;
      }
    },

    enable2FA: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetchWithAuth(getApiUrl("/profiles/me/2fa/enable/"), {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Не удалось настроить 2FA");
        }

        set({ qrCodeData: data, isLoading: false });
        return data;
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        return null;
      }
    },

    confirm2FA: async (code) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetchWithAuth(getApiUrl("/profiles/me/2fa/confirm/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Неверный код подтверждения");
        }

        // Successfully confirmed, fetch fresh profile to update is_2fa_enabled
        await get().fetchProfile();
        set({ qrCodeData: null, isLoading: false });
        return true;
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        return false;
      }
    },

    disable2FA: async (password, code) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetchWithAuth(getApiUrl("/profiles/me/2fa/disable/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, code }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Не удалось отключить 2FA");
        }

        await get().fetchProfile();
        set({ isLoading: false });
        return true;
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        return false;
      }
    },
  };
});
