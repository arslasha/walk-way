# Product Requirements Document (PRD): Phase 2 - Interactive Mapping & Routing

## 1. Objective
Transform the Walk-Way application from a static catalog of places into an interactive routing experience. Users should be able to view places on a highly customized map, seamlessly transition between the Explore feed and the Map, and build intelligent walking routes with a premium, native-app-like UX.

## 2. Global State Persistence
The core mechanism of Phase 2 is the `useRouteStore` (e.g., via Zustand). The active route state (selected places, origin, destination) **must never reset** when navigating between `/explore` and `/map`. The user should be able to freely switch contexts without losing their built route.

## 3. Core User Flows & UI Components

### 3.1 Explore Feed (List View) Upgrades
The `/explore` feed will become "Route-Aware":
- **Visual Highlighting:** Any place card that is already added to the active route must be visually distinct (например, активная обводка, бейдж "В маршруте") to avoid user confusion.
- **Right Sidebar (Route Drawer):** On desktop (and as an overlay on mobile), a right-side drawer (шторка справа) will appear if the route contains at least one point. This drawer shows the selected places and allows quick reordering/deletion without needing to switch to the Map view.
- **Smart "Along the Way" Section:** Once at least one point is added, the Explore feed will dynamically fetch and display a prioritized section at the very top: "По пути" (Along the way). This section displays places that are geographically close to the calculated route polyline, placing them above global recommendations.

### 3.2 Map View (`/map`)
- **Engine:** MapLibre GL JS (via `react-map-gl`). Highly customized to the "Dramatic Urbanism" design system.
- **Bottom Sheet (Нижняя шторка на карте):** A draggable bottom panel (using `vaul`).
  - *Collapsed:* Route summary (distance, time, steps) and "Start".
  - *Half-screen:* List of route points (drag-to-reorder, swipe-to-delete).
  - *Full-screen:* Search/add interface.
- **Smart POIs on Map:** Unobtrusive, tiny dots along the route line representing places "Along the way". Tapping them expands to a mini-card to easily add them to the route.

### 3.3 Entry Points
1. **Contextual:** Clicking "Добавить в маршрут" on a card in `/explore` highlights the card and updates the Right Sidebar. The user is *not* forced to the map immediately, allowing them to build a complex route seamlessly from the feed.
2. **Global:** A global "Карта" floating button switches to `/map`, retaining the entire built route and applying current vibe filters.

## 4. Technical Architecture
### 4.1 Frontend
- **Zustand:** Global store for `RoutePoints[]`.
- **UI Components:** Right Drawer (shadcn/ui `Sheet` component), Route Item Cards.
- **Map & Routing APIs:** `maplibre-gl`, `react-map-gl`, OpenRouteService (ORS) API.

### 4.2 Backend Enhancements
- **Route POI Query:** Update `places/views.py` to accept a GeoJSON LineString (the route) and return places using PostGIS `ST_DWithin` from the line to populate the "По пути" section.

## 5. Development Phases
1. **Infrastructure:** Install MapLibre, Zustand, `vaul`, and setup the `/map` route.
2. **State & Feed UI:** Implement `useRouteStore`. Add Visual Highlighting and the Right Sidebar to `/explore`.
3. **Map Rendering:** Render the MapLibre instance with custom markers matching the `useRouteStore`.
4. **Bottom Sheet & Map UX:** Integrate `vaul` into the map and build the mobile route management UI.
5. **Routing API:** Connect ORS to calculate the walking polyline.
6. **"Along the Way" Logic:** Implement the backend ST_DWithin line query and the smart prioritization in the Explore feed.
