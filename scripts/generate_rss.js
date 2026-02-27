/*
  RSS Feed Generator for Asha.News
  - Builds public/rss.xml from public/data/articles.json
  - Uses RSS 2.0 format
*/

const fs = require('fs');
const path = require('path');

const ARTICLES_PATH = path.join(__dirname, '..', 'public', 'data', 'articles.json');
const RSS_PATH = path.join(__dirname, '..', 'public', 'rss.xml');
const SITE_URL = process.env.SITE_URL || 'https://asha.news';

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRssItem(article) {
  const link = `${SITE_URL}/article/${article.id}`;
  const pubDate = new Date(article.publication_date || Date.now()).toUTCString();
  const source = escapeXml(article.source_name || '');

  return `  <item>
    <title><![CDATA[${article.title || 'Untitled'}]]></title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${article.summary || ''}]]></description>
    ${article.image_url ? `<enclosure url="${escapeXml(article.image_url)}" type="image/jpeg"/>` : ''}
    ${source ? `<category>${source}</category>` : ''}
  </item>`;
}

function generateRss() {
  try {
    const raw = fs.readFileSync(ARTICLES_PATH, 'utf8');
    const data = JSON.parse(raw);
    const articles = Array.isArray(data.articles) ? data.articles : [];

    // Deduplicate by ID and sort by publication_date desc
    const map = new Map();
    for (const a of articles) {
      if (a && a.id && !map.has(a.id)) map.set(a.id, a);
    }
    const unique = Array.from(map.values())
      .sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date))
      .slice(0, 100); // limit feed to 100 most recent

    const channelTitle = 'Asha.News';
    const channelLink = SITE_URL;
    const channelDesc = 'AI-powered news analysis, bias detection, and story clustering.';
    const lastBuildDate = new Date().toUTCString();

    const itemsXml = unique.map(buildRssItem).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(channelTitle)}</title>
  <link>${channelLink}</link>
  <description>${escapeXml(channelDesc)}</description>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <ttl>30</ttl>
${itemsXml}
</channel>
</rss>`;

    fs.writeFileSync(RSS_PATH, rss);
    console.log(`Generated RSS with ${unique.length} items at ${RSS_PATH}`);
  } catch (err) {
    console.error('Failed to generate RSS:', err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  generateRss();
}

module.exports = { generateRss };
