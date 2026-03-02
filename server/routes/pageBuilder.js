const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const axios = require('axios');
const contentRepository = require('../services/contentRepository');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';

const requireAdminIfStrict = (req, res, next) => {
  if (!strictAuth) return next();
  return authenticateToken(req, res, () => requireAdmin(req, res, next));
};

// Get page configuration by slug
router.get('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const pages = await contentRepository.getItems('pages', {
      filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
      limit: 1
    });

    if (pages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    const page = pages[0];
    
    res.json({
      success: true,
      data: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        components: page.components || [],
        layout_settings: page.layout_settings || {},
        seo_settings: page.seo_settings || {},
        updated_at: page.updated_at
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Error fetching page');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page configuration'
    });
  }
});

// Get all pages
router.get('/pages', async (req, res) => {
  try {
    const { status = 'published' } = req.query;
    
    const pages = await contentRepository.getItems('pages', {
      filter: { status: { _eq: status } },
      sort: ['title']
    });

    res.json({
      success: true,
      data: pages.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        updated_at: page.updated_at
      }))
    });

  } catch (error) {
    logger.error({ err: error }, 'Error fetching pages');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pages'
    });
  }
});

// Update page configuration
router.put('/pages/:id', requireAdminIfStrict, async (req, res) => {
  try {
    const { id } = req.params;
    const { components, layout_settings, seo_settings } = req.body;

    const updateData = {};
    if (components !== undefined) updateData.components = components;
    if (layout_settings !== undefined) updateData.layout_settings = layout_settings;
    if (seo_settings !== undefined) updateData.seo_settings = seo_settings;

    const updatedPage = await contentRepository.updateItem('pages', id, updateData);

    res.json({
      success: true,
      data: updatedPage,
      message: 'Page configuration updated successfully'
    });

  } catch (error) {
    logger.error({ err: error }, 'Error updating page');
    res.status(500).json({
      success: false,
      error: 'Failed to update page configuration'
    });
  }
});

// Get component data for a specific component type
router.get('/components/:type/data', async (req, res) => {
  const componentType = req.params.type;
  try {
    const { limit = 10, offset = 0 } = req.query;

    let data = {};

    switch (componentType) {
      case 'story_clusters':
        try {
          const clustersRes = await axios.get(`http://localhost:3001/api/clusters`, { params: { limit, offset } });
          const clustersData = clustersRes.data;
          data = clustersData.success ? clustersData.data : [];
        } catch (err) {
          data = [];
        }
        break;

      case 'embed':
        // No data needed for embeds
        data = {};
        break;

      case 'news_feed':
        try {
          const articlesRes = await axios.get(`http://localhost:3001/api/articles`, { params: { limit, offset } });
          const articlesData = articlesRes.data;
          data = articlesData.success ? articlesData.data : [];
        } catch (err) {
          data = [];
        }
        break;

      case 'daily_briefs':
        // Get latest articles for daily briefs
        try {
          const briefsRes = await axios.get(`http://localhost:3001/api/articles`, { params: { limit: 10 } });
          const briefsData = briefsRes.data;
          data = briefsData.success ? briefsData.data.slice(0, 6) : [];
        } catch (err) {
          data = [];
        }
        break;

      case 'trending_grid':
        // Get trending topics from CMS
        try {
          const trending = await contentRepository.getItems('trending_topics', {
            filter: { status: { _eq: 'published' } },
            limit: parseInt(limit),
            sort: ['-created_at']
          });
          data = trending;
        } catch (err) {
          logger.warn('Trending topics not available:', err.message);
          data = [];
        }
        break;

      case 'gaza_israel_news':
        // Get Palestine-specific articles
        try {
          const palestineArticles = await contentRepository.getPalestineArticles({ limit: parseInt(limit) });
          data = palestineArticles.articles || [];
        } catch (err) {
          logger.warn('Palestine articles not available:', err.message);
          data = [];
        }
        break;

      default:
        data = { message: `Component type '${componentType}' data not implemented yet` };
    }

    res.json({
      success: true,
      component_type: componentType,
      data: data
    });

  } catch (error) {
    logger.error({ err: error }, `Error fetching ${componentType} component data`);
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${componentType} component data`
    });
  }
});

// Get available component types
router.get('/components/types', (req, res) => {
  const componentTypes = [
    {
      type: 'hero',
      name: 'Hero Section',
      description: 'Large hero section with story cluster or article',
      settings: {
        show_clusters: { field_type: 'boolean', default: true },
        fallback_to_articles: { field_type: 'boolean', default: true },
        max_clusters: { field_type: 'number', default: 1 },
        background_gradient: { field_type: 'string', default: 'from-primary-50 to-primary-100' }
      }
    },
    {
      type: 'story_clusters',
      name: 'Story Clusters',
      description: 'Display grouped news stories with bias analysis',
      settings: {
        limit: { field_type: 'number', default: 6 },
        show_bias_distribution: { field_type: 'boolean', default: true },
        show_source_count: { field_type: 'boolean', default: true }
      }
    },
    {
      type: 'news_feed',
      name: 'News Feed',
      description: 'List of individual news articles',
      settings: {
        layout: { field_type: 'select', options: ['grid', 'list', 'sidebar'], default: 'grid' },
        show_filters: { field_type: 'boolean', default: true },
        show_bias_overview: { field_type: 'boolean', default: true },
        pagination: { field_type: 'boolean', default: true },
        articles_per_page: { field_type: 'number', default: 20 }
      }
    },
    {
      type: 'daily_briefs',
      name: 'Daily Briefing',
      description: 'Carousel of daily news summaries',
      settings: {
        carousel_enabled: { field_type: 'boolean', default: true },
        auto_play: { field_type: 'boolean', default: true },
        interval: { field_type: 'number', default: 8000 }
      }
    },
    {
      type: 'trending_grid',
      name: 'Trending Topics',
      description: 'Grid of trending news topics',
      settings: {
        grid_columns: { field_type: 'number', default: 3 },
        show_images: { field_type: 'boolean', default: true },
        limit: { field_type: 'number', default: 6 }
      }
    },
    {
      type: 'image_board',
      name: 'Visual Stories',
      description: 'Masonry layout of visual news content',
      settings: {
        masonry_layout: { field_type: 'boolean', default: true },
        image_quality: { field_type: 'select', options: ['low', 'medium', 'high'], default: 'high' }
      }
    },
    {
      type: 'analysis_section',
      name: 'AI Analysis',
      description: 'AI-powered news analysis and insights',
      settings: {
        show_bias_charts: { field_type: 'boolean', default: true },
        show_fact_checks: { field_type: 'boolean', default: true }
      }
    },
    {
      type: 'topic_carousel',
      name: 'Topic Navigation',
      description: 'Horizontal scrolling topic categories',
      settings: {
        auto_scroll: { field_type: 'boolean', default: true },
        show_article_count: { field_type: 'boolean', default: true }
      }
    },
    {
      type: 'gaza_israel_news',
      name: 'Palestine Coverage',
      description: 'Dedicated section for Palestine/Israel news',
      settings: {
        forensic_focus: { field_type: 'boolean', default: true },
        show_investigations: { field_type: 'boolean', default: true }
      }
    },
    {
      type: 'latest_from_asha',
      name: 'Latest Updates',
      description: 'Latest articles from Asha News',
      settings: {
        limit: { field_type: 'number', default: 5 },
        show_timestamps: { field_type: 'boolean', default: true }
      }
    },
    {
      type: 'custom_html',
      name: 'Custom HTML',
      description: 'Custom HTML content block',
      settings: {
        html_content: { field_type: 'textarea', default: '' },
        css_classes: { field_type: 'string', default: '' }
      }
    },
    {
      type: 'embed',
      name: 'Embed (iframe)',
      description: 'Embed external apps or dashboards via iframe',
      settings: {
        src: { field_type: 'string', default: '' },
        height: { field_type: 'number', default: 500 },
        allow: { field_type: 'string', default: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' },
        sandbox: { field_type: 'string', default: '' },
        referrerpolicy: { field_type: 'string', default: 'no-referrer-when-downgrade' }
      }
    }
  ];

  res.json({
    success: true,
    data: componentTypes
  });
});

// Preview page configuration
router.post('/pages/:id/preview', requireAdminIfStrict, async (req, res) => {
  try {
    const { id } = req.params;
    const { components, layout_settings } = req.body;

    // Generate preview data for each component
    const previewData = await Promise.all(
      (components || []).map(async (component) => {
        if (component && component.enabled === false) return { ...component, preview_data: null };

        const compType = component?.component_type || component?.type;
        if (!compType) return { ...component, preview_data: null };

        try {
          const url = `http://localhost:3001/api/page-builder/components/${encodeURIComponent(compType)}/data`;
          const dataRes = await axios.get(url, { params: { limit: 3 } });
          const data = dataRes.data;

          return {
            ...component,
            preview_data: data?.success ? data.data : null
          };
        } catch (err) {
          return { ...component, preview_data: null };
        }
      })
    );

    res.json({
      success: true,
      data: {
        id,
        components: previewData,
        layout_settings: layout_settings || {},
        preview_url: `http://localhost:3000/preview/${id}`
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Error generating preview');
    res.status(500).json({
      success: false,
      error: 'Failed to generate page preview'
    });
  }
});

module.exports = router;
