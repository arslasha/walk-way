"use client";

import { create } from "zustand";

export interface FriendUser {
  id: number;
  nickname: string;
  bio: string;
  avatar: string | null;
}

export interface Friendship {
  id: number;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  created_at: string;
  friend?: FriendUser; // for friends-list API
  direction?: "incoming" | "outgoing"; // for requests API
  user?: FriendUser; // for requests API
}

export interface PublicProfile {
  nickname: string;
  bio: string;
  avatar: string | null;
  friendship_status: "accepted" | "blocked" | "pending_sent" | "pending_received" | null;
  friendship_id: number | null;
  collections: any[];
}

interface SocialState {
  friends: Friendship[];
  requests: Friendship[];
  searchResults: PublicProfile[];
  currentProfile: PublicProfile | null;
  isLoading: boolean;
  error: string | null;

  clearError: () => void;
  fetchFriends: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  searchProfiles: (query: string) => Promise<void>;
  fetchPublicProfile: (nickname: string) => Promise<PublicProfile | null>;
  sendFriendRequest: (toUserId: number) => Promise<boolean>;
  respondToRequest: (friendshipId: number, action: "accept" | "decline") => Promise<boolean>;
  blockUser: (toUserId: number) => Promise<boolean>;
  removeFriendship: (friendshipId: number) => Promise<boolean>;
}

const getApiUrl = (path: string) => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  return `${envUrl.replace(/\/$/, "")}${path}`;
};

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("walkway_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  requests: [],
  searchResults: [],
  currentProfile: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/friends/"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Не удалось загрузить список друзей");
      const data = await res.json();
      set({ friends: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/friends/requests/"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Не удалось загрузить запросы в друзья");
      const data = await res.json();
      set({ requests: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  searchProfiles: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl(`/profiles/search/?q=${encodeURIComponent(query)}`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Ошибка поиска пользователей");
      const data = await res.json();
      set({ searchResults: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchPublicProfile: async (nickname) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl(`/profiles/${encodeURIComponent(nickname)}/`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Профиль не найден");
        }
        throw new Error("Не удалось загрузить профиль");
      }
      const data = await res.json();
      set({ currentProfile: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false, currentProfile: null });
      return null;
    }
  },

  sendFriendRequest: async (toUserId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/friends/request/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ to_user_id: toUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить запрос");
      
      // Refresh queries
      await get().fetchRequests();
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  respondToRequest: async (friendshipId, action) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/friends/respond/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ friendship_id: friendshipId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось ответить на запрос");

      // Refresh queries
      await Promise.all([get().fetchFriends(), get().fetchRequests()]);
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  blockUser: async (toUserId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/friends/block/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ to_user_id: toUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось заблокировать пользователя");

      // Refresh queries
      await Promise.all([get().fetchFriends(), get().fetchRequests()]);
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  removeFriendship: async (friendshipId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl(`/friends/${friendshipId}/`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось удалить связь");

      // Refresh queries
      await Promise.all([get().fetchFriends(), get().fetchRequests()]);
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
}));
