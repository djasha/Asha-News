const express = require('express');
const path = require('path');

const conflictAnalyticsService = require('../services/conflictAnalyticsService');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/openapi', (_req, res) => {
  res.sendFile(path.join(__dirname, '../openapi/monitor-ops-v1.json'));
});

router.get('/layers', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getMonitorLayers({
      conflict: req.query.conflict,
      days: req.query.days,
      verification: req.query.verification,
      source_tier: req.query.source_tier,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Monitor layers fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monitor layers',
    });
  }
});

router.get('/news/digest', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getMonitorNewsDigest({
      conflict: req.query.conflict,
      days: req.query.days,
      verification: req.query.verification,
      source_tier: req.query.source_tier,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Monitor news digest fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monitor news digest',
    });
  }
});

router.get('/signals/fusion', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getMonitorSignalsFusion({
      conflict: req.query.conflict,
      days: req.query.days,
      verification: req.query.verification,
      source_tier: req.query.source_tier,
      limit: req.query.limit,
      min_signal_events: req.query.min_signal_events,
      low_verified_share: req.query.low_verified_share,
      low_confidence: req.query.low_confidence,
      stale_hours: req.query.stale_hours,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Monitor signal fusion fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monitor signal fusion',
    });
  }
});

router.get('/freshness', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getMonitorFreshness({
      conflict: req.query.conflict,
      days: req.query.days,
      stale_hours: req.query.stale_hours,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Monitor freshness fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monitor freshness',
    });
  }
});

router.get('/intel/brief', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getMonitorIntelBrief({
      conflict: req.query.conflict,
      days: req.query.days,
      verification: req.query.verification,
      source_tier: req.query.source_tier,
      limit: req.query.limit,
      min_signal_events: req.query.min_signal_events,
      low_verified_share: req.query.low_verified_share,
      low_confidence: req.query.low_confidence,
      stale_hours: req.query.stale_hours,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Monitor intel brief fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monitor intel brief',
    });
  }
});

module.exports = router;
