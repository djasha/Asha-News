const express = require('express');
const path = require('path');
const crypto = require('crypto');
const queryBridge = require('../db/queryBridge');
const { getPool, isUsingSupabase } = require('../db');
const logger = require('../utils/logger');
const { optionalAuth, authenticateToken } = require('../middleware/authMiddleware');
const { timeframeToMs } = require('../utils/timeframe');

const router = express.Router();

const INSTRUMENT_ALIASES = {
  XAUUSD: ['gold', 'xau', 'spot gold'],
  XAGUSD: ['silver', 'xag', 'spot silver'],
  OIL: ['oil', 'brent', 'wti', 'crude'],
  EURUSD: ['eur/usd', 'eurusd', 'euro dollar'],
  BTCUSD: ['btc', 'bitcoin', 'btcusd'],
  ETHUSD: ['eth', 'ethereum', 'ethusd'],
  SPX: ['s&p 500', 'spx', 'sp500'],
  NASDAQ: ['nasdaq', 'ndx'],
};

const INSTRUMENT_QUOTE_SYMBOLS = {
  XAUUSD: 'GC=F',
  XAGUSD: 'SI=F',
  OIL: 'CL=F',
  EURUSD: 'EURUSD=X',
  BTCUSD: 'BTC-USD',
  ETHUSD: 'ETH-USD',
  SPX: '^GSPC',
  NASDAQ: '^NDX',
};

let latestPriceCache = {
  updated_at: null,
  results: [],
};

function normalizeCluster(cluster) {
  return {
    id: cluster.id,
    title: cluster.cluster_title || 'Untitled Cluster',
    summary: cluster.cluster_summary || '',
    topic: cluster.main_topic || cluster.topic_category || 'general',
    article_count: cluster.article_count || 0,
    source_count: cluster.source_count || 0,
    created_at: cluster.created_at || null,
    status: cluster.status || 'active',
  };
}

function normalizePriceRow(symbol, quote) {
  return {
    symbol,
    quote_symbol: INSTRUMENT_QUOTE_SYMBOLS[symbol] || symbol,
    price: quote?.regularMarketPrice ?? null,
    change: quote?.regularMarketChange ?? null,
    change_pct: quote?.regularMarketChangePercent ?? null,
    currency: quote?.currency || null,
    market_state: quote?.marketState || null,
    as_of: quote?.regularMarketTime ? new Date(quote.regularMarketTime * 1000).toISOString() : null,
  };
}

function normalizeArticle(article) {
  return {
    id: article.id,
    title: article.title || 'Untitled',
    summary: article.summary || article.content?.slice(0, 280) || '',
    source: article.source_name || 'Unknown Source',
    url: article.url || article.source_url || null,
    category: article.category || null,
    published_at: article.published_at || article.date_created || null,
    bias: article.political_bias || null,
  };
}

function buildDigestText(scope, clusters) {
  const header = `Asha News ${scope} digest (${clusters.length} clusters)`;
  const lines = clusters.map((c, idx) => {
    const topic = c.topic ? ` [${c.topic}]` : '';
    const count = c.article_count ? ` (${c.article_count} articles)` : '';
    return `${idx + 1}. ${c.title}${topic}${count}\n${c.summary || 'No summary available.'}`;
  });
  return [header, ...lines].join('\n\n');
}

async function fetchUserProfile(userId) {
  try {
    const response = await queryBridge(`/items/users/${userId}`);
    return response?.data || null;
  } catch {
    return null;
  }
}

async function fetchUserByEmail(email) {
  try {
    const encoded = encodeURIComponent(String(email || '').toLowerCase());
    const response = await queryBridge(`/items/users?filter[email][_eq]=${encoded}&limit=1`);
    return Array.isArray(response?.data) ? response.data[0] || null : null;
  } catch {
    return null;
  }
}

function getUserPreferences(user) {
  if (user?.preferences && typeof user.preferences === 'object') {
    return { ...user.preferences };
  }
  return {};
}

function getPublicToken(preferences) {
  return preferences?.digest?.public_token || preferences?.public_digest_token || null;
}

function isPublicEnabled(preferences) {
  return Boolean(preferences?.public_digest || preferences?.digest?.public);
}

async function findPublicDigestUserByToken(token) {
  if (!token) return null;

  // Fast path for direct PostgreSQL: single query against JSON fields.
  if (!isUsingSupabase()) {
    try {
      const pool = getPool();
      if (pool) {
        const { rows } = await pool.query(
          `SELECT *
           FROM "users"
           WHERE (
             COALESCE(preferences->'digest'->>'public_token', '') = $1
             OR COALESCE(preferences->>'public_digest_token', '') = $1
           )
           AND (
             COALESCE(LOWER(preferences->'digest'->>'public'), 'false') IN ('true', '1')
             OR COALESCE(LOWER(preferences->>'public_digest'), 'false') IN ('true', '1')
           )
           LIMIT 1`,
          [token]
        );
        if (rows[0]) {
          return rows[0];
        }
      }
    } catch (error) {
      logger.warn({ err: error }, 'Direct token lookup failed, falling back to paginated scan');
    }
  }

  // Supabase REST fallback: iterate through pages to avoid false negatives from hard limits.
  const pageSize = 200;
  const maxRows = 50000;

  for (let offset = 0; offset <= maxRows; offset += pageSize) {
    let users = [];
    try {
      const usersResp = await queryBridge(`/items/users?limit=${pageSize}&offset=${offset}`);
      users = Array.isArray(usersResp?.data) ? usersResp.data : [];
    } catch (error) {
      logger.warn({ err: error }, 'Public digest token scan failed');
      return null;
    }

    if (users.length === 0) break;

    const matchedUser = users.find((user) => {
      const preferences = getUserPreferences(user);
      return getPublicToken(preferences) === token && isPublicEnabled(preferences);
    });

    if (matchedUser) return matchedUser;
    if (users.length < pageSize) break;
  }

  return null;
}

function buildPublicDigestPayload(user, clusters) {
  const preferences = getUserPreferences(user);
  return {
    generated_at: new Date().toISOString(),
    scope: 'public',
    owner: { id: user.id },
    clusters,
    digest_text: buildDigestText('public', clusters),
    public: {
      enabled: isPublicEnabled(preferences),
      token: getPublicToken(preferences) || null,
    }
  };
}

async function updateUserPreferences(userId, preferences) {
  await queryBridge(`/items/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ preferences })
  });
}

async function fetchActiveClusters(limit = 20) {
  const response = await queryBridge(
    `/items/story_clusters?filter[status][_eq]=active&sort=-created_at&limit=${limit}`
  );
  return Array.isArray(response?.data) ? response.data : [];
}

function applyClusterFilters(clusters, filters = {}) {
  const timeframeMs = timeframeToMs(filters.timeframe);
  const now = Date.now();

  return clusters.filter((cluster) => {
    if (filters.topic) {
      const q = String(filters.topic).toLowerCase();
      const haystack = `${cluster.topic || ''} ${cluster.title || ''} ${cluster.summary || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.source) {
      const q = String(filters.source).toLowerCase();
      const haystack = `${cluster.title || ''} ${cluster.summary || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.bias && filters.bias !== 'all') {
      const q = String(filters.bias).toLowerCase();
      const haystack = `${cluster.bias || ''} ${cluster.summary || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.contentType && filters.contentType !== 'all') {
      const type = String(cluster.type || 'cluster').toLowerCase();
      if (type !== String(filters.contentType).toLowerCase()) return false;
    }

    if (timeframeMs) {
      const createdAt = cluster.created_at ? new Date(cluster.created_at).getTime() : NaN;
      if (!Number.isFinite(createdAt)) return false;
      if ((now - createdAt) > timeframeMs) return false;
    }

    return true;
  });
}

async function fetchQuotes(symbols) {
  const quoteSymbols = symbols
    .map((s) => INSTRUMENT_QUOTE_SYMBOLS[s] || s)
    .filter(Boolean);

  if (quoteSymbols.length === 0) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(quoteSymbols.join(','))}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Quote upstream failed with ${response.status}`);
    }
    const json = await response.json();
    const items = Array.isArray(json?.quoteResponse?.result) ? json.quoteResponse.result : [];
    const byQuoteSymbol = new Map(items.map((item) => [item.symbol, item]));
    return symbols.map((symbol) => normalizePriceRow(symbol, byQuoteSymbol.get(INSTRUMENT_QUOTE_SYMBOLS[symbol] || symbol)));
  } finally {
    clearTimeout(timeout);
  }
}

router.get('/openapi', (_req, res) => {
  res.sendFile(path.join(__dirname, '../openapi/agent-v1.json'));
});

router.get('/digest', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const scope = req.query.scope || (req.user ? 'personal' : 'public');
    const format = String(req.query.format || 'json').toLowerCase();
    const filters = {
      topic: String(req.query.topic || '').trim().toLowerCase(),
      source: String(req.query.source || '').trim().toLowerCase(),
      bias: String(req.query.bias || 'all').trim().toLowerCase(),
      timeframe: String(req.query.timeframe || '').trim().toLowerCase(),
      contentType: String(req.query.contentType || req.query.content_type || 'all').trim().toLowerCase(),
    };

    let userProfile = null;
    if (scope === 'personal') {
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Authentication required for personal digest' });
      }
      userProfile = await fetchUserProfile(req.user.userId);
      if (!userProfile && req.user?.email) {
        userProfile = await fetchUserByEmail(req.user.email);
      }
    }

    let clustersRaw = [];
    try {
      clustersRaw = await fetchActiveClusters(limit * 2);
    } catch (error) {
      if (scope !== 'public') {
        throw error;
      }
      logger.warn({ err: error }, 'Public digest cluster fetch failed; returning empty digest');
    }

    let clusters = applyClusterFilters(clustersRaw.map(normalizeCluster), filters);

    clusters = clusters.slice(0, limit);

    const payload = {
      generated_at: new Date().toISOString(),
      scope,
      user: userProfile
        ? {
            id: userProfile.id,
            email: userProfile.email,
            preferences: userProfile.preferences || null,
          }
        : null,
      clusters,
      filters,
      digest_text: buildDigestText(scope, clusters),
    };

    if (format === 'markdown') {
      res.type('text/markdown').send(payload.digest_text);
      return;
    }

    res.json(payload);
  } catch (error) {
    logger.error({ err: error, scope: req.query.scope, query: req.query }, 'Agent digest failed');
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

router.post('/digest/share-token', authenticateToken, async (req, res) => {
  try {
    const email = String(req.user?.email || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Authenticated user email is required' });
    }

    const user = await fetchUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { enabled = true, rotate = false } = req.body || {};
    const preferences = getUserPreferences(user);
    preferences.digest = typeof preferences.digest === 'object' && preferences.digest
      ? { ...preferences.digest }
      : {};

    if (!enabled) {
      preferences.public_digest = false;
      preferences.digest.public = false;
      delete preferences.public_digest_token;
      delete preferences.digest.public_token;
      await updateUserPreferences(user.id, preferences);
      return res.json({ success: true, enabled: false });
    }

    const existingToken = getPublicToken(preferences);
    const token = (rotate || !existingToken)
      ? crypto.randomBytes(24).toString('hex')
      : existingToken;

    preferences.public_digest = true;
    preferences.digest.public = true;
    preferences.public_digest_token = token;
    preferences.digest.public_token = token;
    await updateUserPreferences(user.id, preferences);

    return res.json({
      success: true,
      enabled: true,
      token,
      public_path: `/api/v1/public/token/${token}`
    });
  } catch (error) {
    logger.error({ err: error }, 'Share-token update failed');
    res.status(500).json({ error: 'Failed to update public digest token' });
  }
});

router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await fetchUserProfile(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPublic = Boolean(
      user.preferences?.public_digest ||
      user.preferences?.digest?.public
    );

    if (!isPublic) {
      return res.status(403).json({ error: 'Public digest is disabled for this user' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const clusters = (await fetchActiveClusters(limit)).map(normalizeCluster).slice(0, limit);
    res.json(buildPublicDigestPayload(user, clusters));
  } catch (error) {
    logger.error({ err: error, userId: req.params.userId }, 'Public digest failed');
    res.status(500).json({ error: 'Failed to fetch public digest' });
  }
});

router.get('/public/token/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const matchedUser = await findPublicDigestUserByToken(token);

    if (!matchedUser) {
      return res.status(404).json({ error: 'Public digest not found for token' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const clusters = (await fetchActiveClusters(limit)).map(normalizeCluster).slice(0, limit);
    res.json(buildPublicDigestPayload(matchedUser, clusters));
  } catch (error) {
    logger.error({ err: error, token: req.params.token ? 'provided' : 'missing' }, 'Token public digest failed');
    res.status(500).json({ error: 'Failed to fetch tokenized public digest' });
  }
});

router.get('/clusters/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const all = (await fetchActiveClusters(200)).map(normalizeCluster);

    const results = all
      .filter(c =>
        String(c.title || '').toLowerCase().includes(q) ||
        String(c.summary || '').toLowerCase().includes(q) ||
        String(c.topic || '').toLowerCase().includes(q)
      )
      .slice(0, limit);

    res.json({
      query: q,
      count: results.length,
      results,
    });
  } catch (error) {
    logger.warn({ err: error }, 'Cluster search source unavailable; returning empty results');
    res.json({
      query: String(req.query.q || '').trim().toLowerCase(),
      count: 0,
      results: [],
    });
  }
});

router.get('/instruments/:symbol/news', async (req, res) => {
  try {
    const symbol = String(req.params.symbol || '').toUpperCase();
    const aliases = INSTRUMENT_ALIASES[symbol] || [symbol.toLowerCase()];
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const response = await queryBridge('/items/articles?sort=-published_at&limit=250');
    const articles = Array.isArray(response?.data) ? response.data : [];

    const filtered = articles
      .filter(article => {
        const haystack = `${article.title || ''} ${article.summary || ''} ${article.content || ''}`.toLowerCase();
        return aliases.some(alias => haystack.includes(alias.toLowerCase()));
      })
      .slice(0, limit)
      .map(normalizeArticle);

    res.json({
      symbol,
      aliases,
      count: filtered.length,
      results: filtered,
    });
  } catch (error) {
    logger.warn({ err: error, symbol: req.params.symbol }, 'Instrument news source unavailable; returning empty results');
    res.json({
      symbol: String(req.params.symbol || '').toUpperCase(),
      aliases: INSTRUMENT_ALIASES[String(req.params.symbol || '').toUpperCase()] || [],
      count: 0,
      results: [],
    });
  }
});

router.get('/instruments/prices', async (req, res) => {
  try {
    const symbols = String(req.query.symbols || Object.keys(INSTRUMENT_ALIASES).join(','))
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => Object.prototype.hasOwnProperty.call(INSTRUMENT_ALIASES, s));

    let results = [];
    let source = 'cache';
    try {
      results = await fetchQuotes(symbols);
      latestPriceCache = {
        updated_at: new Date().toISOString(),
        results,
      };
      source = 'yahoo';
    } catch (quoteError) {
      logger.warn({ err: quoteError }, 'Quote fetch failed, falling back to cache');
      const cached = Array.isArray(latestPriceCache.results) ? latestPriceCache.results : [];
      results = symbols.map((symbol) => cached.find((row) => row.symbol === symbol) || normalizePriceRow(symbol, null));
    }

    res.json({
      source,
      updated_at: source === 'yahoo' ? new Date().toISOString() : latestPriceCache.updated_at,
      count: results.length,
      results,
    });
  } catch (error) {
    logger.error({ err: error }, 'Instrument prices lookup failed');
    res.status(500).json({ error: 'Failed to fetch instrument prices' });
  }
});

module.exports = router;
module.exports.__testables = {
  applyClusterFilters,
  getPublicToken,
  isPublicEnabled,
  findPublicDigestUserByToken,
};
