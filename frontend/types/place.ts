export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  is_vibe: boolean;
}

export interface PlaceProperties {
  id: number;
  title: string;
  description: string;
  address: string | null;
  category: Category | null;
  tags: Tag[];
  is_active: boolean;
  is_analyzed: boolean;
  photos: string[];
  icebreakers: string[];
}

export interface PlaceFeature {
  type: "Feature";
  id: number;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: PlaceProperties;
}

export interface PlaceFeatureCollection {
  type: "FeatureCollection";
  features: PlaceFeature[];
}

export interface PlaceFilters {
  tags?: string; // comma-separated tag slugs
  category?: string; // category slug
  in_bbox?: string; // min_lon,min_lat,max_lon,max_lat
  lat?: number;
  lon?: number;
  radius?: number;
}
