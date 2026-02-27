/**
 * Express Server for Asha.News API
 * Handles fact-checking, news aggregation, and user management
 */

// Ensure global fetch is available (Node <18)
try {
  if (typeof fetch === 'undefined') {
    // eslint-disable-next-line global-require
    const nf = require('node-fetch');
    // Assign to global for all modules
    global.fetch = nf;
  }
} catch (_) {
  // If node-fetch is not installed, routes using fetch should handle errors
}

// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { withCache } = require('./services/simpleCache');
const logger = require('./utils/logger');

// Import route modules
const authRoutes = require('./routes/auth');
const factCheckRoutes = require('./routes/factCheck');
const aiAnalysisRoutes = require('./routes/aiAnalysis');
const adminSettingsRoutes = require('./routes/adminSettings');
const rssAutomationRoutes = require('./routes/rssAutomation');
const directusFlowsRoutes = require('./routes/directusFlows');
const webhookRoutes = require('./routes/webhooks');
const webhookSimpleRoutes = require('./routes/webhooks-simple');
const contentEnhancementRoutes = require('./routes/contentEnhancement');
const subscriptionRoutes = require('./routes/subscription');
const advancedFactCheckRoutes = require('./routes/advancedFactCheck');
const palestineAnalysisRoutes = require('./routes/palestineAnalysis');
const vendorRoutes = require('./routes/vendors');
const storyClusterRoutes = require('./routes/storyClusters');
const articlesRoutes = require('./routes/articles');
const rssProcessingRoutes = require('./routes/rssProcessing');
const rssSourcesRoutes = require('./routes/rssSources');
const pageBuilderRoutes = require('./routes/pageBuilder');
const mcpRoutes = require('./routes/mcp');
const siteSettingsRoutes = require('./routes/siteSettings');
const categoryManagementRoutes = require('./routes/categoryManagement');
const menuSettingsRoutes = require('./routes/menuSettings');
const cleanupRoutes = require('./routes/cleanup');
const adminTopicsRoutes = require('./routes/adminTopics');
const usersRoutes = require('./routes/users');
const adminTopicsSettingsRoutes = require('./routes/adminTopicsSettings');
const subscriptionTiersRoutes = require('./routes/subscriptionTiers');
const CronService = require('./services/cronService');

// Import security middleware
const { 
  apiLimiter, 
  securityHeaders, 
  errorHandler, 
  securityLogger 
} = require('./middleware/securityMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize cron service
const cronService = new CronService();

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'CORS blocked origin');
      if (isProduction) {
        callback(new Error('Not allowed by CORS'));
      } else {
        callback(null, true);
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(securityHeaders);
app.use(securityLogger);
app.use(apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path }, 'request');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiAnalysisRoutes);
app.use('/api/fact-check', factCheckRoutes);
app.use('/api/flows', directusFlowsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/webhooks-simple', webhookSimpleRoutes);
app.use('/api/content', contentEnhancementRoutes);
app.use('/api/admin-settings', adminSettingsRoutes);
app.use('/api/rss-automation', rssAutomationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/advanced-fact-check', advancedFactCheckRoutes);
app.use('/api/palestine-analysis', palestineAnalysisRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/clusters', storyClusterRoutes);
app.use('/api/story-clusters', storyClusterRoutes); // Alias for backward compatibility
app.use('/api/articles', articlesRoutes);
app.use('/api/rss', rssSourcesRoutes);
app.use('/api/rss-processing', rssProcessingRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/categories', categoryManagementRoutes);
app.use('/api/menu-settings', menuSettingsRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/admin/topics', adminTopicsRoutes);
app.use('/api/admin/topics-settings', adminTopicsSettingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscription-tiers', subscriptionTiersRoutes);

// Ingestion thin-proxy endpoints -> reuse rss-automation routes
// Manual trigger
app.post('/api/ingest/run', (req, res) => {
  // Forward to existing automation route
  res.redirect(307, '/api/rss-automation/fetch');
});
// Status
app.get('/api/ingest/status', (req, res) => {
  res.redirect(307, '/api/rss-automation/status');
});
app.use('/api/page-builder', pageBuilderRoutes);

// === Database Query Layer (replaces Directus CMS proxy) ===
const directusFetch = require('./db/queryBridge');
const { testConnection: testDbConnection, getPool } = require('./db/index');

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const start = Date.now();
  const dbOk = await testDbConnection();
  const dbLatencyMs = Date.now() - start;

  let poolStats = {};
  try {
    const p = getPool();
    poolStats = { total: p.totalCount, idle: p.idleCount, waiting: p.waitingCount };
  } catch (_) { /* pool not initialized */ }

  const status = dbOk ? 'healthy' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    database: dbOk ? 'connected' : 'disconnected',
    db_latency_ms: dbLatencyMs,
    pool: poolStats,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// GET /api/cms/settings - returns singleton settings object
app.get('/api/cms/settings', async (req, res) => {
  try {
    const data = await directusFetch('/items/global_settings');
    // Handle both singleton (object) and non-singleton (array) responses
    const settings = Array.isArray(data?.data) ? data.data[0] || null : data?.data ?? null;
    res.json({ data: settings });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: null });
    }
    logger.error({ err }, 'CMS settings error');
    res.status(err.status || 500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/cms/rss-sources - returns enabled sources ordered by name
app.get('/api/cms/rss-sources', async (req, res) => {
  try {
    // Avoid boolean filter ambiguity across DBs by fetching and filtering client-side
    const data = await directusFetch(`/items/RSS_Sources?limit=200&sort=name`);
    const items = (data?.data || []).filter(it => it && it.enabled === true);
    res.json({ data: items });
  } catch (err) {
    if (err && err.status === 404) {
      // Collection exists with no table yet or not found
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS rss-sources error');
    res.status(err.status || 500).json({ error: 'Failed to fetch rss sources' });
  }
});

// GET /api/cms/feature-flags - returns all flags; optional map=true to map {name: enabled}
app.get('/api/cms/feature-flags', async (req, res) => {
  try {
    const data = await directusFetch('/items/feature_flags?limit=200');
    const items = data?.data || [];
    if (String(req.query.map).toLowerCase() === 'true') {
      const mapped = items.reduce((acc, it) => { if (it?.name) acc[it.name] = !!it.enabled; return acc; }, {});
      return res.json({ data: mapped });
    }
    res.json({ data: items });
  } catch (err) {
    logger.error({ err }, 'CMS feature-flags error');
    res.status(err.status || 500).json({ error: 'Failed to fetch feature flags' });
  }
});

// === NEW COMPREHENSIVE CMS ENDPOINTS ===

// GET /api/cms/site-config - returns site configuration
app.get('/api/cms/site-config', async (req, res) => {
  try {
    const payload = await withCache('cms:site-config', 30 * 60 * 1000, async () => {
      const data = await directusFetch('/items/site_configuration');
      const config = Array.isArray(data?.data) ? data.data[0] || null : data?.data ?? null;
      return { data: config };
    });
    res.json(payload);
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: null });
    }
    logger.error({ err }, 'CMS site-config error');
    res.status(err.status || 500).json({ error: 'Failed to fetch site configuration' });
  }
});

// GET /api/cms/navigation - returns navigation menus
app.get('/api/cms/navigation', async (req, res) => {
  try {
    const location = req.query.location;
    let endpoint = '/items/navigation_menus?filter[enabled][_eq]=true&sort=sort_order';
    if (location) {
      endpoint += `&filter[location][_eq]=${location}`;
    }
    const cacheKey = `cms:navigation:${location || 'all'}`;
    const payload = await withCache(cacheKey, 15 * 60 * 1000, async () => {
      const data = await directusFetch(endpoint);
      return { data: data?.data || [] };
    });
    res.json(payload);
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS navigation error');
    res.status(err.status || 500).json({ error: 'Failed to fetch navigation' });
  }
});

// GET /api/cms/menu-items - returns menu items for a specific menu
app.get('/api/cms/menu-items', async (req, res) => {
  try {
    const menuId = req.query.menu_id;
    let endpoint = '/items/menu_items?filter[enabled][_eq]=true&sort=sort_order';
    if (menuId) {
      endpoint += `&filter[parent_menu][_eq]=${menuId}`;
    }
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS menu-items error');
    res.status(err.status || 500).json({ error: 'Failed to fetch menu items' });
  }
});

// GET /api/cms/topics - returns topic categories
app.get('/api/cms/topics', async (req, res) => {
  try {
    const payload = await withCache('cms:topics', 10 * 60 * 1000, async () => {
      const data = await directusFetch('/items/topic_categories?filter[enabled][_eq]=true&sort=sort_order');
      return { data: data?.data || [] };
    });
    res.json(payload);
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS topics error');
    res.status(err.status || 500).json({ error: 'Failed to fetch topics' });
  }
});

// GET /api/cms/news-sources - returns enhanced news sources with bias analysis
app.get('/api/cms/news-sources', async (req, res) => {
  try {
    const { limit = 50, offset = 0, bias_rating, category, priority_level } = req.query;
    let endpoint = `/items/news_sources?filter[enabled][_eq]=true&sort=name&limit=${limit}&offset=${offset}`;
    
    if (bias_rating) endpoint += `&filter[bias_rating][_eq]=${bias_rating}`;
    if (category) endpoint += `&filter[category][_eq]=${category}`;
    if (priority_level) endpoint += `&filter[priority_level][_eq]=${priority_level}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS news-sources error');
    res.status(err.status || 500).json({ error: 'Failed to fetch news sources' });
  }
});

// GET /api/cms/articles - returns articles with enhanced fields and filtering
app.get('/api/cms/articles', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      category, 
      published = 'true',
      breaking_news,
      author_name,
      sort = '-published_at'
    } = req.query;
    
    let endpoint = `/items/articles?sort=${sort}&limit=${limit}&offset=${offset}`;
    
    // Add filters
    if (published === 'true') endpoint += `&filter[published][_eq]=true`;
    if (category) endpoint += `&filter[category][_eq]=${category}`;
    if (breaking_news === 'true') endpoint += `&filter[breaking_news][_eq]=true`;
    if (author_name) endpoint += `&filter[author_name][_contains]=${author_name}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS articles error');
    res.status(err.status || 500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/cms/homepage-sections - returns homepage sections
app.get('/api/cms/homepage-sections', async (req, res) => {
  try {
    const payload = await withCache('cms:homepage-sections', 15 * 60 * 1000, async () => {
      const data = await directusFetch('/items/homepage_sections?filter[enabled][_eq]=true&sort=sort_order');
      return { data: data?.data || [] };
    });
    res.json(payload);
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS homepage-sections error');
    res.status(err.status || 500).json({ error: 'Failed to fetch homepage sections' });
  }
});

// GET /api/cms/breaking-news - returns active breaking news
app.get('/api/cms/breaking-news', async (req, res) => {
  try {
    const payload = await withCache('cms:breaking-news', 1 * 60 * 1000, async () => {
      const now = new Date().toISOString();
      const data = await directusFetch(`/items/breaking_news?filter[active][_eq]=true&filter[expires_at][_gte]=${now}&sort=-created_at`);
      return { data: data?.data || [] };
    });
    res.json(payload);
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS breaking-news error');
    res.status(err.status || 500).json({ error: 'Failed to fetch breaking news' });
  }
});

// GET /api/cms/daily-briefs - returns daily briefs
app.get('/api/cms/daily-briefs', async (req, res) => {
  try {
    const { date, period } = req.query;
    let endpoint = '/items/daily_briefs?filter[published][_eq]=true&sort=-date';
    
    if (date) endpoint += `&filter[date][_eq]=${date}`;
    if (period) endpoint += `&filter[time_period][_eq]=${period}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS daily-briefs error');
    res.status(err.status || 500).json({ error: 'Failed to fetch daily briefs' });
  }
});

// GET /api/cms/trending-topics - returns trending topics with advanced metrics
app.get('/api/cms/trending-topics', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      lifecycle_stage, 
      editorial_priority, 
      featured_on_homepage,
      sort = '-trend_score'
    } = req.query;
    let endpoint = `/items/trending_topics?filter[active][_eq]=true&sort=${sort}&limit=${limit}&offset=${offset}`;
    
    if (lifecycle_stage) endpoint += `&filter[lifecycle_stage][_eq]=${lifecycle_stage}`;
    if (editorial_priority) endpoint += `&filter[editorial_priority][_eq]=${editorial_priority}`;
    if (featured_on_homepage === 'true') endpoint += `&filter[featured_on_homepage][_eq]=true`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS trending-topics error');
    res.status(err.status || 500).json({ error: 'Failed to fetch trending topics' });
  }
});

// GET /api/cms/page-content - returns page content (with query param)
app.get('/api/cms/page-content', async (req, res) => {
  try {
    const pageName = req.query.page;
    if (!pageName) {
      return res.status(400).json({ error: 'Page parameter required' });
    }
    const data = await directusFetch(`/items/page_content?filter[page_name][_eq]=${pageName}&filter[published][_eq]=true`);
    const pageContent = data?.data?.[0] || null;
    res.json({ data: pageContent });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: null });
    }
    logger.error({ err }, 'CMS page-content error');
    res.status(err.status || 500).json({ error: 'Failed to fetch page content' });
  }
});

// GET /api/cms/legal-pages - returns legal pages
app.get('/api/cms/legal-pages', async (req, res) => {
  try {
    const payload = await withCache('cms:legal-pages', 60 * 60 * 1000, async () => {
      const data = await directusFetch('/items/legal_pages?filter[published][_eq]=true&sort=sort_order');
      return { data: data?.data || [] };
    });
    res.json(payload);
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS legal-pages error');
    res.status(err.status || 500).json({ error: 'Failed to fetch legal pages' });
  }
});

// GET /api/cms/legal/:page - returns legal page content
app.get('/api/cms/legal/:page', async (req, res) => {
  try {
    const pageSlug = req.params.page;
    const data = await directusFetch(`/items/legal_pages?filter[slug][_eq]=${pageSlug}&filter[published][_eq]=true`);
    const legalPage = data?.data?.[0] || null;
    res.json({ data: legalPage });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: null });
    }
    logger.error({ err }, 'CMS legal error');
    res.status(err.status || 500).json({ error: 'Failed to fetch legal page' });
  }
});

// === NEW CRITICAL COLLECTIONS ENDPOINTS ===

// GET /api/cms/fact-check-claims - returns fact check claims
app.get('/api/cms/fact-check-claims', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category, verdict, published } = req.query;
    let endpoint = `/items/fact_check_claims?sort=-created_at&limit=${limit}&offset=${offset}`;
    
    if (category) endpoint += `&filter[claim_category][_eq]=${category}`;
    if (verdict) endpoint += `&filter[verdict][_eq]=${verdict}`;
    if (published === 'true') endpoint += `&filter[published][_eq]=true`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS fact-check-claims error');
    res.status(err.status || 500).json({ error: 'Failed to fetch fact check claims' });
  }
});

// GET /api/cms/fact-check-claims/:id - returns specific fact check claim
app.get('/api/cms/fact-check-claims/:id', async (req, res) => {
  try {
    const claimId = req.params.id;
    const data = await directusFetch(`/items/fact_check_claims/${claimId}`);
    res.json({ data: data?.data || null });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: null });
    }
    logger.error({ err }, 'CMS fact-check-claim error');
    res.status(err.status || 500).json({ error: 'Failed to fetch fact check claim' });
  }
});

// POST /api/cms/fact-check-claims - creates new fact check claim
app.post('/api/cms/fact-check-claims', async (req, res) => {
  try {
    const claimData = req.body;
    const data = await directusFetch('/items/fact_check_claims', {
      method: 'POST',
      body: JSON.stringify(claimData)
    });
    res.status(201).json({ data: data?.data || null });
  } catch (err) {
    logger.error({ err }, 'CMS create fact-check-claim error');
    res.status(err.status || 500).json({ error: 'Failed to create fact check claim' });
  }
});

// PUT /api/cms/fact-check-claims/:id - updates fact check claim
app.put('/api/cms/fact-check-claims/:id', async (req, res) => {
  try {
    const claimId = req.params.id;
    const updateData = req.body;
    const data = await directusFetch(`/items/fact_check_claims/${claimId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    res.json({ data: data?.data || null });
  } catch (err) {
    logger.error({ err }, 'CMS update fact-check-claim error');
    res.status(err.status || 500).json({ error: 'Failed to update fact check claim' });
  }
});

// GET /api/cms/story-clusters - returns story clusters
app.get('/api/cms/story-clusters', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, featured, topic } = req.query;
    let endpoint = `/items/story_clusters?sort=-created_at&limit=${limit}&offset=${offset}`;
    
    if (status) endpoint += `&filter[status][_eq]=${status}`;
    if (featured === 'true') endpoint += `&filter[featured][_eq]=true`;
    if (topic) endpoint += `&filter[main_topic][_contains]=${topic}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: [] });
    }
    logger.error({ err }, 'CMS story-clusters error');
    res.status(err.status || 500).json({ error: 'Failed to fetch story clusters' });
  }
});

// GET /api/cms/story-clusters/:id - returns specific story cluster
app.get('/api/cms/story-clusters/:id', async (req, res) => {
  try {
    const clusterId = req.params.id;
    const data = await directusFetch(`/items/story_clusters/${clusterId}`);
    res.json({ data: data?.data || null });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: null });
    }
    logger.error({ err }, 'CMS story-cluster error');
    res.status(err.status || 500).json({ error: 'Failed to fetch story cluster' });
  }
});

// POST /api/cms/story-clusters - creates new story cluster
app.post('/api/cms/story-clusters', async (req, res) => {
  try {
    const clusterData = req.body;
    const data = await directusFetch('/items/story_clusters', {
      method: 'POST',
      body: JSON.stringify(clusterData)
    });
    res.status(201).json({ data: data?.data || null });
  } catch (err) {
    logger.error({ err }, 'CMS create story-cluster error');
    res.status(err.status || 500).json({ error: 'Failed to create story cluster' });
  }
});

// PUT /api/cms/story-clusters/:id - updates story cluster
app.put('/api/cms/story-clusters/:id', async (req, res) => {
  try {
    const clusterId = req.params.id;
    const updateData = req.body;
    const data = await directusFetch(`/items/story_clusters/${clusterId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    res.json({ data: data?.data || null });
  } catch (err) {
    logger.error({ err }, 'CMS update story-cluster error');
    res.status(err.status || 500).json({ error: 'Failed to update story cluster' });
  }
});

// GET /api/cms/user-preferences - returns user preferences
app.get('/api/cms/user-preferences', async (req, res) => {
  try {
    const { user_id } = req.query;
    let endpoint = '/items/user_preferences';
    
    if (user_id) {
      endpoint += `?filter[user_id][_eq]=${user_id}`;
    }
    
    const data = await directusFetch(endpoint);
    const preferences = req.query.user_id ? (data?.data?.[0] || null) : (data?.data || []);
    res.json({ data: preferences });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: req.query.user_id ? null : [] });
    }
    logger.error({ err }, 'CMS user-preferences error');
    res.status(err.status || 500).json({ error: 'Failed to fetch user preferences' });
  }
});

// GET /api/cms/user-preferences/:id - returns specific user preferences
app.get('/api/cms/user-preferences/:id', async (req, res) => {
  try {
    const prefId = req.params.id;
    const data = await directusFetch(`/items/user_preferences/${prefId}`);
    res.json({ data: data?.data || null });
  } catch (err) {
    if (err && (err.status === 404 || err.status === 403 || err.status === 401)) {
      return res.json({ data: null });
    }
    logger.error({ err }, 'CMS user-preference error');
    res.status(err.status || 500).json({ error: 'Failed to fetch user preference' });
  }
});

// POST /api/cms/user-preferences - creates new user preferences
app.post('/api/cms/user-preferences', async (req, res) => {
  try {
    const prefData = req.body;
    const data = await directusFetch('/items/user_preferences', {
      method: 'POST',
      body: JSON.stringify(prefData)
    });
    res.status(201).json({ data: data?.data || null });
  } catch (err) {
    logger.error({ err }, 'CMS create user-preferences error');
    res.status(err.status || 500).json({ error: 'Failed to create user preferences' });
  }
});

// PUT /api/cms/user-preferences/:id - updates user preferences
app.put('/api/cms/user-preferences/:id', async (req, res) => {
  try {
    const preferencesId = req.params.id;
    const preferencesData = req.body;
    const data = await directusFetch(`/items/user_preferences/${preferencesId}`, {
      method: 'PATCH',
      body: JSON.stringify(preferencesData)
    });
    res.json({ data: data?.data || null });
  } catch (err) {
    logger.error({ err }, 'CMS update user-preferences error');
    res.status(err.status || 500).json({ error: 'Failed to update user preferences' });
  }
});

// === ENHANCED COLLECTION ENDPOINTS ===

// GET /api/cms/articles/enhanced - returns articles with all enhanced fields
app.get('/api/cms/articles/enhanced', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      bias_rating, 
      credibility_min, 
      engagement_min,
      include_analytics = false 
    } = req.query;
    
    let fields = 'id,title,slug,summary,content,excerpt,article_type,category,reading_time,word_count,language,featured_image,author,source_name,bias_score,political_bias,credibility_score,factual_quality,fact_check_status,view_count,share_count,engagement_score,trending_score,featured,breaking_news,published_at';
    
    if (include_analytics === 'true') {
      fields += ',bookmark_count,comment_count,seo_title,seo_description,og_title,og_description';
    }
    
    let endpoint = `/items/articles?filter[published][_eq]=true&sort=-published_at&limit=${limit}&offset=${offset}&fields=${fields}`;
    
    if (bias_rating) endpoint += `&filter[political_bias][_eq]=${bias_rating}`;
    if (credibility_min) endpoint += `&filter[credibility_score][_gte]=${credibility_min}`;
    if (engagement_min) endpoint += `&filter[engagement_score][_gte]=${engagement_min}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    logger.error({ err }, 'CMS enhanced articles error');
    res.status(err.status || 500).json({ error: 'Failed to fetch enhanced articles' });
  }
});

// GET /api/cms/news-sources/analytics - returns news sources with performance analytics
app.get('/api/cms/news-sources/analytics', async (req, res) => {
  try {
    const { limit = 50, bias_filter, quality_min } = req.query;
    
    let endpoint = `/items/news_sources?filter[enabled][_eq]=true&sort=-credibility_score&limit=${limit}`;
    endpoint += '&fields=id,name,description,website_url,bias_rating,bias_score,credibility_score,factual_reporting,trust_score,transparency_score,article_count,avg_articles_per_day,last_article_date,feed_health_score,content_quality_score,priority_level';
    
    if (bias_filter) endpoint += `&filter[bias_rating][_eq]=${bias_filter}`;
    if (quality_min) endpoint += `&filter[credibility_score][_gte]=${quality_min}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    logger.error({ err }, 'CMS news sources analytics error');
    res.status(err.status || 500).json({ error: 'Failed to fetch news sources analytics' });
  }
});

// GET /api/cms/trending-topics/metrics - returns trending topics with full metrics
app.get('/api/cms/trending-topics/metrics', async (req, res) => {
  try {
    const { 
      limit = 10, 
      stage, 
      priority, 
      anomaly_only = false,
      sort = '-momentum_score'
    } = req.query;
    
    let endpoint = `/items/trending_topics?filter[active][_eq]=true&sort=${sort}&limit=${limit}`;
    endpoint += '&fields=id,name,description,trend_score,velocity_score,momentum_score,peak_score,peak_time,lifecycle_stage,social_mentions,social_sentiment,viral_coefficient,engagement_rate,ai_confidence_score,trend_prediction,editorial_priority,featured_on_homepage,anomaly_detected';
    
    if (stage) endpoint += `&filter[lifecycle_stage][_eq]=${stage}`;
    if (priority) endpoint += `&filter[editorial_priority][_eq]=${priority}`;
    if (anomaly_only === 'true') endpoint += `&filter[anomaly_detected][_eq]=true`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    logger.error({ err }, 'CMS trending topics metrics error');
    res.status(err.status || 500).json({ error: 'Failed to fetch trending topics metrics' });
  }
});

// GET /api/cms/story-clusters/analysis - returns story clusters with bias analysis
app.get('/api/cms/story-clusters/analysis', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      bias_balance_min, 
      blindspot_only = false,
      geographic_scope 
    } = req.query;
    
    let endpoint = `/items/story_clusters?filter[status][_eq]=active&sort=-trending_score&limit=${limit}&offset=${offset}`;
    endpoint += '&fields=id,cluster_title,cluster_summary,main_topic,similarity_threshold,source_count,article_count,geographic_scope,bias_distribution,coverage_gaps,blindspot_detected,bias_balance_score,trending_score,news_cycle_stage,editorial_priority,featured';
    
    if (bias_balance_min) endpoint += `&filter[bias_balance_score][_gte]=${bias_balance_min}`;
    if (blindspot_only === 'true') endpoint += `&filter[blindspot_detected][_eq]=true`;
    if (geographic_scope) endpoint += `&filter[geographic_scope][_eq]=${geographic_scope}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    logger.error({ err }, 'CMS story clusters analysis error');
    res.status(err.status || 500).json({ error: 'Failed to fetch story clusters analysis' });
  }
});

// GET /api/cms/fact-check-claims/workflow - returns fact check claims with workflow data
app.get('/api/cms/fact-check-claims/workflow', async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      status, 
      priority, 
      verdict,
      assigned_to 
    } = req.query;
    
    let endpoint = `/items/fact_check_claims?sort=-created_at&limit=${limit}&offset=${offset}`;
    endpoint += '&fields=id,claim_text,claim_summary,claim_category,source_article,claimant,claim_date,verification_status,verdict,confidence_score,evidence_quality,methodology_used,fact_checker_assigned,review_priority,published,created_at,updated_at';
    
    if (status) endpoint += `&filter[verification_status][_eq]=${status}`;
    if (priority) endpoint += `&filter[review_priority][_eq]=${priority}`;
    if (verdict) endpoint += `&filter[verdict][_eq]=${verdict}`;
    if (assigned_to) endpoint += `&filter[fact_checker_assigned][_eq]=${assigned_to}`;
    
    const data = await directusFetch(endpoint);
    res.json({ data: data?.data || [] });
  } catch (err) {
    logger.error({ err }, 'CMS fact check claims workflow error');
    res.status(err.status || 500).json({ error: 'Failed to fetch fact check claims workflow' });
  }
});

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// === COLLECTION ENDPOINTS ===

// Tags endpoints
app.get('/api/cms/tags', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = 'active' } = req.query;
    const data = await directusFetch(`/items/tags?filter[status][_eq]=${status}&sort=sort_order,name&limit=${limit}&offset=${offset}`);
    res.json({ data: data?.data || [] });
  } catch (err) {
    logger.error({ err }, 'CMS tags error');
    res.status(err.status || 500).json({ error: 'Failed to fetch tags' });
  }
});

// Trending tags endpoint
app.get('/api/cms/tags/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await directusFetch(`/items/tags?filter[trending][_eq]=true&filter[status][_eq]=active&sort=-usage_count,name&limit=${limit}`);
    res.json({ data: data?.data || [] });
  } catch (err) {
    logger.error({ err }, 'Trending tags fetch error');
    res.json({ data: [] });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl
  });
});

// For non-API routes, return a helpful message
app.use('*', (req, res) => {
  res.json({
    message: "Asha.News API Server",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      factCheck: "/api/fact-check/*",
      cms: "/api/cms/*",
    },
    frontend: "http://localhost:3000",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  
  // Start cron jobs
  cronService.startAllJobs();
});

module.exports = app;
