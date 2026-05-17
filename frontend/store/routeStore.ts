import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaceFeature } from '@/types/place';

interface RouteState {
  route: PlaceFeature[];
  addPlace: (place: PlaceFeature) => void;
  removePlace: (placeId: number) => void;
  reorderPlaces: (newRoute: PlaceFeature[]) => void;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      route: [],
      addPlace: (place) =>
        set((state) => {
          if (state.route.some((p) => p.id === place.id)) return state;
          return { route: [...state.route, place] };
        }),
      removePlace: (placeId) =>
        set((state) => ({
          route: state.route.filter((p) => p.id !== placeId),
        })),
      reorderPlaces: (newRoute) => set({ route: newRoute }),
      clearRoute: () => set({ route: [] }),
    }),
    {
      name: 'walkway-route-storage',
    }
  )
);
