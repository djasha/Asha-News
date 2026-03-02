const express = require('express');

jest.mock('../services/conflictAnalyticsService', () => ({
  getMonitorLayers: jest.fn(),
  getMonitorNewsDigest: jest.fn(),
  getMonitorSignalsFusion: jest.fn(),
  getMonitorFreshness: jest.fn(),
  getMonitorIntelBrief: jest.fn(),
}));

const conflictAnalyticsService = require('../services/conflictAnalyticsService');

const buildApp = () => {
  const routePath = require.resolve('../routes/monitorOps');
  delete require.cache[routePath];
  // eslint-disable-next-line global-require
  const router = require('../routes/monitorOps');
  const app = express();
  app.use('/api/monitor', router);
  return app;
};

const startServer = (app) => new Promise((resolve) => {
  const server = app.listen(0, () => resolve(server));
});

describe('monitor ops routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/monitor/layers returns layer payload', async () => {
    conflictAnalyticsService.getMonitorLayers.mockResolvedValue({
      layers: { event_points: [{ id: 'evt-1' }] },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/monitor/layers?conflict=gaza-israel`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.layers.event_points).toHaveLength(1);
    expect(conflictAnalyticsService.getMonitorLayers).toHaveBeenCalledWith(expect.objectContaining({
      conflict: 'gaza-israel',
    }));
  });

  test('GET /api/monitor/signals/fusion returns fusion payload', async () => {
    conflictAnalyticsService.getMonitorSignalsFusion.mockResolvedValue({
      fusion_score: 0.62,
      confidence_label: 'moderate',
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/monitor/signals/fusion?conflict=gaza-israel`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.fusion_score).toBe(0.62);
    expect(conflictAnalyticsService.getMonitorSignalsFusion).toHaveBeenCalledWith(expect.objectContaining({
      conflict: 'gaza-israel',
    }));
  });

  test('GET /api/monitor/intel/brief returns brief payload', async () => {
    conflictAnalyticsService.getMonitorIntelBrief.mockResolvedValue({
      non_deterministic_label: 'Analyst brief is probabilistic and non-deterministic.',
      key_findings: ['Sample finding'],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/monitor/intel/brief?conflict=gaza-israel`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.key_findings).toHaveLength(1);
    expect(conflictAnalyticsService.getMonitorIntelBrief).toHaveBeenCalledWith(expect.objectContaining({
      conflict: 'gaza-israel',
    }));
  });
});
