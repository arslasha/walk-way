# Task 001: Backend LLM Integration Script

**Assignee:** Backend
**Status:** In Progress

## Context
Develop the Layer 3 execution script to analyze place descriptions, generate `is_vibe=True` tags, and create contextual "Icebreaker" text for dates.
- **References:** `PLAN.md` (Phase 1), `docs/LLM_STRATEGY.md`.
- **Target File:** `backend/places/management/commands/generate_vibes.py` (or similar execution script).

## Acceptance Criteria
- [ ] Idempotent Django management command created to process `Place` objects without vibes (`is_analyzed=False` or no vibe tags).
- [ ] Script successfully sends place data to the LLM API using the system prompt from `docs/LLM_STRATEGY.md`.
- [ ] Script correctly parses the LLM JSON response.
- [ ] Script creates/finds `Tag` objects with `is_vibe=True` and associates them with the `Place`.
- [ ] Script saves the generated icebreakers (e.g., in a JSONField `icebreakers` in the `Place` model or a separate model).
- [ ] Script handles rate limits and API errors gracefully without crashing the whole pipeline.
