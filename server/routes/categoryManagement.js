const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const DirectusService = require('../services/directusService');
const directus = new DirectusService();

/**
 * Get all categories
 */
router.get('/', async (req, res) => {
  try {
    // Try to fetch from Directus categories collection
    let categories;
    try {
      categories = await directus.getItems('categories', {
        sort: ['order', 'name'],
        limit: -1
      });
    } catch (error) {
      logger.info('categories collection not yet created, using defaults');
      // Return default hardcoded categories as fallback
      categories = [
        { id: 'politics', name: 'Politics', slug: 'politics', color: '#dc2626', icon: 'government', enabled: true, order: 1 },
        { id: 'technology', name: 'Technology', slug: 'technology', color: '#2563eb', icon: 'cpu', enabled: true, order: 2 },
        { id: 'business', name: 'Business', slug: 'business', color: '#059669', icon: 'currency-dollar', enabled: true, order: 3 },
        { id: 'international', name: 'International', slug: 'international', color: '#7c3aed', icon: 'globe', enabled: true, order: 4 },
        { id: 'health', name: 'Health', slug: 'health', color: '#dc2626', icon: 'heart', enabled: true, order: 5 },
        { id: 'sports', name: 'Sports', slug: 'sports', color: '#ea580c', icon: 'trophy', enabled: true, order: 6 },
        { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#db2777', icon: 'film', enabled: true, order: 7 },
        { id: 'science', name: 'Science', slug: 'science', color: '#0891b2', icon: 'beaker', enabled: true, order: 8 }
      ];
    }
    
    res.json({ success: true, data: categories, source: Array.isArray(categories) && categories.length > 0 && categories[0].id !== 'politics' ? 'directus' : 'defaults' });
  } catch (error) {
    logger.error({ err: error }, 'Get categories error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single category by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await directus.getItemById('categories', req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    logger.error({ err: error }, 'Get category error');
    res.status(404).json({ error: 'Category not found' });
  }
});

/**
 * Create new category
 */
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }
    
    // Set defaults
    const categoryData = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description || '',
      color: req.body.color || '#3b82f6',
      icon: req.body.icon || 'newspaper',
      enabled: req.body.enabled !== undefined ? req.body.enabled : true,
      order: req.body.order || 0,
      featured: req.body.featured || false
    };
    
    const category = await directus.createItem('categories', categoryData);
    res.json({ success: true, data: category, message: 'Category created successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Create category error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update category
 */
router.put('/:id', async (req, res) => {
  try {
    const updated = await directus.updateItem('categories', req.params.id, req.body);
    res.json({ success: true, data: updated, message: 'Category updated successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Update category error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete category
 */
router.delete('/:id', async (req, res) => {
  try {
    await directus.deleteItem('categories', req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Delete category error');
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
