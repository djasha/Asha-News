import fs from 'fs';
import path from 'path';

describe('Sitemap contents', () => {
  test('includes core static and RSS routes', () => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    const xml = fs.readFileSync(sitemapPath, 'utf8');

    // Core static routes
    expect(xml).toContain('/about');
    expect(xml).toContain('/features');
    expect(xml).toContain('/contact');
    expect(xml).toContain('/api');
    expect(xml).toContain('/privacy');
    expect(xml).toContain('/terms');
    expect(xml).toContain('/cookies');
    expect(xml).toContain('/gdpr');

    // Subscription and RSS
    expect(xml).toContain('/subscription');
    expect(xml).toContain('/subscribe');
    expect(xml).toContain('/rss');
    expect(xml).toContain('/rss.xml');
  });
});
