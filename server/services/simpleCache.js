// Lightweight in-memory cache with TTL for server-side CMS responses
// Keeps code simple and avoids new dependencies

class SimpleCache {
  constructor() {
    this.store = new Map(); // key -> { value, expiresAt }
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes

    // periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref?.();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    const ttl = typeof ttlMs === 'number' && ttlMs > 0 ? ttlMs : this.defaultTTL;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  del(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt) this.store.delete(key);
    }
  }
}

const simpleCache = new SimpleCache();

async function withCache(cacheKey, ttlMs, fetcher) {
  const cached = simpleCache.get(cacheKey);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  // Only cache truthy successful payloads
  if (fresh !== undefined) simpleCache.set(cacheKey, fresh, ttlMs);
  return fresh;
}

module.exports = { simpleCache, withCache };
