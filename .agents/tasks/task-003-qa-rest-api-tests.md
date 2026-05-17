# Task 003: QA REST API Auto-tests

**Assignee:** QA
**Status:** Done

## Context
Write automated tests for the Django REST API endpoints, specifically focusing on geospatial filtering, vibe filtering, and place retrieval.
- **References:** `PLAN.md` (Phase 1).

## Acceptance Criteria
- [ ] PyTest (or default Django Test framework) configured for the `places` app.
- [ ] Tests written to validate REST API responses, ensuring correct structure (e.g., GeoJSON if applicable).
- [ ] Tests written to validate spatial filtering logic (e.g., `ST_DWithin` radius search).
- [ ] Tests written to validate category and vibe filtering logic.
- [ ] All tests pass successfully locally.
