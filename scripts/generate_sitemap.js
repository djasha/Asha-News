/*
  Sitemap Generator for Asha.News
  - Generates dynamic sitemap.xml with article URLs from articles.json
  - Includes news sitemap format for Google News
*/

const fs = require('fs');
const path = require('path');

const ARTICLES_PATH = path.join(__dirname, '..', 'public', 'data', 'articles.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');
const BASE_URL = 'https://asha.news';

function generateSitemap() {
  try {
    // Load articles
    const articlesData = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf8'));
    const articles = articlesData.articles || [];
    
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Search Page -->
  <url>
    <loc>${BASE_URL}/search</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Bias Methodology -->
  <url>
    <loc>${BASE_URL}/bias-methodology</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Sources Page -->
  <url>
    <loc>${BASE_URL}/sources</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Blindspots Page -->
  <url>
    <loc>${BASE_URL}/blindspots</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- About Page -->
  <url>
    <loc>${BASE_URL}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

    // Add article URLs
    articles.forEach(article => {
      const articleDate = new Date(article.publication_date).toISOString().split('T')[0];
      const isRecent = (Date.now() - new Date(article.publication_date).getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
      
      sitemap += `
  <!-- Article: ${article.title.substring(0, 50)}... -->
  <url>
    <loc>${BASE_URL}/article/${article.id}</loc>
    <lastmod>${articleDate}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>`;
    
      // Add Google News sitemap for recent articles
      if (isRecent) {
        sitemap += `
    <news:news>
      <news:publication>
        <news:name>Asha.News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${article.publication_date}</news:publication_date>
      <news:title><![CDATA[${article.title}]]></news:title>
    </news:news>`;
      }
      
      // Add image if available
      if (article.image_url && !article.image_url.includes('picsum.photos')) {
        sitemap += `
    <image:image>
      <image:loc>${article.image_url}</image:loc>
      <image:title><![CDATA[${article.title}]]></image:title>
    </image:image>`;
      }
      
      sitemap += `
  </url>`;
    });

    sitemap += `
  
</urlset>`;

    // Write sitemap
    fs.writeFileSync(SITEMAP_PATH, sitemap);
    console.log(`Generated sitemap with ${articles.length} articles at ${SITEMAP_PATH}`);
    
  } catch (error) {
    console.error('Failed to generate sitemap:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };
