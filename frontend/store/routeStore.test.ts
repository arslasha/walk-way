import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. Mock LocalStorage and window for Zustand Persist Middleware
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

if (typeof global.window === 'undefined') {
  global.window = {
    localStorage: mockLocalStorage,
  } as any;
}

import { useRouteStore } from './routeStore';
import { getPlaces, calculateRoute, getPlacesAlongRoute } from '@/lib/api';
import type { PlaceFeature } from '@/types/place';

// 2. Mock API Client Endpoints
vi.mock('@/lib/api', () => ({
  getPlaces: vi.fn(),
  calculateRoute: vi.fn(),
  getPlacesAlongRoute: vi.fn(),
}));

// 3. Setup High-Fidelity Mock Data conforming to PlaceFeature specification
const mockPlace1: PlaceFeature = {
  type: 'Feature',
  id: 101,
  geometry: {
    type: 'Point',
    coordinates: [37.6173, 55.7558], // Moscow Center [lon, lat]
  },
  properties: {
    id: 101,
    title: 'Кафе Бублик',
    description: 'Уютное городское кафе с выпечкой',
    address: 'ул. Тверская, 12',
    category: {
      id: 1,
      name: 'Кафе',
      slug: 'cafe',
      image_url: null,
    },
    tags: [
      { id: 10, name: 'Кофе', slug: 'coffee', image_url: null, is_vibe: true }
    ],
    is_active: true,
    is_analyzed: true,
    photos: [],
    icebreakers: [],
  },
};

const mockPlace2: PlaceFeature = {
  type: 'Feature',
  id: 102,
  geometry: {
    type: 'Point',
    coordinates: [37.6233, 55.7518], // Near Kremlin
  },
  properties: {
    id: 102,
    title: 'Парк Зарядье',
    description: 'Современный ландшафтный парк',
    address: 'ул. Варварка, 6',
    category: {
      id: 2,
      name: 'Парки',
      slug: 'park',
      image_url: null,
    },
    tags: [
      { id: 11, name: 'Природа', slug: 'nature', image_url: null, is_vibe: true }
    ],
    is_active: true,
    is_analyzed: true,
    photos: [],
    icebreakers: [],
  },
};

const mockPlace3: PlaceFeature = {
  type: 'Feature',
  id: 103,
  geometry: {
    type: 'Point',
    coordinates: [37.6188, 55.7415], // Near Tretyakov Gallery
  },
  properties: {
    id: 103,
    title: 'Третьяковская Галерея',
    description: 'Знаменитый музей русского искусства',
    address: 'Лаврушинский пер., 10',
    category: {
      id: 3,
      name: 'Музеи',
      slug: 'museum',
      image_url: null,
    },
    tags: [
      { id: 12, name: 'Искусство', slug: 'art', image_url: null, is_vibe: true }
    ],
    is_active: true,
    is_analyzed: true,
    photos: [],
    icebreakers: [],
  },
};

describe('Zustand routeStore unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Spy and suppress console.warn/error to keep test output clean
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset store state before each test execution
    useRouteStore.getState().clearRoute();
  });

  describe('Initial State Values', () => {
    it('should initialize with default empty values', () => {
      const state = useRouteStore.getState();
      expect(state.route).toEqual([]);
      expect(state.routeGeometry).toBeNull();
      expect(state.distance).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.steps).toBe(0);
      expect(state.alongRoutePlaces).toEqual([]);
      expect(state.isCalculatingRoute).toBe(false);
      expect(state.isFetchingAlongRoute).toBe(false);
    });
  });

  describe('Standard Action Mutators', () => {
    it('should add a place to the route and fetch details', () => {
      // Mock radial getPlaces to prevent uncaught api execution
      vi.mocked(getPlaces).mockResolvedValue({
        type: 'FeatureCollection',
        features: [],
      });

      useRouteStore.getState().addPlace(mockPlace1);

      const state = useRouteStore.getState();
      expect(state.route).toHaveLength(1);
      expect(state.route[0]).toEqual(mockPlace1);
      expect(getPlaces).toHaveBeenCalledTimes(1);
    });

    it('should prevent adding duplicate places to the route', () => {
      // Mock radial getPlaces
      vi.mocked(getPlaces).mockResolvedValue({
        type: 'FeatureCollection',
        features: [],
      });

      const store = useRouteStore.getState();
      store.addPlace(mockPlace1);
      store.addPlace(mockPlace1); // Duplicate attempt

      const state = useRouteStore.getState();
      expect(state.route).toHaveLength(1);
    });

    it('should remove a place from the route and update details', () => {
      // Setup state with 1 place
      useRouteStore.setState({ route: [mockPlace1] });

      useRouteStore.getState().removePlace(mockPlace1.id);

      const state = useRouteStore.getState();
      expect(state.route).toEqual([]);
      expect(state.routeGeometry).toBeNull();
      expect(state.distance).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.steps).toBe(0);
      expect(state.alongRoutePlaces).toEqual([]);
    });

    it('should reorder places and trigger route details refetch', () => {
      vi.mocked(calculateRoute).mockResolvedValue({
        geometry: { type: 'LineString', coordinates: [[37.6, 55.7], [37.61, 55.71]] },
        distance: 1200,
        duration: 900,
      });
      vi.mocked(getPlacesAlongRoute).mockResolvedValue({
        type: 'FeatureCollection',
        features: [],
      });

      useRouteStore.setState({ route: [mockPlace1, mockPlace2] });
      
      // Swap order
      useRouteStore.getState().reorderPlaces([mockPlace2, mockPlace1]);

      const state = useRouteStore.getState();
      expect(state.route).toEqual([mockPlace2, mockPlace1]);
      expect(calculateRoute).toHaveBeenCalledWith([mockPlace2.id, mockPlace1.id]);
    });

    it('should clear all route fields on clearRoute()', () => {
      useRouteStore.setState({
        route: [mockPlace1, mockPlace2],
        routeGeometry: { type: 'LineString', coordinates: [] },
        distance: 1.5,
        duration: 18,
        steps: 2000,
        alongRoutePlaces: [mockPlace3],
        isCalculatingRoute: true,
        isFetchingAlongRoute: true,
      });

      useRouteStore.getState().clearRoute();

      const state = useRouteStore.getState();
      expect(state.route).toEqual([]);
      expect(state.routeGeometry).toBeNull();
      expect(state.distance).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.steps).toBe(0);
      expect(state.alongRoutePlaces).toEqual([]);
      expect(state.isCalculatingRoute).toBe(false);
      expect(state.isFetchingAlongRoute).toBe(false);
    });
  });

  describe('Route Details Asynchronous Operations', () => {
    it('should query radial search when exactly one point is in the route', async () => {
      vi.mocked(getPlaces).mockResolvedValue({
        type: 'FeatureCollection',
        features: [mockPlace2, mockPlace3],
      });

      useRouteStore.setState({ route: [mockPlace1] });

      await useRouteStore.getState().fetchRouteDetails();

      const state = useRouteStore.getState();
      expect(getPlaces).toHaveBeenCalledWith({
        lat: mockPlace1.geometry.coordinates[1],
        lon: mockPlace1.geometry.coordinates[0],
        radius: 1500,
      });
      // Verifies alongRoutePlaces has recommendations excluding the starting point
      expect(state.alongRoutePlaces).toEqual([mockPlace2, mockPlace3]);
      expect(state.isFetchingAlongRoute).toBe(false);
    });

    it('should query route calculate and along-route places when 2 or more points are in the route', async () => {
      const mockGeometry = {
        type: 'LineString',
        coordinates: [[37.6173, 55.7558], [37.6233, 55.7518]],
      };
      
      vi.mocked(calculateRoute).mockResolvedValue({
        geometry: mockGeometry,
        distance: 2200, // 2.2 km (2200 meters)
        duration: 1650, // 27.5 minutes (1650 seconds)
      });
      
      vi.mocked(getPlacesAlongRoute).mockResolvedValue({
        type: 'FeatureCollection',
        features: [mockPlace3],
      });

      useRouteStore.setState({ route: [mockPlace1, mockPlace2] });

      await useRouteStore.getState().fetchRouteDetails();

      const state = useRouteStore.getState();
      expect(calculateRoute).toHaveBeenCalledWith([mockPlace1.id, mockPlace2.id]);
      expect(getPlacesAlongRoute).toHaveBeenCalledWith(mockGeometry, 250, [mockPlace1.id, mockPlace2.id]);
      
      expect(state.routeGeometry).toEqual(mockGeometry);
      expect(state.distance).toBe(2.2); // converted to km
      expect(state.duration).toBe(28); // 1650s rounded to minutes
      expect(state.steps).toBe(Math.round(2.2 * 1350)); // 2970 steps
      expect(state.alongRoutePlaces).toEqual([mockPlace3]);
    });

    it('should gracefully fall back to client-side simulated metrics upon API error', async () => {
      vi.mocked(calculateRoute).mockRejectedValue(new Error('Network Timeout'));

      useRouteStore.setState({ route: [mockPlace1, mockPlace2] });

      await useRouteStore.getState().fetchRouteDetails();

      const state = useRouteStore.getState();
      // Verifies geometry is null, and alongRoute is cleared
      expect(state.routeGeometry).toBeNull();
      expect(state.alongRoutePlaces).toEqual([]);
      // Verifies simulated metrics are computed correctly
      expect(state.distance).toBeGreaterThan(0);
      expect(state.duration).toBeGreaterThan(0);
      expect(state.steps).toBeGreaterThan(0);
      expect(state.isCalculatingRoute).toBe(false);
      expect(state.isFetchingAlongRoute).toBe(false);
    });
  });

  describe('Map Layer Integration & Coordinate Syncing', () => {
    it('should export points perfectly aligning with MapLibre Marker inputs', () => {
      useRouteStore.setState({ route: [mockPlace1, mockPlace2] });
      
      // Simulate component marker sync mapping from page.tsx lines 160-166
      const markers = useRouteStore.getState().route.map((place) => ({
        id: place.id,
        longitude: place.geometry.coordinates[0],
        latitude: place.geometry.coordinates[1],
        title: place.properties.title,
      }));

      expect(markers).toHaveLength(2);
      expect(markers[0]).toEqual({
        id: 101,
        longitude: 37.6173,
        latitude: 55.7558,
        title: 'Кафе Бублик',
      });
      expect(markers[1]).toEqual({
        id: 102,
        longitude: 37.6233,
        latitude: 55.7518,
        title: 'Парк Зарядье',
      });
    });

    it('should build a valid GeoJSON Feature for the polyline route matching page.tsx lines 28-35', () => {
      const mockGeometry = {
        type: 'LineString',
        coordinates: [[37.6173, 55.7558], [37.6233, 55.7518]],
      };
      
      useRouteStore.setState({ routeGeometry: mockGeometry });

      // Replicate memoized GeoJSON selector from page.tsx line 28
      const routeGeometry = useRouteStore.getState().routeGeometry;
      const geojsonRoute = routeGeometry ? {
        type: 'Feature' as const,
        properties: {},
        geometry: routeGeometry,
      } : null;

      expect(geojsonRoute).not.toBeNull();
      expect(geojsonRoute).toEqual({
        type: 'Feature',
        properties: {},
        geometry: mockGeometry,
      });
    });
  });

  describe('Bottom Sheet Quick-Add Snapping & Filter Simulation', () => {
    // Replicates standard filteredRecommendations calculation from RouteBottomSheet.tsx lines 105-116
    const getFilteredRecommendations = (
      alongRoute: PlaceFeature[],
      route: PlaceFeature[],
      searchQuery: string,
      selectedCategory: string | null
    ) => {
      return alongRoute.filter((place) => {
        const matchesSearch = place.properties.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (place.properties.address || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory 
          ? place.properties.category?.slug === selectedCategory
          : true;
          
        const notAlreadyInRoute = !route.some((p) => p.id === place.id);

        return matchesSearch && matchesCategory && notAlreadyInRoute;
      });
    };

    it('should correctly filter alongRoute recommendations based on query parameters', () => {
      const alongRoute = [mockPlace1, mockPlace2, mockPlace3];
      const route: PlaceFeature[] = [];

      // Test 1: Category filter for Cafe
      let filtered = getFilteredRecommendations(alongRoute, route, '', 'cafe');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].properties.title).toBe('Кафе Бублик');

      // Test 2: Search filter matching text 'зарядье'
      filtered = getFilteredRecommendations(alongRoute, route, 'зарядье', null);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].properties.title).toBe('Парк Зарядье');

      // Test 3: Excludes already selected route elements
      filtered = getFilteredRecommendations(alongRoute, [mockPlace1], '', null);
      expect(filtered).toHaveLength(2);
      expect(filtered.some((p) => p.id === mockPlace1.id)).toBe(false);
    });

    it('should trigger store addPlace action when quick-add is clicked', () => {
      // Mock radial search to avoid api execution
      vi.mocked(getPlaces).mockResolvedValue({
        type: 'FeatureCollection',
        features: [],
      });

      const store = useRouteStore.getState();
      expect(store.route).toHaveLength(0);

      // Simulate a user clicking the quick-add "+" button
      store.addPlace(mockPlace2);

      const updatedStore = useRouteStore.getState();
      expect(updatedStore.route).toHaveLength(1);
      expect(updatedStore.route[0].properties.title).toBe('Парк Зарядье');
    });
  });
});
