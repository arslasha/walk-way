import { PlaceFeatureCollection, PlaceFeature, Category, Tag, PlaceFilters } from "@/types/place";

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side (inside Docker, fetch from the "web" container on port 8000)
    return process.env.NEXT_PUBLIC_API_URL_INTERNAL || "http://web:8000/api/v1";
  }
  // Client-side (in the browser, fetch from the host machine on port 8001)
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

export async function getPlaces(filters?: PlaceFilters): Promise<PlaceFeatureCollection> {
  const url = new URL(`${API_BASE_URL}/places/`);
  
  if (filters) {
    if (filters.category) url.searchParams.append("category", filters.category);
    if (filters.tags) url.searchParams.append("tags", filters.tags);
    if (filters.in_bbox) url.searchParams.append("in_bbox", filters.in_bbox);
    if (filters.lat) url.searchParams.append("lat", filters.lat.toString());
    if (filters.lon) url.searchParams.append("lon", filters.lon.toString());
    if (filters.radius) url.searchParams.append("radius", filters.radius.toString());
    if (filters.page) url.searchParams.append("page", filters.page.toString());
  }

  const res = await fetch(url.toString(), { next: { revalidate: 60 } }); // Cache for 60 seconds
  if (!res.ok) {
    throw new Error("Failed to fetch places");
  }
  const data = await res.json();
  return data.results || data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories/`, { next: { revalidate: 3600 } }); // Cache for 1 hour
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

export async function getTags(isVibe?: boolean): Promise<Tag[]> {
  const url = new URL(`${API_BASE_URL}/tags/`);
  if (isVibe !== undefined) {
    url.searchParams.append("is_vibe", isVibe.toString());
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error("Failed to fetch tags");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

export async function calculateRoute(placeIds: number[]): Promise<{ geometry: any; distance: number; duration: number }> {
  const res = await fetch(`${API_BASE_URL}/routes/calculate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ places: placeIds }),
  });
  if (!res.ok) {
    throw new Error("Failed to calculate route");
  }
  return res.json();
}

export async function calculateLoopRoute(options: { 
  startCoords: [number, number], 
  distance: number, 
  vibes?: string[], 
  category?: string 
}): Promise<{ route: { geometry: any; distance: number; duration: number }, places: PlaceFeature[] }> {
  const res = await fetch(`${API_BASE_URL}/routes/calculate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      is_loop: true, 
      start_coords: options.startCoords,
      distance: options.distance,
      vibes: options.vibes || [],
      category: options.category
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to calculate loop route");
  }
  const data = await res.json();
  const placesArray = Array.isArray(data.places) ? data.places : (data.places?.features || []);
  
  return {
    ...data,
    places: placesArray
  };
}

export async function getPlacesAlongRoute(
  route: any,
  buffer: number = 150,
  excludeIds: number[] = []
): Promise<PlaceFeatureCollection> {
  const res = await fetch(`${API_BASE_URL}/places/along-route/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ route, buffer, exclude_ids: excludeIds }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch places along route");
  }
  return res.json();
}

export async function updatePlace(
  id: number,
  data: { description: string; tag_ids: number[]; category_id: number }
): Promise<PlaceFeature | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("walkway_access_token") : null;
  const res = await fetch(`${API_BASE_URL}/places/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deletePlace(id: number): Promise<boolean> {
  const token = typeof window !== "undefined" ? localStorage.getItem("walkway_access_token") : null;
  const res = await fetch(`${API_BASE_URL}/places/${id}/`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.ok;
}

