// Database Service for Article Caching and Deduplication
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/articles.db');
    this.db = null;
    this.init();
  }

  init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize database
      this.db = new Database(this.dbPath);
      this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  createTables() {
    // Articles table with comprehensive indexing for deduplication
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        content TEXT,
        url TEXT UNIQUE NOT NULL,
        source_name TEXT NOT NULL,
        source_url TEXT,
        author TEXT,
        published_at TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        image_url TEXT,
        category TEXT,
        bias_score REAL,
        credibility_score REAL,
        social_score INTEGER DEFAULT 0,
        sentiment REAL,
        api_source TEXT NOT NULL,
        ai_analysis TEXT,
        title_hash TEXT NOT NULL,
        content_hash TEXT,
        is_duplicate INTEGER DEFAULT 0,
        duplicate_of TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for fast lookups and deduplication
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
      CREATE INDEX IF NOT EXISTS idx_articles_title_hash ON articles(title_hash);
      CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
      CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_name);
      CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
      CREATE INDEX IF NOT EXISTS idx_articles_api_source ON articles(api_source);
      CREATE INDEX IF NOT EXISTS idx_articles_fetched_at ON articles(fetched_at);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_url_unique ON articles(url);
    `);

    // Sources table for tracking source metadata
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        url TEXT,
        country TEXT,
        language TEXT,
        category TEXT,
        bias_score REAL,
        credibility_score REAL,
        api_source TEXT,
        last_fetched TEXT,
        article_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for sources
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sources_name ON sources(name);
      CREATE INDEX IF NOT EXISTS idx_sources_country ON sources(country);
      CREATE INDEX IF NOT EXISTS idx_sources_api_source ON sources(api_source);
    `);

    console.log('Database tables created successfully');
  }

  // Generate hash for deduplication
  generateHash(text) {
    if (!text) return null;
    
    // Normalize text for comparison
    const normalized = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Check if article is duplicate based on URL, title, or content similarity
  checkForDuplicate(article) {
    const titleHash = this.generateHash(article.title);
    const contentHash = this.generateHash(article.content || article.summary);

    // Check for exact URL match
    const urlDuplicate = this.db.prepare(`
      SELECT id, title FROM articles WHERE url = ? LIMIT 1
    `).get(article.url);

    if (urlDuplicate) {
      return { isDuplicate: true, reason: 'url', existingId: urlDuplicate.id };
    }

    // Check for title similarity (exact hash match)
    const titleDuplicate = this.db.prepare(`
      SELECT id, title FROM articles WHERE title_hash = ? AND id != ? LIMIT 1
    `).get(titleHash, article.id || '');

    if (titleDuplicate) {
      return { isDuplicate: true, reason: 'title', existingId: titleDuplicate.id };
    }

    // Check for content similarity if content exists
    if (contentHash) {
      const contentDuplicate = this.db.prepare(`
        SELECT id, title FROM articles WHERE content_hash = ? AND id != ? LIMIT 1
      `).get(contentHash, article.id || '');

      if (contentDuplicate) {
        return { isDuplicate: true, reason: 'content', existingId: contentDuplicate.id };
      }
    }

    return { isDuplicate: false };
  }

  // Save article to database with deduplication
  async saveArticle(article) {
    try {
      const duplicateCheck = this.checkForDuplicate(article);
      
      if (duplicateCheck.isDuplicate) {
        console.log(`Skipping duplicate article: "${article.title}" (${duplicateCheck.reason} match)`);
        return { saved: false, reason: duplicateCheck.reason, existingId: duplicateCheck.existingId };
      }

      const titleHash = this.generateHash(article.title);
      const contentHash = this.generateHash(article.content || article.summary);
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO articles (
          id, title, summary, content, url, source_name, source_url, author,
          published_at, fetched_at, image_url, category, bias_score, credibility_score,
          social_score, sentiment, api_source, ai_analysis, title_hash, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        article.id,
        article.title,
        article.summary,
        article.content || '',
        article.url,
        article.source_name,
        article.source_url || '',
        article.author || 'Unknown',
        article.published_at,
        article.fetched_at || new Date().toISOString(),
        article.image_url,
        article.category || 'general',
        article.bias_score || null,
        article.credibility_score || null,
        article.social_score || 0,
        article.sentiment || null,
        article.api_source,
        JSON.stringify(article.ai_analysis) || null,
        titleHash,
        contentHash
      );

      // Update source metadata
      this.updateSourceMetadata(article);

      return { saved: true, id: article.id, changes: result.changes };
    } catch (error) {
      console.error('Error saving article:', error);
      throw error;
    }
  }

  // Save multiple articles with batch processing
  async saveArticles(articles) {
    const results = {
      saved: 0,
      duplicates: 0,
      errors: 0,
      details: []
    };

    const transaction = this.db.transaction((articles) => {
      for (const article of articles) {
        try {
          const result = this.saveArticleSync(article);
          if (result.saved) {
            results.saved++;
          } else {
            results.duplicates++;
          }
          results.details.push(result);
        } catch (error) {
          results.errors++;
          results.details.push({ saved: false, error: error.message });
        }
      }
    });

    transaction(articles);
    return results;
  }

  // Synchronous version for transactions
  saveArticleSync(article) {
    const duplicateCheck = this.checkForDuplicate(article);
    
    if (duplicateCheck.isDuplicate) {
      return { saved: false, reason: duplicateCheck.reason, existingId: duplicateCheck.existingId };
    }

    const titleHash = this.generateHash(article.title);
    const contentHash = this.generateHash(article.content || article.summary);
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO articles (
        id, title, summary, content, url, source_name, source_url, author,
        published_at, fetched_at, image_url, category, bias_score, credibility_score,
        social_score, sentiment, api_source, ai_analysis, title_hash, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      article.id,
      article.title,
      article.summary,
      article.content || '',
      article.url,
      article.source_name,
      article.source_url || '',
      article.author || 'Unknown',
      article.published_at,
      article.fetched_at || new Date().toISOString(),
      article.image_url,
      article.category || 'general',
      article.bias_score || null,
      article.credibility_score || null,
      article.social_score || 0,
      article.sentiment || null,
      article.api_source,
      JSON.stringify(article.ai_analysis) || null,
      titleHash,
      contentHash
    );

    this.updateSourceMetadata(article);
    return { saved: true, id: article.id, changes: result.changes };
  }

  // Update source metadata
  updateSourceMetadata(article) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sources (
        id, name, url, bias_score, credibility_score, api_source, last_fetched,
        article_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT article_count FROM sources WHERE name = ?), 0) + 1)
    `);

    const sourceId = this.generateHash(article.source_name);
    stmt.run(
      sourceId,
      article.source_name,
      article.source_url,
      article.bias_score,
      article.credibility_score,
      article.api_source,
      new Date().toISOString(),
      article.source_name
    );
  }

  // Get cached articles with filtering
  getCachedArticles(params = {}) {
    let query = `
      SELECT * FROM articles 
      WHERE is_duplicate = 0
    `;
    const queryParams = [];

    // Add filters
    if (params.keywords) {
      query += ` AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)`;
      const keyword = `%${params.keywords}%`;
      queryParams.push(keyword, keyword, keyword);
    }

    if (params.category && params.category !== 'all') {
      query += ` AND category = ?`;
      queryParams.push(params.category);
    }

    if (params.source) {
      query += ` AND source_name = ?`;
      queryParams.push(params.source);
    }

    if (params.api_source) {
      query += ` AND api_source = ?`;
      queryParams.push(params.api_source);
    }

    if (params.dateFrom) {
      query += ` AND published_at >= ?`;
      queryParams.push(params.dateFrom);
    }

    if (params.dateTo) {
      query += ` AND published_at <= ?`;
      queryParams.push(params.dateTo);
    }

    // Add ordering
    query += ` ORDER BY published_at DESC`;

    // Add limit
    if (params.limit) {
      query += ` LIMIT ?`;
      queryParams.push(params.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...queryParams);

    return rows.map(row => ({
      ...row,
      ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null
    }));
  }

  // Get article by ID
  getArticleById(id) {
    const stmt = this.db.prepare(`
      SELECT * FROM articles WHERE id = ?
    `);
    const row = stmt.get(id);
    
    if (row) {
      return {
        ...row,
        ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null
      };
    }
    return null;
  }

  // Check if articles need refresh based on age
  needsRefresh(apiSource, maxAgeHours = 1) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
    
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM articles 
      WHERE api_source = ? AND fetched_at > ?
    `);
    
    const result = stmt.get(apiSource, cutoffTime.toISOString());
    return result.count === 0;
  }

  // Get database statistics
  getStats() {
    const totalArticles = this.db.prepare(`
      SELECT COUNT(*) as count FROM articles WHERE is_duplicate = 0
    `).get();

    const duplicateArticles = this.db.prepare(`
      SELECT COUNT(*) as count FROM articles WHERE is_duplicate = 1
    `).get();

    const sourceCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM sources
    `).get();

    const apiBreakdown = this.db.prepare(`
      SELECT api_source, COUNT(*) as count 
      FROM articles WHERE is_duplicate = 0 
      GROUP BY api_source
    `).all();

    const categoryBreakdown = this.db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM articles WHERE is_duplicate = 0 
      GROUP BY category 
      ORDER BY count DESC
    `).all();

    const recentArticles = this.db.prepare(`
      SELECT COUNT(*) as count FROM articles 
      WHERE is_duplicate = 0 AND fetched_at > datetime('now', '-24 hours')
    `).get();

    return {
      totalArticles: totalArticles.count,
      duplicateArticles: duplicateArticles.count,
      uniqueSources: sourceCount.count,
      recentArticles: recentArticles.count,
      apiBreakdown,
      categoryBreakdown
    };
  }

  // Clean old articles (older than specified days)
  cleanOldArticles(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const stmt = this.db.prepare(`
      DELETE FROM articles WHERE published_at < ?
    `);
    
    const result = stmt.run(cutoffDate.toISOString());
    console.log(`Cleaned ${result.changes} old articles`);
    return result.changes;
  }

  // Vacuum database to reclaim space
  vacuum() {
    this.db.exec('VACUUM');
    console.log('Database vacuumed successfully');
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }

  // Get sources with statistics
  getSources() {
    const stmt = this.db.prepare(`
      SELECT s.*, 
        COUNT(a.id) as recent_articles,
        MAX(a.published_at) as latest_article
      FROM sources s
      LEFT JOIN articles a ON s.name = a.source_name 
        AND a.published_at > datetime('now', '-7 days')
        AND a.is_duplicate = 0
      GROUP BY s.id
      ORDER BY recent_articles DESC
    `);
    
    return stmt.all();
  }

  // Update article AI analysis
  updateArticleAnalysis(articleId, aiAnalysis) {
    const stmt = this.db.prepare(`
      UPDATE articles 
      SET ai_analysis = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(JSON.stringify(aiAnalysis), articleId);
    return result.changes > 0;
  }

  // Mark articles as duplicates
  markAsDuplicate(duplicateId, originalId) {
    const stmt = this.db.prepare(`
      UPDATE articles 
      SET is_duplicate = 1, duplicate_of = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(originalId, duplicateId);
    return result.changes > 0;
  }

  // Search articles with full-text search capability
  searchArticles(searchTerm, params = {}) {
    let query = `
      SELECT * FROM articles 
      WHERE is_duplicate = 0 
      AND (
        title LIKE ? OR 
        summary LIKE ? OR 
        content LIKE ? OR
        source_name LIKE ?
      )
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const queryParams = [searchPattern, searchPattern, searchPattern, searchPattern];

    // Add additional filters
    if (params.category && params.category !== 'all') {
      query += ` AND category = ?`;
      queryParams.push(params.category);
    }

    if (params.api_source) {
      query += ` AND api_source = ?`;
      queryParams.push(params.api_source);
    }

    query += ` ORDER BY published_at DESC`;
    
    if (params.limit) {
      query += ` LIMIT ?`;
      queryParams.push(params.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...queryParams);

    return rows.map(row => ({
      ...row,
      ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null
    }));
  }
}

// Create singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
