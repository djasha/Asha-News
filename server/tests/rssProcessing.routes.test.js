const express = require('express');

const mockProcessAllFeeds = jest.fn();
const mockProcessSingleFeed = jest.fn();
const mockGetProcessingStats = jest.fn(() => ({ running: false }));
const mockClearCache = jest.fn(() => ({ cleared: true }));

const mockGetItems = jest.fn();
const mockGetRSSSources = jest.fn();
const mockUpsertArticleBySourceUrl = jest.fn();

jest.mock('../services/rssProcessingService', () => jest.fn().mockImplementation(() => ({
  processAllFeeds: (...args) => mockProcessAllFeeds(...args),
  processSingleFeed: (...args) => mockProcessSingleFeed(...args),
  getProcessingStats: (...args) => mockGetProcessingStats(...args),
  clearCache: (...args) => mockClearCache(...args),
})));

jest.mock('../services/contentRepository', () => ({
  getItems: (...args) => mockGetItems(...args),
  getRSSSources: (...args) => mockGetRSSSources(...args),
  upsertArticleBySourceUrl: (...args) => mockUpsertArticleBySourceUrl(...args),
}));

jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
}));

const buildApp = () => {
  const routePath = require.resolve('../routes/rssProcessing');
  delete require.cache[routePath];
  // eslint-disable-next-line global-require
  const router = require('../routes/rssProcessing');
  const app = express();
  app.use(express.json());
  app.use('/api/rss-processing', router);
  return app;
};

const startServer = (app) => new Promise((resolve) => {
  const server = app.listen(0, () => resolve(server));
});

describe('rssProcessing route compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/rss-processing/process-feeds normalizes source url alias', async () => {
    mockProcessAllFeeds.mockResolvedValue({
      processed_feeds: 1,
      new_articles: 0,
      updated_articles: 0,
      articles: [],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rss-processing/process-feeds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rss_sources: [
          { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', enabled: true },
        ],
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockProcessAllFeeds).toHaveBeenCalledTimes(1);
    const sourcesArg = mockProcessAllFeeds.mock.calls[0][0];
    expect(sourcesArg[0]).toMatchObject({
      name: 'BBC News',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      rss_url: 'http://feeds.bbci.co.uk/news/rss.xml',
    });
  });

  test('POST /api/rss-processing/process-single-feed accepts source.url', async () => {
    mockProcessSingleFeed.mockResolvedValue({
      source_name: 'BBC News',
      new_articles: 1,
      updated_articles: 0,
      articles: [],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rss-processing/process-single-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', enabled: true },
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockProcessSingleFeed).toHaveBeenCalledTimes(1);
    expect(mockProcessSingleFeed.mock.calls[0][0]).toMatchObject({
      name: 'BBC News',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      rss_url: 'http://feeds.bbci.co.uk/news/rss.xml',
    });
  });

  test('POST /api/rss-processing/process-from-cms supports repository sources with url only', async () => {
    mockGetRSSSources.mockResolvedValue([
      { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', enabled: true },
    ]);
    mockProcessAllFeeds.mockResolvedValue({
      processed_feeds: 1,
      new_articles: 1,
      updated_articles: 0,
      articles: [{ title: 'sample' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rss-processing/process-from-cms`, {
      method: 'POST',
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.sources_processed).toBe(1);
    expect(mockProcessAllFeeds).toHaveBeenCalledTimes(1);
    expect(mockProcessAllFeeds.mock.calls[0][0][0]).toMatchObject({
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      rss_url: 'http://feeds.bbci.co.uk/news/rss.xml',
    });
  });

  test('POST /api/rss-processing/ingest-from-content upserts articles from url-only content sources', async () => {
    mockGetItems.mockResolvedValue([
      { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', enabled: true, category: 'world' },
    ]);
    mockProcessAllFeeds.mockResolvedValue({
      processed_feeds: 1,
      new_articles: 1,
      updated_articles: 0,
      articles: [
        {
          title: 'Sample conflict article',
          summary: 'summary',
          content: 'content',
          source_url: 'https://example.com/story-1',
          source_name: 'BBC News',
          category: 'world',
          published_at: new Date().toISOString(),
        },
      ],
    });
    mockUpsertArticleBySourceUrl.mockResolvedValue({ id: 'article-1' });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rss-processing/ingest-from-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min_per_category: 1, max_feeds: 1, hours_back: 72 }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.processed_feeds).toBe(1);
    expect(mockUpsertArticleBySourceUrl).toHaveBeenCalledTimes(1);
  });
});
