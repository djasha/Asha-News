# Conflict Ops API Reference

Last updated: 2026-03-02

Base path: `/api/conflicts`

## Authentication Model

1. Public read endpoints are accessible without admin auth.
2. Admin/ops endpoints require one of:
- Internal header: `X-Internal-Key: <INTERNAL_API_KEY>`
- Bearer JWT user with admin role/email allowlist
3. Strict enforcement occurs when `CONFLICT_OPS_STRICT_AUTH=true`, or falls back to `STRICT_AUTH=true` / production mode.
4. For manual ops in local/dev, use authenticated admin session or `X-Internal-Key`.

## Public/Read Endpoints

### `GET /events`

Purpose: list conflict events with filters.

Query:

1. `conflict=all|gaza-israel|israel-us-iran`
2. `days=<int>`
3. `from=<ISO datetime>`
4. `to=<ISO datetime>`
5. `limit=<int>`
6. `verification=verified|unverified|rejected|all` (default `verified`)
7. `source_tier=official|wire|major|other|all`
8. `include_identities=true|false`

### `GET /stats`

Purpose: aggregated tactical metrics and comparison block.

Query:

1. All filter fields from `/events` (except identities toggle)
2. `compare_mode=conflict-vs-conflict|actor-vs-actor`
3. `compare_left=<scope value>`
4. `compare_right=<scope value>`

Returns:

1. `totals`
2. `timeline`
3. `actor_comparisons`
4. `locations_hit`
5. `weapon_usage`
6. `weapon_category_usage`
7. `technology_usage`
8. `technology_category_usage`
9. `announcement_type_usage`
10. `announcement_actor_usage`
11. `identity_status_breakdown`
12. `official_announcements`
13. `source_breakdown`
14. `comparison`

### `GET /related-news`

Purpose: ranked feed of related articles with explainable matching signals.

Query:

1. `conflict`
2. `days`
3. `verification`
4. `source_tier`
5. `limit`

Returns:

1. `items[]` with `score`, `source_tier`, `explain.matched_signals`, and component sub-scores.

### `GET /forecasts`

Purpose: retrieve forecast cards (24h/7d horizons).

Query:

1. `conflict`
2. `limit`
3. `include_draft=true|false` (admin/internal only)
4. `generate_if_missing=true|false`

Public flag gate:

1. Non-admin/non-internal requests return an empty list when `conflict_ops_forecast_public_v1=false`.

### `GET /theories`

Purpose: retrieve analyst theory cards.

Query:

1. `conflict`
2. `limit`
3. `include_draft=true|false` (admin/internal only)
4. `generate_if_missing=true|false`

Public flag gate:

1. Non-admin/non-internal requests return an empty list when `conflict_ops_theory_public_v1=false`.

## Admin/Ops Endpoints

### `GET /autonomy/status`

Returns:

1. Flag state
2. Agent health summary
3. Open/recent incidents
4. Action summaries
5. 14-day trend arrays:
- `run_trend`
- `incident_trend`
- `action_trend`

### `POST /autonomy/run`

Body:

1. `force=true|false`
2. `shadowMode=true|false`
3. `conflict`
4. `limit`
5. `async=true|false` (recommended `true` for operator-triggered runs)
6. `maxAgentMs` (1000-300000)
7. `maxCycleMs` (5000-900000)

Purpose: manually trigger full autonomy cycle.

Response behavior:

1. `200` for synchronous completion.
2. `202` when `async=true`, with `trigger_id`, `status_endpoint`, and accepted status.

### `GET /autonomy/runs`

Purpose: list recent tracked manual autonomy runs.

Storage behavior:

1. Reads DB-backed tracker (`conflict_autonomy_runs`) when available.
2. Falls back to in-process memory tracker if DB tracker table is unavailable.

Query:

1. `limit` (default `20`, max `100`)
2. `include_result=true|false` (default `false`)

### `GET /autonomy/runs/:triggerId`

Purpose: fetch a specific tracked manual autonomy run.

Query:

1. `include_result=true|false` (default `true`)

### `POST /autonomy/runs/reconcile`

Purpose: reconcile stale `agent_runs` rows that are stuck in `running` status.

Body (all optional):

1. `dry_run=true|false` (default `false`)
2. `stale_after_minutes` (5-10080)
3. `stale_after_ms` (300000-604800000)
4. `limit` (1-5000)

### `GET /sources/candidates`

Query:

1. `status=pending|approved|rejected|all`
2. `limit`

### `POST /sources/candidates/:id/approve`
### `POST /sources/candidates/:id/reject`

Body:

1. `notes` (optional)

### `GET /reviews/queue`

Query:

1. `conflict`
2. `days`
3. `limit`

### `POST /reviews/:eventId`

Body:

1. `action=verify|reject`
2. `reason`

### `POST /events`
### `POST /events/bulk`
### `POST /ingest/from-articles`

Purpose: direct event injection and ingestion workflows.

## Error Shape

Standard failure response:

```json
{
  "success": false,
  "error": "Error message"
}
```

## OpenAPI

Machine-readable Conflict Ops OpenAPI document:

1. File: `/Users/Djasha/CascadeProjects/Asha News/server/openapi/conflict-ops-v1.json`
2. Endpoint: `GET /api/conflicts/openapi`
