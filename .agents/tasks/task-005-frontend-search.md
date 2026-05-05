# Task 005: Frontend Search Integration

**Assignee:** Frontend
**Status:** To Do

## Context
Integrate the frontend with the newly created Django REST API to allow users to search and filter places. No maps are needed yet, just a list or grid feed of places (like Tinder cards or a standard feed).
- **References:** `PLAN.md` (Phase 1).
- **Dependencies:** Wait for `task-004-core-search-api.md` to be somewhat functional (or use mocks reflecting its contract).

## Acceptance Criteria
- [ ] API service/functions created in Next.js to fetch places, categories, and tags from the Django backend.
- [ ] Search interface updated to allow selecting categories and tags.
- [ ] (Optional) Geolocation API used in the browser to pass user coordinates to the backend for radius search.
- [ ] The feed dynamically updates based on the selected filters.
