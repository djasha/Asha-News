const StoryClusteringService = require('../services/storyClusteringService');

function makeArticle(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: overrides.title || 'Sample Title',
    summary: overrides.summary || 'Sample summary',
    content: overrides.content || 'Sample content',
    published_at: overrides.published_at || new Date().toISOString(),
    source_name: overrides.source_name || 'TestSource',
    ...overrides,
  };
}

describe('StoryClusteringService guards and filters', () => {
  let svc;
  beforeEach(() => {
    svc = new StoryClusteringService();
  });

  test('isArticleAllowedByTopic respects allowed topics and aliases', () => {
    const cs = {
      allowedTopics: ['United States', 'Gaza'],
      topicAliases: { USA: 'United States', 'U.S.': 'United States' },
      topicMatchStrategy: 'keywords',
    };

    const a1 = makeArticle({ title: 'Protests in the USA over new policy' });
    const a2 = makeArticle({ title: 'Cultural festival in Europe' });

    expect(svc.isArticleAllowedByTopic(a1, cs)).toBe(true);
    expect(svc.isArticleAllowedByTopic(a2, cs)).toBe(false);
  });

  test('isLikelyEvent detects event-like headlines', () => {
    const a1 = makeArticle({ title: 'Ceasefire announced after intense clashes' });
    const a2 = makeArticle({ title: 'Weekly opinion column: reflections on policy' });

    expect(svc.isLikelyEvent(a1)).toBe(true);
    expect(svc.isLikelyEvent(a2)).toBe(false);
  });

  test('filterByTimeSpan prunes old articles beyond window', () => {
    const newest = new Date('2025-10-10T12:00:00Z');
    const within = new Date('2025-10-05T12:00:00Z');
    const old = new Date('2025-09-20T12:00:00Z');

    const articles = [
      makeArticle({ id: 'n', published_at: newest.toISOString() }),
      makeArticle({ id: 'w', published_at: within.toISOString() }),
      makeArticle({ id: 'o', published_at: old.toISOString() }),
    ];

    const kept = svc.filterByTimeSpan(articles, 14);
    const ids = kept.map(a => a.id);
    expect(ids).toContain('n');
    expect(ids).toContain('w');
    expect(ids).not.toContain('o');
  });

  test('applyGuardsToCluster prunes by coherence when shadow-mode is off', async () => {
    const a1 = makeArticle({ id: 'a1', title: 'Event in Gaza', content: 'Gaza conflict escalates' });
    const a2 = makeArticle({ id: 'a2', title: 'Sports results', content: 'Local team wins championship' });

    // Stub embeddings: a1 near centroid, a2 far
    // Vectors chosen so cosine(a1, centroid) > threshold, cosine(a2, centroid) < threshold
    const embMap = {
      a1: Array(8).fill(0).map((_, i) => (i === 0 ? 1 : 0)),
      a2: Array(8).fill(0).map((_, i) => (i === 1 ? 1 : 0)),
    };
    svc.generateEmbedding = jest.fn(async (article) => embMap[article.id]);

    const cluster = { id: 'c1', articles: [a1, a2] };
    const cs = {
      allowedTopics: ['Gaza'],
      topicAliases: {},
      topicMatchStrategy: 'keywords',
      eventOnlyEnabled: false,
      maxTimeSpanDays: 30,
      coherenceGuardEnabled: true,
      coherenceGuardShadowMode: false,
      coherenceMinScore: 0.8,
    };

    const pruned = await svc.applyGuardsToCluster(cluster, { settings: cs });
    expect(pruned).toBeTruthy();
    const ids = pruned.articles.map(a => a.id);
    expect(ids).toContain('a1');
    expect(ids).not.toContain('a2');
  });
});
