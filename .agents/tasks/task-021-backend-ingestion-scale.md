# Task 021: Backend Data Ingestion Scale-up

**Assignee:** Backend Agent
**Status:** In Progress

## Context
The current KudaGo parsing script (`parse_kudago.py`) works well for small samples but is inefficient for ingesting large datasets (1000+ places). It uses individual `update_or_create` calls inside a loop, which causes significant database overhead. Furthermore, it fetches all categories from KudaGo, including irrelevant ones (like shops or business events), wasting API quota.

## Requirements
1. **Category Filtering**: Request only specific categories from the KudaGo API to avoid parsing irrelevant places.
2. **Limit Argument**: Add a `--limit` argument to control the maximum number of places to fetch instead of just `--pages`.
3. **Bulk Operations**: Refactor the script to use Django's `bulk_create` / `bulk_update` for `Place` and `Tag` models to minimize database queries. Optimize the Many-to-Many (`Place.tags`) insertion.
4. **Rate Limit Handling**: Implement retry logic with exponential backoff for handling KudaGo API HTTP 429 (Too Many Requests) and 5xx errors.

## Acceptance Criteria
- [ ] Script successfully fetches only relevant categories from KudaGo.
- [ ] Script handles the `--limit` argument correctly.
- [ ] Script uses `bulk_create` / `bulk_update` for database operations, significantly speeding up ingestion.
- [ ] Script gracefully retries on API rate limits.
- [ ] The command can be run to fetch 1000+ places in Moscow without timing out or crashing.
