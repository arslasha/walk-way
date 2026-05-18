# Task 014: QA Routing and Spatial API Auto-tests

**Assignee:** QA / Tester
**Status:** To Do

## Context
With the Phase 2 routing and spatial features fully implemented (including the frontend Zustand route store, MapLibre route layers, Vaul bottom sheet, and the backend routing/spatial APIs), we need comprehensive automated test coverage to prevent regressions and verify correct behavior under various conditions.
- **References:** `PLAN.md` (Phase 2), `task-007`, `task-008`, `task-009`, `task-010`, `task-013`.

## Requirements

### 1. Backend: Extended API Integration Tests (PyTest)
The backend tests must verify the correct behavior of the routing and along-the-way spatial endpoints under standard and edge cases. Ensure you mock external OpenRouteService (ORS) API calls to maintain deterministic and fast offline testing.
- **Calculate Route API (`/api/v1/routes/calculate/`):**
  - Verify calculation with a valid list of sequential `places` (place IDs).
  - Verify calculation with a valid list of coordinate pairs (`coordinates`).
  - Verify that the API correctly handles and validates invalid or malformed payloads (e.g., coordinate list with less than 2 points, invalid lat/lon values, negative coordinates).
  - Assert the response contains the required fields: `geometry` (valid GeoJSON LineString), `distance` (meters, greater than 0), and `duration` (seconds, greater than 0).
  - Verify graceful fallback behavior if the ORS API is rate-limited or unavailable (e.g., fallback to a straight line segment and log a warning).
- **Places Along Route API (`/api/v1/places/along-route/`):**
  - Verify that the endpoint returns places located within the specified `buffer` radius (e.g., 150 meters) of the given GeoJSON `LineString` route.
  - Verify that places already included in the active route (passed via `exclude_ids` or parsed from the route) are successfully excluded from the recommendations.
  - Test spatial boundaries: confirm that places outside the buffer radius (e.g., far cafes) are not returned.
  - Verify edge cases such as a zero or negative buffer distance, and malformed GeoJSON geometries, returning an appropriate `400 Bad Request` or using standard safe defaults.

### 2. Frontend: Store & Integration Unit Tests (Jest/Vitest)
Verify that the frontend routing state and map synchronization operate correctly.
- **Zustand Route Store (`routeStore.ts`):**
  - Write unit tests for store actions: `addPlaceToRoute`, `removePlaceFromRoute`, `clearRoute`, and `reorderRoutePlaces`.
  - Verify that the store correctly updates the waypoints array, handles duplicates, and maintains the order of places.
  - Test that fetching route details correctly sets `routeGeometry`, `distance`, `duration`, and handles error states by setting appropriate flags and triggering toasts.
- **UI Integration (Render & Interaction Mocking):**
  - Mock the MapLibre/react-map-gl canvas to verify that coordinate points from the Zustand store are passed to the map layer correctly.
  - Test the Vaul bottom sheet snapping logic and ensure that clicking a recommended place correctly triggers the add action in the route store.

---

## Constraints & Rules
- Never use raw external network requests during tests; mock all external APIs (specifically OpenRouteService).
- Follow the **Clean History Protocol** and **Conventional Commits** (`test(qa): add routing and spatial api tests`).
- Do not mention AI involvement or task/agent configurations in git commit messages.

## Status Check
- [ ] Mock routing client implemented for PyTest environment.
- [ ] Backend PyTest suite covers all successful route calculation flows (by places and coordinates).
- [ ] Backend PyTest suite covers validation edge cases and ORS API fallback scenarios.
- [ ] Backend PyTest suite covers `ST_DWithin` spatial along-the-route queries and `exclude_ids` exclusion logic.
- [ ] Frontend unit tests for `routeStore.ts` state actions and transitions are complete and pass successfully.
- [ ] Frontend mock tests for map rendering inputs and explore drawer interactions are complete.
