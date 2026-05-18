# Walk-Way: Full Development Plan

This document serves as the master roadmap and context tracker for the Walk-Way project. It must be updated after the completion of any significant feature or phase to ensure seamless cross-device development context.

## Project Overview
Walk-Way is a geo-social web application designed for finding places (cafes, parks, etc.) and building walking routes based on moods/vibes, duration, and social context.

---

## Phase 1: Core Search & Data Ingestion (Current - v0.1 & v1.0 MVP)
**Goal:** Establish the foundation, ingest real data, and enable complex vibe/spatial filtering.

### Completed Stages
- [x] **Repository & CI/CD Setup:**
  - Configured 3-Layer Architecture rules (`GEMINI.md`, `version-control-protocol.md`).
  - Implemented proactive PR rules and clean-commit protocols.
  - Secured the repository by removing sensitive files (`.env.example`, `SETUP.md`).
- [x] **Backend Infrastructure (Docker + Django):**
  - Set up PostgreSQL with PostGIS extension via `docker-compose`.
  - Initialized Django project (`walkway_core`) and `places` app.
- [x] **Data Modeling:**
  - Created models for `Category`, `Tag`, and `Place`.
  - Implemented PostGIS `PointField` for geospatial coordinate storage.
  - Added `is_vibe` boolean to the `Tag` model to separate KudaGo generic tags from future LLM-generated emotional tags.
- [x] **Data Ingestion (KudaGo API):**
  - Developed an idempotent Django management command (`parse_kudago.py`) using the `requests` library.
  - Implemented category priority logic to select the most meaningful primary category from KudaGo.
  - Successfully parsed initial test data (categories, places, and tags) into the local database.
- [x] **Frontend Initialization (v1.0):**
  - Set up the Next.js (App Router) foundation.
  - Integrated the Tailwind CSS design system (`DESIGN.md`).
  - Built an explore feed skeleton.

- [x] **REST API Foundation:** Created Django REST Framework endpoints for places, categories, and tags. Integrated `djangorestframework-gis` and spatial filtering.
- [x] **Core Search & Filtering:** Implemented backend filtering (distance via PostGIS `ST_DWithin`, category, basic tags) and connected it to the frontend via server-side fetches.
- [x] **Explore Feed UI:** Finalized the frontend interface for browsing places with dynamic filters and a geolocation toggle.

- [x] **CORS & Map Route Rendering Fixes (Task 013):**
  - Integrated `django-cors-headers` package and middleware to solve cross-origin blocking on route calculations.
  - Resolved `500 Internal Server Error` on Tag and Category viewsets by disabling Global GeoJson Pagination for standard non-spatial endpoints.
  - Fixed MapLibre GL polyline route layers disappearing during theme switching by dynamically keying the `<Source>` layer with the `resolvedTheme` state, forcing clean reactive remounting on style reload.

### Next Steps (To-Do)
- [x] **UI/UX Polish:** Implement Loading Skeletons for the feed, proper Empty States for filtered results, and Toast notifications for geolocation errors.
- [x] **End-to-End Testing:** Conduct full testing of the search flow only after the core functionality is built.

---

## Phase 2: Interactive Mapping & Advanced Routing (v1.5)
**Goal:** Provide visual exploration and intelligent route building.

### Current Tasks
- [x] **Task 007:** Frontend Global Route State & Sidebar (Zustand, RouteDrawer, PlaceCard UI, /map stub).
- [x] **Task 008:** MapLibre Integration & Route Visualization.
- [x] **Task 009:** Map Bottom Sheet & Interactive UX (Vaul, responsive multi-snap drawer, quick-add recommendations, map-marker synchronization).
- [x] **Task 010:** Backend Routing API & "Along the Way" Spatial Queries.
- [ ] **Task 011:** Frontend Routing Polish & Loop Routes (Круговые маршруты).
- [ ] **Task 012:** Backend Advanced Filters (Time, Weather, Budget) & Loop Logic.
- [x] **Task 013:** Fix Route Rendering & Client-Side CORS Issues (django-cors-headers, MapLibre layer fixes, tag viewset pagination).
- [x] **Task 014:** QA Routing & Spatial API Auto-tests (PyTest backend mocks, Zustand store unit tests, map/bottom-sheet integration).

### Backlog
- [ ] **Saved & Shared Routes:** Moving towards phase 3, but preparing route models on backend.

## Phase 3: Social Features & User Accounts (v2.0 & v3.0)
**Goal:** Transform the app into a collaborative, community-driven social app and dating network.

### Current Tasks
- [x] **Task 015:** JWT Authentication, Registration & Optional 2FA (Backend).
- [ ] **Task 016:** Auth Forms, User Dashboard & Profile Editing UI (Frontend).
- [ ] **Task 017:** Personal Folders & Place Collections (Backend & Frontend).
- [ ] **Task 018:** Social Graph, User Search & Friend Profiles (Backend & Frontend).
- [ ] **Task 019:** QA: Security, Accounts, Collections & Social API Auto-tests.

### Backlog & Future Tasks
- [ ] **Saved & Shared Routes:** Generate unique URLs to share custom walking routes with friends or partners.
- [ ] **WebSockets & Real-Time Collaboration:** Jointly build and edit a route with a friend on the map in real-time.
- [ ] **"Radar" Matching:** Spatial discoverability to find people nearby who want to walk with the same vibe.

---

## Backlog / Postponed Features
- [ ] **LLM Vibe Generation & Icebreakers:** AI-based analysis of place descriptions to generate emotional `is_vibe=True` tags and conversational "Icebreakers". (Postponed indefinitely to focus on core mechanics).
