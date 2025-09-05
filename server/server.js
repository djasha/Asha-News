/**
 * Express Server for Asha.News API
 * Handles fact-checking, news aggregation, and user management
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const factCheckRoutes = require('./routes/factCheck');

// API Routes
app.use('/api/fact-check', factCheckRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// === Directus Proxy (CMS) ===
// Minimal helper to call Directus with server-side secret
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

async function directusFetch(pathname, init = {}) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    throw new Error('Directus not configured: set DIRECTUS_URL and DIRECTUS_TOKEN in server environment');
  }
  const url = `${DIRECTUS_URL.replace(/\/$/, '')}${pathname}`;
  const headers = Object.assign(
    {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    init.headers || {}
  );
  const resp = await fetch(url, { ...init, headers });
  const text = await resp.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!resp.ok) {
    const msg = json?.errors?.[0]?.message || resp.statusText;
    const err = new Error(`Directus ${resp.status}: ${msg}`);
    err.status = resp.status;
    err.body = json;
    throw err;
  }
  return json;
}

// GET /api/cms/settings - returns singleton settings object
app.get('/api/cms/settings', async (req, res) => {
  try {
    const data = await directusFetch('/items/global_settings');
    // Handle both singleton (object) and non-singleton (array) responses
    const settings = Array.isArray(data?.data) ? data.data[0] || null : data?.data ?? null;
    res.json({ data: settings });
  } catch (err) {
    if (err && err.status === 404) {
      // Singleton record not created yet
      return res.json({ data: null });
    }
    console.error('CMS settings error:', err);
    res.status(err.status || 500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/cms/rss-sources - returns enabled sources ordered by name
app.get('/api/cms/rss-sources', async (req, res) => {
  try {
    // Avoid boolean filter ambiguity across DBs by fetching and filtering client-side
    const data = await directusFetch(`/items/rss_sources?limit=200&sort=name`);
    const items = (data?.data || []).filter(it => it && it.enabled === true);
    res.json({ data: items });
  } catch (err) {
    if (err && err.status === 404) {
      // Collection exists with no table yet or not found
      return res.json({ data: [] });
    }
    console.error('CMS rss-sources error:', err);
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
    console.error('CMS feature-flags error:', err);
    res.status(err.status || 500).json({ error: 'Failed to fetch feature flags' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
