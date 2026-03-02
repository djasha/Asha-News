# SLO Gates and Regression Budget

Last updated: 2026-03-02

## Launch SLO Gates

1. Availability: `/api/conflicts/*` and `/api/monitor/*` monthly success rate >= 99.5%.
2. Latency:
- `/api/conflicts/stats`, `/api/conflicts/signals`, `/api/conflicts/intel-gaps` p95 <= 1200ms.
- `/api/monitor/layers`, `/api/monitor/signals/fusion`, `/api/monitor/news/digest` p95 <= 1500ms.
3. Correctness:
- Comparison mode tests must pass (`conflict-vs-conflict`, `actor-vs-actor`).
- Policy tests must confirm identity withholding for non-eligible events.
4. Explainability:
- Ranked-news responses include `explain.matched_signals` for top items.
- Intel-gap responses include threshold metadata and explicit reason codes.

## Regression Budget

1. API regression budget per release candidate:
- 0 critical auth/policy regressions allowed.
- <= 1 medium severity UI regression allowed if workaround exists.
2. Performance regression budget:
- <= 10% p95 increase per endpoint compared with previous RC baseline.
- Any >10% increase requires rollback plan before promotion.

## Required Pre-Release Checks

1. `npm run smoke:security`
2. `cd server && npm test -- conflictAnalytics.routes.test.js conflictAnalytics.service.test.js monitorOps.routes.test.js --runInBand`
3. `CI=true npm test -- --watch=false --runInBand src/__tests__/conflict-monitor.test.js src/__tests__/v1-core-routes.test.js`
4. `npm run build`
5. `BASE_URL=http://localhost:3001 ITERATIONS=20 scripts/perf-monitor-endpoints.sh`
