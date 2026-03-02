/**
 * Supabase REST API Client
 * Uses PostgREST API for database operations (IPv4 compatible)
 * Fallback when direct PostgreSQL connection (IPv6) is not available.
 */

const logger = require('../utils/logger');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Backend server should prefer service key for both reads and writes.
const getApiKey = () => SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

let supabaseAvailable = null;

function isAvailable() {
  if (supabaseAvailable === null) {
    supabaseAvailable = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
    if (supabaseAvailable) {
      logger.info('Supabase REST client available');
    }
  }
  return supabaseAvailable;
}

/**
 * Make a request to Supabase PostgREST API
 * @param {string} table - Table name
 * @param {object} options - { method, select, filter, order, limit, offset, body }
 */
async function supabaseRequest(table, options = {}) {
  if (!isAvailable()) {
    throw new Error('Supabase credentials not configured');
  }

  const { method = 'GET', select = '*', filter, order, limit, offset, body, id } = options;

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;

  // Add filters
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        url += `&${key}=eq.${encodeURIComponent(value)}`;
      }
    }
  }

  // Add ordering
  if (order) {
    const [col, dir = 'asc'] = order.split('.');
    url += `&order=${col}.${dir}`;
  }

  // Add pagination
  if (limit) url += `&limit=${limit}`;
  if (offset) url += `&offset=${offset}`;

  // Single item by ID
  if (id) {
    url += `&id=eq.${id}`;
  }

  const apiKey = getApiKey();
  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': (method === 'POST' || method === 'PATCH') ? 'return=representation' : undefined
  };

  // Remove undefined headers
  Object.keys(headers).forEach(key => headers[key] === undefined && delete headers[key]);

  const fetchOptions = { method, headers };
  if (body && (method === 'POST' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase error ${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      return { data: null, error: null };
    }

    const data = JSON.parse(text);
    return { data, error: null };
  } catch (error) {
    logger.error(`Supabase request failed: ${error.message}`);
    return { data: null, error: error.message };
  }
}

// Convenience methods matching the pg pool interface
const supabaseClient = {
  isAvailable,

  async query(sql, values = []) {
    // For raw SQL, we need to use Supabase RPC or direct table queries
    // This is a simplified adapter for common patterns
    logger.warn('Supabase client: raw SQL queries not supported via REST API');
    return { rows: [], error: 'Use table-specific methods instead of raw SQL' };
  },

  // Table operations
  async select(table, options = {}) {
    return supabaseRequest(table, { method: 'GET', ...options });
  },

  async insert(table, data) {
    return supabaseRequest(table, { method: 'POST', body: data });
  },

  async update(table, id, data) {
    return supabaseRequest(table, { method: 'PATCH', id, body: data });
  },

  async delete(table, id) {
    return supabaseRequest(table, { method: 'DELETE', id });
  },

  // Direct request for complex queries
  request: supabaseRequest
};

module.exports = supabaseClient;
