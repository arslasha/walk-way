export type Vibe =
  | "все"
  | "ветерок"
  | "уличное-искусство"
  | "кофе"
  | "природа"
  | "музеи"
  | "еда"
  | "архитектура"
  | "тихое";

export type PlaceCategory =
  | "Кафе"
  | "Парк"
  | "Музей"
  | "Кофейня"
  | "Арт-пространство"
  | "Рынок"
  | "Галерея"
  | "Культура";

export interface Place {
  slug: string;
  name: string;
  category: PlaceCategory;
  address: string;
  duration: string;
  vibes: Vibe[];
  imageUrl?: string;
}

export interface PlaceFilters {
  vibe: Vibe | null;
  category: PlaceCategory | null;
  maxDuration: number | null;
}
