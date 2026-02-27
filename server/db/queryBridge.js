/**
 * Query Bridge — drop-in replacement for the directusFetch() function.
 *
 * Translates Directus-style REST paths + query params into direct
 * PostgreSQL queries via the pg Pool so that every existing call site
 * in server.js can switch with a one-line change.
 *
 * Supported patterns:
 *   GET  /items/<collection>          → SELECT * with filters
 *   GET  /items/<collection>/<id>     → SELECT by primary key
 *   POST /items/<collection>          → INSERT
 *   PATCH /items/<collection>/<id>    → UPDATE
 *   DELETE /items/<collection>/<id>   → DELETE
 */
const { getPool } = require('./index');

// Map Directus collection names (including any casing variants) to real table names
const TABLE_MAP = {
  articles: 'articles',
  story_clusters: 'story_clusters',
  articles_story_clusters: 'articles_story_clusters',
  tags: 'tags',
  articles_tags: 'articles_tags',
  rss_sources: 'rss_sources',
  RSS_Sources: 'rss_sources',
  global_settings: 'global_settings',
  site_configuration: 'site_configuration',
  feature_flags: 'feature_flags',
  navigation_items: 'navigation_items',
  menu_items: 'menu_items',
  topic_categories: 'topic_categories',
  homepage_sections: 'homepage_sections',
  breaking_news: 'breaking_news',
  curated_collections: 'curated_collections',
  editorial_briefs: 'editorial_briefs',
  daily_briefs: 'daily_briefs',
  page_content: 'page_content',
  legal_pages: 'legal_pages',
  fact_check_claims: 'fact_check_claims',
  news_sources: 'news_sources',
  trending_topics: 'trending_topics',
  users: 'users',
  subscription_tiers: 'subscription_tiers',
  user_subscriptions: 'user_subscriptions',
  api_configs: 'api_configs',
  api_configurations: 'api_configurations',
  refresh_tokens: 'refresh_tokens',
};

/**
 * Parse a Directus-style pathname + query string into components.
 * Example: "/items/articles?limit=50&sort=-date_created&filter[category][_eq]=politics"
 */
function parsePath(pathname) {
  const [path, queryString] = pathname.split('?');
  const segments = path.replace(/^\//, '').split('/');
  // Expected: ["items", "<collection>"] or ["items", "<collection>", "<id>"]
  const collection = segments[1] || null;
  const itemId = segments[2] || null;
  const params = {};

  if (queryString) {
    for (const part of queryString.split('&')) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = decodeURIComponent(part.substring(0, eqIdx));
      const val = decodeURIComponent(part.substring(eqIdx + 1));
      params[key] = val;
    }
  }

  return { collection, itemId, params };
}

/**
 * Build WHERE clauses from Directus filter[field][operator]=value params.
 * Returns { text: 'col op $1 AND ...', values: [...] }
 */
function buildFilters(params, startIdx = 1) {
  const clauses = [];
  const values = [];
  let idx = startIdx;

  const filterRegex = /^filter\[([^\]]+)\]\[([^\]]+)\]$/;

  for (const [key, val] of Object.entries(params)) {
    const match = key.match(filterRegex);
    if (!match) continue;
    const col = match[1];
    const op = match[2];

    switch (op) {
      case '_eq':
        clauses.push(`"${col}" = $${idx++}`);
        values.push(val === 'true' ? true : val === 'false' ? false : val);
        break;
      case '_neq':
        clauses.push(`"${col}" != $${idx++}`);
        values.push(val);
        break;
      case '_contains':
      case '_icontains':
        clauses.push(`"${col}" ILIKE $${idx++}`);
        values.push(`%${val}%`);
        break;
      case '_gte':
        clauses.push(`"${col}" >= $${idx++}`);
        values.push(val);
        break;
      case '_lte':
        clauses.push(`"${col}" <= $${idx++}`);
        values.push(val);
        break;
      case '_gt':
        clauses.push(`"${col}" > $${idx++}`);
        values.push(val);
        break;
      case '_lt':
        clauses.push(`"${col}" < $${idx++}`);
        values.push(val);
        break;
      case '_in': {
        const arr = val.split(',');
        const placeholders = [];
        for (let i = 0; i < arr.length; i++) {
          placeholders.push(`$${idx++}`);
        }
        clauses.push(`"${col}" IN (${placeholders.join(',')})`);
        values.push(...arr);
        break;
      }
      case '_null':
        clauses.push(val === 'true' ? `"${col}" IS NULL` : `"${col}" IS NOT NULL`);
        break;
      default:
        // Unsupported operator — skip
        break;
    }
  }

  return { text: clauses.join(' AND '), values };
}

/**
 * Drop-in replacement for the old directusFetch() function.
 *
 * @param {string} pathname - Directus-style path, e.g. "/items/articles?limit=50"
 * @param {object} init     - { method, body (string) }
 * @returns {object}        - { data: ... } matching Directus response shape
 */
async function queryBridge(pathname, init = {}) {
  const pool = getPool();
  const method = (init.method || 'GET').toUpperCase();
  const { collection, itemId, params } = parsePath(pathname);

  if (!collection) {
    throw new Error(`queryBridge: could not parse collection from "${pathname}"`);
  }

  const table = TABLE_MAP[collection];
  if (!table) {
    throw new Error(`queryBridge: unknown collection "${collection}"`);
  }

  // ── GET single item ─────────────────────────────────────────
  if (method === 'GET' && itemId) {
    const { rows } = await pool.query(`SELECT * FROM "${table}" WHERE id = $1 LIMIT 1`, [itemId]);
    return { data: rows[0] || null };
  }

  // ── GET list ────────────────────────────────────────────────
  if (method === 'GET') {
    const limit = parseInt(params.limit, 10) || 100;
    const offset = parseInt(params.offset, 10) || 0;
    const { text: whereText, values } = buildFilters(params);

    // Sort
    let orderBy = '';
    if (params.sort) {
      const parts = params.sort.split(',').map(s => {
        const trimmed = s.trim();
        if (trimmed.startsWith('-')) return `"${trimmed.substring(1)}" DESC`;
        return `"${trimmed}" ASC`;
      });
      orderBy = `ORDER BY ${parts.join(', ')}`;
    }

    // Fields
    const fields = params.fields && params.fields !== '*'
      ? params.fields.split(',').map(f => {
          // Strip nested relation fields (e.g. "articles_story_clusters.articles_id.*")
          const base = f.trim().split('.')[0];
          return `"${base}"`;
        }).join(', ')
      : '*';

    let sql = `SELECT ${fields} FROM "${table}"`;
    if (whereText) sql += ` WHERE ${whereText}`;
    sql += ` ${orderBy}`;

    // meta count support
    if (params.meta === 'filter_count' && limit === 0) {
      let countSql = `SELECT COUNT(*) AS filter_count FROM "${table}"`;
      if (whereText) countSql += ` WHERE ${whereText}`;
      const { rows } = await pool.query(countSql, values);
      return { data: [], meta: { filter_count: parseInt(rows[0]?.filter_count || '0', 10) } };
    }

    if (limit > 0) sql += ` LIMIT ${limit}`;
    if (offset > 0) sql += ` OFFSET ${offset}`;

    const { rows } = await pool.query(sql, values);
    return { data: rows };
  }

  // ── POST (create) ──────────────────────────────────────────
  if (method === 'POST') {
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    if (!body) throw new Error('queryBridge POST: body is required');

    // Handle array inserts
    const items = Array.isArray(body) ? body : [body];
    const results = [];

    for (const item of items) {
      const keys = Object.keys(item);
      const vals = Object.values(item);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const { rows } = await pool.query(
        `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      if (rows[0]) results.push(rows[0]);
    }
    return { data: items.length === 1 ? results[0] : results };
  }

  // ── PATCH (update) ─────────────────────────────────────────
  if (method === 'PATCH' && itemId) {
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    if (!body) throw new Error('queryBridge PATCH: body is required');

    const keys = Object.keys(body);
    const vals = Object.values(body);
    const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    vals.push(itemId);
    const { rows } = await pool.query(
      `UPDATE "${table}" SET ${setClauses} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    return { data: rows[0] || null };
  }

  // ── DELETE ─────────────────────────────────────────────────
  if (method === 'DELETE' && itemId) {
    await pool.query(`DELETE FROM "${table}" WHERE id = $1`, [itemId]);
    return { data: null };
  }

  throw new Error(`queryBridge: unsupported ${method} on "${pathname}"`);
}

module.exports = queryBridge;
