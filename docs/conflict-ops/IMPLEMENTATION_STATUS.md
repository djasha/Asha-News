# Implementation Status (Plan V2)

Last updated: 2026-03-02

This file maps the "Autonomous Conflict Operations Dashboard" plan to current implementation state.

## Implemented

1. DB-backed conflict runtime model and migrations.
2. Conflict API expansion (`events`, `stats`, `related-news`, `forecasts`, `theories`, admin queues/status).
3. Guarded autonomy agents with run/incident/action audit trails.
4. Cron orchestration for scheduled autonomy cycle.
5. Tactical `/conflicts` dashboard with feature-flag fallback.
6. Admin `/admin/conflicts` page for:
- autonomy status and trends,
- source candidate approvals,
- review queue verify/reject actions.
7. OpenAPI document for conflict API.
8. Manual autonomy execution budgets (`maxAgentMs`, `maxCycleMs`) plus async trigger mode to prevent long-running request hangs.
9. Conflict Ops admin auth override (`CONFLICT_OPS_STRICT_AUTH`) to enforce ops-route protection independent of global strict mode.
10. Async manual run tracking endpoints (`/autonomy/runs`, `/autonomy/runs/:triggerId`) for deterministic operator monitoring.
11. DB-backed autonomy run tracker (`conflict_autonomy_runs`) with in-memory fallback when DB table is unavailable.
12. Public exposure kill-switch enforcement for analyst artifacts:
- `/api/conflicts/theories` is empty for non-privileged users when `conflict_ops_theory_public_v1=false`.
- `/api/conflicts/forecasts` is empty for non-privileged users when `conflict_ops_forecast_public_v1=false`.
13. Admin Conflict Ops page includes `Recent Manual Runs` table backed by `/api/conflicts/autonomy/runs` with refresh support.
14. Conflict Ops auth smoke script available at `/Users/Djasha/CascadeProjects/Asha News/scripts/smoke-conflict-ops-auth.sh`.
15. Tactical `/conflicts` dashboard adds comparative trend overlay chart with metric switch (events, fatalities, injured, IDs, official announcements).
16. Supabase REST fallback compatibility for RSS and articles in `dbService`:
- RSS source CRUD now supports no-`DATABASE_URL` environments.
- Article CRUD/upsert used by RSS ingestion now supports no-`DATABASE_URL` environments.
17. Conflict DB wrappers normalize Supabase array responses in insert/patch paths so review + ingest responses preserve DB values.
18. Stale agent run reconciliation endpoint added: `POST /api/conflicts/autonomy/runs/reconcile`.
19. Functional smoke script hardened for deterministic runtime:
- adds RSS bootstrap controls (`RSS_BOOTSTRAP_MODE`, `MIN_ARTICLES_BEFORE_RSS`, `RSS_REQUIRED`),
- adds timeout controls (`RSS_INGEST_TIMEOUT_SECONDS`, `CURL_TIMEOUT_SECONDS`),
- auto-skips expensive RSS bootstrap when article corpus is already populated.
20. Conflict extraction intelligence upgraded:
- pattern-based hit-location extraction,
- weapon/technology taxonomy classification,
- identity signal parsing for named/ID hints,
- official announcement type classification and aggregate breakdowns.
21. Conflict API additive monitor inputs implemented:
- `GET /api/conflicts/signals`
- `GET /api/conflicts/intel-gaps`
22. Monitor Ops API surface implemented:
- `GET /api/monitor/layers`
- `GET /api/monitor/news/digest`
- `GET /api/monitor/signals/fusion`
- `GET /api/monitor/freshness`
- `GET /api/monitor/intel/brief`
23. Monitor OpenAPI document added at `/Users/Djasha/CascadeProjects/Asha News/server/openapi/monitor-ops-v1.json`.
24. Conflict extraction schema extended with `official_announcement_types[]` and extraction confidence metadata envelope.
25. `/monitor` route added as high-parity alias to tactical conflict dashboard.
26. `apps/ops-monitor` scaffold added (Vite + React + TypeScript + DeckGL + MapLibre) with command palette and docking presets.
27. Launch governance artifacts added:
- AGPL provenance notices,
- rollback/kill-switch matrix,
- SLO gates + regression budget,
- monitor endpoint performance sweep script.

## Runtime State (Current Environment)

1. `conflict_ops_dashboard_v1` is enabled.
2. `cod_war_monitor_v1` remains present as a legacy flag from the prior in-app COD prototype (current `/cod-war-monitor` launcher and COD CTAs route to upstream WorldMonitor URL).
3. `conflict_ops_autonomy_v1` is enabled.
4. `conflict_ops_theory_public_v1` is disabled.
5. `conflict_ops_forecast_public_v1` is disabled.
6. Wiki feature flags are seeded and enabled (`wiki_index_v1`, `wiki_conflict_ops_v1`, `wiki_ai_checker_v1`, `wiki_markets_v1`, `wiki_agent_api_v1`).

## Environment Notes

1. Local runtime still defaults to Supabase REST mode when `DATABASE_URL` is unset.
2. As of 2026-03-02, conflict/agent/autonomy tables are now present and queryable in Postgres and visible to Supabase REST.
3. `PGRST205` table-not-found errors for conflict ops tables are resolved in this environment.
4. Baseline data-load validation completed in Supabase REST mode:
- RSS ingestion into `articles` succeeds.
- Conflict ingestion from articles succeeds.
- Review queue verify actions succeed.
- Verified-first stats now return non-empty totals after review actions.

## Immediate Completion Needed (Ops Hardening)

1. Optional: set `DATABASE_URL` for local direct-Postgres mode if desired.
2. Scale source diversity beyond initial feed subset and monitor ingestion quality over multiple cycles.
3. Clear stale `running` historical agent run rows created before Supabase response normalization fix (optional cleanup task).

## Partially Implemented / Needs Iteration

1. Source scout discovery breadth: currently based on available article/source signals; can be expanded with broader external discovery pipelines.
2. Calibration governance: baseline gate exists; needs rolling backtest framework for production confidence target enforcement.
3. Public comms tooling: public guide exists; user-facing FAQ/help page wiring can be added in app navigation if needed.

## Deferred (Explicit)

1. Autonomous code/schema/auth mutations (disallowed by policy).
2. Automatic source enablement without admin approval (disallowed by policy).
3. Deterministic forecasting claims (disallowed by policy).

## Rollout Recommendation

1. Keep autonomy in shadow mode initially.
2. Track failure/incidents trend and action quality in `/admin/conflicts`.
3. Enable theory/forecast public flags only after internal quality sign-off.
