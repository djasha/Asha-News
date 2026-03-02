import { applyUnifiedFilters, timeframeToMs } from '../utils/feedFilters';

describe('feedFilters', () => {
  const now = Date.now();
  const sample = [
    {
      id: 1,
      title: 'Bitcoin moves higher',
      source: 'Reuters',
      bias: 'center',
      category: 'markets',
      content_type: 'article',
      published_at: new Date(now - (2 * 60 * 60 * 1000)).toISOString(),
    },
    {
      id: 2,
      title: 'Oil retreats on demand outlook',
      source: 'Bloomberg',
      bias: 'center',
      category: 'markets',
      content_type: 'article',
      published_at: new Date(now - (40 * 60 * 60 * 1000)).toISOString(),
    },
  ];

  it('maps timeframe values correctly', () => {
    expect(timeframeToMs('24h')).toBe(24 * 60 * 60 * 1000);
    expect(timeframeToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    expect(timeframeToMs('unknown')).toBeNull();
  });

  it('filters by topic/source/timeframe', () => {
    const result = applyUnifiedFilters(sample, {
      topic: 'bitcoin',
      source: 'reuters',
      timeframe: '24h',
      bias: 'all',
      contentType: 'all',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('filters by content type when specified', () => {
    const result = applyUnifiedFilters(sample, {
      contentType: 'video',
      timeframe: '',
      topic: '',
      source: '',
      bias: 'all',
    });
    expect(result).toHaveLength(0);
  });
});

