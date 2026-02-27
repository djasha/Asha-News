// Google Analytics 4 Service for Asha News
// Tracks page views, article views, user interactions, and news-specific events
import logger from '../utils/logger';

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Initialize Google Analytics 4
  initialize() {
    if (this.isInitialized || !this.measurementId) {
      return;
    }

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      debug_mode: this.debugMode,
      send_page_view: false // We'll handle page views manually
    });

    this.isInitialized = true;
    logger.info('Analytics initialized:', this.measurementId);
  }

  // Track page views
  trackPageView(path, title) {
    if (!this.isInitialized) return;

    window.gtag('event', 'page_view', {
      page_title: title,
      page_location: window.location.href,
      page_path: path
    });

    if (this.debugMode) {
      logger.debug('Page view tracked:', { path, title });
    }
  }

  // Track article views with news-specific metadata
  trackArticleView(article) {
    if (!this.isInitialized) return;

    window.gtag('event', 'article_view', {
      event_category: 'Content',
      article_id: article.id,
      article_title: article.title,
      article_category: article.category,
      article_source: article.source,
      article_bias_rating: article.biasRating,
      article_published_date: article.publishedAt,
      custom_parameters: {
        content_type: 'news_article',
        bias_score: article.biasScore || 0,
        source_credibility: article.sourceCredibility || 'unknown'
      }
    });

    if (this.debugMode) {
      logger.debug('Article view tracked:', article.title);
    }
  }

  // Track story cluster views (unique to Asha News)
  trackStoryClusterView(cluster) {
    if (!this.isInitialized) return;

    window.gtag('event', 'story_cluster_view', {
      event_category: 'Content',
      cluster_id: cluster.id,
      cluster_title: cluster.title,
      article_count: cluster.articles?.length || 0,
      bias_distribution: JSON.stringify(cluster.biasDistribution),
      custom_parameters: {
        content_type: 'story_cluster',
        left_sources: cluster.biasDistribution?.left || 0,
        center_sources: cluster.biasDistribution?.center || 0,
        right_sources: cluster.biasDistribution?.right || 0
      }
    });

    if (this.debugMode) {
      logger.debug('Story cluster view tracked:', cluster.title);
    }
  }

  // Track fact-check interactions
  trackFactCheck(claim, result) {
    if (!this.isInitialized) return;

    window.gtag('event', 'fact_check', {
      event_category: 'Engagement',
      claim_text: claim.substring(0, 100), // Truncate for privacy
      fact_check_result: result.verdict,
      credibility_score: result.credibilityScore,
      custom_parameters: {
        content_type: 'fact_check',
        sources_checked: result.sourcesCount || 0
      }
    });

    if (this.debugMode) {
      logger.debug('Fact check tracked:', result.verdict);
    }
  }

  // Track user engagement events
  trackEngagement(action, details = {}) {
    if (!this.isInitialized) return;

    const eventMap = {
      'article_share': 'share',
      'article_save': 'save_content',
      'newsletter_signup': 'sign_up',
      'search': 'search',
      'filter_apply': 'filter',
      'bias_toggle': 'bias_view_toggle',
      'theme_toggle': 'theme_change'
    };

    const eventName = eventMap[action] || action;

    window.gtag('event', eventName, {
      event_category: 'Engagement',
      ...details,
      custom_parameters: {
        user_action: action,
        timestamp: new Date().toISOString()
      }
    });

    if (this.debugMode) {
      logger.debug('Engagement tracked:', action, details);
    }
  }

  // Track performance metrics
  trackPerformance(metric, value, category = 'Performance') {
    if (!this.isInitialized) return;

    window.gtag('event', 'performance_metric', {
      event_category: category,
      metric_name: metric,
      metric_value: value,
      custom_parameters: {
        measurement_type: 'performance',
        page_path: window.location.pathname
      }
    });

    if (this.debugMode) {
      logger.debug('Performance tracked:', metric, value);
    }
  }

  // Track conversion events (subscriptions, etc.)
  trackConversion(action, value = 0) {
    if (!this.isInitialized) return;

    window.gtag('event', 'conversion', {
      event_category: 'Conversion',
      action: action,
      value: value,
      currency: 'USD',
      custom_parameters: {
        conversion_type: action,
        user_journey_stage: this.getUserJourneyStage()
      }
    });

    if (this.debugMode) {
      logger.debug('Conversion tracked:', action, value);
    }
  }

  // Helper: Determine user journey stage
  getUserJourneyStage() {
    const path = window.location.pathname;
    if (path === '/') return 'homepage';
    if (path.includes('/article/')) return 'article_reading';
    if (path.includes('/fact-check')) return 'fact_checking';
    if (path.includes('/subscribe')) return 'subscription';
    return 'browsing';
  }

  // Track custom news events
  trackNewsEvent(eventType, data) {
    if (!this.isInitialized) return;

    window.gtag('event', `news_${eventType}`, {
      event_category: 'News',
      ...data,
      custom_parameters: {
        news_event_type: eventType,
        timestamp: new Date().toISOString()
      }
    });

    if (this.debugMode) {
      logger.debug('News event tracked:', eventType, data);
    }
  }

  // Set user properties for segmentation
  setUserProperties(properties) {
    if (!this.isInitialized) return;

    window.gtag('config', this.measurementId, {
      custom_map: properties
    });

    if (this.debugMode) {
      logger.debug('User properties set:', properties);
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
