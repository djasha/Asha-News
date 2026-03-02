const { pgTable, uuid, text, varchar, integer, boolean, timestamp, json, real, serial, uniqueIndex } = require('drizzle-orm/pg-core');

// ─── Core Content ────────────────────────────────────────────

const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull().default('Untitled'),
  summary: text('summary').default(''),
  content: text('content').default(''),
  byline: text('byline'),
  url: text('url'),
  source_url: text('source_url'),
  source_name: varchar('source_name', { length: 255 }).default('Unknown Source'),
  category: varchar('category', { length: 100 }).default('General'),
  author_name: varchar('author_name', { length: 255 }),
  political_bias: varchar('political_bias', { length: 50 }).default('center'),
  bias_score: real('bias_score').default(0.5),
  credibility_score: real('credibility_score').default(0.8),
  featured_image_alt: text('featured_image_alt'),
  image_url: text('image_url'),
  breaking_news: boolean('breaking_news').default(false),
  featured: boolean('featured').default(false),
  word_count: integer('word_count'),
  reading_time: integer('reading_time'),
  fact_check_status: varchar('fact_check_status', { length: 50 }).default('unverified'),
  view_count: integer('view_count').default(0),
  status: varchar('status', { length: 50 }).default('published'),
  published_at: timestamp('published_at'),
  date_created: timestamp('date_created').defaultNow(),
  date_updated: timestamp('date_updated').defaultNow(),
});

const storyClusters = pgTable('story_clusters', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }),
  cluster_summary: text('cluster_summary'),
  expanded_summary: text('expanded_summary'),
  bias_distribution: json('bias_distribution'),
  article_count: integer('article_count').default(0),
  main_topic: varchar('main_topic', { length: 255 }),
  topic_category: varchar('topic_category', { length: 100 }),
  status: varchar('status', { length: 50 }).default('active'),
  x_posts: json('x_posts'),
  trending_hashtags: json('trending_hashtags'),
  content_hash: varchar('content_hash', { length: 128 }),
  fact_check: json('fact_check'),
  qa_pairs: json('qa_pairs'),
  key_perspectives: json('key_perspectives'),
  featured: boolean('featured').default(false),
  featured_on_homepage: boolean('featured_on_homepage').default(false),
  editorial_priority: varchar('editorial_priority', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

const articlesStoryClusters = pgTable('articles_story_clusters', {
  id: serial('id').primaryKey(),
  articles_id: uuid('articles_id').references(() => articles.id, { onDelete: 'cascade' }),
  story_clusters_id: uuid('story_clusters_id').references(() => storyClusters.id, { onDelete: 'cascade' }),
});

const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }),
});

const articlesTags = pgTable('articles_tags', {
  id: serial('id').primaryKey(),
  articles_id: uuid('articles_id').references(() => articles.id, { onDelete: 'cascade' }),
  tags_id: uuid('tags_id').references(() => tags.id, { onDelete: 'cascade' }),
});

// ─── RSS Sources ─────────────────────────────────────────────

const rssSources = pgTable('rss_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  enabled: boolean('enabled').default(true),
  political_bias: varchar('political_bias', { length: 50 }).default('center'),
  category: varchar('category', { length: 100 }),
  description: text('description'),
  last_fetched: timestamp('last_fetched'),
  status: varchar('status', { length: 50 }).default('active'),
  sort: integer('sort').default(0),
});

// ─── Site Configuration ──────────────────────────────────────

const globalSettings = pgTable('global_settings', {
  id: serial('id').primaryKey(),
  setting_key: varchar('setting_key', { length: 255 }),
  setting_value: text('setting_value'),
  site_name: varchar('site_name', { length: 255 }).default('Asha News'),
  site_description: text('site_description'),
  site_logo: text('site_logo'),
  contact_email: varchar('contact_email', { length: 255 }),
  social_links: json('social_links'),
  analytics_id: varchar('analytics_id', { length: 100 }),
  meta_tags: json('meta_tags'),
  date_updated: timestamp('date_updated').defaultNow(),
});

const siteConfiguration = pgTable('site_configuration', {
  id: serial('id').primaryKey(),
  config_key: varchar('config_key', { length: 255 }).notNull(),
  config_value: json('config_value'),
  description: text('description'),
  date_updated: timestamp('date_updated').defaultNow(),
});

const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  enabled: boolean('enabled').default(false),
  description: text('description'),
  sort: integer('sort').default(0),
});

// ─── Navigation & Menus ─────────────────────────────────────

const navigationItems = pgTable('navigation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 255 }).notNull(),
  url: text('url'),
  location: varchar('location', { length: 50 }),
  icon: varchar('icon', { length: 100 }),
  sort: integer('sort').default(0),
  enabled: boolean('enabled').default(true),
  parent_id: uuid('parent_id'),
});

const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 255 }).notNull(),
  url: text('url'),
  parent_menu: uuid('parent_menu'),
  sort: integer('sort').default(0),
  enabled: boolean('enabled').default(true),
});

// ─── Topics & Categories ────────────────────────────────────

const topicCategories = pgTable('topic_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  color: varchar('color', { length: 20 }),
  enabled: boolean('enabled').default(true),
  sort_order: integer('sort_order').default(0),
});

// ─── Homepage & Content Curation ────────────────────────────

const homepageSections = pgTable('homepage_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  section_type: varchar('section_type', { length: 100 }),
  enabled: boolean('enabled').default(true),
  config: json('config'),
  sort_order: integer('sort_order').default(0),
});

const breakingNews = pgTable('breaking_news', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  summary: text('summary'),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  active: boolean('active').default(true),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow(),
});

const curatedCollections = pgTable('curated_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }),
  description: text('description'),
  main_topic: varchar('main_topic', { length: 255 }),
  featured: boolean('featured').default(false),
  article_ids: json('article_ids'),
  status: varchar('status', { length: 50 }).default('active'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Editorial ──────────────────────────────────────────────

const editorialBriefs = pgTable('editorial_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  date: timestamp('date'),
  time_period: varchar('time_period', { length: 50 }),
  category: varchar('category', { length: 100 }),
  priority_level: varchar('priority_level', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
});

const dailyBriefs = pgTable('daily_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  date: timestamp('date'),
  time_period: varchar('time_period', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Pages & Legal ──────────────────────────────────────────

const pageContent = pgTable('page_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  page_name: varchar('page_name', { length: 255 }).notNull(),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  published: boolean('published').default(false),
  date_updated: timestamp('date_updated').defaultNow(),
});

const legalPages = pgTable('legal_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  published: boolean('published').default(false),
  sort_order: integer('sort_order').default(0),
  date_updated: timestamp('date_updated').defaultNow(),
});

// ─── Fact Checking ──────────────────────────────────────────

const factCheckClaims = pgTable('fact_check_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  claim: text('claim'),
  verdict: varchar('verdict', { length: 100 }),
  explanation: text('explanation'),
  sources: json('sources'),
  article_id: uuid('article_id'),
  published: boolean('published').default(false),
  created_at: timestamp('created_at').defaultNow(),
  date_updated: timestamp('date_updated').defaultNow(),
});

// ─── Source & Topic Metadata ────────────────────────────────

const newsSources = pgTable('news_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url'),
  bias_rating: varchar('bias_rating', { length: 50 }),
  political_bias: varchar('political_bias', { length: 50 }),
  credibility_score: real('credibility_score'),
  description: text('description'),
  logo_url: text('logo_url'),
  followers: integer('followers').default(0),
  status: varchar('status', { length: 50 }).default('active'),
});

const trendingTopics = pgTable('trending_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic: varchar('topic', { length: 255 }),
  name: varchar('name', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  trend_score: real('trend_score').default(0),
  article_count: integer('article_count').default(0),
  category: varchar('category', { length: 100 }),
  topic_category: varchar('topic_category', { length: 100 }),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Conflict Ops Runtime ───────────────────────────────────

const conflictEvents = pgTable('conflict_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  conflict: varchar('conflict', { length: 80 }).notNull().default('unknown'),
  event_date: timestamp('event_date').notNull().defaultNow(),
  reported_at: timestamp('reported_at').notNull().defaultNow(),
  title: varchar('title', { length: 500 }).default(''),
  summary: text('summary').default(''),
  source_name: varchar('source_name', { length: 255 }).default('Unknown Source'),
  source_url: text('source_url'),
  source_tier: varchar('source_tier', { length: 30 }).default('other'),
  article_id: text('article_id'),
  actors: json('actors').default([]),
  hit_locations: json('hit_locations').default([]),
  weapons: json('weapons').default([]),
  technologies: json('technologies').default([]),
  identities: json('identities').default([]),
  fatalities_total: integer('fatalities_total').default(0),
  injured_total: integer('injured_total').default(0),
  ids_released_count: integer('ids_released_count').default(0),
  official_announcement_text: text('official_announcement_text').default(''),
  official_announcement_actor: varchar('official_announcement_actor', { length: 255 }).default(''),
  verification_status: varchar('verification_status', { length: 30 }).default('unverified'),
  verification_reason: text('verification_reason'),
  verified_by: varchar('verified_by', { length: 255 }),
  verified_at: timestamp('verified_at'),
  extraction_method: varchar('extraction_method', { length: 80 }).default('manual'),
  confidence: real('confidence').default(0.5),
  metadata: json('metadata').default({}),
  date_created: timestamp('date_created').defaultNow(),
  date_updated: timestamp('date_updated').defaultNow(),
});

const conflictSourceCandidates = pgTable('conflict_source_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  source_tier_suggestion: varchar('source_tier_suggestion', { length: 30 }).default('other'),
  credibility_score: real('credibility_score').default(0.5),
  relevance_score: real('relevance_score').default(0.5),
  discovery_method: varchar('discovery_method', { length: 80 }).default('agent_scout'),
  status: varchar('status', { length: 30 }).default('pending'),
  notes: text('notes').default(''),
  discovered_at: timestamp('discovered_at').defaultNow(),
  reviewed_at: timestamp('reviewed_at'),
  reviewed_by: varchar('reviewed_by', { length: 255 }),
  metadata: json('metadata').default({}),
});

const conflictTheories = pgTable('conflict_theories', {
  id: uuid('id').primaryKey().defaultRandom(),
  conflict: varchar('conflict', { length: 80 }).notNull().default('all'),
  scope_type: varchar('scope_type', { length: 30 }).default('conflict'),
  scope_primary: varchar('scope_primary', { length: 255 }).default(''),
  scope_secondary: varchar('scope_secondary', { length: 255 }).default(''),
  thesis: text('thesis').notNull(),
  supporting_evidence: json('supporting_evidence').default([]),
  counter_evidence: json('counter_evidence').default([]),
  uncertainty: text('uncertainty').default(''),
  confidence: real('confidence').default(0.5),
  evidence_count: integer('evidence_count').default(0),
  source_tier_min: varchar('source_tier_min', { length: 30 }).default('other'),
  status: varchar('status', { length: 30 }).default('draft'),
  model_version: varchar('model_version', { length: 120 }),
  model_provider: varchar('model_provider', { length: 120 }),
  created_at: timestamp('created_at').defaultNow(),
  published_at: timestamp('published_at'),
  metadata: json('metadata').default({}),
});

const conflictForecasts = pgTable('conflict_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  conflict: varchar('conflict', { length: 80 }).notNull().default('all'),
  scope_type: varchar('scope_type', { length: 30 }).default('conflict'),
  scope_primary: varchar('scope_primary', { length: 255 }).default(''),
  scope_secondary: varchar('scope_secondary', { length: 255 }).default(''),
  horizon_hours: integer('horizon_hours').notNull(),
  scenario_probabilities: json('scenario_probabilities').notNull().default({}),
  confidence_band: json('confidence_band').default({}),
  calibration_score: real('calibration_score').default(0),
  calibration_note: text('calibration_note').default(''),
  status: varchar('status', { length: 30 }).default('draft'),
  model_version: varchar('model_version', { length: 120 }),
  model_provider: varchar('model_provider', { length: 120 }),
  created_at: timestamp('created_at').defaultNow(),
  published_at: timestamp('published_at'),
  metadata: json('metadata').default({}),
});

const agentRuns = pgTable('agent_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agent_name: varchar('agent_name', { length: 80 }).notNull(),
  run_type: varchar('run_type', { length: 40 }).default('scheduled'),
  status: varchar('status', { length: 30 }).default('running'),
  started_at: timestamp('started_at').defaultNow(),
  finished_at: timestamp('finished_at'),
  input_payload: json('input_payload').default({}),
  output_payload: json('output_payload').default({}),
  decision_trace: json('decision_trace').default([]),
  model_metadata: json('model_metadata').default({}),
  metrics: json('metrics').default({}),
  error_message: text('error_message'),
});

const conflictAutonomyRuns = pgTable('conflict_autonomy_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  trigger_id: varchar('trigger_id', { length: 120 }).notNull(),
  mode: varchar('mode', { length: 20 }).default('async'),
  status: varchar('status', { length: 30 }).default('queued'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  started_at: timestamp('started_at'),
  finished_at: timestamp('finished_at'),
  ok: boolean('ok'),
  requested_by: varchar('requested_by', { length: 255 }),
  request_source: varchar('request_source', { length: 30 }).default('api'),
  options: json('options').default({}),
  result: json('result').default({}),
  error: json('error').default({}),
  agent_run_ids: json('agent_run_ids').default([]),
  run_count: integer('run_count').default(0),
}, (table) => ({
  triggerIdx: uniqueIndex('conflict_autonomy_runs_trigger_idx').on(table.trigger_id),
}));

const agentIncidents = pgTable('agent_incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  severity: varchar('severity', { length: 30 }).default('warning'),
  status: varchar('status', { length: 30 }).default('open'),
  category: varchar('category', { length: 80 }).default('pipeline'),
  message: text('message').notNull(),
  root_cause_hypothesis: text('root_cause_hypothesis').default(''),
  source_id: text('source_id'),
  opened_at: timestamp('opened_at').defaultNow(),
  last_seen_at: timestamp('last_seen_at').defaultNow(),
  resolved_at: timestamp('resolved_at'),
  metadata: json('metadata').default({}),
});

const agentActions = pgTable('agent_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  run_id: uuid('run_id'),
  incident_id: uuid('incident_id'),
  action_type: varchar('action_type', { length: 80 }).notNull(),
  status: varchar('status', { length: 30 }).default('executed'),
  allowed: boolean('allowed').default(true),
  reversible: boolean('reversible').default(true),
  details: json('details').default({}),
  executed_by: varchar('executed_by', { length: 120 }).default('system'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Users & Auth ───────────────────────────────────────────

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  password_hash: text('password_hash'),
  display_name: varchar('display_name', { length: 255 }),
  first_name: varchar('first_name', { length: 100 }),
  last_name: varchar('last_name', { length: 100 }),
  avatar_url: text('avatar_url'),
  role: varchar('role', { length: 50 }).default('user'),
  status: varchar('status', { length: 50 }).default('active'),
  provider: varchar('provider', { length: 50 }).default('local'),
  provider_id: text('provider_id'),
  preferences: json('preferences'),
  last_login: timestamp('last_login'),
  created_at: timestamp('created_at').defaultNow(),
  date_updated: timestamp('date_updated').defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// ─── Subscriptions & Monetization ───────────────────────────

const subscriptionTiers = pgTable('subscription_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  price_monthly: real('price_monthly').default(0),
  price_yearly: real('price_yearly').default(0),
  features: json('features').default([]),
  limits: json('limits').default({}),
  is_active: boolean('is_active').default(true),
  is_default: boolean('is_default').default(false),
  sort_order: integer('sort_order').default(0),
  badge_color: varchar('badge_color', { length: 20 }),
  created_at: timestamp('created_at').defaultNow(),
  date_updated: timestamp('date_updated').defaultNow(),
});

const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tier_id: uuid('tier_id').references(() => subscriptionTiers.id).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  started_at: timestamp('started_at').defaultNow(),
  expires_at: timestamp('expires_at'),
  payment_provider: varchar('payment_provider', { length: 50 }),
  payment_subscription_id: text('payment_subscription_id'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── API Configuration ──────────────────────────────────────

const apiConfigs = pgTable('api_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  service_name: varchar('service_name', { length: 100 }).notNull(),
  api_key: text('api_key'),
  model: varchar('model', { length: 100 }),
  enabled: boolean('enabled').default(true),
  config: json('config'),
  date_updated: timestamp('date_updated').defaultNow(),
});

const apiConfigurations = pgTable('api_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  service_name: varchar('service_name', { length: 100 }).notNull(),
  environment: varchar('environment', { length: 50 }).default('development'),
  api_key: text('api_key'),
  client_id: text('client_id'),
  client_secret: text('client_secret'),
  base_url: text('base_url'),
  configuration: json('configuration').default({}),
  status: varchar('status', { length: 50 }).default('active'),
  date_updated: timestamp('date_updated').defaultNow(),
});

const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

module.exports = {
  articles,
  storyClusters,
  articlesStoryClusters,
  tags,
  articlesTags,
  rssSources,
  globalSettings,
  siteConfiguration,
  featureFlags,
  navigationItems,
  menuItems,
  topicCategories,
  homepageSections,
  breakingNews,
  curatedCollections,
  editorialBriefs,
  dailyBriefs,
  pageContent,
  legalPages,
  factCheckClaims,
  newsSources,
  trendingTopics,
  conflictEvents,
  conflictSourceCandidates,
  conflictTheories,
  conflictForecasts,
  agentRuns,
  conflictAutonomyRuns,
  agentIncidents,
  agentActions,
  users,
  subscriptionTiers,
  userSubscriptions,
  apiConfigs,
  apiConfigurations,
  refreshTokens,
};
