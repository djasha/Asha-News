const express = require('express');

const mockGetRSSSources = jest.fn();
const mockGetRSSSourceById = jest.fn();
const mockCreateRSSSource = jest.fn();
const mockUpdateRSSSource = jest.fn();
const mockDeleteRSSSource = jest.fn();
const mockParseURL = jest.fn();

jest.mock('../services/contentRepository', () => ({
  getRSSSources: (...args) => mockGetRSSSources(...args),
  getRSSSourceById: (...args) => mockGetRSSSourceById(...args),
  createRSSSource: (...args) => mockCreateRSSSource(...args),
  updateRSSSource: (...args) => mockUpdateRSSSource(...args),
  deleteRSSSource: (...args) => mockDeleteRSSSource(...args),
}));

jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
}));

jest.mock('rss-parser', () => jest.fn().mockImplementation(() => ({
  parseURL: (...args) => mockParseURL(...args),
})));

const buildApp = () => {
  const routePath = require.resolve('../routes/rssSources');
  delete require.cache[routePath];
  // eslint-disable-next-line global-require
  const router = require('../routes/rssSources');
  const app = express();
  app.use(express.json());
  app.use('/api/rss', router);
  return app;
};

const startServer = (app) => new Promise((resolve) => {
  const server = app.listen(0, () => resolve(server));
});

describe('rssSources route compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/rss/sources accepts `url` and strips unknown fields', async () => {
    mockCreateRSSSource.mockResolvedValue({
      id: 'source-1',
      name: 'BBC News',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      enabled: true,
      category: 'general',
      political_bias: 'center',
      description: '',
      status: 'active',
      sort: 0,
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rss/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'BBC News',
        url: 'http://feeds.bbci.co.uk/news/rss.xml',
        category: 'general',
        credibility_score: 9,
        region: 'uk',
        fetch_frequency: 30,
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(mockCreateRSSSource).toHaveBeenCalledTimes(1);
    const createdArg = mockCreateRSSSource.mock.calls[0][0];
    expect(createdArg).toMatchObject({
      name: 'BBC News',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      category: 'general',
      political_bias: 'center',
      enabled: true,
      status: 'active',
      sort: 0,
    });
    expect(createdArg).not.toHaveProperty('credibility_score');
    expect(createdArg).not.toHaveProperty('region');
    expect(createdArg).not.toHaveProperty('fetch_frequency');
    expect(createdArg).not.toHaveProperty('rss_url');
  });

  test('POST /api/rss/test accepts url alias (not only rss_url)', async () => {
    mockParseURL.mockResolvedValue({
      title: 'BBC News',
      description: 'Feed',
      items: [{ title: 'One', link: 'https://example.com/1', pubDate: '2026-03-02T00:00:00Z' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rss/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'http://feeds.bbci.co.uk/news/rss.xml',
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.articleCount).toBe(1);
    expect(mockParseURL).toHaveBeenCalledWith('http://feeds.bbci.co.uk/news/rss.xml');
  });

  test('POST /api/rss/sources/:id/fetch works with source.url', async () => {
    mockGetRSSSourceById.mockResolvedValue({
      id: 'source-1',
      name: 'BBC News',
      enabled: true,
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
    });
    mockParseURL.mockResolvedValue({ items: [{}, {}] });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rss/sources/source-1/fetch`, {
      method: 'POST',
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.articleCount).toBe(2);
    expect(payload.source).toEqual({
      id: 'source-1',
      name: 'BBC News',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      rss_url: 'http://feeds.bbci.co.uk/news/rss.xml',
    });
  });
});
