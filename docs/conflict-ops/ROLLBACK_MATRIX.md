# Launch Rollback Matrix

Last updated: 2026-03-02

## Kill-Switch Flags

1. `conflict_ops_dashboard_v1`: disables tactical `/conflicts` and `/monitor` feature surfaces.
2. `cod_war_monitor_v1`: legacy flag from prior immersive in-app prototype (does not gate current upstream WorldMonitor launcher flow).
3. `conflict_ops_autonomy_v1`: disables autonomous agent cycles.
4. `conflict_ops_theory_public_v1`: disables public theory cards.
5. `conflict_ops_forecast_public_v1`: disables public forecast cards.

## Rollback Matrix

| Scenario | Trigger Signal | Immediate Action | Follow-up |
|---|---|---|---|
| Identity exposure risk | Any public response includes identity payload unexpectedly | Disable `conflict_ops_dashboard_v1`, `conflict_ops_theory_public_v1`, `conflict_ops_forecast_public_v1` | Run audit query against affected responses and hotfix policy gate. |
| Autonomy instability | `agent_runs` failure spike >30% over 30m | Disable `conflict_ops_autonomy_v1` | Reconcile stale runs and inspect incidents/actions trend. |
| Monitor API degradation | `/api/monitor/*` p95 latency breaches gate | Keep tactical dashboard (`/monitor`) active and point `REACT_APP_WORLDMONITOR_URL` to a known-good upstream/deployment target | Run perf script, narrow query defaults, deploy route-level optimizations. |
| Incorrect probabilistic artifacts | Forecast/theory fails gate checks | Disable relevant public artifact flag | Re-run calibration validation before re-enable. |

## Kill-Switch Drill Steps

1. Simulate an incident in staging.
2. Flip relevant feature flag(s) within 2 minutes.
3. Confirm endpoint behavior:
- `/api/conflicts/theories` returns empty for public when theory flag is off.
- `/api/conflicts/forecasts` returns empty for public when forecast flag is off.
- `/api/conflicts/autonomy/status` shows autonomy disabled when autonomy flag is off.
4. Capture timestamps for detection, mitigation, and verification.
5. File post-drill notes in incident log.
