#!/usr/bin/env node

/**
 * Import RSS Articles to Directus CMS
 * Reads articles from public/data/articles.json and imports them to Directus
 */

const fs = require('fs');
const path = require('path');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'test-token-12345';
const ARTICLES_FILE = path.join(__dirname, 'public/data/articles.json');

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function loadArticles() {
  try {
    if (!fs.existsSync(ARTICLES_FILE)) {
      console.error('Articles file not found. Run "node scripts/fetch_rss.js" first.');
      return [];
    }
    
    const data = fs.readFileSync(ARTICLES_FILE, 'utf8');
    const json = JSON.parse(data);
    return json.articles || [];
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

async function checkExistingArticle(url) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`${DIRECTUS_URL}/items/articles?filter[source_url][_eq]=${encodedUrl}&limit=1`, { headers });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.data && data.data.length > 0;
  } catch (error) {
    return false;
  }
}

async function createArticle(article) {
  try {
    // Map RSS article to Directus article format
    const directusArticle = {
      title: article.title,
      slug: article.id || generateSlug(article.title),
      summary: article.summary || '',
      content: article.content || article.summary || '',
      source_url: article.url,
      source_name: article.source_name,
      author_name: article.author || 'Unknown',
      category: article.topic || 'General',
      published_at: article.publication_date,
      date_created: new Date().toISOString(),
      published: true,
      featured: article.section === 'featured',
      breaking_news: article.breaking_news || false,
      political_bias: article.political_bias || 'center',
      bias_score: article.bias_score || 0.5,
      credibility_score: article.factual_quality || 0.8,
      fact_check_status: 'unverified',
      word_count: article.content ? article.content.split(' ').length : 0,
      reading_time: Math.max(1, Math.ceil((article.content || '').split(' ').length / 200)),
      image_url: article.image_url || null,
      view_count: 0,
      share_count: 0,
      engagement_score: 0
    };

    const response = await fetch(`${DIRECTUS_URL}/items/articles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(directusArticle)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to create article "${article.title}":`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error creating article "${article.title}":`, error);
    return false;
  }
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
    .substring(0, 100);
}

async function main() {
  console.log('🔄 Loading RSS articles...');
  const articles = await loadArticles();
  
  if (articles.length === 0) {
    console.log('❌ No articles found to import');
    return;
  }
  
  console.log(`📰 Found ${articles.length} articles to process`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    
    if (i % 50 === 0) {
      console.log(`📊 Progress: ${i}/${articles.length} (${Math.round(i/articles.length*100)}%)`);
    }
    
    try {
      // Check if article already exists
      const exists = await checkExistingArticle(article.url);
      
      if (exists) {
        skipped++;
        continue;
      }
      
      // Create new article
      const success = await createArticle(article);
      
      if (success) {
        imported++;
      } else {
        errors++;
      }
      
      // Rate limiting - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error processing article "${article.title}":`, error);
      errors++;
    }
  }
  
  console.log('\n✅ Import completed!');
  console.log(`📈 Results:`);
  console.log(`  - Imported: ${imported} articles`);
  console.log(`  - Skipped (already exist): ${skipped} articles`);
  console.log(`  - Errors: ${errors} articles`);
  console.log(`  - Total processed: ${imported + skipped + errors} articles`);
}

// Run the import
main().catch(console.error);
