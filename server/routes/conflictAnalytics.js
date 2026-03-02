const express = require('express');
const path = require('path');
const router = express.Router();
const logger = require('../utils/logger');
const queryBridge = require('../db/queryBridge');
const conflictAnalyticsService = require('../services/conflictAnalyticsService');
const { authenticateToken, requireAdmin, optionalAuth, isAdminUser } = require('../middleware/authMiddleware');

const strictAuth = process.env.CONFLICT_OPS_STRICT_AUTH !== undefined
  ? process.env.CONFLICT_OPS_STRICT_AUTH === 'true'
  : (process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true');
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const parseBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const parseBoundedInt = (value, fallback, min, max) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

const AUTONOMY_RUN_TRACK_TTL_MS = parseBoundedInt(
  process.env.CONFLICT_OPS_RUN_TRACK_TTL_MS,
  6 * 60 * 60 * 1000,
  60 * 1000,
  7 * 24 * 60 * 60 * 1000
);
const AUTONOMY_RUN_TRACK_MAX = parseBoundedInt(
  process.env.CONFLICT_OPS_RUN_TRACK_MAX,
  200,
  10,
  2000
);
const AUTONOMY_RUNS_TABLE = 'conflict_autonomy_runs';
const autonomyRunTracker = new Map();
const THEORY_ARTIFACT = 'theory';
const FORECAST_ARTIFACT = 'forecast';

const nowIso = () => new Date().toISOString();
const encode = (value) => encodeURIComponent(String(value || ''));

const ensureObject = (value) => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      return {};
    }
  }
  return {};
};

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseNullableBool = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
};

const extractAgentRunIds = (result) => {
  const ids = Object.values(result?.agents || {})
    .map((agent) => agent?.run_id)
    .filter((id) => typeof id === 'string' && id.trim().length > 0);
  return [...new Set(ids)];
};

const dbList = async (pathname) => {
  const response = await queryBridge(pathname);
  if (response?.error) {
    throw new Error(String(response.error));
  }
  return Array.isArray(response?.data) ? response.data : [];
};

const dbInsert = async (table, payload) => {
  const response = await queryBridge(`/items/${table}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (response?.error) {
    throw new Error(String(response.error));
  }
  return response?.data || null;
};

const dbPatch = async (table, id, payload) => {
  const response = await queryBridge(`/items/${table}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (response?.error) {
    throw new Error(String(response.error));
  }
  return response?.data || null;
};

const toRunRecord = (entry = {}) => ({
  id: entry.id || null,
  trigger_id: String(entry.trigger_id || ''),
  mode: String(entry.mode || 'async'),
  status: String(entry.status || 'queued'),
  created_at: entry.created_at || nowIso(),
  updated_at: entry.updated_at || nowIso(),
  started_at: entry.started_at || null,
  finished_at: entry.finished_at || null,
  ok: parseNullableBool(entry.ok),
  requested_by: entry.requested_by || null,
  request_source: entry.request_source || 'api',
  options: ensureObject(entry.options),
  result: ensureObject(entry.result),
  error: ensureObject(entry.error),
  agent_run_ids: ensureArray(entry.agent_run_ids),
  run_count: parseBoundedInt(entry.run_count, 0, 0, 100000),
});

const toRunPayload = (entry = {}) => ({
  trigger_id: entry.trigger_id,
  mode: entry.mode,
  status: entry.status,
  created_at: entry.created_at,
  updated_at: entry.updated_at,
  started_at: entry.started_at,
  finished_at: entry.finished_at,
  ok: entry.ok,
  requested_by: entry.requested_by,
  request_source: entry.request_source,
  options: entry.options,
  result: entry.result,
  error: entry.error,
  agent_run_ids: entry.agent_run_ids,
  run_count: entry.run_count,
});

const findPersistedAutonomyRun = async (triggerId) => {
  const rows = await dbList(`/items/${AUTONOMY_RUNS_TABLE}?filter[trigger_id][_eq]=${encode(triggerId)}&limit=1`);
  return rows[0] || null;
};

const persistAutonomyRun = async (entry) => {
  if (!entry?.trigger_id) return null;

  const existing = await findPersistedAutonomyRun(entry.trigger_id).catch(() => null);
  const payload = toRunPayload(entry);
  if (existing?.id) {
    const updated = await dbPatch(AUTONOMY_RUNS_TABLE, existing.id, payload);
    return toRunRecord({ ...entry, ...(updated || {}), id: existing.id });
  }

  const inserted = await dbInsert(AUTONOMY_RUNS_TABLE, payload);
  return toRunRecord({ ...entry, ...(inserted || {}) });
};

const sanitizeRunOptions = (options = {}) => ({
  run_type: options.runType || 'manual_trigger',
  force: Boolean(options.force),
  shadow_mode: Boolean(options.shadowMode),
  conflict: options.conflict || 'all',
  limit: options.limit || null,
  max_agent_ms: options.maxAgentMs || null,
  max_cycle_ms: options.maxCycleMs || null,
});

const pruneAutonomyRunTracker = () => {
  const now = Date.now();

  for (const [triggerId, entry] of autonomyRunTracker.entries()) {
    const referenceTs = new Date(entry.finished_at || entry.updated_at || entry.created_at).getTime();
    if (!Number.isFinite(referenceTs) || (now - referenceTs) > AUTONOMY_RUN_TRACK_TTL_MS) {
      autonomyRunTracker.delete(triggerId);
    }
  }

  if (autonomyRunTracker.size <= AUTONOMY_RUN_TRACK_MAX) return;

  const oldestFirst = [...autonomyRunTracker.values()].sort(
    (a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime()
  );

  const overflow = autonomyRunTracker.size - AUTONOMY_RUN_TRACK_MAX;
  for (let idx = 0; idx < overflow; idx += 1) {
    const item = oldestFirst[idx];
    if (item?.trigger_id) autonomyRunTracker.delete(item.trigger_id);
  }
};

const upsertAutonomyRun = async (triggerId, patch = {}) => {
  const existing = toRunRecord(autonomyRunTracker.get(triggerId) || {
    trigger_id: triggerId,
    status: 'queued',
    created_at: nowIso(),
    updated_at: nowIso(),
    started_at: null,
    finished_at: null,
    ok: null,
    options: {},
    result: {},
    error: {},
    agent_run_ids: [],
    run_count: 0,
  });

  const merged = toRunRecord({
    ...existing,
    ...patch,
    trigger_id: triggerId,
    updated_at: nowIso(),
  });

  autonomyRunTracker.set(triggerId, merged);
  pruneAutonomyRunTracker();

  try {
    const persisted = await persistAutonomyRun(merged);
    if (persisted) {
      autonomyRunTracker.set(triggerId, persisted);
      return persisted;
    }
  } catch (error) {
    logger.warn({ err: error?.message, triggerId }, 'Autonomy run tracker DB persist failed; using memory fallback');
  }

  return merged;
};

const serializeAutonomyRun = (entry, includeResult = false) => {
  if (!entry) return null;
  const normalized = toRunRecord(entry);
  const payload = {
    trigger_id: normalized.trigger_id,
    mode: normalized.mode,
    status: normalized.status,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
    started_at: normalized.started_at || null,
    finished_at: normalized.finished_at || null,
    ok: normalized.ok,
    requested_by: normalized.requested_by || null,
    request_source: normalized.request_source || null,
    options: normalized.options || {},
    error: normalized.error || {},
    agent_run_ids: normalized.agent_run_ids || [],
    run_count: normalized.run_count || 0,
  };

  if (includeResult) payload.result = normalized.result || {};
  return payload;
};

const requireOpsAccess = (req, res, next) => {
  if (!strictAuth) return next();

  const providedInternal = req.header('X-Internal-Key') || req.header('x-internal-key');
  if (INTERNAL_API_KEY && providedInternal && providedInternal === INTERNAL_API_KEY) {
    req.isInternalOps = true;
    return next();
  }

  return authenticateToken(req, res, () => requireAdmin(req, res, next));
};

const resolvePrivilegedRead = (req) => {
  const providedInternal = req.header('X-Internal-Key') || req.header('x-internal-key');
  if (INTERNAL_API_KEY && providedInternal && providedInternal === INTERNAL_API_KEY) return true;
  if (req.isInternalOps) return true;
  if (req.user && isAdminUser(req.user)) return true;
  return false;
};

const isPublicArtifactEnabled = async (artifact) => {
  try {
    return await conflictAnalyticsService.isPublicAnalyticsExposureEnabled(artifact);
  } catch (error) {
    logger.warn({ err: error?.message, artifact }, 'Failed to resolve public artifact exposure flag');
    return false;
  }
};

router.get('/openapi', (_req, res) => {
  res.sendFile(path.join(__dirname, '../openapi/conflict-ops-v1.json'));
});

router.get('/events', async (req, res) => {
  try {
    const events = await conflictAnalyticsService.listEvents({
      conflict: req.query.conflict,
      days: req.query.days,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
      verification: req.query.verification || 'verified',
      source_tier: req.query.source_tier,
      include_identities: parseBool(req.query.include_identities, false),
    });

    return res.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict events fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict events',
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await conflictAnalyticsService.getStats({
      conflict: req.query.conflict,
      days: req.query.days,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
      verification: req.query.verification || 'verified',
      source_tier: req.query.source_tier,
      compare_mode: req.query.compare_mode,
      compare_left: req.query.compare_left,
      compare_right: req.query.compare_right,
    });

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict stats fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict stats',
    });
  }
});

router.get('/intel-gaps', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getIntelGaps({
      conflict: req.query.conflict,
      days: req.query.days,
      verification: req.query.verification || 'all',
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
      total: Array.isArray(data?.items) ? data.items.length : 0,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict intel-gaps fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict intelligence gaps',
    });
  }
});

router.get('/signals', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getSignals({
      conflict: req.query.conflict,
      days: req.query.days,
      verification: req.query.verification || 'verified',
      source_tier: req.query.source_tier,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict signals fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict signal fusion input',
    });
  }
});

router.get('/related-news', async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getRelatedNews({
      conflict: req.query.conflict,
      days: req.query.days,
      verification: req.query.verification || 'verified',
      source_tier: req.query.source_tier,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict related-news fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch related conflict news',
    });
  }
});

router.get('/forecasts', optionalAuth, async (req, res) => {
  try {
    const privileged = resolvePrivilegedRead(req);
    if (!privileged) {
      const enabled = await isPublicArtifactEnabled(FORECAST_ARTIFACT);
      if (!enabled) {
        return res.json({
          success: true,
          data: [],
          total: 0,
        });
      }
    }

    const items = await conflictAnalyticsService.listForecasts({
      conflict: req.query.conflict,
      limit: req.query.limit,
      include_draft: privileged && parseBool(req.query.include_draft, false),
      verification: req.query.verification || 'verified',
      generate_if_missing: parseBool(req.query.generate_if_missing, false),
    });

    return res.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict forecasts fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict forecasts',
    });
  }
});

router.get('/theories', optionalAuth, async (req, res) => {
  try {
    const privileged = resolvePrivilegedRead(req);
    if (!privileged) {
      const enabled = await isPublicArtifactEnabled(THEORY_ARTIFACT);
      if (!enabled) {
        return res.json({
          success: true,
          data: [],
          total: 0,
        });
      }
    }

    const items = await conflictAnalyticsService.listTheories({
      conflict: req.query.conflict,
      limit: req.query.limit,
      include_draft: privileged && parseBool(req.query.include_draft, false),
      verification: req.query.verification || 'verified',
      generate_if_missing: parseBool(req.query.generate_if_missing, false),
    });

    return res.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict theories fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict theories',
    });
  }
});

router.get('/autonomy/status', requireOpsAccess, async (_req, res) => {
  try {
    const status = await conflictAnalyticsService.getAutonomyStatus();
    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error({ err: error }, 'Conflict autonomy status fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch autonomy status',
    });
  }
});

router.get('/autonomy/runs', requireOpsAccess, async (req, res) => {
  try {
    pruneAutonomyRunTracker();
    const limit = parseBoundedInt(req.query.limit, 20, 1, 100);
    const includeResult = parseBool(req.query.include_result, false);
    let persisted = [];
    try {
      persisted = await dbList(`/items/${AUTONOMY_RUNS_TABLE}?sort=-created_at&limit=${limit}`);
    } catch (error) {
      logger.warn({ err: error?.message }, 'Conflict autonomy runs DB list failed; using memory tracker');
    }

    const byTrigger = new Map(
      persisted
        .map((entry) => toRunRecord(entry))
        .filter((entry) => entry.trigger_id)
        .map((entry) => [entry.trigger_id, entry])
    );

    for (const entry of autonomyRunTracker.values()) {
      const normalized = toRunRecord(entry);
      if (!normalized.trigger_id) continue;
      if (!byTrigger.has(normalized.trigger_id)) {
        byTrigger.set(normalized.trigger_id, normalized);
      } else {
        const existingTs = new Date(byTrigger.get(normalized.trigger_id).updated_at || 0).getTime();
        const memTs = new Date(normalized.updated_at || 0).getTime();
        if (memTs > existingTs) {
          byTrigger.set(normalized.trigger_id, normalized);
        }
      }
    }

    const items = [...byTrigger.values()]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, limit)
      .map((entry) => serializeAutonomyRun(entry, includeResult));

    return res.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict autonomy runs list failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch autonomy runs',
    });
  }
});

router.get('/autonomy/runs/:triggerId', requireOpsAccess, async (req, res) => {
  try {
    pruneAutonomyRunTracker();
    const includeResult = parseBool(req.query.include_result, true);
    const triggerId = String(req.params.triggerId || '').trim();
    let entry = null;

    try {
      const persisted = await findPersistedAutonomyRun(triggerId);
      if (persisted) entry = toRunRecord(persisted);
    } catch (error) {
      logger.warn({ err: error?.message, triggerId }, 'Conflict autonomy run DB fetch failed; falling back to memory tracker');
    }

    if (!entry && autonomyRunTracker.has(triggerId)) {
      entry = toRunRecord(autonomyRunTracker.get(triggerId));
    }

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Autonomy run not found',
      });
    }

    return res.json({
      success: true,
      data: serializeAutonomyRun(entry, includeResult),
    });
  } catch (error) {
    logger.error({ err: error, params: req.params }, 'Conflict autonomy run fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch autonomy run',
    });
  }
});

router.post('/autonomy/runs/reconcile', requireOpsAccess, async (req, res) => {
  try {
    const result = await conflictAnalyticsService.reconcileStaleRunningAgentRuns({
      dry_run: parseBool(req.body?.dry_run ?? req.body?.dryRun, false),
      stale_after_minutes: parseBoundedInt(req.body?.stale_after_minutes, undefined, 5, 10080),
      stale_after_ms: parseBoundedInt(req.body?.stale_after_ms, undefined, 300000, 604800000),
      limit: parseBoundedInt(req.body?.limit, undefined, 1, 5000),
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Conflict autonomy run reconciliation failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to reconcile stale autonomy agent runs',
    });
  }
});

router.get('/sources/candidates', requireOpsAccess, async (req, res) => {
  try {
    const data = await conflictAnalyticsService.listSourceCandidates({
      status: req.query.status || 'pending',
      limit: req.query.limit,
    });
    return res.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict source candidate list failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch source candidates',
    });
  }
});

router.post('/sources/candidates/:id/approve', requireOpsAccess, async (req, res) => {
  try {
    const reviewer = req.user?.email || req.user?.userId || 'internal';
    const data = await conflictAnalyticsService.approveSourceCandidate(
      req.params.id,
      reviewer,
      req.body?.notes || ''
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, params: req.params, body: req.body }, 'Approve source candidate failed');
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve source candidate',
    });
  }
});

router.post('/sources/candidates/:id/reject', requireOpsAccess, async (req, res) => {
  try {
    const reviewer = req.user?.email || req.user?.userId || 'internal';
    const data = await conflictAnalyticsService.rejectSourceCandidate(
      req.params.id,
      reviewer,
      req.body?.notes || ''
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, params: req.params, body: req.body }, 'Reject source candidate failed');
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to reject source candidate',
    });
  }
});

router.get('/reviews/queue', requireOpsAccess, async (req, res) => {
  try {
    const data = await conflictAnalyticsService.getReviewQueue({
      conflict: req.query.conflict,
      days: req.query.days,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Conflict review queue fetch failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict review queue',
    });
  }
});

router.post('/reviews/:eventId', requireOpsAccess, async (req, res) => {
  try {
    const reviewer = req.user?.email || req.user?.userId || 'internal';
    const data = await conflictAnalyticsService.reviewEvent(req.params.eventId, {
      action: req.body?.action,
      reason: req.body?.reason,
      reviewer,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error({ err: error, params: req.params, body: req.body }, 'Conflict review action failed');
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to apply review action',
    });
  }
});

router.post('/events', requireOpsAccess, async (req, res) => {
  try {
    const event = await conflictAnalyticsService.addEvent(req.body || {});
    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Conflict event create failed');
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create conflict event',
    });
  }
});

router.post('/events/bulk', requireOpsAccess, async (req, res) => {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : [];
    if (events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'events array is required',
      });
    }

    const created = await conflictAnalyticsService.addEventsBulk(events);
    return res.status(201).json({
      success: true,
      created: created.length,
      data: created,
    });
  } catch (error) {
    logger.error({ err: error }, 'Conflict bulk insert failed');
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create conflict events',
    });
  }
});

router.post('/ingest/from-articles', requireOpsAccess, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.body?.limit, 10) || 300, 1000));
    const conflict = req.body?.conflict || 'all';
    const minConfidence = Number.isFinite(Number(req.body?.minConfidence))
      ? Number(req.body.minConfidence)
      : 0.35;
    const dryRun = req.body?.dryRun !== false;

    const response = await queryBridge(`/items/articles?sort=-published_at&limit=${limit}`);
    const articles = Array.isArray(response?.data) ? response.data : [];

    const result = await conflictAnalyticsService.ingestFromArticles(articles, {
      conflict,
      minConfidence,
      dryRun,
    });

    return res.json({
      success: true,
      mode: dryRun ? 'dry_run' : 'write',
      data: result,
    });
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Conflict article ingestion failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to ingest conflict events from articles',
    });
  }
});

router.post('/autonomy/run', requireOpsAccess, async (req, res) => {
  try {
    const runOptions = {
      runType: 'manual_trigger',
      force: parseBool(req.body?.force, false),
      shadowMode: parseBool(req.body?.shadowMode, true),
      conflict: req.body?.conflict,
      limit: req.body?.limit,
      maxAgentMs: parseBoundedInt(req.body?.maxAgentMs, undefined, 1000, 300000),
      maxCycleMs: parseBoundedInt(req.body?.maxCycleMs, undefined, 5000, 900000),
    };

    const asyncMode = parseBool(req.body?.async, false);

    if (asyncMode) {
      const triggerId = `autonomy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      const requestPayload = req.body;
      const requestedBy = req.user?.email || req.user?.userId || (req.isInternalOps ? 'internal' : 'unknown');
      const requestSource = req.isInternalOps ? 'internal_key' : 'admin_auth';

      await upsertAutonomyRun(triggerId, {
        mode: 'async',
        status: 'queued',
        requested_by: requestedBy,
        request_source: requestSource,
        options: sanitizeRunOptions(runOptions),
        error: {},
        result: {},
        agent_run_ids: [],
        run_count: 0,
        ok: null,
      });

      setImmediate(async () => {
        await upsertAutonomyRun(triggerId, {
          status: 'running',
          started_at: nowIso(),
          error: {},
        });

        try {
          const result = await conflictAnalyticsService.runAutonomousCycle(runOptions);
          const agentRunIds = extractAgentRunIds(result);
          await upsertAutonomyRun(triggerId, {
            status: 'completed',
            finished_at: nowIso(),
            ok: result?.ok !== false,
            result,
            error: {},
            agent_run_ids: agentRunIds,
            run_count: agentRunIds.length,
          });
          logger.info({ triggerId, result }, 'Conflict autonomy async manual run completed');
        } catch (error) {
          await upsertAutonomyRun(triggerId, {
            status: 'failed',
            finished_at: nowIso(),
            ok: false,
            error: {
              message: error?.message || 'Autonomy cycle failed',
              code: error?.code || null,
            },
          });
          logger.error({ err: error, triggerId, body: requestPayload }, 'Conflict autonomy async manual run failed');
        }
      });

      return res.status(202).json({
        success: true,
        data: {
          accepted: true,
          mode: 'async',
          trigger_id: triggerId,
          status_endpoint: `/api/conflicts/autonomy/runs/${encodeURIComponent(triggerId)}`,
          message: 'Autonomy cycle started in background. Poll status endpoint for completion.',
        },
      });
    }

    const result = await conflictAnalyticsService.runAutonomousCycle(runOptions);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Conflict autonomy manual run failed');
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to run conflict autonomy cycle',
    });
  }
});

module.exports = router;
