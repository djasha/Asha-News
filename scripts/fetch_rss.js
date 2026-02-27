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
const AggregatorService = require('./aggregatorService');
const { normalizeUrl, hash, slugifyTag } = require('./rss_utils');

const parser = new Parser({ timeout: 15000 });
const ROOT = path.resolve(__dirname, '..');
const SOURCES_PATH = path.join(__dirname, 'sources.json');
const OUTPUT_DIR = path.join(ROOT, 'public', 'data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'articles.json');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Initialize AI analyzer if any supported provider key is available (Groq preferred)
let biasAnalyzer = null;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ENABLE_AI_ANALYSIS = process.env.ENABLE_AI_ANALYSIS === 'true';

if (ENABLE_AI_ANALYSIS && (GROQ_API_KEY || OPENAI_API_KEY)) {
  try {
    // BiasAnalyzer checks GROQ_API_KEY internally and prefers Groq; OpenAI key passed for fallback
    biasAnalyzer = new BiasAnalyzer(OPENAI_API_KEY);
    console.log(GROQ_API_KEY ? 'AI bias analysis enabled (Groq)' : 'AI bias analysis enabled (OpenAI)');
  } catch (error) {
    console.warn('Failed to initialize AI analyzer:', error.message);
  }
} else {
  console.log('AI bias analysis disabled (set GROQ_API_KEY or OPENAI_API_KEY and ENABLE_AI_ANALYSIS=true to enable)');
}

async function loadSources() {
  // 1) Prefer FreshRSS subscriptions when configured
  try {
    const freshrss = new AggregatorService();
    if (freshrss.isConfigured) {
      const subs = await freshrss.getSubscriptions();
      const fromFresh = subs
        .filter(s => s.xmlUrl)
        .map(s => ({
          id: (s.id || s.title || s.xmlUrl).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: s.title || s.id || 'Untitled',
          bias: 'center',
          rss: s.xmlUrl,
          categories: Array.isArray(s.categories) ? s.categories : []
        }));
      if (fromFresh.length > 0) {
        console.log(`Loaded ${fromFresh.length} RSS sources from FreshRSS (Google Reader API)`);
        return fromFresh;
      }
      console.log('FreshRSS returned no subscriptions with xmlUrl; continuing to Directus...');
    }
  } catch (e) {
    console.warn('FreshRSS subscriptions load failed:', e.message);
  }

  // 2) Next try Directus CMS
  const directusUrl = process.env.DIRECTUS_URL;
  const directusToken = process.env.DIRECTUS_TOKEN;

  if (directusUrl && directusToken) {
    try {
      const normalizedUrl = directusUrl.replace(/\/$/, '');
      const response = await fetch(`${normalizedUrl}/items/RSS_Sources?filter[enabled][_eq]=true`, {
        headers: {
          'Authorization': `Bearer ${directusToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sources = (data.data || []).map(source => ({
          id: source.source_id || source.name.toLowerCase().replace(/\s+/g, '-'),
          name: source.name,
          bias: source.bias_rating || 'center',
          rss: source.rss_url
        }));

        if (sources.length > 0) {
          console.log(`Loaded ${sources.length} RSS sources from Directus CMS`);
          return sources;
        }
      }

      console.log('Directus sources not available, falling back to local sources.json');
    } catch (error) {
      console.warn('Failed to load sources from Directus:', error.message);
      console.log('Falling back to local sources.json');
    }
  } else {
    console.log('DIRECTUS_URL or DIRECTUS_TOKEN not set; using local sources.json');
  }

  // 3) Fallback to local sources.json
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

// helpers provided by rss_utils: hash, normalizeUrl, slugifyTag

function categorizeArticle(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  
  // Politics keywords
  if (text.match(/\b(politics|political|election|vote|congress|senate|president|government|policy|democrat|republican|biden|trump|campaign|legislation)\b/)) {
    return 'Politics';
  }
  
  // Technology keywords
  if (text.match(/\b(technology|tech|ai|artificial intelligence|software|hardware|startup|silicon valley|apple|google|microsoft|meta|tesla|crypto|blockchain)\b/)) {
    return 'Technology';
  }
  
  // Business keywords
  if (text.match(/\b(business|economy|economic|finance|financial|stock|market|trade|company|corporate|earnings|revenue|investment|banking)\b/)) {
    return 'Business';
  }
  
  // Health keywords
  if (text.match(/\b(health|medical|medicine|hospital|doctor|disease|covid|pandemic|vaccine|healthcare|pharmaceutical|fda)\b/)) {
    return 'Health';
  }
  
  // Science keywords
  if (text.match(/\b(science|research|study|climate|environment|space|nasa|discovery|breakthrough|experiment|scientific)\b/)) {
    return 'Science';
  }
  
  // Sports keywords
  if (text.match(/\b(sports|football|basketball|baseball|soccer|olympics|nfl|nba|mlb|fifa|championship|tournament|athlete)\b/)) {
    return 'Sports';
  }
  
  // Entertainment keywords
  if (text.match(/\b(entertainment|celebrity|movie|film|tv|television|music|hollywood|netflix|disney|streaming|concert)\b/)) {
    return 'Entertainment';
  }
  
  // International keywords
  if (text.match(/\b(international|world|global|china|russia|europe|ukraine|israel|gaza|palestine|nato|un|united nations)\b/)) {
    return 'International';
  }
  
  return 'General';
}

function determineSection(title, summary, pubDate) {
  const text = `${title} ${summary}`.toLowerCase();
  const articleDate = new Date(pubDate);
  const now = new Date();
  const hoursDiff = (now - articleDate) / (1000 * 60 * 60);
  
  // Breaking news - recent articles with urgent keywords
  if (hoursDiff < 2 && text.match(/\b(breaking|urgent|alert|just in|developing|live|emergency|crisis)\b/)) {
    return 'breaking';
  }
  
  // Local news keywords
  if (text.match(/\b(local|city|county|mayor|school district|community|neighborhood|town|municipal)\b/)) {
    return 'local';
  }
  
  return 'featured';
}

function extractImage(item) {
  // Try multiple RSS image fields
  let imageUrl = item.enclosure?.url || 
                 item['media:content']?.url || 
                 item['media:thumbnail']?.url || 
                 item.image?.url || 
                 item.image ||
                 item['itunes:image']?.href;
  
  // Also try to extract from content
  if (!imageUrl && item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }
  
  // Validate image URL
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = null;
  }
  
  return imageUrl;
}

async function fetchFeed(source) {
  try {
    const feed = await parser.parseURL(source.rss);
    const items = [];
    
    for (const item of feed.items || []) {
      const linkRaw = item.link || item.guid || '';
      const link = normalizeUrl(linkRaw);
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
      
      // Categorize article based on title and content
      const topic = categorizeArticle(title, summary);
      const section = determineSection(title, summary, pubDate);
      const urlHash = hash(link || idSeed);

      // Tags/Topic mapping from FreshRSS categories (if provided on source)
      const tags = Array.isArray(source.categories) ? Array.from(new Set(source.categories.map(c => c?.label || c?.id || c).filter(Boolean))) : [];
      const topicCategories = tags.map(slugifyTag).filter(Boolean);

      const article = {
        id: `${source.id}-${hash(idSeed)}`,
        title,
        summary,
        url: link,
        publication_date: toISODate(pubDate),
        source_id: source.id,
        source_name: source.name,
        political_bias: source.bias, // Original source bias
        topic: topic,
        section: section,
        author: item.creator || item.author || source.name,
        image_url: extractImage(item),
        factual_quality: 0.8,
        confidence_score: 0.8,
        ai_analysis: aiAnalysis, // Add AI analysis results
        url_hash: urlHash,
        tags,
        topic_categories: topicCategories
      };
      
      // Push; global dedupe is handled in main()
      items.push(article);
    }
    
    return { source, items };
  } catch (err) {
    console.warn(`WARN: Failed to fetch ${source.name} (${source.id}): ${err.message}`);
    return { source, items: [] };
  }
}

async function main() {
  const startTime = Date.now();
  console.log('Starting RSS feed fetch...');
  
  const allArticles = [];
  const articlesWithoutImages = [];
  const seenHashes = new Set();
  
  const sources = await loadSources();
  // Concurrency limit 5
  const concurrency = 5;
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(src => {
      console.log(`Fetching ${src.name}...`);
      return fetchFeed(src);
    }));

    for (const result of results) {
      if (!result || !result.items) continue;
      // Deduplicate by url_hash
      const uniqueItems = [];
      for (const art of result.items) {
        const uhash = art.url_hash || hash(art.url || art.id || '');
        if (uhash && !seenHashes.has(uhash)) {
          seenHashes.add(uhash);
          uniqueItems.push(art);
        }
      }
      allArticles.push(...uniqueItems);

      // Track articles without images
      const noImageArticles = uniqueItems.filter(article => !article.image_url);
      articlesWithoutImages.push(...noImageArticles);

      console.log(`  -> ${uniqueItems.length} unique articles (${uniqueItems.filter(a => a.ai_analysis).length} with AI analysis, ${noImageArticles.length} without images)`);
    }
  }
  
  // Sort articles by date (newest first)
  allArticles.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));
  
  // Log category breakdown
  const categoryBreakdown = {};
  allArticles.forEach(article => {
    categoryBreakdown[article.topic] = (categoryBreakdown[article.topic] || 0) + 1;
  });
  
  console.log(`Saved ${allArticles.length} articles to public/data/articles.json in ${((Date.now() - startTime) / 1000).toFixed(3)}s`);
  console.log(`${articlesWithoutImages.length} articles without images`);
  console.log('Category breakdown:', categoryBreakdown);
  console.log(`Breaking news articles: ${allArticles.filter(a => a.section === 'breaking').length}`);
  
  // Save to JSON file
  const output = {
    fetched_at: new Date().toISOString(),
    count: allArticles.length,
    articles: allArticles,
    categories: categoryBreakdown,
    breaking_news: allArticles.filter(a => a.section === 'breaking'),
    articles_without_images: articlesWithoutImages.map(a => ({
      id: a.id,
      title: a.title,
      source: a.source_name,
      url: a.url
    }))
  };
  // Ensure output dir exists and write file
  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  
  // Generate sitemap
  try {
    const { generateSitemap } = require('./generate_sitemap');
    generateSitemap(allArticles);
  } catch (error) {
    console.warn('Failed to generate sitemap:', error.message);
  }
}

main().catch((e) => {
  console.error('Fatal error in RSS fetcher:', e);
  process.exit(1);
});
