# Task 009: Map Bottom Sheet & Interactive UX

**Assignee:** Frontend Agent
**Status:** Completed
**Completed At:** 2026-05-18T04:25:00Z

## Context
Now that the Map renders successfully and displays markers (Task 008), we need to implement the interactive Route Management interface on the `/map` page. Following premium navigation app UX (like Yandex Maps or Apple Maps), we will use `vaul` (a premium drawer component for React) to build a draggable bottom sheet on mobile, which translates elegantly to a sidebar or bottom panel on desktop.

## Requirements

1. **Install Vaul & Reordering Library**
   - Install Vaul: `npm install vaul`
   - If drag-and-drop isn't already installed, ensure a lightweight library is present (e.g., `@hello-pangea/dnd` or `@dnd-kit/core`, or use standard HTML5 drag-and-drop if already implemented in Task 007).

2. **Implement the Bottom Drawer (`RouteBottomSheet.tsx`)**
   - Integrate `Drawer` from `vaul` into `frontend/app/(marketing)/map/page.tsx`.
   - The drawer must support multiple snap points (e.g., `["148px", "0.5", "0.95"]` for collapsed, half-screen, and expanded).
   - Ensure the drawer is non-modal or allows interaction with the map behind it if possible, or matches the styling in `DESIGN.md`.

3. **Drawer Snap States & Layout**
   - **Collapsed State (e.g., 148px height):**
     - Display route summary metrics: total duration (e.g., "1 ч. 15 мин."), estimated distance (e.g., "4.2 км"), and steps.
     - Add a prominent primary CTA button: "Поехали" (Start Route).
   - **Half-screen State:**
     - Display the list of selected route points from `useRouteStore` in a clean, vertical list.
     - Add drag handles to reorder places (using `reorderPlaces` from `useRouteStore`).
     - Add a "Delete" icon or button next to each place to easily remove it from the route.
   - **Fully Expanded State:**
     - Include a simple search bar to search for new places or display a quick-add grid of recommended nearby categories (e.g., "Кафе", "Парки", "Музеи").

4. **Synchronize UI with Map**
   - Tapping a route item in the drawer should center the map on that marker and open its hover tooltip.

## Constraints & Rules
- Do not build the real polyline walking calculations yet (Task 010). For now, use straight lines or simulated route metrics.
- Keep performance high; drawer dragging must be buttery smooth (60fps).
- Follow `DESIGN.md` for colors (accent, card, secondary) and typography.
- Do not make auto-commits. Ask the Orchestrator for review when complete.

## Status Check
- [x] Responsive layout with unified left sidebar implemented (bottom mobile drawer removed per user preference).
- [x] Pinned layout fits perfectly under Navbar and adapts smoothly.
- [x] Route metrics (estimated distance/time/steps) calculated and displayed seamlessly.
- [x] Drag-to-reorder and click-to-delete work flawlessly for route points.
- [x] Styling conforms to "Dramatic Urbanism" design guidelines.
