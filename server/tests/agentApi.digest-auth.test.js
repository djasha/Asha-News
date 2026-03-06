const express = require('express');

jest.mock('../db/queryBridge', () => jest.fn());
jest.mock('../db', () => ({
  getPool: jest.fn(),
  isUsingSupabase: jest.fn(),
}));
jest.mock('../middleware/authMiddleware', () => ({
  optionalAuth: (_req, _res, next) => next(),
  authenticateToken: (_req, _res, next) => next(),
}));

const queryBridge = require('../db/queryBridge');

const buildApp = () => {
  const routePath = require.resolve('../routes/agentApi');
  delete require.cache[routePath];
  // eslint-disable-next-line global-require
  const router = require('../routes/agentApi');
  const app = express();
  app.use(express.json());
  app.use('/api/v1', router);
  return app;
};

const startServer = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

describe('agentApi digest auth behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/v1/digest scope=personal rejects anonymous request before cluster fetch', async () => {
    queryBridge.mockRejectedValue(new Error('cluster backend unavailable'));

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/digest?scope=personal&limit=1`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'Authentication required for personal digest' });
    expect(queryBridge).not.toHaveBeenCalled();
  });

  test('GET /api/v1/digest scope=public returns empty digest when cluster backend is unavailable', async () => {
    queryBridge.mockRejectedValue(new Error('cluster backend unavailable'));

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/digest?scope=public&limit=3`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.scope).toBe('public');
    expect(payload.clusters).toEqual([]);
    expect(payload.digest_text).toContain('public digest (0 clusters)');
    expect(queryBridge).toHaveBeenCalledTimes(1);
    expect(queryBridge.mock.calls[0][0]).toBe('/items/story_clusters?filter[status][_eq]=active&sort=-created_at&limit=6');
  });
});
