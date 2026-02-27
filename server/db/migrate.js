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

    logger.info('Migration completed successfully!');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
