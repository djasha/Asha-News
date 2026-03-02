const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const contentRepository = require('../services/contentRepository');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';

if (strictAuth) {
  router.use(authenticateToken, requireAdmin);
}

/**
 * Admin Topics Routes
 * Provides CRUD operations for topic categories management
 */

/**
 * GET /api/admin/topics
 * List all topics with pagination, filtering, and search
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      enabled, 
      search,
      sortBy = 'sort_order',
      sortOrder = 'asc'
    } = req.query;
    
        
    // Build filter
    let filter = {};
    if (enabled !== undefined) {
      filter.enabled = enabled === 'true';
    }
    if (search) {
      filter._or = [
        { name: { _contains: search } },
        { slug: { _contains: search } },
        { description: { _contains: search } }
      ];
    }
    
    // Build sort
    const sort = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
    
    const topics = await contentRepository.getItems('topic_categories', {
      filter,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      sort: [sort],
      fields: ['*']
    });
    
    // Get total count for pagination
    const total = await contentRepository.getItems('topic_categories', {
      filter,
      limit: -1,
      fields: ['id']
    });
    
    res.json({ 
      success: true, 
      data: topics || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total?.length || 0,
        totalPages: Math.ceil((total?.length || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching topics');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/admin/topics/:id
 * Get single topic by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const topic = await contentRepository.getItemById('topic_categories', req.params.id);
    
    if (!topic) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: topic 
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching topic');
    res.status(404).json({ 
      success: false,
      error: 'Topic not found' 
    });
  }
});

/**
 * POST /api/admin/topics
 * Create new topic
 */
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      icon, 
      color, 
      enabled = true 
    } = req.body;
    
    // Validation
    if (!name || !slug) {
      return res.status(400).json({ 
        success: false,
        error: 'Name and slug are required' 
      });
    }
    
    // Validate slug format (lowercase, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Slug must contain only lowercase letters, numbers, and hyphens'
      });
    }
    
    // Check slug uniqueness
    const existing = await contentRepository.getItems('topic_categories', {
      filter: { slug }
    });
    
    if (existing?.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'A topic with this slug already exists' 
      });
    }
    
    // Get max sort_order to append to end
    const allTopics = await contentRepository.getItems('topic_categories', {
      sort: ['-sort_order'],
      limit: 1
    });
    const maxOrder = allTopics?.[0]?.sort_order || 0;
    
    // Create new topic
    const newTopic = await contentRepository.createItem('topic_categories', {
      name,
      slug,
      description: description || null,
      icon: icon || null,
      color: color || '#3B82F6',
      enabled,
      sort_order: maxOrder + 1,
      article_count: 0
    });
    
    res.status(201).json({ 
      success: true, 
      data: newTopic 
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating topic');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * PUT /api/admin/topics/:id
 * Update existing topic
 */
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      icon, 
      color, 
      enabled, 
      sort_order 
    } = req.body;
    
    // Check if topic exists
    const existing = await contentRepository.getItemById('topic_categories', req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }
    
    // Check slug uniqueness (exclude current topic)
    if (slug && slug !== existing.slug) {
      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
          success: false,
          error: 'Slug must contain only lowercase letters, numbers, and hyphens'
        });
      }
      
      const duplicates = await contentRepository.getItems('topic_categories', {
        filter: { 
          slug,
          id: { _neq: req.params.id }
        }
      });
      
      if (duplicates?.length > 0) {
        return res.status(400).json({ 
          success: false,
          error: 'A topic with this slug already exists' 
        });
      }
    }
    
    // Build update object (only include provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    
    const updated = await contentRepository.updateItem('topic_categories', req.params.id, updateData);
    
    res.json({ 
      success: true, 
      data: updated 
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating topic');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * DELETE /api/admin/topics/:id
 * Delete topic
 */
router.delete('/:id', async (req, res) => {
  try {
    
    // Check if topic exists
    const existing = await contentRepository.getItemById('topic_categories', req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }
    
    // Check if topic has articles
    if (existing.article_count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete topic with ${existing.article_count} associated articles. Disable it instead.`
      });
    }
    
    await contentRepository.deleteItem('topic_categories', req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Topic deleted successfully' 
    });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting topic');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/admin/topics/reorder
 * Bulk reorder topics by sort_order
 */
router.post('/reorder', async (req, res) => {
  try {
    const { topics } = req.body; // Array of {id, sort_order}
    
    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topics array is required'
      });
    }
    
    // Validate each topic has id and sort_order
    for (const topic of topics) {
      if (!topic.id || topic.sort_order === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Each topic must have id and sort_order'
        });
      }
    }
    const results = [];
    
    // Update each topic's sort_order
    for (const topic of topics) {
      try {
        await contentRepository.updateItem('topic_categories', topic.id, {
          sort_order: topic.sort_order
        });
        results.push({ id: topic.id, success: true });
      } catch (error) {
        logger.error({ err: error }, `Failed to update topic ${topic.id}:`, error);
        results.push({ id: topic.id, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    res.json({ 
      success: failCount === 0,
      message: `Reordered ${successCount} topics${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results
    });
  } catch (error) {
    logger.error({ err: error }, 'Error reordering topics');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * PATCH /api/admin/topics/bulk-update
 * Bulk enable/disable or update multiple topics
 */
router.patch('/bulk-update', async (req, res) => {
  try {
    const { ids, updates } = req.body; // ids: array of topic IDs, updates: object with fields to update
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'IDs array is required'
      });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Updates object is required'
      });
    }
    const results = [];
    
    // Update each topic
    for (const id of ids) {
      try {
        await contentRepository.updateItem('topic_categories', id, updates);
        results.push({ id, success: true });
      } catch (error) {
        logger.error({ err: error }, `Failed to update topic ${id}`);
        results.push({ id, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    res.json({ 
      success: failCount === 0,
      message: `Updated ${successCount} topics${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results
    });
  } catch (error) {
    logger.error({ err: error }, 'Error bulk updating topics');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
