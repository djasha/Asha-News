/*
  Sitemap Generator for Asha.News
  - Generates dynamic sitemap.xml with article URLs from articles.json
  - Includes news sitemap format for Google News
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ARTICLES_PATH = path.join(__dirname, '..', 'public', 'data', 'articles.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');
const BASE_URL = process.env.SITE_URL || 'https://asha.news';

async function generateSitemap() {
  try {
    // Load articles
    const articlesData = JSON.parse(fs.readFileSync(ARTICLES_PATH, "utf8"));
    const articles = articlesData.articles || [];

    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

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
  
  <!-- Fact Checker Page -->
  <url>
    <loc>${BASE_URL}/fact-check</loc>
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
  
  <!-- Stories Page -->
  <url>
    <loc>${BASE_URL}/stories</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- For You Page -->
  <url>
    <loc>${BASE_URL}/for-you</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Blog Page -->
  <url>
    <loc>${BASE_URL}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Local Page -->
  <url>
    <loc>${BASE_URL}/local</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Features Page -->
  <url>
    <loc>${BASE_URL}/features</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Contact Page -->
  <url>
    <loc>${BASE_URL}/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Careers Page -->
  <url>
    <loc>${BASE_URL}/careers</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <!-- API Page -->
  <url>
    <loc>${BASE_URL}/api</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <!-- Subscription Pages -->
  <url>
    <loc>${BASE_URL}/subscription</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${BASE_URL}/subscribe</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- RSS Pages -->
  <url>
    <loc>${BASE_URL}/rss</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${BASE_URL}/rss.xml</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Legal Pages -->
  <url>
    <loc>${BASE_URL}/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/cookies</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/gdpr</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
`;

    // Optionally include Story Cluster URLs from Directus CMS if configured (with pagination)
    try {
      const DIRECTUS_URL = process.env.DIRECTUS_URL;
      const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
      if (DIRECTUS_URL && DIRECTUS_TOKEN) {
        const baseUrl = `${DIRECTUS_URL.replace(
          /\/$/,
          ""
        )}/items/story_clusters`;
        const pageSize = 100;
        let offset = 0;
        let totalAdded = 0;
        const maxItems = 2000; // hard safety cap
        // Fetch in pages until no more results or safety cap reached
        // Using offset pagination to be compatible with Directus REST
        for (;;) {
          const resp = await axios.get(baseUrl, {
            headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
            params: {
              limit: pageSize,
              offset,
              sort: "-date_updated",
              fields: "id,date_updated,status",
            },
          });
          const page = resp.data?.data || [];
          if (!page.length) break;
          const active = page.filter((c) => !c.status || c.status === "active");
          for (const c of active) {
            const lastmod = c.date_updated
              ? new Date(c.date_updated).toISOString().split("T")[0]
              : now;
            sitemap += `
  <!-- Story Cluster -->
  <url>
    <loc>${BASE_URL}/story/${c.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>`;
          }
          totalAdded += active.length;
          offset += pageSize;
          if (offset >= maxItems) break;
        }
        if (totalAdded > 0) {
          console.log(`Included ${totalAdded} story cluster URLs in sitemap`);
        }
      }
    } catch (e) {
      console.warn(
        "Sitemap: skipping story clusters (Directus not available):",
        e.message
      );
    }

    // Optionally include CMS Pages (Directus 'pages' collection)
    try {
      const DIRECTUS_URL = process.env.DIRECTUS_URL;
      const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
      if (DIRECTUS_URL && DIRECTUS_TOKEN) {
        const baseUrl = `${DIRECTUS_URL.replace(/\/$/, "")}/items/pages`;
        const pageSize = 100;
        let offset = 0;
        let totalAdded = 0;
        const maxItems = 2000; // safety cap
        // Slugs we already include explicitly above or that map to non-page routes
        const staticSlugs = new Set([
          "home",
          "articles",
          "about",
          "features",
          "contact",
          "careers",
          "api",
          "search",
          "stories",
          "for-you",
          "blog",
          "local",
          "rss",
          "rss.xml",
          "bias-methodology",
          "sources",
          "privacy",
          "terms",
          "cookies",
          "gdpr",
          "subscription",
          "subscribe",
        ]);

        for (;;) {
          const resp = await axios.get(baseUrl, {
            headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
            params: {
              limit: pageSize,
              offset,
              sort: "-updated_at",
              fields: "slug,updated_at,status",
            },
          });
          const page = resp.data?.data || [];
          if (!page.length) break;
          const published = page.filter(
            (p) =>
              p.status === "published" && p.slug && !staticSlugs.has(p.slug)
          );
          for (const p of published) {
            const lastmod = p.updated_at
              ? new Date(p.updated_at).toISOString().split("T")[0]
              : now;
            sitemap += `
  <!-- CMS Page -->
  <url>
    <loc>${BASE_URL}/page/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
          }
          totalAdded += published.length;
          offset += pageSize;
          if (offset >= maxItems) break;
        }
        if (totalAdded > 0) {
          console.log(`Included ${totalAdded} CMS page URLs in sitemap`);
        }
      }
    } catch (e) {
      console.warn(
        "Sitemap: skipping CMS pages (Directus not available):",
        e.message
      );
    }

    // Add article URLs
    articles.forEach((article) => {
      const articleDate = new Date(article.publication_date)
        .toISOString()
        .split("T")[0];
      const isRecent =
        Date.now() - new Date(article.publication_date).getTime() <
        7 * 24 * 60 * 60 * 1000; // 7 days

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
      if (article.image_url && !article.image_url.includes("picsum.photos")) {
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
    console.log(
      `Generated sitemap with ${articles.length} articles at ${SITEMAP_PATH}`
    );
  } catch (error) {
    console.error('Failed to generate sitemap:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  generateSitemap().catch((err) => {
    console.error('Sitemap generation failed:', err);
    process.exitCode = 1;
  });
}

module.exports = { generateSitemap };
