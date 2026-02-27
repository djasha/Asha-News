/**
 * Directus Flows API Routes
 * Manages automation workflows in Directus CMS
 */

const express = require('express');
const DirectusFlowService = require('../services/directusFlowService');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const logger = require('../utils/logger');
const flowService = new DirectusFlowService();

/**
 * Initialize all automation flows
 * POST /api/flows/initialize
 */
router.post('/initialize', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    logger.info('🚀 Initializing Directus automation flows...');
    const results = await flowService.initializeAllFlows();
    
    res.json({
      success: true,
      message: 'Automation flows initialized successfully',
      flows: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Flow initialization failed');
    res.status(500).json({
      success: false,
      error: 'Failed to initialize flows',
      details: error.message
    });
  }
});

/**
 * List all existing flows
 * GET /api/flows
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const flows = await flowService.listFlows();
    
    res.json({
      success: true,
      flows: flows.map(flow => ({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        status: flow.status,
        trigger: flow.trigger,
        icon: flow.icon,
        color: flow.color,
        operations_count: flow.operations?.length || 0,
        date_created: flow.date_created,
        date_updated: flow.date_updated
      })),
      total: flows.length
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to list flows');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve flows',
      details: error.message
    });
  }
});

/**
 * Create fact-checking flow
 * POST /api/flows/fact-checking
 */
router.post('/fact-checking', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const flow = await flowService.createFactCheckingFlow();
    
    res.json({
      success: true,
      message: 'Fact-checking flow created successfully',
      flow: {
        id: flow.id,
        name: flow.name,
        status: flow.status
      }
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to create fact-checking flow');
    res.status(500).json({
      success: false,
      error: 'Failed to create fact-checking flow',
      details: error.message
    });
  }
});

/**
 * Create categorization flow
 * POST /api/flows/categorization
 */
router.post('/categorization', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const flow = await flowService.createCategorizationFlow();
    
    res.json({
      success: true,
      message: 'Categorization flow created successfully',
      flow: {
        id: flow.id,
        name: flow.name,
        status: flow.status
      }
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to create categorization flow');
    res.status(500).json({
      success: false,
      error: 'Failed to create categorization flow',
      details: error.message
    });
  }
});

/**
 * Create daily briefs flow
 * POST /api/flows/daily-briefs
 */
router.post('/daily-briefs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const flow = await flowService.createDailyBriefsFlow();
    
    res.json({
      success: true,
      message: 'Daily briefs flow created successfully',
      flow: {
        id: flow.id,
        name: flow.name,
        status: flow.status
      }
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to create daily briefs flow');
    res.status(500).json({
      success: false,
      error: 'Failed to create daily briefs flow',
      details: error.message
    });
  }
});

/**
 * Create breaking news flow
 * POST /api/flows/breaking-news
 */
router.post('/breaking-news', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const flow = await flowService.createBreakingNewsFlow();
    
    res.json({
      success: true,
      message: 'Breaking news flow created successfully',
      flow: {
        id: flow.id,
        name: flow.name,
        status: flow.status
      }
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to create breaking news flow');
    res.status(500).json({
      success: false,
      error: 'Failed to create breaking news flow',
      details: error.message
    });
  }
});

/**
 * Delete a flow
 * DELETE /api/flows/:id
 */
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await flowService.deleteFlow(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Flow deleted successfully',
        flow_id: id
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Flow not found or could not be deleted'
      });
    }
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to delete flow');
    res.status(500).json({
      success: false,
      error: 'Failed to delete flow',
      details: error.message
    });
  }
});

/**
 * Test flow execution (manual trigger)
 * POST /api/flows/:id/test
 */
router.post('/:id/test', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { test_data } = req.body;
    
    // This would trigger a manual execution of the flow
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Flow test initiated',
      flow_id: id,
      test_data: test_data || {},
      note: 'Manual flow execution not yet implemented - flows will trigger automatically based on their configured triggers'
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to test flow');
    res.status(500).json({
      success: false,
      error: 'Failed to test flow',
      details: error.message
    });
  }
});

/**
 * Get flow statistics and performance
 * GET /api/flows/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const flows = await flowService.listFlows();
    
    const stats = {
      total_flows: flows.length,
      active_flows: flows.filter(f => f.status === 'active').length,
      inactive_flows: flows.filter(f => f.status === 'inactive').length,
      flow_types: {
        event: flows.filter(f => f.trigger === 'event').length,
        schedule: flows.filter(f => f.trigger === 'schedule').length,
        manual: flows.filter(f => f.trigger === 'manual').length,
        webhook: flows.filter(f => f.trigger === 'webhook').length
      },
      flows_by_name: flows.reduce((acc, flow) => {
        acc[flow.name] = {
          id: flow.id,
          status: flow.status,
          trigger: flow.trigger,
          operations: flow.operations?.length || 0
        };
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to get flow stats');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve flow statistics',
      details: error.message
    });
  }
});

module.exports = router;
