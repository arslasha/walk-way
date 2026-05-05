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

### Next Steps (To-Do)
- [ ] **REST API Foundation:** Create Django REST Framework endpoints to expose places, categories, and KudaGo tags. Include `djangorestframework-gis` for spatial serialization.
- [ ] **Core Search & Filtering:** Implement backend filtering (distance via PostGIS `ST_DWithin`, category, basic tags) and connect it to the frontend.
- [ ] **Explore Feed UI:** Finalize the frontend interface for browsing places (list/feed view without a map).
- [ ] **End-to-End Testing:** Conduct full testing of the search flow only after the core functionality is built.

---

## Phase 2: Interactive Mapping & Advanced Routing (v1.5)
**Goal:** Provide visual exploration and intelligent route building.
- [ ] **Leaflet Integration:** Introduce a map view for the filtered places.
- [ ] **Loop Routing (Круговые маршруты):** Algorithm to build a closed-loop walking route (A -> B -> C -> A) matching a specific duration.
- [ ] **Time-Aware Routing:** Filter places based on the time of day (e.g., exclude closed places).
- [ ] **Weather & Budget Filters:** Route through indoor spaces during rain, and add a `price_level` filter.

---

## Phase 3: Social Features & User Accounts (v2.0 & v3.0)
**Goal:** Transform the app into a social experience and dating network.
- [ ] **User Authentication:** NextAuth / Django Auth.
- [ ] **Saved & Shared Routes:** Generate unique links to share a built route with a partner.
- [ ] **WebSockets & Real-time:** Jointly edit a route with a friend in real-time.
- [ ] **"Radar" Matching:** Find people nearby who want to walk with the same vibe.

---

## Backlog / Postponed Features
- [ ] **LLM Vibe Generation & Icebreakers:** AI-based analysis of place descriptions to generate emotional `is_vibe=True` tags and conversational "Icebreakers". (Postponed indefinitely to focus on core mechanics).
