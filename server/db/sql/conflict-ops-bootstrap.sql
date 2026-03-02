-- Conflict Ops Bootstrap SQL
-- Run in Supabase SQL Editor (or any Postgres admin console)
-- Purpose: create runtime tables for conflict dashboard/autonomy and seed required feature flags.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS conflict_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conflict VARCHAR(80) NOT NULL DEFAULT 'unknown',
  event_date TIMESTAMP NOT NULL DEFAULT NOW(),
  reported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  title VARCHAR(500) DEFAULT '',
  summary TEXT DEFAULT '',
  source_name VARCHAR(255) DEFAULT 'Unknown Source',
  source_url TEXT,
  source_tier VARCHAR(30) DEFAULT 'other',
  article_id TEXT,
  actors JSONB DEFAULT '[]'::jsonb,
  hit_locations JSONB DEFAULT '[]'::jsonb,
  weapons JSONB DEFAULT '[]'::jsonb,
  technologies JSONB DEFAULT '[]'::jsonb,
  identities JSONB DEFAULT '[]'::jsonb,
  fatalities_total INTEGER DEFAULT 0,
  injured_total INTEGER DEFAULT 0,
  ids_released_count INTEGER DEFAULT 0,
  official_announcement_text TEXT DEFAULT '',
  official_announcement_actor VARCHAR(255) DEFAULT '',
  verification_status VARCHAR(30) DEFAULT 'unverified',
  verification_reason TEXT,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  extraction_method VARCHAR(80) DEFAULT 'manual',
  confidence REAL DEFAULT 0.5,
  metadata JSONB DEFAULT '{}'::jsonb,
  date_created TIMESTAMP DEFAULT NOW(),
  date_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conflict_events_conflict_date_idx ON conflict_events(conflict, event_date DESC);
CREATE INDEX IF NOT EXISTS conflict_events_verification_idx ON conflict_events(verification_status);
CREATE INDEX IF NOT EXISTS conflict_events_source_tier_idx ON conflict_events(source_tier);

CREATE TABLE IF NOT EXISTS conflict_source_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  source_tier_suggestion VARCHAR(30) DEFAULT 'other',
  credibility_score REAL DEFAULT 0.5,
  relevance_score REAL DEFAULT 0.5,
  discovery_method VARCHAR(80) DEFAULT 'agent_scout',
  status VARCHAR(30) DEFAULT 'pending',
  notes TEXT DEFAULT '',
  discovered_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS conflict_source_candidates_status_idx ON conflict_source_candidates(status);

CREATE TABLE IF NOT EXISTS conflict_theories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conflict VARCHAR(80) NOT NULL DEFAULT 'all',
  scope_type VARCHAR(30) DEFAULT 'conflict',
  scope_primary VARCHAR(255) DEFAULT '',
  scope_secondary VARCHAR(255) DEFAULT '',
  thesis TEXT NOT NULL,
  supporting_evidence JSONB DEFAULT '[]'::jsonb,
  counter_evidence JSONB DEFAULT '[]'::jsonb,
  uncertainty TEXT DEFAULT '',
  confidence REAL DEFAULT 0.5,
  evidence_count INTEGER DEFAULT 0,
  source_tier_min VARCHAR(30) DEFAULT 'other',
  status VARCHAR(30) DEFAULT 'draft',
  model_version VARCHAR(120),
  model_provider VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS conflict_theories_lookup_idx ON conflict_theories(conflict, status, created_at DESC);

CREATE TABLE IF NOT EXISTS conflict_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conflict VARCHAR(80) NOT NULL DEFAULT 'all',
  scope_type VARCHAR(30) DEFAULT 'conflict',
  scope_primary VARCHAR(255) DEFAULT '',
  scope_secondary VARCHAR(255) DEFAULT '',
  horizon_hours INTEGER NOT NULL,
  scenario_probabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_band JSONB DEFAULT '{}'::jsonb,
  calibration_score REAL DEFAULT 0,
  calibration_note TEXT DEFAULT '',
  status VARCHAR(30) DEFAULT 'draft',
  model_version VARCHAR(120),
  model_provider VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS conflict_forecasts_lookup_idx ON conflict_forecasts(conflict, horizon_hours, status, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name VARCHAR(80) NOT NULL,
  run_type VARCHAR(40) DEFAULT 'scheduled',
  status VARCHAR(30) DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  decision_trace JSONB DEFAULT '[]'::jsonb,
  model_metadata JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS agent_runs_lookup_idx ON agent_runs(agent_name, started_at DESC);

CREATE TABLE IF NOT EXISTS conflict_autonomy_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_id VARCHAR(120) NOT NULL,
  mode VARCHAR(20) DEFAULT 'async',
  status VARCHAR(30) DEFAULT 'queued',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  ok BOOLEAN,
  requested_by VARCHAR(255),
  request_source VARCHAR(30) DEFAULT 'api',
  options JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error JSONB DEFAULT '{}'::jsonb,
  agent_run_ids JSONB DEFAULT '[]'::jsonb,
  run_count INTEGER DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS conflict_autonomy_runs_trigger_idx ON conflict_autonomy_runs(trigger_id);
CREATE INDEX IF NOT EXISTS conflict_autonomy_runs_status_idx ON conflict_autonomy_runs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  severity VARCHAR(30) DEFAULT 'warning',
  status VARCHAR(30) DEFAULT 'open',
  category VARCHAR(80) DEFAULT 'pipeline',
  message TEXT NOT NULL,
  root_cause_hypothesis TEXT DEFAULT '',
  source_id TEXT,
  opened_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS agent_incidents_lookup_idx ON agent_incidents(status, opened_at DESC);

CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID,
  incident_id UUID,
  action_type VARCHAR(80) NOT NULL,
  status VARCHAR(30) DEFAULT 'executed',
  allowed BOOLEAN DEFAULT true,
  reversible BOOLEAN DEFAULT true,
  details JSONB DEFAULT '{}'::jsonb,
  executed_by VARCHAR(120) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_actions_run_idx ON agent_actions(run_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_name_idx ON feature_flags(name);

INSERT INTO feature_flags (name, enabled, description, sort)
VALUES
  ('conflict_ops_dashboard_v1', false, 'Enable tactical conflict operations dashboard UI', 900),
  ('conflict_ops_autonomy_v1', false, 'Enable autonomous conflict operations agents', 901),
  ('conflict_ops_theory_public_v1', false, 'Expose analyst theories on public conflict dashboard', 902),
  ('conflict_ops_forecast_public_v1', false, 'Expose conflict forecast probabilities on public dashboard', 903),
  ('wiki_index_v1', true, 'Enable the in-app wiki index documentation page', 910),
  ('wiki_conflict_ops_v1', true, 'Enable the conflict ops wiki documentation page', 911),
  ('wiki_ai_checker_v1', true, 'Enable the AI checker wiki documentation page', 912),
  ('wiki_markets_v1', true, 'Enable the markets wiki documentation page', 913),
  ('wiki_agent_api_v1', true, 'Enable the agent API wiki documentation page', 914)
ON CONFLICT (name) DO NOTHING;
