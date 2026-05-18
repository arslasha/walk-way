import { PlaceFeatureCollection, Category, Tag, PlaceFilters } from "@/types/place";

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  }
  // In the browser, check if environment URL is a valid external URL
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("//web:") && !envUrl.includes("//web/")) {
    return envUrl;
  }
  return "http://127.0.0.1:8000/api/v1";
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

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
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

