const path = require('path');

// Require utils from project root scripts directory
const utilsPath = path.resolve(__dirname, '../../scripts/rss_utils.js');
// eslint-disable-next-line import/no-dynamic-require, global-require
const { normalizeUrl, hash, slugifyTag, dedupeByUrlHash } = require(utilsPath);

describe('rss_utils', () => {
  test('normalizeUrl removes tracking params and lowercases hostname', () => {
    const raw = 'HTTPS://Example.COM/article?id=123&utm_source=twitter&gclid=abc';
    const out = normalizeUrl(raw);
    expect(out).toMatch(/^https:\/\/example\.com\/article\?id=123$/);
  });

  test('hash returns stable base36 strings for same input', () => {
    const a1 = hash('sample');
    const a2 = hash('sample');
    const b = hash('other');
    expect(a1).toEqual(a2);
    expect(typeof a1).toBe('string');
    expect(a1).not.toEqual(b);
  });

  test('slugifyTag normalizes labels', () => {
    expect(slugifyTag('World News')).toBe('world-news');
    expect(slugifyTag('  Tech_AI  ')).toBe('tech-ai');
  });

  test('dedupeByUrlHash keeps a single item for duplicate URLs (tracking removed)', () => {
    const items = [
      { id: 'a1', url: 'https://news.com/a?utm_source=foo', url_hash: undefined },
      { id: 'a2', url: 'https://news.com/a?gclid=bar', url_hash: undefined },
      { id: 'b1', url: 'https://news.com/b', url_hash: undefined },
    ];
    const { uniqueItems } = dedupeByUrlHash(
      // pre-assign url_hash via normalize to simulate fetch_rss pipeline
      items.map(it => ({ ...it, url_hash: hash(normalizeUrl(it.url)) }))
    );
    const ids = uniqueItems.map(x => x.id).sort();
    expect(ids.length).toBe(2);
    // only one of a1/a2 remains
    expect(ids.includes('b1')).toBe(true);
    expect(ids.includes('a1') || ids.includes('a2')).toBe(true);
  });
});
