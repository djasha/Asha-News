const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const EventRegistryService = require('../services/eventRegistryService');
const DirectusService = require('../services/directusService');

const directusService = new DirectusService();

/**
 * POST /api/vendors/event-registry/test
 * Minimal integration test for newsapi.ai features, conserving tokens.
 * Performs at most ~3 API calls:
 *  - suggestConcept (1)
 *  - getEventsByConcept (1)
 *  - getEventArticles (1)
 * Optional: persist to Directus and create a small cluster.
 */
router.post('/event-registry/test', async (req, res) => {
  try {
    const {
      topic,
      apiKey,
      articles_per_event = 3,
      persist = false,
      dry_run = true,
      force_keyword = false
    } = req.body || {};

    if (!topic || String(topic).trim().length === 0) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const er = new EventRegistryService({ apiKey });
    if (!er.apiKey) {
      return res.status(400).json({ error: 'Event Registry API key not configured. Provide in env or body.apiKey for dev testing.' });
    }

    // 1) Concept (1 call)
    const concept = force_keyword ? null : await er.suggestConcept(String(topic));

    // 2) Fetch articles via events or direct keyword search
    let event = null;
    const maxArticles = Math.max(1, Math.min(parseInt(articles_per_event) || 3, 5));
    let articles = [];
    if (force_keyword) {
      articles = await er.searchArticles(String(topic), { articlesCount: maxArticles });
    } else {
      let eventsList = [];
      if (concept) {
        eventsList = await er.getEventsForSuggestion(concept, { eventsCount: 1, sortBy: 'date' });
      }
      event = Array.isArray(eventsList) && eventsList.length > 0 ? eventsList[0] : null;
      if (event?.uri || event?.id) {
        articles = await er.getEventArticles(event?.uri || event?.id, { articlesCount: maxArticles });
      } else {
        const searched = await er.searchArticles(String(topic), { articlesCount: maxArticles });
        const first = Array.isArray(searched) && searched.length > 0 ? searched[0] : null;
        const artEventUri = first?.eventUri || first?.event?.uri || null;
        if (artEventUri) {
          event = { uri: artEventUri, title: first?.title };
          articles = await er.getEventArticles(artEventUri, { articlesCount: maxArticles });
        } else {
          articles = searched;
        }
      }
    }

    // Analyze presence of fields
    const analyzed = (articles || []).map(a => {
      const sentiment = a?.sentiment || a?.sentimentBody || a?.sentimentTitle || null;
      const body = a?.body || a?.summary || '';
      return {
        title: a?.title || a?.titleEng || '',
        hasBody: !!body,
        hasSentiment: !!sentiment,
        hasSummary: !!a?.summary,
        source: a?.source?.title || a?.source?.uri || 'Unknown',
        url: a?.url || a?.uri || null,
      };
    });

    let clusterId = null;
    let savedIds = [];

    if (persist && !dry_run) {
      try {
        // Save limited articles and create a small cluster
        for (const item of (articles || []).slice(0, maxArticles)) {
          try {
            const saved = await directusService.upsertArticleBySourceUrl({
              title: item?.title || item?.titleEng || 'Untitled',
              summary: item?.summary || '',
              content: item?.body || '',
              source_url: item?.url || item?.uri || '',
              source_name: item?.source?.title || item?.source?.uri || 'Unknown',
              image_url: item?.image || null,
              published_at: item?.dateTimePub || item?.date || new Date().toISOString(),
              category: 'International'
            });
            if (saved?.id) savedIds.push(saved.id);
          } catch (e) {
            logger.error({ err: error }, 'Vendors test upsert error');

          }
        }
        if (savedIds.length > 0) {
          const savedCluster = await directusService.saveCluster({
            cluster_title: event?.title || `Topic: ${topic}`,
            cluster_summary: `EventRegistry test for topic '${topic}'.`,
            article_count: savedIds.length,
            status: 'active'
          });
          clusterId = savedCluster?.id || null;
          if (clusterId) await directusService.saveClusterArticles(clusterId, savedIds);
        }
      } catch (e) {
        logger.error({ err: error }, 'Vendors test cluster persist error');

      }
    }

    return res.json({
      success: true,
      api_calls_estimate: 3,
      message: 'EventRegistry test completed',
      data: {
        concept: concept ? { uri: concept?.uri, label: concept?.label || concept?.labelEng } : null,
        event: { uri: event?.uri || event?.id, title: event?.title },
        articles_analyzed: analyzed.length,
        sample: analyzed,
        cluster_id: clusterId,
        article_ids: savedIds
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in vendors event-registry test');
    return res.status(500).json({ error: 'EventRegistry test failed', details: error.message });
  }
});

module.exports = router;
