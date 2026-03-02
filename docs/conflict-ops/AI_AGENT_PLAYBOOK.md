# AI Agent Playbook

Last updated: 2026-03-02

This document is written for autonomous or semi-autonomous agents that interact with the Conflict Ops system.

## Mission

Produce high-signal, source-attributed conflict intelligence while preserving verification, governance, and safety boundaries.

## Non-Negotiable Constraints

1. Never modify application code or DB schema autonomously.
2. Never enable newly discovered sources directly.
3. Never publish unverified identities.
4. Never present theories or forecasts as deterministic facts.
5. Every autonomous action must be logged in `agent_actions`.

## Kill-Switch Flags

1. `conflict_ops_dashboard_v1`
2. `conflict_ops_autonomy_v1`
3. `conflict_ops_theory_public_v1`
4. `conflict_ops_forecast_public_v1`

Agent behavior must respect flag state before any publish-facing action.

## Agent Definitions

### 1. Source Scout Agent

Input:

1. Recent article/source signals.
2. Existing RSS sources and existing candidate queue.

Output:

1. `conflict_source_candidates` rows with `status=pending`.
2. Credibility/relevance scores and metadata.

Rules:

1. Queue-only discovery. No auto-enable.
2. Deduplicate by source host.

### 2. Ingestion Agent

Input:

1. Article corpus (published).
2. Confidence threshold.

Output:

1. New `conflict_events` records.
2. Deduplication results and run metrics.

Rules:

1. Use threshold + dedupe keys.
2. Mark extracted items as `verification_status=unverified` by default.

### 3. Verification Agent

Input:

1. Unverified events.
2. Near-time cross-source neighbors.

Output:

1. `metadata.verification_suggestion` and reason codes.

Rules:

1. Suggest only; admin performs final verify/reject action.

### 4. Theory Agent

Input:

1. Verified event set.
2. Evidence bundle and optional AI provider synthesis.

Output:

1. Theory cards with thesis, support/counter evidence, uncertainty, confidence.

Rules:

1. Must include uncertainty statement.
2. Must include evidence references.
3. Publish only if gates pass and theory public flag is enabled.

### 5. Forecast Agent

Input:

1. Verified historical event signals.
2. Optional provider adjustment signal.

Output:

1. Scenario probabilities for 24h and 7d (`escalation|stable|de_escalation`).
2. Calibration score and confidence band.

Rules:

1. Probabilities must be bounded [0,1] and normalized.
2. Publish only if calibration gate + forecast public flag pass.

### 6. Reliability Agent

Input:

1. Recent `agent_runs`, incidents, and action history.

Output:

1. New incidents when thresholds are crossed.
2. Allowed auto-fix actions only.

Rules:

1. Allowed actions:
- `retry_ingestion_job`
- `quarantine_source`
- `lower_fetch_concurrency`
- `trigger_backfill_after_recovery`
- `open_incident_record`
2. All actions must be logged.

## Required Traceability

For each run:

1. Store input payload, output payload, decision trace, metrics, and model metadata in `agent_runs`.
2. Store side effects in `agent_actions` with `allowed` and `reversible` fields.
3. Link incidents and actions where relevant.

## Safety-Labeled Language Contract

When generating output intended for public surfaces:

1. Use "hypothesis" wording for theories.
2. Use "probability" wording for forecasts.
3. Include uncertainty/calibration notes.
4. Never use deterministic language for future outcomes.

## Minimal Output Contract (Reference)

Theory object should include:

1. `thesis`
2. `supporting_evidence[]`
3. `counter_evidence[]`
4. `uncertainty`
5. `confidence`

Forecast object should include:

1. `horizon_hours`
2. `scenario_probabilities`
3. `confidence_band`
4. `calibration_score`
5. `calibration_note`
