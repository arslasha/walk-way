# Walk-Way: Full Development Plan

This document serves as the master roadmap and context tracker for the Walk-Way project. It must be updated after the completion of any significant feature or phase to ensure seamless cross-device development context.

## Project Overview
Walk-Way is a geo-social web application designed for finding places (cafes, parks, etc.) and building walking routes based on moods/vibes, duration, and social context.

---

## Phase 1: Core Search & Data Ingestion (Current)
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

### Next Steps (To-Do)
- [ ] **REST API Foundation:** Create Django REST Framework (or Ninja) endpoints to expose places, categories, and tags to the frontend.
- [ ] **Spatial & Vibe Filtering:** Implement Django `Q` objects and PostGIS functions (e.g., `ST_DWithin`) to filter places by distance, category, and selected vibes.
- [ ] **Frontend Initialization:** Setup the Next.js (App Router) foundation, integrating the Tailwind CSS design system (`DESIGN.md`) via Stitch MCP.
- [ ] **LLM Vibe Generation:** Develop the Layer 3 execution script to automatically analyze KudaGo descriptions and generate emotional `is_vibe=True` tags using an LLM.

---

## Phase 2: Interactive Mapping & Advanced Routing
**Goal:** Provide visual exploration and intelligent route building.
- [ ] Integrate Leaflet for interactive frontend mapping.
- [ ] Develop custom walking route generation algorithms based on user duration and selected POIs.
- [ ] Implement route sharing links.

---

## Phase 3: Social Features & User Accounts
**Goal:** Transform the app into a social experience.
- [ ] Implement User Authentication (NextAuth / Django Auth).
- [ ] Allow users to save favorite places and custom routes.
- [ ] Introduce a friend system and WebSockets for real-time chat/route collaboration.
