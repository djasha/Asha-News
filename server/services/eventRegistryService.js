const axios = require('axios');
const logger = require('../utils/logger');
let erBase = null;
try {
  // Lazy require to avoid crashing if dependency not installed yet
  erBase = require('eventregistry');
} catch (_) {
  // SDK optional; REST methods still work
}

/**
 * EventRegistry (newsapi.ai) minimal service
 * Conserves tokens by limiting requests and result counts.
 * Do NOT hardcode API keys. Set EVENT_REGISTRY_API_KEY in env.
 */
class EventRegistryService {
  constructor(options = {}) {
    this.apiKey = process.env.EVENT_REGISTRY_API_KEY || options.apiKey;
    if (!this.apiKey) {
      logger.warn('EventRegistryService: EVENT_REGISTRY_API_KEY not set. Set it in env before calling.');
    }
    this.baseUrl = 'https://newsapi.ai/api/v1';
    this.http = axios.create({ baseURL: this.baseUrl, timeout: 40000 });

    // Initialize SDK if available
    if (erBase && typeof erBase.EventRegistry === 'function') {
      try {
        this.sdk = new erBase.EventRegistry({ apiKey: this.apiKey });
      } catch (e) {
        this.sdk = null;
      }
    } else {
      this.sdk = null;
    }
  }

  async post(path, payload) {
    try {
      const body = { ...payload, apiKey: this.apiKey };
      const { data } = await this.http.post(path, body);
      return data;
    } catch (err) {
      const msg = err?.response?.data || err.message;
      logger.error(`EventRegistryService POST ${path} error:`, msg);
      throw err;
    }
  }

  // Suggest the best matching concept for a given text (topic)
  async suggestConcept(text, lang = 'eng') {
    if (!text) return null;
    const res = await this.post('/suggestConcepts', { text, lang, page: 1, count: 5 });
    const items = res?.suggestions || res || [];
    if (!Array.isArray(items) || items.length === 0) return null;
    const t = String(text).toLowerCase();
    const best = items.find(it => {
      const lbl = (it?.label?.eng || it?.label || '').toString().toLowerCase();
      return lbl.includes(t);
    });
    return best || items[0];
  }

  // Get up to N most recent events for concept
  async getEventsByConcept(conceptUri, { eventsCount = 1, sortBy = 'date' } = {}) {
    if (!conceptUri) return [];
    const payload = {
      query: { $and: [ { conceptUri } ] },
      resultType: 'events',
      eventsSortBy: sortBy,
      eventsCount: Math.max(1, Math.min(eventsCount, 5)),
    };
    const data = await this.post('/event/getEvents', payload);
    // The response usually contains 'events' array
    return data?.events || [];
  }

  // Get events for a concept or location suggestion
  async getEventsForSuggestion(suggestion, { eventsCount = 1, sortBy = 'date' } = {}) {
    if (!suggestion || !suggestion.uri) return [];
    const isLoc = String(suggestion.type || '').toLowerCase() === 'loc';
    const cond = isLoc ? { locationUri: suggestion.uri } : { conceptUri: suggestion.uri };
    const payload = {
      query: { $and: [ cond ] },
      resultType: 'events',
      eventsSortBy: sortBy,
      eventsCount: Math.max(1, Math.min(eventsCount, 5)),
    };
    const data = await this.post('/event/getEvents', payload);
    return data?.events || [];
  }

  // Get articles for a given event
  async getEventArticles(eventUri, { articlesCount = 3, sortBy = 'date' } = {}) {
    if (!eventUri) return [];
    const payload = {
      eventUri,
      resultType: 'articles',
      articlesSortBy: sortBy,
      articlesCount: Math.max(1, Math.min(articlesCount, 5)),
      articlesArticleBodyLen: 0
    };
    const data = await this.post('/event/getEventArticles', payload);
    // common shape: { articles: { results: [...] } } but can vary; normalize
    const results = data?.articles?.results || data?.articles || data?.results || [];
    return Array.isArray(results) ? results : [];
  }

  // Fallback: search articles by keyword (conservative)
  async searchArticles(keyword, { articlesCount = 5, lang = 'eng' } = {}) {
    if (!keyword) return [];
    const payload = {
      query: { $and: [ { keyword, keywordLoc: 'title' }, { lang } ] },
      resultType: 'articles',
      articlesSortBy: 'date',
      articlesCount: Math.max(1, Math.min(articlesCount, 5)),
      articlesArticleBodyLen: 0
    };
    const data = await this.post('/article/getArticles', payload);
    const results = data?.articles?.results || data?.articles || data?.results || [];
    return Array.isArray(results) ? results : [];
  }

  // SDK-based fallback for article search to ensure payload correctness
  async searchArticlesSdk(keyword, { articlesCount = 5, sortBy = 'date' } = {}) {
    if (!this.sdk || !keyword) return [];
    try {
      const { QueryArticles, RequestArticlesInfo } = erBase;
      const q = new QueryArticles({ keyword, keywordLoc: 'title' });
      const reqInfo = new RequestArticlesInfo({ sortBy, count: Math.max(1, Math.min(articlesCount, 5)) });
      q.setRequestedResult(reqInfo);
      const data = await this.sdk.execQuery(q);
      const results = data?.articles?.results || [];
      return Array.isArray(results) ? results : [];
    } catch (e) {
      logger.error('EventRegistryService.searchArticlesSdk error:', e.message);
      return [];
    }
  }
}

module.exports = EventRegistryService;
