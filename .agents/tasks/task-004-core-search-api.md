# Task 004: Core Search REST API

**Assignee:** Backend
**Status:** Done

## Context
Develop the Django REST Framework API endpoints required for searching and filtering places. The map and LLM vibes are postponed, so rely on standard KudaGo tags and categories for filtering.
- **References:** `PLAN.md` (Phase 1).

## Acceptance Criteria
- [x] Django REST Framework and `djangorestframework-gis` installed and configured.
- [x] Serializers created for `Category`, `Tag`, and `Place` models.
- [x] List/Search endpoint created for `Place` returning data in JSON (or GeoJSON if needed for distance).
- [x] Django `Q` objects implemented to filter by `Category` and existing `Tag`s.
- [x] PostGIS `ST_DWithin` implemented to allow filtering places within a radius of user coordinates (if coordinates are provided).
