"use client";

import { create } from "zustand";

export interface PlaceInCollection {
  id: number;
  title: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  places_count: number;
  owner_nickname: string;
  created_at: string;
  places?: PlaceInCollection[];
}

interface CollectionState {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;

  fetchCollections: () => Promise<void>;
  createCollection: (name: string, description: string, isPublic: boolean) => Promise<Collection | null>;
  deleteCollection: (id: number) => Promise<boolean>;
  addPlace: (collectionId: number, placeId: number) => Promise<boolean>;
  removePlace: (collectionId: number, placeId: number) => Promise<boolean>;
  getCollectionsForPlace: (placeId: number) => number[];
  clearError: () => void;
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

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/collections/"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Не удалось загрузить коллекции");
      const data = await res.json();
      set({ collections: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createCollection: async (name, description, isPublic) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/collections/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, description, is_public: isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.name?.[0] || "Ошибка создания коллекции");
      set((state) => ({
        collections: [data, ...state.collections],
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  deleteCollection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl(`/collections/${id}/`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Не удалось удалить коллекцию");
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  addPlace: async (collectionId, placeId) => {
    try {
      const res = await fetch(getApiUrl(`/collections/${collectionId}/add-place/`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ place_id: placeId }),
      });
      if (!res.ok) throw new Error("Не удалось добавить место");
      // Update local places_count optimistically
      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === collectionId ? { ...c, places_count: c.places_count + 1 } : c
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },

  removePlace: async (collectionId, placeId) => {
    try {
      const res = await fetch(getApiUrl(`/collections/${collectionId}/remove-place/`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ place_id: placeId }),
      });
      if (!res.ok) throw new Error("Не удалось удалить место");
      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                places_count: Math.max(0, c.places_count - 1),
                places: c.places?.filter((p) => p.id !== placeId),
              }
            : c
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },

  getCollectionsForPlace: (placeId) => {
    return get()
      .collections.filter((c) => c.places?.some((p) => p.id === placeId))
      .map((c) => c.id);
  },
}));
