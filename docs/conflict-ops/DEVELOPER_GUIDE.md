# Developer Guide

Last updated: 2026-03-02

## Architecture Overview

Conflict Ops is implemented as an extension to the existing Asha News stack:

1. API layer: Express routes under `/api/conflicts`.
2. Domain layer: `conflictAnalyticsService` for ingestion, aggregation, ranking, autonomy.
3. Data layer: PostgreSQL tables created via `server/db/migrate.js` and mapped in `queryBridge`.
4. Scheduler: `cronService` job `conflict-ops-autonomy`.
5. Frontend:
- Public tactical page: `/conflicts`
- Admin control page: `/admin/conflicts`

## Key Files

1. `/Users/Djasha/CascadeProjects/Asha News/server/routes/conflictAnalytics.js`
2. `/Users/Djasha/CascadeProjects/Asha News/server/services/conflictAnalyticsService.js`
3. `/Users/Djasha/CascadeProjects/Asha News/server/services/cronService.js`
4. `/Users/Djasha/CascadeProjects/Asha News/server/db/schema.js`
5. `/Users/Djasha/CascadeProjects/Asha News/server/db/migrate.js`
6. `/Users/Djasha/CascadeProjects/Asha News/src/pages/ConflictMonitorPage.js`
7. `/Users/Djasha/CascadeProjects/Asha News/src/pages/admin/ConflictOpsPage.js`

## Local Setup

1. Install dependencies:
```bash
npm install
npm --prefix server install
```
2. Ensure env is configured (`DATABASE_URL` or Supabase credentials).
3. Run migration:
```bash
node server/db/migrate.js
```

Supabase session-pooler example (TLS/libpq-compatible mode):
```bash
DATABASE_URL='postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?uselibpqcompat=true&sslmode=require' \
  node server/db/migrate.js
```
4. Run app:
```bash
npm run dev:full
```

## Functional Bootstrap (Fresh Environment)

Use this sequence after migrations if `/conflicts` is empty.

1. Ingest RSS sources into `articles`:
```bash
curl -X POST http://localhost:3001/api/rss-processing/ingest-from-content \
  -H "Content-Type: application/json" \
  -d '{"hours_back":72,"min_per_category":6,"max_feeds":10}'
```
2. Extract conflict events from article corpus:
```bash
curl -X POST http://localhost:3001/api/conflicts/ingest/from-articles \
  -H "Content-Type: application/json" \
  -d '{"limit":300,"dryRun":false,"minConfidence":0.25,"conflict":"all"}'
```
3. Review queue check:
```bash
curl "http://localhost:3001/api/conflicts/reviews/queue?limit=20"
```
4. Verify/reject events as admin/internal key so verified-first stats are populated:
```bash
curl -X POST http://localhost:3001/api/conflicts/reviews/<eventId> \
  -H "Content-Type: application/json" \
  -d '{"action":"verify","reason":"editorial verification"}'
```
5. Validate outputs:
```bash
curl "http://localhost:3001/api/conflicts/stats"
curl "http://localhost:3001/api/conflicts/related-news?limit=10"
```
6. Optional stale run reconciliation (for pre-fix historical rows):
```bash
curl -X POST http://localhost:3001/api/conflicts/autonomy/runs/reconcile \
  -H "Content-Type: application/json" \
  -d '{"dry_run":true,"stale_after_minutes":45,"limit":500}'
```

## Required Env Flags

1. `ENABLE_CONFLICT_OPS_CRON=true|false`
2. `CONFLICT_OPS_CRON_SCHEDULE=*/20 * * * *`
3. `CONFLICT_OPS_SHADOW_MODE=true|false`
4. `INTERNAL_API_KEY=<secret>`
5. `STRICT_AUTH=true|false`
6. `CONFLICT_OPS_AGENT_TIMEOUT_MS=45000` (optional per-agent budget)
7. `CONFLICT_OPS_CYCLE_TIMEOUT_MS=180000` (optional full-cycle budget)
8. `CONFLICT_OPS_STRICT_AUTH=true|false` (optional override for `/api/conflicts` admin routes)
9. `CONFLICT_OPS_RUN_TRACK_TTL_MS=21600000` (optional in-memory run tracker retention)
10. `CONFLICT_OPS_RUN_TRACK_MAX=200` (optional max tracked runs kept in memory)
11. `RSS_ENABLE_CONTENT_SCRAPING=false` (optional: faster local ingest/debug)
12. `ENABLE_AI_ANALYSIS=false` (optional: deterministic ingest/debug)

## Feature Flag Progression

Recommended enable sequence:

1. `conflict_ops_dashboard_v1`
2. `conflict_ops_autonomy_v1` (shadow mode)
3. `conflict_ops_theory_public_v1` (after evidence gate confidence)
4. `conflict_ops_forecast_public_v1` (after calibration quality)

## Extension Patterns

### Add new conflict scope

1. Update conflict keyword map in service.
2. Add UI option in `ConflictMonitorPage`.
3. Ensure related-news signal model includes new tokens.
4. Add service tests for extraction + compare mode.

### Add new auto-fix type

1. Define action constant and allowlist entry.
2. Implement action path in reliability agent with explicit bounds.
3. Ensure action logging to `agent_actions` includes reversibility data.
4. Document in Governance and Runbook docs.

### Add new public chart

1. Prefer using `/api/conflicts/stats` or `/api/conflicts/related-news`.
2. Keep explainability fields visible (source tiers, signal matches).
3. Preserve verified-first default behavior.

## Testing

Backend:
```bash
npm --prefix server test -- conflictAnalytics.service.test.js --runInBand
npm --prefix server test -- conflictAnalytics.routes.test.js --runInBand
```

Frontend:
```bash
npm test -- --runInBand --watchAll=false src/__tests__/conflict-monitor.test.js
```

Build:
```bash
npm run build
```

Auth smoke:
```bash
BASE_URL=http://localhost:3001 STRICT_EXPECT=true \
  scripts/smoke-conflict-ops-auth.sh
```

Functional smoke:
```bash
BASE_URL=http://localhost:3001 AUTO_VERIFY=false \
  scripts/smoke-conflict-ops-functional.sh
```

Functional smoke (fast local mode with auto RSS bootstrap skipping):
```bash
BASE_URL=http://localhost:3001 AUTO_VERIFY=true RSS_BOOTSTRAP_MODE=auto RSS_REQUIRED=false \
  scripts/smoke-conflict-ops-functional.sh
```

Functional smoke controls:

1. `RSS_BOOTSTRAP_MODE=auto|always|never` (default: `auto`)
2. `MIN_ARTICLES_BEFORE_RSS=<n>` (default: `10`)
3. `RSS_REQUIRED=true|false` (default: `false`)
4. `RSS_INGEST_TIMEOUT_SECONDS=<n>` (default: `60`)
5. `CURL_TIMEOUT_SECONDS=<n>` (default: `180`)

Optional authenticated variants:
```bash
BASE_URL=http://localhost:3001 STRICT_EXPECT=true AUTH_TOKEN=<admin_token> \
  scripts/smoke-conflict-ops-auth.sh

BASE_URL=http://localhost:3001 STRICT_EXPECT=true INTERNAL_API_KEY=<internal_key> \
  scripts/smoke-conflict-ops-auth.sh
```

## Coding Guardrails

1. Keep deterministic fallbacks when providers fail.
2. Do not break legacy fallback behavior when dashboard flag is off.
3. Preserve admin/internal-key auth gates for write/admin routes.
4. Avoid schema churn without migration updates and data-model documentation updates.
5. When adding DB writes, ensure Supabase REST mode and direct-Postgres mode both return consistent response shapes.
