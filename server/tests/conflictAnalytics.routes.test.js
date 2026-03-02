const express = require('express');

jest.mock('../db/queryBridge', () => jest.fn(async () => ({ data: [] })));
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
  optionalAuth: (req, _res, next) => next(),
  isAdminUser: (user) => user?.role === 'admin',
}));

jest.mock('../services/conflictAnalyticsService', () => ({
  isPublicAnalyticsExposureEnabled: jest.fn(),
  listForecasts: jest.fn(),
  listTheories: jest.fn(),
  getIntelGaps: jest.fn(),
  getSignals: jest.fn(),
  reconcileStaleRunningAgentRuns: jest.fn(),
}));

const conflictAnalyticsService = require('../services/conflictAnalyticsService');

const buildApp = () => {
  const routePath = require.resolve('../routes/conflictAnalytics');
  delete require.cache[routePath];
  // eslint-disable-next-line global-require
  const router = require('../routes/conflictAnalytics');
  const app = express();
  app.use(express.json());
  app.use('/api/conflicts', router);
  return app;
};

const startServer = (app) => new Promise((resolve) => {
  const server = app.listen(0, () => resolve(server));
});

describe('conflict analytics route flag gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTERNAL_API_KEY = 'test-internal-key';
  });

  afterEach(() => {
    delete process.env.INTERNAL_API_KEY;
  });

  test('GET /api/conflicts/forecasts returns empty for public when forecast flag is disabled', async () => {
    conflictAnalyticsService.isPublicAnalyticsExposureEnabled.mockResolvedValue(false);

    const app = buildApp();
    const server = await startServer(app);
    const url = `http://127.0.0.1:${server.address().port}/api/conflicts/forecasts?conflict=gaza-israel`;
    const response = await fetch(url);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      data: [],
      total: 0,
    });
    expect(conflictAnalyticsService.listForecasts).not.toHaveBeenCalled();
  });

  test('GET /api/conflicts/forecasts allows internal privileged request even when public flag is disabled', async () => {
    conflictAnalyticsService.isPublicAnalyticsExposureEnabled.mockResolvedValue(false);
    conflictAnalyticsService.listForecasts.mockResolvedValue([
      { id: 'f1', horizon_hours: 24, status: 'draft' },
    ]);

    const app = buildApp();
    const server = await startServer(app);
    const url = `http://127.0.0.1:${server.address().port}/api/conflicts/forecasts?conflict=gaza-israel&include_draft=true`;
    const response = await fetch(url, {
      headers: { 'x-internal-key': 'test-internal-key' },
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBe(1);
    expect(conflictAnalyticsService.listForecasts).toHaveBeenCalledTimes(1);
  });

  test('GET /api/conflicts/theories returns empty for public when theory flag is disabled', async () => {
    conflictAnalyticsService.isPublicAnalyticsExposureEnabled.mockResolvedValue(false);

    const app = buildApp();
    const server = await startServer(app);
    const url = `http://127.0.0.1:${server.address().port}/api/conflicts/theories?conflict=gaza-israel`;
    const response = await fetch(url);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      data: [],
      total: 0,
    });
    expect(conflictAnalyticsService.listTheories).not.toHaveBeenCalled();
  });

  test('GET /api/conflicts/theories allows internal privileged request even when theory flag is disabled', async () => {
    conflictAnalyticsService.isPublicAnalyticsExposureEnabled.mockResolvedValue(false);
    conflictAnalyticsService.listTheories.mockResolvedValue([
      { id: 't1', thesis: 'Sample', status: 'draft' },
    ]);

    const app = buildApp();
    const server = await startServer(app);
    const url = `http://127.0.0.1:${server.address().port}/api/conflicts/theories?conflict=gaza-israel&include_draft=true`;
    const response = await fetch(url, {
      headers: { 'x-internal-key': 'test-internal-key' },
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBe(1);
    expect(conflictAnalyticsService.listTheories).toHaveBeenCalledTimes(1);
  });

  test('POST /api/conflicts/autonomy/runs/reconcile passes bounded params to service', async () => {
    conflictAnalyticsService.reconcileStaleRunningAgentRuns.mockResolvedValue({
      scanned_running_runs: 8,
      stale_candidates: 2,
      reconciled_runs: 2,
      dry_run: false,
      reconciled_run_ids: ['run-1', 'run-2'],
      stale_after_ms: 1800000,
    });

    const app = buildApp();
    const server = await startServer(app);
    const url = `http://127.0.0.1:${server.address().port}/api/conflicts/autonomy/runs/reconcile`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': 'test-internal-key',
      },
      body: JSON.stringify({
        stale_after_minutes: 30,
        limit: 1000,
        dryRun: false,
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.reconciled_runs).toBe(2);
    expect(conflictAnalyticsService.reconcileStaleRunningAgentRuns).toHaveBeenCalledWith({
      dry_run: false,
      stale_after_minutes: 30,
      stale_after_ms: undefined,
      limit: 1000,
    });
  });

  test('GET /api/conflicts/intel-gaps returns gap payload', async () => {
    conflictAnalyticsService.getIntelGaps.mockResolvedValue({
      total_gaps: 1,
      items: [{ gap_type: 'hit_location_coverage_gap', signal: 'Rafah' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const url = `http://127.0.0.1:${server.address().port}/api/conflicts/intel-gaps?conflict=gaza-israel&days=14&min_signal_events=3`;
    const response = await fetch(url);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBe(1);
    expect(conflictAnalyticsService.getIntelGaps).toHaveBeenCalledWith(expect.objectContaining({
      conflict: 'gaza-israel',
      days: '14',
      min_signal_events: '3',
    }));
  });

  test('GET /api/conflicts/signals returns signal payload', async () => {
    conflictAnalyticsService.getSignals.mockResolvedValue({
      totals: { events: 4 },
      signals: {
        locations: [{ location: 'Rafah', hits: 3 }],
      },
    });

    const app = buildApp();
    const server = await startServer(app);
    const url = `http://127.0.0.1:${server.address().port}/api/conflicts/signals?conflict=gaza-israel&days=14`;
    const response = await fetch(url);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.totals.events).toBe(4);
    expect(conflictAnalyticsService.getSignals).toHaveBeenCalledWith(expect.objectContaining({
      conflict: 'gaza-israel',
      days: '14',
    }));
  });
});
