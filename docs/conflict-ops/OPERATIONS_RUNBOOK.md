# Operations Runbook

Last updated: 2026-03-02

## Environments and Preconditions

1. Database migration applied.
2. Feature flags seeded and manageable.
3. Admin auth + internal key configured.
4. Cron process running `CronService.startAllJobs()`.

## Launch Sequence (Recommended)

### Phase 1: Backend + queues only

1. Keep all public theory/forecast flags OFF.
2. Enable dashboard flag only for internal validation.
3. Verify:
- `/api/conflicts/stats`
- `/api/conflicts/events`
- `/api/conflicts/signals`
- `/api/conflicts/intel-gaps`
- `/api/monitor/layers`
- `/api/monitor/signals/fusion`
- `/api/conflicts/reviews/queue`
- `/api/conflicts/sources/candidates`

### Phase 2: Autonomy shadow mode

1. Enable `conflict_ops_autonomy_v1`.
2. Keep `CONFLICT_OPS_SHADOW_MODE=true`.
3. Watch `/admin/conflicts` trends and incident feed for at least 3-7 days.

### Phase 3: Controlled publication

1. Enable theory public flag only after evidence quality validation.
2. Enable forecast public flag only after calibration quality target is met.

## Daily Operator Checklist

1. Review `open incidents` count and severity.
2. Check run trend for failure spikes.
3. Check `Recent Manual Runs` panel for queued/running/failed triggers.
4. Check review queue backlog and age.
5. Process pending source candidates.
6. Confirm action summaries align with expected fix behavior.

## Data Bootstrap (If Dashboard Is Empty)

Use this once in a fresh environment after migration/flag setup.

1. Run RSS ingest:
```bash
curl -X POST http://localhost:3001/api/rss-processing/ingest-from-content \
  -H "Content-Type: application/json" \
  -d '{"hours_back":72,"min_per_category":6,"max_feeds":10}'
```
2. Run conflict extraction:
```bash
curl -X POST http://localhost:3001/api/conflicts/ingest/from-articles \
  -H "Content-Type: application/json" \
  -d '{"limit":300,"dryRun":false,"minConfidence":0.25,"conflict":"all"}'
```
3. Process review queue and verify/reject events:
```bash
curl "http://localhost:3001/api/conflicts/reviews/queue?limit=20"
```
4. Confirm verified-first stats are non-empty:
```bash
curl "http://localhost:3001/api/conflicts/stats"
```

## Incident Response

When ingestion failures spike:

1. Open `/admin/conflicts` and inspect recent incidents + run trend.
2. Confirm if reliability agent already attempted allowed auto-fixes.
3. Validate external feed/source availability.
4. If needed, keep autonomy enabled but maintain shadow mode while stabilizing.
5. Run manual cycle via `Run Autonomy Cycle` button after remediation (async mode).
6. Track completion via `GET /api/conflicts/autonomy/runs/:triggerId`.
7. If runs are timing out, reduce scope (`conflict`, `limit`) or increase `maxAgentMs`/`maxCycleMs` within policy bounds.
8. If historical `running` run rows accumulate, reconcile stale entries:
```bash
curl -X POST http://localhost:3001/api/conflicts/autonomy/runs/reconcile \
  -H "Content-Type: application/json" \
  -d '{"dry_run":true,"stale_after_minutes":45,"limit":500}'
```

## Auth Verification Smoke

Use this before/after auth config changes:

```bash
BASE_URL=http://localhost:3001 STRICT_EXPECT=true \
  scripts/smoke-conflict-ops-auth.sh
```

Optional:

1. Add `AUTH_TOKEN=<admin_bearer_token>` to validate bearer-protected access.
2. Add `INTERNAL_API_KEY=<internal_key>` to validate internal-key ops access.

## Functional Verification Smoke

Run end-to-end bootstrap + validation checks:

```bash
BASE_URL=http://localhost:3001 AUTO_VERIFY=false \
  scripts/smoke-conflict-ops-functional.sh
```

Optional automatic queue verification during smoke:

```bash
BASE_URL=http://localhost:3001 AUTO_VERIFY=true VERIFY_LIMIT=5 \
  scripts/smoke-conflict-ops-functional.sh
```

Recommended fast/stable local mode (avoids slow RSS bootstrap in heavy environments):

```bash
BASE_URL=http://localhost:3001 AUTO_VERIFY=true RSS_BOOTSTRAP_MODE=auto RSS_REQUIRED=false \
  scripts/smoke-conflict-ops-functional.sh
```

Smoke script runtime controls:

1. `RSS_BOOTSTRAP_MODE=auto|always|never` (default: `auto`)
2. `MIN_ARTICLES_BEFORE_RSS=<n>` (default: `10`)
3. `RSS_REQUIRED=true|false` (default: `false`)
4. `RSS_INGEST_TIMEOUT_SECONDS=<n>` (default: `60`)
5. `CURL_TIMEOUT_SECONDS=<n>` (default: `180`)

## Monitor Perf Sweep

Run endpoint-level latency sweep before release:

```bash
BASE_URL=http://localhost:3001 ITERATIONS=20 scripts/perf-monitor-endpoints.sh
```

## Rollback / Safety Actions

Immediate containment options:

1. Disable `conflict_ops_autonomy_v1`.
2. Disable `conflict_ops_theory_public_v1`.
3. Disable `conflict_ops_forecast_public_v1`.
4. Keep `conflict_ops_dashboard_v1` enabled for read-only monitoring if needed.

Detailed rollback matrix + drills:

1. `/Users/Djasha/CascadeProjects/Asha News/docs/conflict-ops/ROLLBACK_MATRIX.md`

## Audit and Postmortem Inputs

Collect for postmortem:

1. `agent_runs` during incident window.
2. Related `agent_incidents` and `agent_actions`.
3. Event review decisions and queue timing.
4. Any feature flag state changes during window.

## Performance and Reliability Targets (v1 baseline)

1. Stats and related-news API median latency under expected load target.
2. Forecast/theory generation bounded by timeout + fallback behavior.
3. Zero unauthorized identity exposure in public responses.
4. Full action traceability for every autonomous side effect.

## Supabase REST Mode Notes

1. The stack supports no-`DATABASE_URL` mode via Supabase REST for RSS/article/conflict write paths.
2. If `DATABASE_URL` is later enabled, run a full smoke sweep (`stats`, `events`, `related-news`, `autonomy/status`) before switching traffic.
