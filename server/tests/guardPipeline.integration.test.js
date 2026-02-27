const StoryClusteringService = require('../services/storyClusteringService');

function art(id, title, opts = {}) {
  return {
    id,
    title,
    summary: opts.summary || '',
    content: opts.content || '',
    published_at: opts.published_at || new Date().toISOString(),
    source_name: 'Test',
  };
}

describe('Guard pipeline integration (topics + event + time + coherence)', () => {
  let svc;

  beforeEach(() => {
    svc = new StoryClusteringService();
  });

  test('filters non-topic, non-event, old, and incoherent articles', async () => {
    const now = new Date('2025-10-11T10:00:00Z');
    const recent = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString();
    const old = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

    const aTopicEventGood = art('a1', 'Gaza ceasefire announced', { content: 'Ceasefire in Gaza announced by officials', published_at: recent });
    const aOffTopic = art('a2', 'Local sports team wins', { content: 'Sports update', published_at: recent });
    const aOld = art('a3', 'Gaza clashes reported', { content: 'Clashes in Gaza region', published_at: old });
    const aIncoherent = art('a4', 'Gaza update', { content: 'Unrelated vector', published_at: recent });

    // Stub embeddings to make aIncoherent drop by coherence
    const emb = {
      a1: [1, 0, 0, 0],
      a4: [0, 1, 0, 0],
    };
    svc.generateEmbedding = jest.fn(async (article) => emb[article.id] || [1, 0, 0, 0]);

    const cluster = { id: 'cX', articles: [aTopicEventGood, aOffTopic, aOld, aIncoherent] };

    const settings = {
      allowedTopics: ['Gaza'],
      topicAliases: {},
      topicMatchStrategy: 'keywords',
      eventOnlyEnabled: true,
      maxTimeSpanDays: 14,
      coherenceGuardEnabled: true,
      coherenceGuardShadowMode: false,
      coherenceMinScore: 0.8,
    };

    const pruned = await svc.applyGuardsToCluster(cluster, { settings });
    expect(pruned).toBeTruthy();
    const ids = pruned.articles.map(a => a.id);
    expect(ids).toEqual(['a1']);
  });
});
