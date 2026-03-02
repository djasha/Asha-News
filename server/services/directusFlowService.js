/**
 * Flow Service (stub)
 *
 * Directus Flows have been removed. Automation is now handled by
 * CronService and backend route logic directly.
 * This stub keeps existing route imports working without errors.
 */
const logger = require('../utils/logger');

class DirectusFlowService {
  async createFactCheckingFlow() { return { id: null, status: 'deprecated' }; }
  async createCategorizationFlow() { return { id: null, status: 'deprecated' }; }
  async createDailyBriefsFlow() { return { id: null, status: 'deprecated' }; }
  async createBreakingNewsFlow() { return { id: null, status: 'deprecated' }; }
  async listFlows() { return []; }
  async deleteFlow() { return true; }
  async initializeAllFlows() {
    logger.info('Flow service: Directus Flows removed. Automation handled by CronService.');
    return [];
  }
}

module.exports = DirectusFlowService;
