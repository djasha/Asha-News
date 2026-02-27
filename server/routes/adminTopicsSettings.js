const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

/**
 * Admin Topics Settings Routes
 * Manages all topic-related settings
 */

/**
 * GET /api/admin/topics-settings
 * Get all topic-related settings
 */
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    // Extract topic-related settings with defaults
    const topicsSettings = {
      topicsPage: settings.topicsPage || {
        layout: {
          heroEnabled: true,
          sidebarEnabled: true,
          articlesPerPage: 50,
          gridColumns: {
            mobile: 1,
            tablet: 2,
            desktop: 2
          },
          autoLoadMore: false
        },
        display: {
          showBiasIndicators: true,
          showSourceLogos: true,
          showArticleCount: true,
          showFollowButton: true,
          showTopicDescription: true,
          showCoverageStats: true,
          showPublishDate: true,
          compactMode: false
        },
        sidebar: {
          enabled: true,
          showCoveredMostBy: true,
          maxSources: 8,
          showSuggestSource: true,
          showBiasBreakdown: true,
          showMediaBreakdown: false,
          position: 'right'
        },
        sorting: {
          defaultSort: 'date_desc',
          options: ['date_desc', 'date_asc', 'relevance', 'bias_center_first', 'source_count']
        },
        seo: {
          titleTemplate: '{topic} - News Coverage | Asha.News',
          descriptionTemplate: 'Comprehensive news coverage about {topic} from multiple sources and perspectives.',
          ogImageTemplate: '/images/topics/{slug}-og.jpg'
        }
      },
      trendingBar: settings.trendingBar || {
        enabled: true,
        position: 'top',
        animation: {
          enabled: true,
          speed: 'normal',
          speedMs: 50,
          direction: 'left',
          pauseOnHover: true,
          infiniteLoop: true
        },
        display: {
          showIcon: true,
          showArticleCount: true,
          showPlusButton: true,
          showTrendingBadge: false,
          maxTopics: 12,
          duplicateForSeamless: true,
          compactMode: false
        },
        style: {
          backgroundColor: 'surface',
          textColor: 'primary',
          hoverColor: 'primary-50',
          borderRadius: 'full',
          fontSize: 'sm',
          padding: { x: 3, y: 1 }
        },
        filtering: {
          minArticleCount: 0,
          enabledOnly: true,
          sortBy: 'sort_order',
          excludeSlugs: [],
          includeHidden: false
        },
        behavior: {
          clickAction: 'navigate',
          openInNewTab: false,
          trackClicks: true
        }
      },
      topicCarousel: settings.topicCarousel || {
        enabled: true,
        title: 'Topics',
        subtitle: 'Browse by category',
        layout: {
          itemsPerRow: { mobile: 1, tablet: 2, desktop: 4 },
          showNavigation: true,
          autoplay: false,
          autoplaySpeed: 5000
        },
        display: {
          showArticleCount: true,
          maxArticlesPerTopic: 4,
          showViewAllButton: true
        },
        filtering: {
          featuredOnly: false,
          minArticleCount: 1,
          maxTopics: 8,
          excludeSlugs: []
        }
      },
      clusteringTopics: {
        allowedTopics: settings.clusterSettings?.allowedTopics || [],
        topicAliases: settings.clusterSettings?.topicAliases || {},
        topicMatchStrategy: settings.clusterSettings?.topicMatchStrategy || 'keywords',
        enableStrictMatching: settings.clusterSettings?.enableStrictMatching || false,
        caseSensitive: settings.clusterSettings?.caseSensitive || false,
        matchLocation: settings.clusterSettings?.matchLocation || {
          title: true,
          summary: true,
          content: true,
          tags: true
        }
      },
      topicAnalytics: settings.topicAnalytics || {
        enabled: true,
        trackViews: true,
        trackClicks: true,
        trackDuration: true,
        updateTrendingScore: true,
        trendingCalculation: {
          viewWeight: 0.4,
          clickWeight: 0.4,
          durationWeight: 0.2,
          timeDecay: 0.1,
          updateInterval: '4h'
        },
        reporting: {
          generateDailyReports: false,
          reportRecipients: [],
          includeGraphs: true
        }
      }
    };
    
    res.json({
      success: true,
      data: topicsSettings
    });
  } catch (error) {
    logger.error({ err: error }, 'Error reading topics settings');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * PUT /api/admin/topics-settings
 * Update topic-related settings
 */
router.put('/', async (req, res) => {
  try {
    const { 
      topicsPage, 
      trendingBar, 
      topicCarousel,
      clusteringTopics,
      topicAnalytics 
    } = req.body;
    
    // Read current settings
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    // Update settings sections
    if (topicsPage) {
      settings.topicsPage = { ...settings.topicsPage, ...topicsPage };
    }
    
    if (trendingBar) {
      settings.trendingBar = { ...settings.trendingBar, ...trendingBar };
    }
    
    if (topicCarousel) {
      settings.topicCarousel = { ...settings.topicCarousel, ...topicCarousel };
    }
    
    if (clusteringTopics) {
      if (!settings.clusterSettings) {
        settings.clusterSettings = {};
      }
      if (clusteringTopics.allowedTopics !== undefined) {
        settings.clusterSettings.allowedTopics = clusteringTopics.allowedTopics;
      }
      if (clusteringTopics.topicAliases !== undefined) {
        settings.clusterSettings.topicAliases = clusteringTopics.topicAliases;
      }
      if (clusteringTopics.topicMatchStrategy !== undefined) {
        settings.clusterSettings.topicMatchStrategy = clusteringTopics.topicMatchStrategy;
      }
      if (clusteringTopics.enableStrictMatching !== undefined) {
        settings.clusterSettings.enableStrictMatching = clusteringTopics.enableStrictMatching;
      }
      if (clusteringTopics.caseSensitive !== undefined) {
        settings.clusterSettings.caseSensitive = clusteringTopics.caseSensitive;
      }
      if (clusteringTopics.matchLocation !== undefined) {
        settings.clusterSettings.matchLocation = clusteringTopics.matchLocation;
      }
    }
    
    if (topicAnalytics) {
      settings.topicAnalytics = { ...settings.topicAnalytics, ...topicAnalytics };
    }
    
    // Write updated settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: 'Topics settings updated successfully' 
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating topics settings');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/admin/topics-settings/:section
 * Get specific settings section
 */
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['topicsPage', 'trendingBar', 'topicCarousel', 'clusteringTopics', 'topicAnalytics'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        error: `Invalid section. Valid sections: ${validSections.join(', ')}`
      });
    }
    
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    let sectionData = {};
    
    if (section === 'clusteringTopics') {
      sectionData = {
        allowedTopics: settings.clusterSettings?.allowedTopics || [],
        topicAliases: settings.clusterSettings?.topicAliases || {},
        topicMatchStrategy: settings.clusterSettings?.topicMatchStrategy || 'keywords',
        enableStrictMatching: settings.clusterSettings?.enableStrictMatching || false,
        caseSensitive: settings.clusterSettings?.caseSensitive || false,
        matchLocation: settings.clusterSettings?.matchLocation || {
          title: true,
          summary: true,
          content: true,
          tags: true
        }
      };
    } else {
      sectionData = settings[section] || {};
    }
    
    res.json({
      success: true,
      data: sectionData
    });
  } catch (error) {
    logger.error({ err: error }, `Error reading ${req.params.section} settings`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * PUT /api/admin/topics-settings/:section
 * Update specific settings section
 */
router.put('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['topicsPage', 'trendingBar', 'topicCarousel', 'clusteringTopics', 'topicAnalytics'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        error: `Invalid section. Valid sections: ${validSections.join(', ')}`
      });
    }
    
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    if (section === 'clusteringTopics') {
      if (!settings.clusterSettings) {
        settings.clusterSettings = {};
      }
      Object.assign(settings.clusterSettings, req.body);
    } else {
      settings[section] = { ...settings[section], ...req.body };
    }
    
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: `${section} settings updated successfully` 
    });
  } catch (error) {
    logger.error({ err: error }, `Error updating ${req.params.section} settings`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/admin/topics-settings/reset
 * Reset all topics settings to defaults
 */
router.post('/reset', async (req, res) => {
  try {
    const { section } = req.body; // Optional: reset specific section only
    
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    const defaults = {
      topicsPage: {
        layout: {
          heroEnabled: true,
          sidebarEnabled: true,
          articlesPerPage: 50,
          gridColumns: { mobile: 1, tablet: 2, desktop: 2 },
          autoLoadMore: false
        },
        display: {
          showBiasIndicators: true,
          showSourceLogos: true,
          showArticleCount: true,
          showFollowButton: true,
          showTopicDescription: true,
          showCoverageStats: true,
          showPublishDate: true,
          compactMode: false
        },
        sidebar: {
          enabled: true,
          showCoveredMostBy: true,
          maxSources: 8,
          showSuggestSource: true,
          showBiasBreakdown: true,
          showMediaBreakdown: false,
          position: 'right'
        },
        sorting: {
          defaultSort: 'date_desc',
          options: ['date_desc', 'date_asc', 'relevance', 'bias_center_first', 'source_count']
        },
        seo: {
          titleTemplate: '{topic} - News Coverage | Asha.News',
          descriptionTemplate: 'Comprehensive news coverage about {topic} from multiple sources and perspectives.',
          ogImageTemplate: '/images/topics/{slug}-og.jpg'
        }
      },
      trendingBar: {
        enabled: true,
        position: 'top',
        animation: {
          enabled: true,
          speed: 'normal',
          speedMs: 50,
          direction: 'left',
          pauseOnHover: true,
          infiniteLoop: true
        },
        display: {
          showIcon: true,
          showArticleCount: true,
          showPlusButton: true,
          showTrendingBadge: false,
          maxTopics: 12,
          duplicateForSeamless: true,
          compactMode: false
        },
        style: {
          backgroundColor: 'surface',
          textColor: 'primary',
          hoverColor: 'primary-50',
          borderRadius: 'full',
          fontSize: 'sm',
          padding: { x: 3, y: 1 }
        },
        filtering: {
          minArticleCount: 0,
          enabledOnly: true,
          sortBy: 'sort_order',
          excludeSlugs: [],
          includeHidden: false
        },
        behavior: {
          clickAction: 'navigate',
          openInNewTab: false,
          trackClicks: true
        }
      },
      topicCarousel: {
        enabled: true,
        title: 'Topics',
        subtitle: 'Browse by category',
        layout: {
          itemsPerRow: { mobile: 1, tablet: 2, desktop: 4 },
          showNavigation: true,
          autoplay: false,
          autoplaySpeed: 5000
        },
        display: {
          showArticleCount: true,
          maxArticlesPerTopic: 4,
          showViewAllButton: true
        },
        filtering: {
          featuredOnly: false,
          minArticleCount: 1,
          maxTopics: 8,
          excludeSlugs: []
        }
      }
    };
    
    if (section && defaults[section]) {
      settings[section] = defaults[section];
    } else if (!section) {
      Object.assign(settings, defaults);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid section specified'
      });
    }
    
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: section ? `${section} reset to defaults` : 'All topics settings reset to defaults' 
    });
  } catch (error) {
    logger.error({ err: error }, 'Error resetting topics settings');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
