/*
  RSS Fetcher for Asha.News
  - Reads sources from scripts/sources.json
  - Fetches and parses RSS feeds using rss-parser
  - Normalizes fields: id, title, summary, url, publication_date, source_id, source_name, political_bias
  - Outputs to public/data/articles.json
*/

const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const BiasAnalyzer = require('./bias_analyzer');

const parser = new Parser({ timeout: 15000 });
const ROOT = path.resolve(__dirname, '..');
const SOURCES_PATH = path.join(__dirname, 'sources.json');
const OUTPUT_DIR = path.join(ROOT, 'public', 'data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'articles.json');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Initialize AI analyzer if API key is available
let biasAnalyzer = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ENABLE_AI_ANALYSIS = process.env.ENABLE_AI_ANALYSIS === 'true';

if (OPENAI_API_KEY && ENABLE_AI_ANALYSIS) {
  try {
    biasAnalyzer = new BiasAnalyzer(OPENAI_API_KEY);
    console.log('AI bias analysis enabled');
  } catch (error) {
    console.warn('Failed to initialize AI analyzer:', error.message);
  }
} else {
  console.log('AI bias analysis disabled (set OPENAI_API_KEY and ENABLE_AI_ANALYSIS=true to enable)');
}

async function loadSources() {
  const raw = fs.readFileSync(SOURCES_PATH, 'utf8');
  return JSON.parse(raw);
}

function sanitizeText(text) {
  if (!text) return '';
  // Remove HTML tags and trim
  return String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toISODate(dateLike) {
  try {
    const d = new Date(dateLike);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function hash(str) {
  // Simple hash for id generation (non-crypto)
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function extractImage(item) {
  // Try multiple RSS image fields
  let imageUrl = item.enclosure?.url || 
                 item['media:content']?.url || 
                 item['media:thumbnail']?.url || 
                 item.image?.url || 
                 item.image ||
                 item['itunes:image']?.href;
  
  // If no image found, use a placeholder based on topic/source
  if (!imageUrl) {
    const placeholders = [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2', 
      'https://picsum.photos/400/300?random=3',
      'https://picsum.photos/400/300?random=4',
      'https://picsum.photos/400/300?random=5'
    ];
    imageUrl = placeholders[Math.floor(Math.random() * placeholders.length)];
  }
  
  return imageUrl;
}

async function fetchFeed(source) {
  try {
    const feed = await parser.parseURL(source.rss);
    const items = [];
    
    for (const item of feed.items || []) {
      const link = item.link || item.guid || '';
      const title = sanitizeText(item.title);
      const summary = sanitizeText(item.contentSnippet || item.content || item.summary || '');
      const pubDate = item.isoDate || item.pubDate || item.published || item.updated || new Date().toISOString();
      const idSeed = `${source.id}|${link}|${title}`;
      
      // Get AI bias analysis if available
      let aiAnalysis = null;
      if (biasAnalyzer && title && title.length > 10) {
        try {
          aiAnalysis = await biasAnalyzer.analyzeArticle(title, summary, source.id);
          await sleep(100); // Rate limiting for OpenAI API
        } catch (error) {
          console.warn(`AI analysis failed for "${title.substring(0, 50)}...": ${error.message}`);
        }
      }
      
      const article = {
        id: `${source.id}-${hash(idSeed)}`,
        title,
        summary,
        url: link,
        publication_date: toISODate(pubDate),
        source_id: source.id,
        source_name: source.name,
        political_bias: source.bias, // Original source bias
        topic: 'General',
        section: 'featured',
        author: item.creator || item.author || source.name,
        image_url: extractImage(item),
        factual_quality: 0.8,
        confidence_score: 0.8,
        ai_analysis: aiAnalysis // Add AI analysis results
      };
      
      items.push(article);
    }
    
    return { source, items };
  } catch (err) {
    console.warn(`WARN: Failed to fetch ${source.name} (${source.id}): ${err.message}`);
    return { source, items: [] };
  }
}

async function main() {
  const started = Date.now();
  console.log('Asha.News RSS fetcher starting...');
  const sources = await loadSources();
  const results = [];

  // fetch sequentially with small delay to be polite
  for (const s of sources) {
    console.log(`Fetching ${s.name}...`);
    const { items } = await fetchFeed(s);
    results.push(...items);
    console.log(`  -> ${items.length} articles (${items.filter(a => a.ai_analysis).length} with AI analysis)`);
    await sleep(400);
  }

  // Sort by publication_date desc
  results.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));

  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ fetched_at: new Date().toISOString(), count: results.length, articles: results }, null, 2));
  console.log(`Saved ${results.length} articles to ${path.relative(ROOT, OUTPUT_PATH)} in ${(Date.now() - started) / 1000}s`);
  
  // Generate sitemap after fetching articles
  try {
    const { generateSitemap } = require('./generate_sitemap');
    generateSitemap();
  } catch (error) {
    console.warn('Failed to generate sitemap:', error.message);
  }
}

main().catch((e) => {
  console.error('Fatal error in RSS fetcher:', e);
  process.exit(1);
});
