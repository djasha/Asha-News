# Fresh Thread Starter (V3)

Last updated: 2026-03-02
Owner context: COD dashboard + WorldMonitor parity rollout

## 1) Security Incident Resolution (Completed)

Incident shown by GitGuardian:
- Type: `Netlify Token v2`
- Repository: `djasha/Asha-News`
- Triggered commit: `e8b0debea9eb2b3e78d0c137f6b407f095bff5b6`

Remediation executed:
1. Rebuilt the commit on a clean branch from `e8b0deb^`.
2. Removed tracked `.playwright-cli/*` artifacts from the replacement commit.
3. Added `.playwright-cli/` to `.gitignore` to prevent recurrence.
4. Force-updated `origin/clean-main` to sanitized commit:
- New commit: `b4523afa6`
- Old commit replaced: `e8b0debea`

Command used:
```bash
git push --force-with-lease origin codex/remediate-netlify-token:clean-main
```

Still required outside git history:
1. Rotate the Netlify token in Netlify UI (if not already rotated).
2. Mark/resolve the GitGuardian incident after rotation.

## 2) Verified Runtime Checks (Completed)

Executed on sanitized branch:

```bash
npm run smoke:security
cd server && npm test -- conflictAnalytics.routes.test.js conflictAnalytics.service.test.js --runInBand
CI=true npm test -- --watch=false --runInBand src/__tests__/conflict-monitor.test.js src/__tests__/v1-core-routes.test.js
npm run build
npx serve -s build -l 4173
curl -I http://127.0.0.1:4173
```

Results:
1. Security smoke: pass.
2. Backend conflict tests: pass.
3. Frontend targeted tests: pass (known React `act`/future-flag warnings only).
4. Production build: pass.
5. Preview HTTP probe: `200 OK`.

## 3) Current Baseline (Where We Are)

Implemented docs and references:
1. Hub: `docs/conflict-ops/README.md`
2. Status: `docs/conflict-ops/IMPLEMENTATION_STATUS.md`
3. API: `docs/conflict-ops/API_REFERENCE.md`
4. Data: `docs/conflict-ops/DATA_MODEL.md`
5. Ops: `docs/conflict-ops/OPERATIONS_RUNBOOK.md`
6. Governance: `docs/conflict-ops/GOVERNANCE_AND_SAFETY.md`

Key product baseline already in repo:
1. Tactical `/conflicts` route + admin ops panel.
2. Conflict analytics service, agent orchestration hooks, and audit tables.
3. Feature-flag and policy gates for public analyst artifacts.
4. OpenAPI for conflict ops.

## 4) Parallel Subagent Execution Plan (V3)

Goal:
- Deliver polished tactical `/conflicts` + high-parity `/monitor` with bounded autonomy and explainability.

### Workstream A: Data + API (Backend)
Owner: Backend Agent A
1. Extend conflict extraction schema: `hit_locations[]`, `weapons[]`, `technologies[]`, `official_announcement_types[]`, confidence fields.
2. Implement/extend endpoints:
- `/api/conflicts/stats` additive breakdowns
- `/api/conflicts/events` normalized extraction confidence
- `/api/conflicts/intel-gaps`
- `/api/conflicts/signals`
- `/api/monitor/layers`
- `/api/monitor/news/digest`
- `/api/monitor/signals/fusion`
- `/api/monitor/freshness`
- `/api/monitor/intel/brief`
3. Update OpenAPI:
- `server/openapi/conflict-ops-v1.json`
- `server/openapi/monitor-ops-v1.json`

### Workstream B: Tactical COD UX (`/conflicts`)
Owner: Frontend Agent B
1. Implement command strip controls + verification/source-tier/timeframe compare modes.
2. Add tactical boards:
- hit-location intensity board
- weapon/tech matrix
- official announcement ledger
- ranked related-news panel with explainability
3. Add Analyst tab cards for theories + 24h/7d probabilities with explicit non-deterministic labels.

### Workstream C: Monitor Surface (`/monitor`)
Owner: Frontend/Geo Agent C
1. Build `apps/ops-monitor` (Vite + React + TS + DeckGL + MapLibre).
2. Map-first layout with docking presets and command palette.
3. Integrate monitor endpoints and shared settings model.

### Workstream D: Autonomy + Reliability
Owner: Agent Systems D
1. Expand existing six-agent context to monitor signals/freshness.
2. Keep bounded auto-fix policy (pipeline-only).
3. Add calibration/evidence publish gates for forecast/theory artifacts.
4. Ensure immutable audit trail coverage (`agent_runs`, `agent_incidents`, `agent_actions`).

### Workstream E: Governance + Security + AGPL
Owner: Compliance/SRE Agent E
1. Complete AGPL provenance notices for derived/reused modules.
2. Enforce public identity withholding gates in all output surfaces.
3. Validate admin-only protection for approvals/autonomy controls.
4. Prepare launch rollback matrix and kill-switch drills.

### Workstream F: QA + Performance
Owner: QA Agent F
1. Add test coverage for comparison correctness and policy enforcement.
2. Add integration tests for ranked-news explainability and intel-gap thresholds.
3. Run load/perf tests for map interactions + stats/signals/news endpoints.
4. Define launch SLO gates and regression budget.

## 5) Suggested Parallel Order (Execution)

1. Start A, B, C in parallel.
2. Start D once A endpoint contracts stabilize.
3. Run E continuously in parallel with A-D (gates, auth, compliance checks).
4. Run F after first integrated builds from A/B/C, then again pre-release.

## 6) Fresh Thread Kickoff Prompt

Use this exact kickoff in the next thread:

"Continue from `docs/conflict-ops/FRESH_THREAD_STARTER_V3.md` and execute Workstreams A-F in parallel batches. Keep `/conflicts` production-safe at all times, keep autonomy bounded, run smoke/tests/build at each merge point, and report blockers with file-level diffs and decisions."

## 7) Local Safety Notes

1. A stash exists from pre-remediation local WIP:
- `stash@{0}: codex-wip-before-secret-remediation-20260302-172633`
2. Do not auto-apply this stash without review; it contains broad secret-placeholder edits across archive/setup scripts.
