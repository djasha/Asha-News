const express = require('express');
const router = express.Router();
const dbService = require('../db/dbService');
const logger = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/subscription-tiers — list all active tiers
router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.all === 'true';
    let tiers;
    if (includeInactive) {
      tiers = await dbService.getItems('subscription_tiers', { sort: 'sort_order', limit: 50 });
    } else {
      tiers = await dbService.getSubscriptionTiers();
    }
    res.json({ data: tiers });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching subscription tiers');
    res.status(500).json({ error: 'Failed to fetch subscription tiers' });
  }
});

// GET /api/subscription-tiers/:id — single tier
router.get('/:id', async (req, res) => {
  try {
    const tier = await dbService.getItemById('subscription_tiers', req.params.id);
    if (!tier) return res.status(404).json({ error: 'Tier not found' });
    res.json({ data: tier });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching tier');
    res.status(500).json({ error: 'Failed to fetch tier' });
  }
});

// POST /api/subscription-tiers — create tier (admin)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, slug, description, price_monthly, price_yearly, features, limits, is_active, sort_order, badge_color } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }

    const existing = await dbService.getSubscriptionTierBySlug(slug);
    if (existing) {
      return res.status(409).json({ error: `Tier with slug "${slug}" already exists` });
    }

    const tier = await dbService.createSubscriptionTier({
      name,
      slug,
      description: description || '',
      price_monthly: price_monthly || 0,
      price_yearly: price_yearly || 0,
      features: features || [],
      limits: limits || {},
      is_active: is_active !== false,
      sort_order: sort_order || 0,
      badge_color: badge_color || '#6B7280',
    });

    res.status(201).json({ data: tier });
  } catch (error) {
    logger.error({ err: error }, 'Error creating tier');
    res.status(500).json({ error: 'Failed to create tier' });
  }
});

// PATCH /api/subscription-tiers/:id — update tier (admin)
router.patch('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const existing = await dbService.getItemById('subscription_tiers', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Tier not found' });

    const allowedFields = ['name', 'slug', 'description', 'price_monthly', 'price_yearly', 'features', 'limits', 'is_active', 'is_default', 'sort_order', 'badge_color'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const tier = await dbService.updateSubscriptionTier(req.params.id, updates);
    res.json({ data: tier });
  } catch (error) {
    logger.error({ err: error }, 'Error updating tier');
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

// DELETE /api/subscription-tiers/:id — delete tier (admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const existing = await dbService.getItemById('subscription_tiers', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Tier not found' });

    if (existing.is_default) {
      return res.status(400).json({ error: 'Cannot delete the default tier' });
    }

    await dbService.deleteSubscriptionTier(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting tier');
    res.status(500).json({ error: 'Failed to delete tier' });
  }
});

module.exports = router;
