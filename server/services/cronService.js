/**
 * Cron Service for Scheduled Tasks
 * Handles automated daily briefs and other scheduled operations
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const axios = require('axios');
const queryBridge = require('../db/queryBridge');

class CronService {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    this.enableIngestCron = String(process.env.ENABLE_INGEST_CRON || 'false').toLowerCase() === 'true';
    this.ingestCronSchedule = process.env.INGEST_CRON_SCHEDULE || '*/30 * * * *';

    this.headers = { 'Content-Type': 'application/json' };
    this.jobs = new Map();
  }

  /**
   * Story clustering automation job
   */
  startStoryClusteringJob() {
    const job = cron.schedule('*/30 * * * *', async () => {
      logger.info('[CronService] Running story clustering automation...');
      try {
        await axios.post(`${this.backendUrl}/api/clusters/auto-cluster`, {
          threshold: 0.75,
          max_articles: 200
        });
        logger.info('[CronService] Story clustering automation executed');
      } catch (error) {
        logger.error('[CronService] Story clustering automation failed:', error.response?.data || error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    this.jobs.set('story-clustering', job);
    job.start();
    logger.info('[CronService] Story clustering job scheduled every 30 minutes');
  }

  /**
   * Start all cron jobs
   */
  startAllJobs() {
    logger.info('[CronService] Starting cron jobs...');
    
    // Daily briefs generation - every day at 6 AM
    this.startDailyBriefsJob();
    
    // Breaking news cleanup - every hour
    this.startBreakingNewsCleanup();
    
    // Analytics update - every 4 hours
    this.startAnalyticsUpdate();

    // Story clustering automation - every 30 minutes
    this.startStoryClusteringJob();
    
    // Ingestion job (optional)
    if (this.enableIngestCron) {
      this.startIngestJob();
    } else {
      logger.info('[CronService] Ingestion cron disabled (set ENABLE_INGEST_CRON=true to enable)');
    }
    
    logger.info('[CronService] All cron jobs started');
  }

  /**
   * RSS ingestion job (FreshRSS/Directus-driven)
   */
  startIngestJob() {
    const job = cron.schedule(this.ingestCronSchedule, async () => {
      logger.info('[CronService] Running scheduled ingestion (RSS automation fetch)...');
      try {
        await axios.post(`${this.backendUrl}/api/rss-automation/fetch`);
        logger.info('[CronService] Ingestion executed');
      } catch (error) {
        logger.error('[CronService] Ingestion job failed:', error.response?.data || error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    this.jobs.set('ingestion', job);
    job.start();
    logger.info(`[CronService] Ingestion job scheduled (${this.ingestCronSchedule})`);
  }

  /**
   * Daily briefs generation job
   */
  startDailyBriefsJob() {
    const job = cron.schedule('0 6 * * *', async () => {
      logger.info('[CronService] Running daily briefs generation...');
      try {
        await this.generateDailyBrief();
      } catch (error) {
        logger.error('[CronService] Daily briefs job failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    
    this.jobs.set('daily-briefs', job);
    job.start();
    logger.info('[CronService] Daily briefs job scheduled for 6:00 AM UTC');
  }

  /**
   * Breaking news cleanup job
   */
  startBreakingNewsCleanup() {
    const job = cron.schedule('0 * * * *', async () => {
      logger.info('[CronService] Cleaning up expired breaking news...');
      try {
        await this.cleanupExpiredBreakingNews();
      } catch (error) {
        logger.error('[CronService] Breaking news cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    
    this.jobs.set('breaking-news-cleanup', job);
    job.start();
    logger.info('[CronService] Breaking news cleanup job scheduled hourly');
  }

  /**
   * Analytics update job
   */
  startAnalyticsUpdate() {
    const job = cron.schedule('0 */4 * * *', async () => {
      logger.info('[CronService] Updating analytics and trending topics...');
      try {
        await this.updateAnalytics();
      } catch (error) {
        logger.error('[CronService] Analytics update failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    
    this.jobs.set('analytics-update', job);
    job.start();
    logger.info('[CronService] Analytics update job scheduled every 4 hours');
  }

  /**
   * Generate daily brief
   */
  async generateDailyBrief() {
    try {
      const response = await axios.post(`${this.backendUrl}/api/webhooks/generate-daily-brief`, {}, {
        headers: { 'Content-Type': 'application/json' }
      });
      logger.info('Daily brief generated:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Failed to generate daily brief:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Clean up expired breaking news
   */
  async cleanupExpiredBreakingNews() {
    try {
      const now = new Date().toISOString();
      const response = await queryBridge(`/items/breaking_news?filter[expires_at][_lt]=${now}&filter[status][_eq]=active`);
      const expiredItems = response.data || [];

      if (expiredItems.length === 0) return;

      for (const item of expiredItems) {
        await queryBridge(`/items/breaking_news/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'expired' })
        });
      }
      logger.info(`Cleaned up ${expiredItems.length} expired breaking news items`);
    } catch (error) {
      logger.error('Breaking news cleanup failed:', error.message);
    }
  }

  /**
   * Update analytics and trending topics
   */
  async updateAnalytics() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const articlesResponse = await queryBridge(
        `/items/articles?filter[date_created][_gte]=${yesterday.toISOString()}&filter[status][_eq]=published&sort=-view_count&limit=50`
      );
      const articles = articlesResponse.data || [];

      if (articles.length === 0) return;

      const topicCounts = {};
      articles.forEach(article => {
        const category = article.category || 'General';
        topicCounts[category] = (topicCounts[category] || 0) + (article.view_count || 0);
      });

      for (const [topic, score] of Object.entries(topicCounts)) {
        try {
          const existingResponse = await queryBridge(`/items/trending_topics?filter[name][_eq]=${encodeURIComponent(topic)}&limit=1`);
          const existing = existingResponse.data?.[0];

          if (existing) {
            await queryBridge(`/items/trending_topics/${existing.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                trending_score: score,
                last_updated: new Date().toISOString(),
                status: score > 10 ? 'active' : 'inactive'
              })
            });
          } else {
            await queryBridge('/items/trending_topics', {
              method: 'POST',
              body: JSON.stringify({
                name: topic,
                trending_score: score,
                status: score > 10 ? 'active' : 'inactive',
                last_updated: new Date().toISOString()
              })
            });
          }
        } catch (error) {
          logger.error(`Failed to update trending topic ${topic}:`, error.message);
        }
      }
      logger.info(`Analytics updated for ${Object.keys(topicCounts).length} topics`);
    } catch (error) {
      logger.error('Analytics update failed:', error.message);
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs() {
    logger.info('[CronService] Stopping all cron jobs...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      logger.info(`[CronService] Stopped ${name} job`);
    }
    
    this.jobs.clear();
    logger.info('[CronService] All cron jobs stopped');
  }

  /**
   * Get job status
   */
  getJobStatus() {
    const status = {};
    
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }
    
    return status;
  }

  /**
   * Manually trigger daily brief generation
   */
  async triggerDailyBrief() {
    logger.info('[CronService] Manually triggering daily brief generation...');
    return await this.generateDailyBrief();
  }

  /**
   * Manually trigger breaking news cleanup
   */
  async triggerBreakingNewsCleanup() {
    logger.info('[CronService] Manually triggering breaking news cleanup...');
    return await this.cleanupExpiredBreakingNews();
  }

  /**
   * Manually trigger analytics update
   */
  async triggerAnalyticsUpdate() {
    logger.info('[CronService] Manually triggering analytics update...');
    return await this.updateAnalytics();
  }
}

module.exports = CronService;
