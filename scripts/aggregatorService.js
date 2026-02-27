/**
 * FreshRSS Aggregator Service (Google Reader API)
 * Minimal client to read subscriptions and items from a FreshRSS instance
 * without introducing new heavy dependencies.
 *
 * Env vars:
 * - FRESHRSS_URL (e.g. http://localhost:8081)
 * - FRESHRSS_USER
 * - FRESHRSS_PASSWORD
 */

class AggregatorService {
  constructor() {
    this.baseUrl = (process.env.FRESHRSS_URL || '').replace(/\/$/, '');
    this.user = process.env.FRESHRSS_USER || '';
    this.password = process.env.FRESHRSS_PASSWORD || '';
    this.authToken = null; // Google Reader ClientLogin token (Auth=...)
    this.basicAuth = null; // HTTP Basic auth header as fallback
    this.defaultTimeoutMs = 10000;
    this.maxRetries = 3;
  }

  get isConfigured() {
    return !!(this.baseUrl && this.user && this.password);
  }

  // Simple sleep helper
  sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // Perform a fetch with timeout and simple retries
  async requestJson(path, { method = 'GET', params = {}, headers = {}, body } = {}) {
    if (!this.baseUrl) throw new Error('FreshRSS base URL not configured');

    const url = new URL(this.baseUrl + path);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    let lastErr = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

        const res = await fetch(url.toString(), {
          method,
          headers: await this.buildHeaders(headers),
          body,
          signal: controller.signal
        });

        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await res.json();
        }
        const text = await res.text();
        // Some GReader endpoints return text/plain with JSON content
        try { return JSON.parse(text); } catch { return text; }
      } catch (err) {
        lastErr = err;
        if (attempt < this.maxRetries) {
          await this.sleep(200 * attempt);
          continue;
        }
      }
    }
    throw lastErr || new Error('Unknown FreshRSS request error');
  }

  async buildHeaders(extra = {}) {
    const headers = { 'Accept': 'application/json', ...extra };
    // Prefer Google Reader ClientLogin token
    if (!this.authToken && !this.basicAuth) {
      await this.ensureAuth();
    }
    if (this.authToken) {
      headers['Authorization'] = `GoogleLogin auth=${this.authToken}`;
    } else if (this.basicAuth) {
      headers['Authorization'] = `Basic ${this.basicAuth}`;
    }
    return headers;
  }

  async ensureAuth() {
    if (!this.isConfigured) return;

    // Attempt ClientLogin – returns plaintext with Auth=... token
    try {
      const params = {
        client: 'AshaNews',
        Email: this.user,
        Passwd: this.password,
        service: 'reader'
      };
      const res = await this.requestClientLogin('/api/greader.php/accounts/ClientLogin', params);
      if (res && typeof res === 'string') {
        const m = res.match(/Auth=([^\n]+)/);
        if (m) {
          this.authToken = m[1].trim();
          return;
        }
      }
    } catch (_) {}

    // Fallback: HTTP Basic auth
    try {
      const raw = `${this.user}:${this.password}`;
      this.basicAuth = Buffer.from(raw, 'utf8').toString('base64');
    } catch (_) {}
  }

  async requestClientLogin(path, params) {
    const url = new URL(this.baseUrl + path);
    Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    let lastErr = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.defaultTimeoutMs);
        const res = await fetch(url.toString(), { method: 'GET', signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err) {
        lastErr = err;
        if (attempt < this.maxRetries) await this.sleep(150 * attempt);
      }
    }
    throw lastErr || new Error('ClientLogin failed');
  }

  // Returns subscriptions in Google Reader format
  async getSubscriptions() {
    if (!this.isConfigured) return [];
    const data = await this.requestJson('/api/greader.php/reader/api/0/subscription/list', { params: { output: 'json' } });
    const subs = Array.isArray(data?.subscriptions) ? data.subscriptions : [];
    return subs.map(s => ({
      id: s.id || s.streamId || '',
      title: s.title || s.sortid || 'Untitled',
      htmlUrl: s.htmlUrl || s.website || null,
      xmlUrl: s.xmlUrl || s.feedUrl || null,
      categories: s.categories || []
    }));
  }

  // Optionally get items for a stream (unused for now; we rely on xmlUrl -> RSS parsing)
  async getStreamContents(streamId, { n = 50 } = {}) {
    if (!this.isConfigured) return { items: [] };
    const path = `/api/greader.php/reader/api/0/stream/contents/${encodeURIComponent(streamId)}`;
    const data = await this.requestJson(path, { params: { n } });
    return data || { items: [] };
  }
}

module.exports = AggregatorService;
