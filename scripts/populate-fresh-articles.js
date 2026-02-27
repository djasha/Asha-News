/**
 * Populate Fresh Articles Script
 * Fetches latest articles from RSS feeds and populates Directus with proper topics
 */

const Parser = require('rss-parser');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AshaNews/1.0; +https://asha.news)'
  }
});

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

// Topic/Category mapping
const CATEGORY_TO_TOPIC = {
  'general': 'World News',
  'politics': 'Politics',
  'business': 'Business',
  'technology': 'Technology',
  'health': 'Health',
  'sports': 'Sports',
  'entertainment': 'Entertainment',
  'science': 'Science',
  'local': 'Local News'
};

// RSS Sources (curated balanced selection)
const RSS_SOURCES = [
  // Left-leaning
  { id: 'cnn', name: 'CNN', bias: 'left', rss: 'http://rss.cnn.com/rss/edition.rss', category: 'general', credibility: 7 },
  { id: 'guardian', name: 'The Guardian', bias: 'left', rss: 'https://www.theguardian.com/world/rss', category: 'general', credibility: 8 },
  { id: 'nytimes', name: 'New York Times', bias: 'left', rss: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'general', credibility: 9 },
  { id: 'politico', name: 'Politico', bias: 'left', rss: 'https://www.politico.com/rss/politicopicks.xml', category: 'politics', credibility: 7 },
  
  // Center
  { id: 'reuters', name: 'Reuters', bias: 'center', rss: 'http://feeds.reuters.com/reuters/topNews', category: 'general', credibility: 9 },
  { id: 'ap', name: 'AP News', bias: 'center', rss: 'https://feeds.apnews.com/ApNews/World', category: 'general', credibility: 9 },
  { id: 'bbc', name: 'BBC News', bias: 'center', rss: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'general', credibility: 8 },
  { id: 'npr', name: 'NPR', bias: 'center', rss: 'https://feeds.npr.org/1001/rss.xml', category: 'general', credibility: 8 },
  { id: 'aljazeera', name: 'Al Jazeera', bias: 'center', rss: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'general', credibility: 7 },
  { id: 'bloomberg', name: 'Bloomberg', bias: 'center', rss: 'https://feeds.bloomberg.com/politics/news.rss', category: 'business', credibility: 8 },
  { id: 'techcrunch', name: 'TechCrunch', bias: 'center', rss: 'http://feeds.feedburner.com/TechCrunch', category: 'technology', credibility: 7 },
  
  // Right-leaning
  { id: 'fox', name: 'Fox News', bias: 'right', rss: 'https://moxie.foxnews.com/google-publisher/latest.xml', category: 'general', credibility: 5 },
  { id: 'wsj', name: 'Wall Street Journal', bias: 'right', rss: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'business', credibility: 8 },
  { id: 'national-review', name: 'National Review', bias: 'right', rss: 'https://www.nationalreview.com/feed/', category: 'politics', credibility: 6 },
  { id: 'reason', name: 'Reason', bias: 'right', rss: 'https://reason.com/feed/', category: 'politics', credibility: 7 }
];

// Generate content hash for deduplication
function generateContentHash(content) {
  return crypto.createHash('md5').update(content || '').digest('hex');
}

// Fetch articles from RSS feed
async function fetchRSSArticles(source) {
  try {
    console.log(`📥 Fetching from ${source.name} (${source.bias})...`);
    const feed = await parser.parseURL(source.rss);
    
    const articles = feed.items.slice(0, 10).map(item => {
      const contentHash = generateContentHash(item.link + item.title);
      const topic = CATEGORY_TO_TOPIC[source.category] || 'General';
      
      return {
        title: item.title?.substring(0, 500) || 'Untitled',
        summary: (item.contentSnippet || item.content || item.description || '')
          .replace(/<[^>]*>/g, '')
          .substring(0, 1000),
        content: item.content || item.description || item.contentSnippet || '',
        url: item.link,
        source_name: source.name,
        source_url: source.rss,
        author_name: item.creator || item.author || source.name,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        image_url: item.enclosure?.url || item.mediaGroup?.['media:thumbnail']?.[0]?.$ ||null,
        category: source.category,
        topic: topic,
        political_bias: source.bias,
        bias_score: source.bias === 'left' ? 0.3 : source.bias === 'right' ? 0.7 : 0.5,
        credibility_score: source.credibility / 10,
        content_hash: contentHash,
        status: 'published',
        featured: false,
        breaking: false
      };
    });
    
    console.log(`  ✓ Fetched ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`  ✗ Error fetching from ${source.name}:`, error.message);
    return [];
  }
}

// Check if article already exists in Directus
async function articleExists(contentHash) {
  try {
    const response = await axios.get(
      `${DIRECTUS_URL}/items/articles?filter[content_hash][_eq]=${contentHash}&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
      }
    );
    return response.data.data && response.data.data.length > 0;
  } catch (error) {
    return false;
  }
}

// Create article in Directus
async function createArticle(article) {
  try {
    // Check if already exists
    if (await articleExists(article.content_hash)) {
      return { skipped: true };
    }

    const response = await axios.post(
      `${DIRECTUS_URL}/items/articles`,
      article,
      {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return { success: true, id: response.data.data.id };
  } catch (error) {
    console.error(`  ✗ Error creating article "${article.title.substring(0, 50)}...":`, error.message);
    return { error: error.message };
  }
}

// Ensure topics exist in Directus
async function ensureTopicsExist() {
  console.log('\n📂 Ensuring topics exist in Directus...');
  
  const topics = Object.values(CATEGORY_TO_TOPIC);
  
  for (const topicName of topics) {
    try {
      // Check if topic exists
      const checkResponse = await axios.get(
        `${DIRECTUS_URL}/items/topic_categories?filter[name][_eq]=${encodeURIComponent(topicName)}&limit=1`,
        {
          headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
        }
      );
      
      if (checkResponse.data.data && checkResponse.data.data.length > 0) {
        console.log(`  ✓ Topic "${topicName}" already exists`);
        continue;
      }
      
      // Create topic
      await axios.post(
        `${DIRECTUS_URL}/items/topic_categories`,
        {
          name: topicName,
          slug: topicName.toLowerCase().replace(/\s+/g, '-'),
          description: `Articles related to ${topicName}`,
          status: 'published'
        },
        {
          headers: {
            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`  ✓ Created topic "${topicName}"`);
    } catch (error) {
      console.error(`  ✗ Error with topic "${topicName}":`, error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Fresh Article Population...\n');
  console.log(`📡 Directus URL: ${DIRECTUS_URL}`);
  console.log(`📰 Processing ${RSS_SOURCES.length} RSS sources\n`);
  
  if (!DIRECTUS_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN not found in environment variables');
    process.exit(1);
  }
  
  // Ensure topics exist first
  await ensureTopicsExist();
  
  let totalArticles = 0;
  let createdArticles = 0;
  let skippedArticles = 0;
  let errorArticles = 0;
  
  console.log('\n📥 Fetching articles from RSS sources...\n');
  
  // Fetch articles from all sources
  for (const source of RSS_SOURCES) {
    const articles = await fetchRSSArticles(source);
    
    // Create articles in Directus
    for (const article of articles) {
      totalArticles++;
      const result = await createArticle(article);
      
      if (result.success) {
        createdArticles++;
        console.log(`  ✓ Created: ${article.title.substring(0, 60)}...`);
      } else if (result.skipped) {
        skippedArticles++;
      } else {
        errorArticles++;
      }
    }
    
    // Small delay between sources
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Article Population Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total processed: ${totalArticles}`);
  console.log(`   ✓ Created: ${createdArticles}`);
  console.log(`   ⊘ Skipped (duplicates): ${skippedArticles}`);
  console.log(`   ✗ Errors: ${errorArticles}`);
  console.log('\n🌐 Articles are now available in Asha News!');
  console.log(`   Frontend: http://localhost:3000`);
  console.log(`   Directus: ${DIRECTUS_URL}/admin/content/articles\n`);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal Error:', error.message);
  process.exit(1);
});
