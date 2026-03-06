const express = require('express');

const missionControlService = require('../services/missionControlService');
const { optionalAuth } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();
router.use(optionalAuth);

function buildQuery(req) {
  const acceptLanguage = String(req.headers['accept-language'] || '').trim();
  const requestedLanguage = String(req.query.lang || req.query.language || '').trim();
  const countryHint = String(
    req.query.country
      || req.headers['x-vercel-ip-country']
      || req.headers['cf-ipcountry']
      || req.headers['x-country-code']
      || req.headers['x-geo-country']
      || ''
  ).trim();

  return {
    conflict: req.query.conflict,
    days: req.query.days,
    mode: req.query.mode,
    verification_mode: req.query.verification_mode,
    incident_type: req.query.incident_type,
    profile: req.query.profile,
    language: requestedLanguage || acceptLanguage,
    country: countryHint,
    search: req.query.search,
    cursor: req.query.cursor,
    limit: req.query.limit,
    feed_tab: req.query.feed_tab || req.query.tab,
    severity: req.query.severity,
    source_type: req.query.source_type,
    topic: req.query.topic,
    category: req.query.category,
    country_filter: req.query.country_filter,
    verification_status: req.query.verification_status,
    time_range: req.query.time_range,
    user_id: req.user?.userId,
  };
}

function handleError(res, error, message, context = {}) {
  const statusCode = Number(error?.statusCode) || 500;
  logger.error({ err: error, ...context }, message);
  return res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'Mission control request failed' : error.message,
  });
}

router.get('/home', async (req, res) => {
  try {
    const data = await missionControlService.getHomeSnapshot(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control home snapshot failed', { query: req.query });
  }
});

router.get('/ticker', async (req, res) => {
  try {
    const data = await missionControlService.getTicker(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control ticker request failed', { query: req.query });
  }
});

router.get('/feed/home', async (req, res) => {
  try {
    const data = await missionControlService.getFeedHome(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control feed home request failed', { query: req.query });
  }
});

router.get('/feed/items', async (req, res) => {
  try {
    const data = await missionControlService.getFeedItems(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control feed items request failed', { query: req.query });
  }
});

router.get('/feed/filters/catalog', async (req, res) => {
  try {
    const data = await missionControlService.getFeedFiltersCatalog(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control feed filter catalog request failed', { query: req.query });
  }
});

router.get('/feed/topics', async (req, res) => {
  try {
    const data = await missionControlService.getFeedTopics(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control feed topics request failed', { query: req.query });
  }
});

router.get('/feed/categories', async (req, res) => {
  try {
    const data = await missionControlService.getFeedCategories(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control feed categories request failed', { query: req.query });
  }
});

router.get('/feed/countries', async (req, res) => {
  try {
    const data = await missionControlService.getFeedCountries(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control feed countries request failed', { query: req.query });
  }
});

router.get('/alerts/inbox', async (req, res) => {
  try {
    const data = await missionControlService.getAlertsInbox(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control inbox request failed', { query: req.query });
  }
});

router.get('/alerts/actions', async (req, res) => {
  try {
    const data = await missionControlService.getAlertActions(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control alert actions request failed', { query: req.query });
  }
});

router.post('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const data = await missionControlService.applyAlertAction('acknowledge', buildQuery(req), {
      ...(req.body || {}),
      alert_id: req.params.id,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control acknowledge action failed', {
      id: req.params.id,
      body: req.body,
    });
  }
});

router.post('/alerts/:id/mute-similar', async (req, res) => {
  try {
    const data = await missionControlService.applyAlertAction('mute_similar', buildQuery(req), {
      ...(req.body || {}),
      alert_id: req.params.id,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control mute-similar action failed', {
      id: req.params.id,
      body: req.body,
    });
  }
});

router.post('/alerts/:id/follow-region', async (req, res) => {
  try {
    const data = await missionControlService.applyAlertAction('follow_region', buildQuery(req), {
      ...(req.body || {}),
      alert_id: req.params.id,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control follow-region action failed', {
      id: req.params.id,
      body: req.body,
    });
  }
});

router.get('/leaks', async (req, res) => {
  try {
    const data = await missionControlService.getLeaks(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control leaks request failed', { query: req.query });
  }
});

router.get('/layers/catalog', async (_req, res) => {
  try {
    const data = await missionControlService.getLayersCatalog();
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control layers catalog request failed');
  }
});

router.get('/map/layers', async (req, res) => {
  try {
    const data = await missionControlService.getMapLayers(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control map layers request failed', { query: req.query });
  }
});

router.get('/map/session', async (req, res) => {
  try {
    const data = await missionControlService.getMapSession(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control map session request failed', { query: req.query });
  }
});

router.get('/wm/resources', async (req, res) => {
  try {
    const data = await missionControlService.getWorldMonitorResources(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control WM resources request failed', { query: req.query });
  }
});

router.get('/hazards/catalog', async (_req, res) => {
  try {
    const data = await missionControlService.getHazardsCatalog();
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control hazards catalog request failed');
  }
});

router.get('/safety-guides', async (req, res) => {
  try {
    const data = await missionControlService.getSafetyGuides(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control safety guides request failed', { query: req.query });
  }
});

router.get('/explainers', async (_req, res) => {
  try {
    const data = await missionControlService.getExplainers();
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control explainers request failed');
  }
});

router.put('/alerts/audio-preferences', async (req, res) => {
  try {
    const data = await missionControlService.updateAlertAudioPreferences(
      {
        ...buildQuery(req),
        profile: req.query.profile || req.body?.profile,
      },
      req.body || {}
    );
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control audio preferences update failed', {
      query: req.query,
      body: req.body,
    });
  }
});

router.put('/layouts/:id', async (req, res) => {
  try {
    const data = await missionControlService.updateWorkspaceLayout(req.params.id, req.body || {}, buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control layout update failed', {
      id: req.params.id,
      body: req.body,
    });
  }
});

router.get('/notifications/preferences', async (req, res) => {
  try {
    const data = await missionControlService.getNotificationPreferences(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control notification preferences request failed', { query: req.query });
  }
});

router.get('/notifications/telemetry', async (req, res) => {
  try {
    const data = await missionControlService.getNotificationTelemetry(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control notification telemetry request failed', { query: req.query });
  }
});

router.get('/ops/health', async (req, res) => {
  try {
    const data = await missionControlService.getOpsHealth(buildQuery(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control ops health request failed', { query: req.query });
  }
});

router.put('/notifications/preferences', async (req, res) => {
  try {
    const data = await missionControlService.updateNotificationPreferences(
      {
        ...buildQuery(req),
        profile: req.query.profile || req.body?.profile,
      },
      req.body || {}
    );
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Mission Control notification preferences update failed', {
      query: req.query,
      body: req.body,
    });
  }
});

module.exports = router;
