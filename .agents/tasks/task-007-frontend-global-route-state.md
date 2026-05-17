# Task 007: Frontend Global Route State & Sidebar

**Assignee:** Frontend Agent
**Status:** In Progress

## Context
Phase 2 of Walk-Way introduces Interactive Mapping. Before we integrate the actual map, we must implement the data layer and initial UI for route building directly from the explore feed. We need a persistent state to store selected places, and a Sidebar to manage them without leaving the `/explore` page.
Reference: `docs/prd/phase2-interactive-mapping.md`

## Requirements

1. **Global State (Zustand)**
   - Install `zustand` (`npm install zustand`).
   - Create a store (`frontend/store/routeStore.ts`).
   - The store must hold an array of `Place` objects (the route).
   - Implement actions: `addPlace`, `removePlace`, `reorderPlaces`, `clearRoute`.

2. **Place Card Updates (`PlaceCard.tsx`)**
   - Add a button "В маршрут" (Add to route) on the `PlaceCard` component. If the place is already in the route, the button should change to "Убрать" (Remove) or a suitable icon.
   - Visually highlight the card if it is in the active route (e.g., active border, subtle background tint, or badge). Refer to `DESIGN.md` for styling principles.

3. **Route Drawer (Боковая шторка)**
   - Create a new component `RouteDrawer.tsx` (you can use shadcn/ui `Sheet` component for this).
   - This drawer should be accessible via a floating button or a top nav button when `route.length > 0`.
   - The drawer must display the list of selected places in order.
   - Include a call-to-action at the bottom of the drawer: "Перейти к карте" (Go to map) which links to `/map` (even if `/map` is empty for now).

4. **Global Map FAB (Floating Action Button)**
   - Add a floating button on the `/explore` page (bottom-center or bottom-right) labeled "Карта", linking to `/map`.

## Constraints & Rules
- Follow `version-control-protocol.md`: Do not commit code directly. Notify the Orchestrator when the task is complete.
- Adhere to `DESIGN.md` and use existing Tailwind utilities.

## Status Check
- [ ] Zustand store created and tested.
- [ ] `PlaceCard` updated with add/remove functionality and visual highlighting.
- [ ] `RouteDrawer` component built and integrated into the layout.
- [ ] Global Map FAB implemented.
