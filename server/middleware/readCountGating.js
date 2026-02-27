/**
 * Article Read-Count Gating Middleware
 *
 * Tracks daily article reads per user/IP and enforces subscription tier limits.
 * Free tier: 10 articles/day (configurable via subscription_tiers.limits.articles_per_day)
 * Pro/Premium: unlimited (-1)
 *
 * Uses in-memory store with daily reset. For production scale, swap to Redis.
 */
const dbService = require('../db/dbService');
const logger = require('../utils/logger');

// In-memory read counts: Map<key, { count, date }>
const readCounts = new Map();

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getReaderKey(req) {
  // Prefer user ID from JWT, fall back to IP
  return req.user?.userId || req.ip || 'anonymous';
}

function getReadCount(key) {
  const entry = readCounts.get(key);
  if (!entry || entry.date !== todayKey()) {
    return 0;
  }
  return entry.count;
}

function incrementReadCount(key) {
  const today = todayKey();
  const entry = readCounts.get(key);
  if (!entry || entry.date !== today) {
    readCounts.set(key, { count: 1, date: today });
  } else {
    entry.count += 1;
  }
}

/**
 * Middleware: check if user has exceeded their daily article read limit.
 * Attach to article detail endpoints (GET /api/articles/:id).
 */
async function checkReadLimit(req, res, next) {
  try {
    const key = getReaderKey(req);
    const currentCount = getReadCount(key);

    // Determine the user's tier limit
    let articlesPerDay = 10; // default free tier
    if (req.user?.userId) {
      const sub = await dbService.getUserSubscription(req.user.userId);
      if (sub?.tier_id) {
        const tier = await dbService.getItemById('subscription_tiers', sub.tier_id);
        if (tier?.limits?.articles_per_day !== undefined) {
          articlesPerDay = tier.limits.articles_per_day;
        }
      }
    }

    // -1 means unlimited
    if (articlesPerDay !== -1 && currentCount >= articlesPerDay) {
      return res.status(429).json({
        error: 'Daily article limit reached',
        limit: articlesPerDay,
        reads_today: currentCount,
        upgrade_url: '/subscribe',
        message: `You've reached your daily limit of ${articlesPerDay} articles. Upgrade to Pro for unlimited access.`,
      });
    }

    // Attach read info to request for downstream use
    req.readCount = currentCount;
    req.readLimit = articlesPerDay;
    next();
  } catch (error) {
    // On error, allow the request through (fail open)
    logger.error('Read count gating error:', error.message);
    next();
  }
}

/**
 * Middleware: increment read count after successful article fetch.
 * Call AFTER the article has been served (use as response interceptor).
 */
function trackRead(req, res, next) {
  // Hook into response finish to only count successful reads
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const key = getReaderKey(req);
      incrementReadCount(key);
    }
    return originalJson(body);
  };
  next();
}

/**
 * Get current read stats for a user/IP (for frontend display).
 */
function getReadStats(req) {
  const key = getReaderKey(req);
  return {
    reads_today: getReadCount(key),
    date: todayKey(),
  };
}

module.exports = { checkReadLimit, trackRead, getReadStats };
