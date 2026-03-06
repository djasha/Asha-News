/**
 * Database migration script
 * Creates tables if they don't exist and seeds default data.
 * Safe to run multiple times — uses IF NOT EXISTS.
 *
 * Usage: DATABASE_URL=postgres://... node db/migrate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const logger = require('../utils/logger');
const { Pool } = require('pg');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    logger.info('Starting database migration...');

    // Enable uuid-ossp extension for uuid_generate_v4()
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // ─── Articles ────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
        summary TEXT DEFAULT '',
        content TEXT DEFAULT '',
        byline TEXT,
        url TEXT,
        source_url TEXT,
        source_name VARCHAR(255) DEFAULT 'Unknown Source',
        category VARCHAR(100) DEFAULT 'General',
        author_name VARCHAR(255),
        political_bias VARCHAR(50) DEFAULT 'center',
        bias_score REAL DEFAULT 0.5,
        credibility_score REAL DEFAULT 0.8,
        featured_image_alt TEXT,
        image_url TEXT,
        breaking_news BOOLEAN DEFAULT false,
        featured BOOLEAN DEFAULT false,
        word_count INTEGER,
        reading_time INTEGER,
        fact_check_status VARCHAR(50) DEFAULT 'unverified',
        view_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'published',
        published_at TIMESTAMP,
        date_created TIMESTAMP DEFAULT NOW(),
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Story Clusters ──────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS story_clusters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500),
        cluster_summary TEXT,
        expanded_summary TEXT,
        bias_distribution JSONB,
        article_count INTEGER DEFAULT 0,
        main_topic VARCHAR(255),
        topic_category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        x_posts JSONB,
        trending_hashtags JSONB,
        content_hash VARCHAR(128),
        fact_check JSONB,
        qa_pairs JSONB,
        key_perspectives JSONB,
        featured BOOLEAN DEFAULT false,
        featured_on_homepage BOOLEAN DEFAULT false,
        editorial_priority VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Junction: articles <-> story_clusters ───────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles_story_clusters (
        id SERIAL PRIMARY KEY,
        articles_id UUID REFERENCES articles(id) ON DELETE CASCADE,
        story_clusters_id UUID REFERENCES story_clusters(id) ON DELETE CASCADE
      )
    `);

    // ─── Tags ────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles_tags (
        id SERIAL PRIMARY KEY,
        articles_id UUID REFERENCES articles(id) ON DELETE CASCADE,
        tags_id UUID REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // ─── RSS Sources ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rss_sources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        political_bias VARCHAR(50) DEFAULT 'center',
        category VARCHAR(100),
        description TEXT,
        last_fetched TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        sort INTEGER DEFAULT 0
      )
    `);

    // ─── Global Settings (singleton-like) ────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255),
        setting_value TEXT,
        site_name VARCHAR(255) DEFAULT 'Asha News',
        site_description TEXT,
        site_logo TEXT,
        contact_email VARCHAR(255),
        social_links JSONB,
        analytics_id VARCHAR(100),
        meta_tags JSONB,
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Site Configuration (key-value) ──────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_configuration (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(255) NOT NULL,
        config_value JSONB,
        description TEXT,
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Feature Flags ───────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT false,
        description TEXT,
        sort INTEGER DEFAULT 0
      )
    `);

    // ─── Navigation Items ────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS navigation_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        label VARCHAR(255) NOT NULL,
        url TEXT,
        location VARCHAR(50),
        icon VARCHAR(100),
        sort INTEGER DEFAULT 0,
        enabled BOOLEAN DEFAULT true,
        parent_id UUID
      )
    `);

    // ─── Menu Items ──────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        label VARCHAR(255) NOT NULL,
        url TEXT,
        parent_menu UUID,
        sort INTEGER DEFAULT 0,
        enabled BOOLEAN DEFAULT true
      )
    `);

    // ─── Topic Categories ────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS topic_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        description TEXT,
        icon VARCHAR(100),
        color VARCHAR(20),
        enabled BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0
      )
    `);

    // ─── Homepage Sections ───────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255),
        section_type VARCHAR(100),
        enabled BOOLEAN DEFAULT true,
        config JSONB,
        sort_order INTEGER DEFAULT 0
      )
    `);

    // ─── Breaking News ───────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS breaking_news (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        summary TEXT,
        description TEXT,
        category VARCHAR(100),
        active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Curated Collections ─────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS curated_collections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500),
        description TEXT,
        main_topic VARCHAR(255),
        featured BOOLEAN DEFAULT false,
        article_ids JSONB,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Editorial Briefs ────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS editorial_briefs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500),
        content TEXT,
        date TIMESTAMP,
        time_period VARCHAR(50),
        category VARCHAR(100),
        priority_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Daily Briefs ────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_briefs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500),
        content TEXT,
        date TIMESTAMP,
        time_period VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Page Content ────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        page_name VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        content TEXT,
        published BOOLEAN DEFAULT false,
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Legal Pages ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS legal_pages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        content TEXT,
        published BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Fact Check Claims ───────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fact_check_claims (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        claim TEXT,
        verdict VARCHAR(100),
        explanation TEXT,
        sources JSONB,
        article_id UUID,
        published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── News Sources ────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_sources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        url TEXT,
        bias_rating VARCHAR(50),
        political_bias VARCHAR(50),
        credibility_score REAL,
        description TEXT,
        logo_url TEXT,
        followers INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active'
      )
    `);

    // ─── Trending Topics ─────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trending_topics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        topic VARCHAR(255),
        name VARCHAR(255),
        slug VARCHAR(255),
        trend_score REAL DEFAULT 0,
        article_count INTEGER DEFAULT 0,
        category VARCHAR(100),
        topic_category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Users ───────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        password_hash TEXT,
        display_name VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar_url TEXT,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        provider VARCHAR(50) DEFAULT 'local',
        provider_id TEXT,
        preferences JSONB,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email)');

    // ─── Subscription Tiers ──────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_tiers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT,
        price_monthly REAL DEFAULT 0,
        price_yearly REAL DEFAULT 0,
        features JSONB DEFAULT '[]'::jsonb,
        limits JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        badge_color VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── User Subscriptions ──────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        started_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        payment_provider VARCHAR(50),
        payment_subscription_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── API Configs ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_configs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        service_name VARCHAR(100) NOT NULL,
        api_key TEXT,
        model VARCHAR(100),
        enabled BOOLEAN DEFAULT true,
        config JSONB,
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Refresh Tokens (auth) ─────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        token TEXT NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── API Configurations (used by apiConfigService) ───────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_configurations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        service_name VARCHAR(100) NOT NULL,
        environment VARCHAR(50) DEFAULT 'development',
        api_key TEXT,
        client_id TEXT,
        client_secret TEXT,
        base_url TEXT,
        configuration JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'active',
        date_updated TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Conflict Ops Runtime ───────────────────────────────
    await pool.query(`
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
        official_announcement_types JSONB DEFAULT '[]'::jsonb,
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS conflict_events_conflict_date_idx ON conflict_events(conflict, event_date DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS conflict_events_verification_idx ON conflict_events(verification_status)');
    await pool.query('CREATE INDEX IF NOT EXISTS conflict_events_source_tier_idx ON conflict_events(source_tier)');

    await pool.query(`
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS conflict_source_candidates_status_idx ON conflict_source_candidates(status)');

    await pool.query(`
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS conflict_theories_lookup_idx ON conflict_theories(conflict, status, created_at DESC)');

    await pool.query(`
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS conflict_forecasts_lookup_idx ON conflict_forecasts(conflict, horizon_hours, status, created_at DESC)');

    await pool.query(`
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS agent_runs_lookup_idx ON agent_runs(agent_name, started_at DESC)');

    await pool.query(`
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
      )
    `);
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS conflict_autonomy_runs_trigger_idx ON conflict_autonomy_runs(trigger_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS conflict_autonomy_runs_status_idx ON conflict_autonomy_runs(status, created_at DESC)');

    await pool.query(`
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS agent_incidents_lookup_idx ON agent_incidents(status, opened_at DESC)');

    await pool.query(`
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS agent_actions_run_idx ON agent_actions(run_id, created_at DESC)');

    // ─── Mission Control: user preferences and layouts ──────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_user_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255),
        profile_key VARCHAR(120) NOT NULL DEFAULT 'default',
        preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        mode_default VARCHAR(20) NOT NULL DEFAULT 'simple',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_workspace_layouts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        profile_key VARCHAR(120) NOT NULL DEFAULT 'default',
        preset_id VARCHAR(120) NOT NULL,
        layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, preset_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_followed_regions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        region VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, region)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_muted_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        signature VARCHAR(400) NOT NULL,
        scope VARCHAR(80) NOT NULL DEFAULT 'source-location',
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        UNIQUE(scope_id, signature, scope)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_alert_actions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        alert_id VARCHAR(255) NOT NULL,
        action VARCHAR(80) NOT NULL,
        metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, alert_id, action)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_dispatch_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        alert_id VARCHAR(255) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        payload_json JSONB NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'queued',
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at TIMESTAMP DEFAULT NOW(),
        claimed_at TIMESTAMP,
        claimed_by VARCHAR(120),
        last_error_code VARCHAR(120),
        idempotency_key VARCHAR(500) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query('ALTER TABLE mc_dispatch_queue ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP');
    await pool.query('ALTER TABLE mc_dispatch_queue ADD COLUMN IF NOT EXISTS claimed_by VARCHAR(120)');
    await pool.query('ALTER TABLE mc_dispatch_queue ADD COLUMN IF NOT EXISTS last_error_code VARCHAR(120)');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_dispatch_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        queue_id UUID REFERENCES mc_dispatch_queue(id) ON DELETE CASCADE,
        provider VARCHAR(120) NOT NULL,
        result VARCHAR(80) NOT NULL,
        delivered_at TIMESTAMP,
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_dispatch_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        metric_type VARCHAR(120) NOT NULL,
        value_ms INTEGER,
        value_num NUMERIC(14,4),
        channel VARCHAR(50),
        alert_id VARCHAR(255),
        metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_source_health_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        source VARCHAR(120) NOT NULL,
        status VARCHAR(40) NOT NULL,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        message TEXT,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, source)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_feed_filters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255),
        profile_key VARCHAR(120) NOT NULL DEFAULT 'default',
        topics JSONB NOT NULL DEFAULT '[]'::jsonb,
        categories JSONB NOT NULL DEFAULT '[]'::jsonb,
        countries JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_types JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_feed_cursor_state (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        view VARCHAR(120) NOT NULL DEFAULT 'feed',
        cursor VARCHAR(255) NOT NULL DEFAULT '0',
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, view)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_wm_resource_health (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        family VARCHAR(120) NOT NULL,
        resource_key VARCHAR(120) NOT NULL,
        status VARCHAR(40) NOT NULL,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        error_code VARCHAR(120),
        endpoint_path VARCHAR(300),
        wm_endpoint_version VARCHAR(60),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, resource_key)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_feed_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        dedupe_key VARCHAR(255) NOT NULL,
        source_type VARCHAR(80) NOT NULL,
        verification_status VARCHAR(80) NOT NULL,
        severity VARCHAR(30) NOT NULL,
        country VARCHAR(8),
        topic VARCHAR(120),
        category VARCHAR(120),
        payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, dedupe_key)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mc_source_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_id VARCHAR(255) NOT NULL,
        source_provider VARCHAR(80) NOT NULL,
        source_key VARCHAR(255) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT false,
        metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scope_id, source_provider, source_key)
      )
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS mc_workspace_layouts_scope_idx ON mc_workspace_layouts(scope_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_alert_actions_scope_idx ON mc_alert_actions(scope_id, created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_dispatch_queue_status_idx ON mc_dispatch_queue(status, next_attempt_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_dispatch_queue_claim_idx ON mc_dispatch_queue(status, claimed_at, next_attempt_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_dispatch_metrics_scope_idx ON mc_dispatch_metrics(scope_id, metric_type, created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_source_health_scope_idx ON mc_source_health_snapshots(scope_id, updated_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_feed_filters_scope_idx ON mc_feed_filters(scope_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_feed_cursor_scope_idx ON mc_feed_cursor_state(scope_id, view)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_wm_resource_scope_idx ON mc_wm_resource_health(scope_id, family, updated_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_feed_events_scope_idx ON mc_feed_events(scope_id, created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_feed_events_filter_idx ON mc_feed_events(scope_id, severity, source_type, verification_status)');
    await pool.query('CREATE INDEX IF NOT EXISTS mc_source_subscriptions_scope_idx ON mc_source_subscriptions(scope_id, source_provider, enabled)');

    // ─── Seed default subscription tiers ─────────────────────
    const { rows: existingTiers } = await pool.query('SELECT id FROM subscription_tiers LIMIT 1');
    if (existingTiers.length === 0) {
      logger.info('Seeding default subscription tiers...');
      await pool.query(`
        INSERT INTO subscription_tiers (name, slug, description, price_monthly, price_yearly, features, limits, is_active, is_default, sort_order, badge_color) VALUES
        ('Free', 'free', 'Basic access to Asha News', 0, 0,
         '["Basic bias indicators", "Top stories feed", "AI summaries", "10 articles per day"]'::jsonb,
         '{"articles_per_day": 10, "saved_articles": 20}'::jsonb,
         true, true, 0, '#6B7280'),
        ('Pro', 'pro', 'Full access for informed readers', 4.99, 29.99,
         '["Unlimited articles", "Full bias analysis", "Personal bias dashboard", "Blindspot alerts", "Custom feeds", "Ad-free experience"]'::jsonb,
         '{"articles_per_day": -1, "saved_articles": -1}'::jsonb,
         true, false, 1, '#3B82F6'),
        ('Premium', 'premium', 'Everything plus API and advanced features', 9.99, 79.99,
         '["Everything in Pro", "AI daily briefs", "Advanced fact-checking", "API access (1000 calls/mo)", "Priority support", "Export data"]'::jsonb,
         '{"articles_per_day": -1, "saved_articles": -1, "api_calls_per_month": 1000}'::jsonb,
         true, false, 2, '#8B5CF6')
      `);
      logger.info('Default subscription tiers created');
    }

    // ─── Seed default global settings ────────────────────────
    const { rows: existingSettings } = await pool.query('SELECT id FROM global_settings LIMIT 1');
    if (existingSettings.length === 0) {
      logger.info('Seeding default global settings...');
      await pool.query(`
        INSERT INTO global_settings (site_name, site_description) VALUES
        ('Asha News', 'AI-powered news aggregation that combats media bias')
      `);
    }

    // ─── Seed required conflict ops flags ───────────────────
    await pool.query(`
      INSERT INTO feature_flags (name, enabled, description, sort)
      VALUES
        ('conflict_ops_dashboard_v1', false, 'Enable tactical conflict operations dashboard UI', 900),
        ('conflict_ops_autonomy_v1', false, 'Enable autonomous conflict operations agents', 901),
        ('conflict_ops_theory_public_v1', false, 'Expose analyst theories on public conflict dashboard', 902),
        ('conflict_ops_forecast_public_v1', false, 'Expose conflict forecast probabilities on public dashboard', 903),
        ('cod_war_monitor_v1', false, 'Enable immersive full-page COD War Monitor route', 904),
        ('wiki_index_v1', true, 'Enable the in-app wiki index documentation page', 910),
        ('wiki_conflict_ops_v1', true, 'Enable the conflict ops wiki documentation page', 911),
        ('wiki_ai_checker_v1', true, 'Enable the AI checker wiki documentation page', 912),
        ('wiki_markets_v1', true, 'Enable the markets wiki documentation page', 913),
        ('wiki_agent_api_v1', true, 'Enable the agent API wiki documentation page', 914)
      ON CONFLICT (name) DO NOTHING
    `).catch(async () => {
      // Older DBs may not have a unique index yet.
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_name_idx ON feature_flags(name)');
      await pool.query(`
        INSERT INTO feature_flags (name, enabled, description, sort)
        VALUES
          ('conflict_ops_dashboard_v1', false, 'Enable tactical conflict operations dashboard UI', 900),
          ('conflict_ops_autonomy_v1', false, 'Enable autonomous conflict operations agents', 901),
          ('conflict_ops_theory_public_v1', false, 'Expose analyst theories on public conflict dashboard', 902),
          ('conflict_ops_forecast_public_v1', false, 'Expose conflict forecast probabilities on public dashboard', 903),
          ('cod_war_monitor_v1', false, 'Enable immersive full-page COD War Monitor route', 904),
          ('wiki_index_v1', true, 'Enable the in-app wiki index documentation page', 910),
          ('wiki_conflict_ops_v1', true, 'Enable the conflict ops wiki documentation page', 911),
          ('wiki_ai_checker_v1', true, 'Enable the AI checker wiki documentation page', 912),
          ('wiki_markets_v1', true, 'Enable the markets wiki documentation page', 913),
          ('wiki_agent_api_v1', true, 'Enable the agent API wiki documentation page', 914)
        ON CONFLICT (name) DO NOTHING
      `);
    });

    logger.info('Migration completed successfully!');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
