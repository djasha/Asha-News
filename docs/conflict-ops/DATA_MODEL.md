# Conflict Ops Data Model

Last updated: 2026-03-02

## Core Tables

### 1) `conflict_events`

Runtime source-of-truth event records used by dashboard metrics and review workflows.

Key fields:

1. Identity and scope: `id`, `conflict`, `event_date`, `reported_at`
2. Source metadata: `source_name`, `source_url`, `source_tier`, `article_id`
3. Tactical dimensions: `actors`, `hit_locations`, `weapons`, `technologies`, `official_announcement_types`
4. Casualty/identity counts: `fatalities_total`, `injured_total`, `ids_released_count`, `identities`
5. Governance: `verification_status`, `verification_reason`, `verified_by`, `verified_at`
6. Extraction/quality: `extraction_method`, `confidence`, `metadata`

`metadata` currently carries structured analyst signals, including:

1. `weapon_categories` and `technology_categories` taxonomy hints.
2. `official_announcement.type|confidence|matched_signals` classification.
3. `extracted_identity_count` and location signal counters.
4. `extraction_confidence.event_confidence|announcement_confidence`.

Indexes:

1. `(conflict, event_date DESC)`
2. `(verification_status)`
3. `(source_tier)`

### 2) `conflict_source_candidates`

Queue-first source discovery table.

Key fields:

1. Candidate identity: `name`, `url`
2. Scoring: `source_tier_suggestion`, `credibility_score`, `relevance_score`
3. Workflow: `status=pending|approved|rejected`, `reviewed_at`, `reviewed_by`
4. Trace: `discovery_method`, `notes`, `metadata`

### 3) `conflict_theories`

Analyst hypothesis objects with evidence and uncertainty.

Key fields:

1. Scope: `conflict`, `scope_type`, `scope_primary`, `scope_secondary`
2. Content: `thesis`, `supporting_evidence`, `counter_evidence`, `uncertainty`
3. Quality: `confidence`, `evidence_count`, `source_tier_min`
4. Publication: `status=draft|published`, `published_at`
5. Model lineage: `model_provider`, `model_version`, `metadata`

### 4) `conflict_forecasts`

Probabilistic scenario outputs.

Key fields:

1. Scope: `conflict`, `scope_*`
2. Forecast payload: `horizon_hours`, `scenario_probabilities`, `confidence_band`
3. Quality: `calibration_score`, `calibration_note`
4. Publication: `status=draft|published`, `published_at`
5. Model lineage: `model_provider`, `model_version`, `metadata`

### 5) `agent_runs`

Per-run execution trace.

Key fields:

1. Identity: `agent_name`, `run_type`, `status`
2. Timing: `started_at`, `finished_at`
3. Trace payloads: `input_payload`, `output_payload`, `decision_trace`, `metrics`, `model_metadata`
4. Errors: `error_message`

### 6) `conflict_autonomy_runs`

Durable tracker for manual autonomy trigger lifecycle (async run observability).

Key fields:

1. Identity: `trigger_id`, `mode`, `status`
2. Timing: `created_at`, `updated_at`, `started_at`, `finished_at`
3. Request metadata: `requested_by`, `request_source`, `options`
4. Outcome: `ok`, `result`, `error`
5. Correlation: `agent_run_ids`, `run_count`

### 7) `agent_incidents`

Reliability incidents and lifecycle.

Key fields:

1. Classification: `severity`, `category`, `status`
2. Message: `message`, `root_cause_hypothesis`
3. Timing: `opened_at`, `last_seen_at`, `resolved_at`
4. Context: `source_id`, `metadata`

### 8) `agent_actions`

Immutable-like audit records of autonomous actions.

Key fields:

1. Linking: `run_id`, `incident_id`
2. Action metadata: `action_type`, `status`, `allowed`, `reversible`
3. Context: `details`, `executed_by`, `created_at`

## Relationships (Logical)

1. `conflict_autonomy_runs` (1) -> (N) `agent_runs` (logical correlation via `agent_run_ids`)
2. `agent_runs` (1) -> (N) `agent_actions`
3. `agent_incidents` (1) -> (N) `agent_actions`
4. `conflict_events` feed theory/forecast generation and review queues
5. `conflict_source_candidates` serves admin approval queue before source onboarding

## Lifecycle Summary

1. Ingestion creates unverified event records.
2. Verification agent annotates suggestions.
3. Admin confirms verify/reject decisions.
4. Stats/news/analyst surfaces read from filtered event sets.
5. Reliability agent monitors run outcomes and incident thresholds.
