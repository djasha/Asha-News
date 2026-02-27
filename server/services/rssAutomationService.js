/**
 * RSS Automation Service
 * Handles automated RSS fetching controlled from Directus CMS
 */

const { spawn } = require('child_process');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const DirectusService = require('./directusService');
const { slugifyTag } = require('../../scripts/rss_utils');

class RSSAutomationService {
  constructor() {
    this.isRunning = false;
    this.lastFetch = null;
    this.fetchInterval = null;
    this.defaultInterval = 30 * 60 * 1000; // 30 minutes
    this.hasDirectusConfig = Boolean(process.env.DATABASE_URL);
    this.autoImportOverride = process.env.RSS_AUTO_IMPORT_TO_CMS;

    if (!this.hasDirectusConfig) {
      logger.warn('RSSAutomationService: DATABASE_URL missing; database import will be disabled.');
    }
  }
  /**
   * Import latest output JSON (public/data/articles.json) into Directus with tags
   */
  async importLatestOutputToDirectus() {
    if (!this.hasDirectusConfig) {
      logger.warn('Directus not configured; skipping import');
      return { imported: 0 };
    }
    const outputPath = path.join(__dirname, '..', '..', 'public', 'data', 'articles.json');
    if (!fs.existsSync(outputPath)) {
      logger.warn('No output file found for import:', outputPath);
      return { imported: 0 };
    }
    const raw = fs.readFileSync(outputPath, 'utf8');
    let data;
    try { data = JSON.parse(raw); } catch (e) { logger.warn('Invalid JSON in output:', e.message); return { imported: 0 }; }

    const items = Array.isArray(data?.articles) ? data.articles : [];
    const directus = new DirectusService();
    let imported = 0;
    for (const a of items) {
      try {
        const payload = {
          title: a.title,
          summary: a.summary,
          content: a.content || '',
          source_url: a.url,
          source_name: a.source_name || a.source_id,
          category: a.topic || 'General',
          published_at: a.publication_date,
          author: a.author,
          image_url: a.image_url,
          status: 'published'
        };
        const saved = await directus.upsertArticleBySourceUrl(payload);

        // Upsert and link tags
        const labels = Array.from(new Set([...(a.tags || []), ...(a.topic_categories || [])])).filter(Boolean);
        if (labels.length && saved?.id) {
          const tagIds = [];
          for (const label of labels) {
            try {
              const name = String(label).trim();
              const slug = slugifyTag(name);
              const tag = await directus.upsertTag(name, slug);
              if (tag?.id) tagIds.push(tag.id);
            } catch (e) { logger.warn('Tag upsert failed:', e.message); }
          }
          if (tagIds.length) {
            await directus.linkArticleTags(saved.id, tagIds);
          }
        }
        imported += 1;
      } catch (e) {
        logger.warn('Import article failed:', e.message);
      }
    }
    logger.info(`📥 Imported ${imported} articles into Directus`);
    return { imported };
  }

  /**
   * Get RSS automation settings from Directus
   */
  async getAutomationSettings() {
    if (!this.hasDirectusConfig) {
      return {
        enabled: false,
        fetch_interval_minutes: 30,
        auto_import_to_cms: false,
        max_articles_per_source: 50,
        enable_bias_analysis: false,
        priority_sources_only: false
      };
    }
    try {
      const queryBridge = require('../db/queryBridge');
      const result = await queryBridge('/items/global_settings?filter[setting_key][_eq]=rss_automation');
      const settings = result.data?.[0];

      if (settings?.setting_value) {
        const parsed = JSON.parse(settings.setting_value);
        if (this.autoImportOverride !== undefined) {
          const normalized = String(this.autoImportOverride).trim().toLowerCase();
          parsed.auto_import_to_cms = normalized === 'true' || normalized === '1' || normalized === 'yes';
        }
        return parsed;
      }
    } catch (error) {
      logger.warn('Failed to load RSS automation settings:', error.message);
    }

    // Default settings
    const settings = {
      enabled: true,
      fetch_interval_minutes: 30,
      auto_import_to_cms: false,
      max_articles_per_source: 50,
      enable_bias_analysis: false,
      priority_sources_only: false
    };

    if (this.autoImportOverride !== undefined) {
      const normalized = String(this.autoImportOverride).trim().toLowerCase();
      settings.auto_import_to_cms = normalized === 'true' || normalized === '1' || normalized === 'yes';
    }

    return settings;
  }

  /**
   * Get enabled RSS sources from Directus
   */
  async getEnabledSources() {
    if (!this.hasDirectusConfig) {
      return [];
    }
    try {
      const queryBridge = require('../db/queryBridge');
      const result = await queryBridge('/items/rss_sources?filter[enabled][_eq]=true&sort=name');
      return result.data || [];
    } catch (error) {
      logger.warn('Failed to load RSS sources:', error.message);
    }

    return [];
  }

  /**
   * Update RSS source statistics in Directus
   */
  async updateSourceStats(sourceId, articleCount, lastFetched, status = 'active') {
    if (!this.hasDirectusConfig) {
      return;
    }
    try {
      const queryBridge = require('../db/queryBridge');
      const result = await queryBridge(`/items/rss_sources?filter[source_id][_eq]=${encodeURIComponent(sourceId)}&limit=1`);
      const source = result.data?.[0];

      if (source) {
        await queryBridge(`/items/rss_sources/${source.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            article_count: articleCount,
            last_fetched: lastFetched,
            status: status,
            date_updated: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      logger.warn(`Failed to update stats for source ${sourceId}:`, error.message);
    }
  }

  /**
   * Execute RSS fetch script
   */
  async executeFetch() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'fetch_rss.js');
      
      logger.info('🔄 Starting automated RSS fetch...');
      
      const child = spawn('node', [scriptPath], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        logger.info(text.trim());
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        logger.error(text.trim());
      });

      child.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ RSS fetch completed successfully');
          resolve({ success: true, output, code });
        } else {
          logger.error(`❌ RSS fetch failed with code ${code}`);
          reject(new Error(`RSS fetch failed with code ${code}: ${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        logger.error('❌ RSS fetch process error:', error);
        reject(error);
      });
    });
  }

  /**
   * Parse fetch results and update source statistics
   */
  async updateSourceStatistics(output) {
    try {
      const lines = output.split('\n');
      const sourceStats = {};

      for (const line of lines) {
        // Parse lines like "Fetching CNN..." and "  -> 50 articles"
        const fetchMatch = line.match(/^Fetching (.+)\.\.\.$/);
        const resultMatch = line.match(/^\s*->\s*(\d+)\s+articles/);
        
        if (fetchMatch) {
          const sourceName = fetchMatch[1];
          sourceStats[sourceName] = { name: sourceName, articles: 0, status: 'active' };
        } else if (resultMatch && Object.keys(sourceStats).length > 0) {
          const lastSource = Object.keys(sourceStats).pop();
          sourceStats[lastSource].articles = parseInt(resultMatch[1]);
        }
        
        // Check for warnings/errors
        if (line.includes('WARN:') || line.includes('Failed to fetch')) {
          const lastSource = Object.keys(sourceStats).pop();
          if (lastSource) {
            sourceStats[lastSource].status = 'error';
          }
        }
      }

      // Update statistics in Directus
      const now = new Date().toISOString();
      for (const [sourceName, stats] of Object.entries(sourceStats)) {
        // Convert source name to source_id (lowercase, replace spaces with hyphens)
        const sourceId = sourceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await this.updateSourceStats(sourceId, stats.articles, now, stats.status);
      }

      logger.info(`📊 Updated statistics for ${Object.keys(sourceStats).length} sources`);
    } catch (error) {
      logger.warn('Failed to update source statistics:', error.message);
    }
  }

  /**
   * Start automated RSS fetching
   */
  async start() {
    if (this.isRunning) {
      logger.info('⚠️ RSS automation is already running');
      return;
    }

    if (!this.hasDirectusConfig) {
      logger.warn('RSSAutomationService: Directus configuration missing, automation cannot start.');
      return;
    }

    logger.info('🚀 Starting RSS automation service...');
    
    const settings = await this.getAutomationSettings();
    
    if (!settings.enabled) {
      logger.info('⏸️ RSS automation is disabled in settings');
      return;
    }

    this.isRunning = true;
    const intervalMs = (settings.fetch_interval_minutes || 30) * 60 * 1000;

    // Initial fetch
    try {
      const result = await this.executeFetch();
      await this.updateSourceStatistics(result.output);
      this.lastFetch = new Date();
      // Auto-import on initial automated run if enabled (settings or env override)
      const envAuto = this.autoImportOverride !== undefined && ['true','1','yes'].includes(String(this.autoImportOverride).trim().toLowerCase());
      if (settings.auto_import_to_cms || envAuto) {
        await this.importLatestOutputToDirectus();
      }
    } catch (error) {
      logger.error('Initial RSS fetch failed:', error.message);
    }

    // Set up recurring fetch
    this.fetchInterval = setInterval(async () => {
      try {
        const currentSettings = await this.getAutomationSettings();
        
        if (!currentSettings.enabled) {
          logger.info('⏸️ RSS automation disabled, stopping...');
          this.stop();
          return;
        }

        const result = await this.executeFetch();
        await this.updateSourceStatistics(result.output);
        this.lastFetch = new Date();
        // Auto-import on scheduled runs if enabled (settings or env override)
        const envAuto = this.autoImportOverride !== undefined && ['true','1','yes'].includes(String(this.autoImportOverride).trim().toLowerCase());
        if (currentSettings.auto_import_to_cms || envAuto) {
          await this.importLatestOutputToDirectus();
        }
        
      } catch (error) {
        logger.error('Scheduled RSS fetch failed:', error.message);
      }
    }, intervalMs);

    logger.info(`✅ RSS automation started (interval: ${settings.fetch_interval_minutes} minutes)`);
  }

  /**
   * Stop automated RSS fetching
   */
  stop() {
    if (!this.isRunning) {
      logger.info('⚠️ RSS automation is not running');
      return;
    }

    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }

    this.isRunning = false;
    logger.info('⏹️ RSS automation stopped');
  }

  /**
   * Trigger manual RSS fetch
   */
  async triggerFetch() {
    if (this.isRunning) {
      logger.info('⚠️ Automated fetch is running, skipping manual trigger');
      return { success: false, message: 'Automated fetch is already running' };
    }

    const canUpdateDirectus = this.hasDirectusConfig;
    const settings = await this.getAutomationSettings();

    try {
      logger.info('🔄 Manual RSS fetch triggered...');
      const result = await this.executeFetch();
      if (canUpdateDirectus) {
        await this.updateSourceStatistics(result.output);
        if (settings.auto_import_to_cms) {
          await this.importLatestOutputToDirectus();
        }
      } else {
        logger.info('ℹ️ Skipping Directus stats update (no Directus config present)');
      }
      this.lastFetch = new Date();
      
      return { 
        success: true, 
        message: 'RSS fetch completed successfully',
        lastFetch: this.lastFetch 
      };
    } catch (error) {
      logger.error('Manual RSS fetch failed:', error.message);
      return { 
        success: false, 
        message: `RSS fetch failed: ${error.message}` 
      };
    }
  }

  /**
   * Get automation status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastFetch: this.lastFetch,
      nextFetch: this.fetchInterval ? new Date(Date.now() + this.defaultInterval) : null
    };
  }
}

module.exports = RSSAutomationService;
