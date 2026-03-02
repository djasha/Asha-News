# Governance and Safety

Last updated: 2026-03-02

## Core Principles

1. Verified-first presentation by default.
2. Explainability for public metrics to source-level context.
3. Identity protection over completeness.
4. Bounded autonomy with auditability.
5. Non-deterministic labeling for all forward-looking AI output.

## Identity Exposure Policy

Identities can be shown publicly only when all conditions are true:

1. Event `verification_status=verified`.
2. Policy metadata indicates identity publication is allowed.
3. Route requests explicitly include identity display and still pass policy checks.

Else:

1. Return identity count only (if available).
2. Include withholding notice.

Enforcement surfaces:

1. `/api/conflicts/events` (with `include_identities` policy guard)
2. `/api/conflicts/theories`
3. `/api/conflicts/forecasts`
4. `/api/monitor/*` derived payloads (identity data excluded by default)

## Theory Publication Gate

Before public theory publication:

1. Minimum evidence count threshold.
2. Minimum source-tier quality threshold.
3. Confidence threshold.
4. Feature flag `conflict_ops_theory_public_v1=true`.

Public theory cards must include:

1. Hypothesis statement.
2. Supporting evidence references.
3. Counter-evidence section.
4. Uncertainty label.

## Forecast Publication Gate

Before public forecast publication:

1. Bounded/normalized probabilities.
2. Calibration score threshold met.
3. Feature flag `conflict_ops_forecast_public_v1=true`.

Public forecast cards must include:

1. Horizon (24h/7d).
2. Scenario probabilities.
3. Confidence/calibration note.
4. Non-deterministic disclaimer.

## Autonomous Action Boundaries

Allowed auto-fixes:

1. Retry ingestion jobs.
2. Quarantine failing sources.
3. Lower per-source fetch concurrency.
4. Trigger backfill after recovery.
5. Open incident records with root-cause hypothesis.

Disallowed autonomous actions:

1. Editing app code.
2. DB schema changes.
3. Auth policy changes.
4. Direct source enablement from discovery.
5. Publishing unverified identities.

## Audit Requirements

1. Every agent run recorded in `agent_runs`.
2. Every autonomous side effect recorded in `agent_actions`.
3. Incident lifecycle recorded in `agent_incidents`.
4. Review decisions attributable via reviewer identity/time.

## Public Communication Standard

For all public-facing conflict AI content:

1. Use probability/hypothesis language.
2. Avoid certainty claims.
3. Link or reference supporting evidence and source context.

## Compliance References

1. AGPL provenance register: `/Users/Djasha/CascadeProjects/Asha News/docs/conflict-ops/AGPL_PROVENANCE_NOTICES.md`
2. Rollback + kill-switch matrix: `/Users/Djasha/CascadeProjects/Asha News/docs/conflict-ops/ROLLBACK_MATRIX.md`
3. Launch SLO gates and regression budget: `/Users/Djasha/CascadeProjects/Asha News/docs/conflict-ops/SLO_GATES_AND_REGRESSION_BUDGET.md`
