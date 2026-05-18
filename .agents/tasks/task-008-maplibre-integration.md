# Task 008: MapLibre Integration & Route Visualization

**Assignee:** Frontend Agent
**Status:** Completed

## Context
Part of Phase 2 Interactive Mapping. We established the global state (`useRouteStore`) and feed-level UI in Task 007. Now, we must implement the actual interactive Map page (`/map`) to visualize these selected points. We will use `maplibre-gl` and `react-map-gl` for a highly customizable map experience.

## Requirements

1. **Install Dependencies**
   - Install MapLibre libraries: `npm install maplibre-gl react-map-gl`
   - Install types: `npm install -D @types/maplibre-gl`

2. **Setup Map Page (`frontend/app/(marketing)/map/page.tsx`)**
   - Create or update the `/map` route.
   - Initialize the `Map` component from `react-map-gl`.
   - Use an open-source MapLibre style that fits the "Dramatic Urbanism" aesthetic (e.g., Carto Dark Matter, Stadia Dark, or a suitable custom styling approach).

3. **Render Route Markers**
   - Fetch `route` from `useRouteStore`.
   - For each place in the route, render a `Marker` at its coordinates.
   - Design custom HTML markers: they should look premium, match the brand colors (accent/primary), and perhaps display an index number (1, 2, 3...) or an icon.

4. **Map Navigation & Bounds**
   - Add a fixed/floating "Назад к списку" (Back to explore) button to return to `/explore`.
   - Automatically adjust the map viewport (bounds) to fit all markers when the component mounts or the route changes.
   - If the route is empty, default the center to a generic starting location (e.g., Moscow center) or user's geolocation if available.

## Constraints & Rules
- **No Polylines Yet:** Do not integrate OpenRouteService or draw the actual walking paths yet. That comes in a later task.
- **Styling:** Adhere strictly to `DESIGN.md`. Map markers must look custom, not generic browser defaults.
- **Protocol:** Follow `version-control-protocol.md`. DO NOT commit code yourself. Ask the Orchestrator for a review.

## Status Check
- [x] Dependencies installed.
- [x] MapLibre map renders successfully on `/map`.
- [x] Route items from `useRouteStore` are displayed as custom markers.
- [x] Viewport auto-fits to marker bounds.
- [x] Back navigation is implemented.
