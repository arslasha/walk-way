import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaceFeature } from '@/types/place';
import { getPlaces, calculateRoute, calculateLoopRoute, getPlacesAlongRoute } from '@/lib/api';

function calculateSimulatedRouteMetrics(route: PlaceFeature[]) {
  if (route.length < 2) {
    return {
      distance: 0,
      duration: 0,
      steps: 0,
    };
  }

  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i].geometry.coordinates;
    const p2 = route[i + 1].geometry.coordinates;

    const R = 6371;
    const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
    const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1[1] * Math.PI) / 180) *
        Math.cos((p2[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    totalDistance += d;
  }

  const adjustedDistance = totalDistance * 1.25;
  const durationMinutes = Math.round((adjustedDistance / 4.8) * 60);
  const totalSteps = Math.round(adjustedDistance * 1350);

  return {
    distance: parseFloat(adjustedDistance.toFixed(1)),
    duration: durationMinutes,
    steps: totalSteps,
  };
}

interface RouteState {
  route: PlaceFeature[];
  routeGeometry: any | null;
  distance: number;
  duration: number;
  steps: number;
  alongRoutePlaces: PlaceFeature[];
  isCalculatingRoute: boolean;
  isFetchingAlongRoute: boolean;
  isLoopRoute: boolean;
  loopDurationMinutes: number;
  
  addPlace: (place: PlaceFeature) => void;
  removePlace: (placeId: number) => void;
  reorderPlaces: (newRoute: PlaceFeature[]) => void;
  clearRoute: () => void;
  setLoopMode: (isLoop: boolean, durationMinutes?: number) => void;
  fetchRouteDetails: () => Promise<void>;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      route: [],
      routeGeometry: null,
      distance: 0,
      duration: 0,
      steps: 0,
      alongRoutePlaces: [],
      isCalculatingRoute: false,
      isFetchingAlongRoute: false,
      isLoopRoute: false,
      loopDurationMinutes: 60, // default 1 hour

      addPlace: (place) => {
        set((state) => {
          if (state.route.some((p) => p.id === place.id)) return state;
          return { route: [...state.route, place] };
        });
        get().fetchRouteDetails();
      },

      removePlace: (placeId) => {
        set((state) => ({
          route: state.route.filter((p) => p.id !== placeId),
        })),
        get().fetchRouteDetails();
      },

      reorderPlaces: (newRoute) => {
        set({ route: newRoute });
        get().fetchRouteDetails();
      },

      clearRoute: () => {
        set({
          route: [],
          routeGeometry: null,
          distance: 0,
          duration: 0,
          steps: 0,
          alongRoutePlaces: [],
          isCalculatingRoute: false,
          isFetchingAlongRoute: false,
          // Loop mode persists, but route clears
        });
      },

      setLoopMode: (isLoop, durationMinutes) => {
        set((state) => ({
          isLoopRoute: isLoop,
          loopDurationMinutes: durationMinutes || state.loopDurationMinutes,
        }));
        get().fetchRouteDetails();
      },

      fetchRouteDetails: async () => {
        const { route, isLoopRoute, loopDurationMinutes } = get();
        
        if (route.length === 0) {
          set({
            routeGeometry: null,
            distance: 0,
            duration: 0,
            steps: 0,
            alongRoutePlaces: [],
            isCalculatingRoute: false,
            isFetchingAlongRoute: false,
          });
          return;
        }

        // Loop Route Logic
        if (isLoopRoute && route.length >= 1) {
          set({ isCalculatingRoute: true, isFetchingAlongRoute: false });
          try {
            const firstPlace = route[0];
            const [lon, lat] = firstPlace.geometry.coordinates;
            // estimate distance in meters: 4.8 km/h speed
            const targetDistanceMeters = (loopDurationMinutes / 60) * 4800;
            
            const loopData = await calculateLoopRoute({
              startCoords: [lon, lat],
              distance: targetDistanceMeters,
            });

            // Set the new looped route, preserving the first place but appending the generated ones
            // ORS loop returns multiple places, we just display them all as part of the route.
            const newRoute = [firstPlace, ...loopData.places];

            set({
              route: newRoute,
              routeGeometry: loopData.route.geometry,
              distance: parseFloat((loopData.route.distance / 1000).toFixed(1)),
              duration: Math.round(loopData.route.duration / 60),
              steps: Math.round((loopData.route.distance / 1000) * 1350),
              isCalculatingRoute: false,
              alongRoutePlaces: [], // along-route logic typically not used for loops right away
            });
          } catch (error) {
            console.error("Error calculating loop route:", error);
            set({ isCalculatingRoute: false });
          }
          return;
        }

        // If exactly 1 point, do a radial search around that point as a fallback
        if (route.length === 1) {
          set({
            routeGeometry: null,
            distance: 0,
            duration: 0,
            steps: 0,
            isCalculatingRoute: false,
            isFetchingAlongRoute: true,
          });
          try {
            const firstPlace = route[0];
            const [lon, lat] = firstPlace.geometry.coordinates;
            const placesData = await getPlaces({ lat, lon, radius: 1500 });
            const features = (placesData.features || []).filter((p) => p.id !== firstPlace.id);
            set({
              alongRoutePlaces: features,
              isFetchingAlongRoute: false,
            });
          } catch (error) {
            console.error("Error fetching radial places:", error);
            set({
              alongRoutePlaces: [],
              isFetchingAlongRoute: false,
            });
          }
          return;
        }

        // If >= 2 points, calculate the actual walking route and fetch recommendations along it
        set({ isCalculatingRoute: true, isFetchingAlongRoute: true });
        try {
          const placeIds = route.map((p) => p.id);
          const routeInfo = await calculateRoute(placeIds);
          
          set({
            routeGeometry: routeInfo.geometry,
            distance: parseFloat((routeInfo.distance / 1000).toFixed(1)), // convert meters to km
            duration: Math.round(routeInfo.duration / 60), // convert seconds to minutes
            steps: Math.round((routeInfo.distance / 1000) * 1350), // estimate steps
            isCalculatingRoute: false,
          });

          // Fetch places along route within 250m
          const alongPlaces = await getPlacesAlongRoute(
            routeInfo.geometry,
            250, // 250m buffer
            placeIds
          );
          
          set({
            alongRoutePlaces: alongPlaces.features || [],
            isFetchingAlongRoute: false,
          });
        } catch (error) {
          console.error("Error fetching route details from backend:", error);
          // Fallback to simulated metrics if API fails or offline
          const simulated = calculateSimulatedRouteMetrics(route);
          set({
            routeGeometry: null,
            distance: simulated.distance,
            duration: simulated.duration,
            steps: simulated.steps,
            alongRoutePlaces: [],
            isCalculatingRoute: false,
            isFetchingAlongRoute: false,
          });
        }
      },
    }),
    {
      name: 'walkway-route-storage',
      partialize: (state) => ({ route: state.route }),
      onRehydrateStorage: () => (state) => {
        state?.fetchRouteDetails();
      }
    }
  )
);

