// RSS Feed Adapter - Free, unlimited news aggregation
import { XMLParser } from 'fast-xml-parser';

class RSSAdapter {
  constructor(config = {}) {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: true,
      trimValues: true
    });
    this.rateLimit = config.rateLimit || 500; // 500ms between requests
    this.features = [
      'live_news',
      'full_content',
      'unlimited_requests',
      'real_time',
      'diverse_sources',
      'international_coverage'
    ];
    this.sources = this.getMajorNewsSources();
  }

  isAvailable() {
    return true; // RSS feeds are always available
  }

  async fetchArticles(params = {}) {
    let sources = params.sources || this.getDefaultSources();
    const limit = params.limit || 25;
    const category = params.category;
    const keywords = params.keywords;
    const countries = params.countries;
    
    console.log('RSS fetchArticles called with params:', params);
    
    // Filter sources by category first for better performance
    if (category && category !== 'general') {
      sources = this.getSourcesByCategory(category);
      console.log(`Filtered sources by category '${category}':`, sources.map(s => s.name));
      if (sources.length === 0) {
        // Fallback to all sources if no category-specific sources found
        sources = this.getDefaultSources();
        console.log('No category sources found, using default sources');
      }
    }
    
    // Filter sources by country if specified (exclude countries logic)
    if (countries) {
      const countryList = countries.split(',').map(c => c.trim().toLowerCase());
      // If countries is provided, exclude those countries (inverse filtering)
      sources = sources.filter(source => !countryList.includes(source.country.toLowerCase()));
      console.log(`Excluded sources from countries '${countries}':`, sources.map(s => `${s.name} (${s.country})`));
      
      // If no sources remain after filtering, use international sources
      if (sources.length === 0) {
        sources = this.sources.filter(source => !['us', 'gb'].includes(source.country.toLowerCase()));
        console.log('No sources after country filter, using international sources:', sources.map(s => s.name));
      }
    }
    
    try {
      // Fetch from multiple RSS sources in parallel
      const promises = sources.map(source => this.fetchFromSource(source, params));
      const results = await Promise.allSettled(promises);
      
      // Combine successful results
      const allArticles = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(article => article !== null);

      console.log(`Fetched ${allArticles.length} total articles from ${sources.length} sources`);

      // Filter by keywords if specified
      let filteredArticles = allArticles;
      if (keywords && keywords.trim()) {
        const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
        filteredArticles = allArticles.filter(article => {
          const searchText = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
          return keywordList.some(keyword => searchText.includes(keyword));
        });
        console.log(`Filtered by keywords '${keywords}': ${filteredArticles.length} articles`);
        
        // If no articles found with keywords, try broader search
        if (filteredArticles.length === 0) {
          console.log('No articles found with exact keyword match, trying broader search...');
          filteredArticles = allArticles.filter(article => {
            const searchText = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
            return keywordList.some(keyword => {
              // Try partial matches and related terms
              const variations = [keyword, keyword + 's', keyword.slice(0, -1)];
              return variations.some(variation => searchText.includes(variation));
            });
          });
          console.log(`Broader keyword search found: ${filteredArticles.length} articles`);
        }
      }

      // Additional filtering by category if needed (for mixed sources)
      if (category && category !== 'general') {
        filteredArticles = filteredArticles.filter(article => 
          article.category.toLowerCase() === category.toLowerCase()
        );
        console.log(`Filtered by category '${category}': ${filteredArticles.length} articles`);
      }

      // Sort by publication date (newest first)
      filteredArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      // Apply limit
      const finalArticles = filteredArticles.slice(0, limit);
      console.log(`Final result: ${finalArticles.length} articles after limit`);
      
      return finalArticles;
    } catch (error) {
      console.error('RSS Adapter Error:', error);
      throw error;
    }
  }

  async fetchFromSource(source, params = {}) {
    try {
      const response = await fetch(source.rss_url);
      const xmlText = await response.text();
      const feed = this.parser.parse(xmlText);
      
      // Extract items from different RSS formats
      const items = this.extractItems(feed);
      
      return items.map(item => this.normalizeArticle(item, source)).filter(Boolean);
    } catch (error) {
      console.warn(`Failed to fetch from ${source.name}:`, error);
      return [];
    }
  }

  extractItems(feed) {
    // Handle different RSS/Atom formats
    if (feed.rss && feed.rss.channel && feed.rss.channel.item) {
      return Array.isArray(feed.rss.channel.item) ? feed.rss.channel.item : [feed.rss.channel.item];
    }
    if (feed.feed && feed.feed.entry) {
      return Array.isArray(feed.feed.entry) ? feed.feed.entry : [feed.feed.entry];
    }
    if (feed.channel && feed.channel.item) {
      return Array.isArray(feed.channel.item) ? feed.channel.item : [feed.channel.item];
    }
    return [];
  }

  normalizeArticle(item, source) {
    try {
      // Extract image URL from various possible fields
      const imageUrl = this.extractImageUrl(item, source);
      
      // Clean and extract content - handle XML parser format
      const content = item['content:encoded'] || item.description || item.summary || '';
      const summary = this.extractSummary(item.description || item.summary || content);

      return {
        id: this.generateId(item),
        title: item.title || '',
        summary: summary,
        content: this.cleanHtmlContent(content),
        url: item.link || item.guid || '',
        source_id: source.id,
        source_name: source.name,
        author: item.author || item['dc:creator'] || source.name,
        published_at: this.normalizeDate(item.pubDate || item.published),
        image_url: imageUrl,
        category: source.category || 'general',
        bias_score: source.bias_score || null,
        credibility_score: source.credibility_score || null,
        ai_analysis: null,
        api_source: 'rss',
        fetched_at: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Error normalizing article:', error);
      return null;
    }
  }

  extractImageUrl(item, source) {
    // Try multiple image sources - adapted for fast-xml-parser format
    if (item.enclosure && item.enclosure['@_url'] && this.isImageUrl(item.enclosure['@_url'])) {
      return item.enclosure['@_url'];
    }
    
    if (item['media:content'] && item['media:content']['@_url']) {
      return item['media:content']['@_url'];
    }
    
    if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
      return item['media:thumbnail']['@_url'];
    }

    // Extract from content
    const content = item['content:encoded'] || item.description || '';
    if (content) {
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    return source.default_image || null;
  }

  isImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  }

  extractSummary(text) {
    if (!text) return '';
    
    // Remove HTML tags
    const cleaned = text.replace(/<[^>]*>/g, '');
    
    // Truncate to reasonable length
    return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
  }

  cleanHtmlContent(html) {
    if (!html) return '';
    
    // Basic HTML cleaning - remove scripts, styles, etc.
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  generateId(item) {
    const str = `${item.title || ''}-${item.link || ''}-${item.pubDate || ''}`;
    // Use a safer encoding method that handles special characters
    const hash = str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString(36).substring(0, 16);
  }

  normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  getDefaultSources() {
    return this.sources.filter(source => source.priority === 'high').slice(0, 10);
  }

  getMajorNewsSources() {
    return [
      // US Major Networks
      {
        id: 'cnn',
        name: 'CNN',
        rss_url: 'http://rss.cnn.com/rss/edition.rss',
        category: 'general',
        country: 'us',
        language: 'en',
        bias_score: -0.2, // Slightly left-leaning
        credibility_score: 0.8,
        priority: 'high'
      },
      {
        id: 'bbc',
        name: 'BBC News',
        rss_url: 'http://feeds.bbci.co.uk/news/rss.xml',
        category: 'general',
        country: 'gb',
        language: 'en',
        bias_score: 0.0, // Center
        credibility_score: 0.9,
        priority: 'high'
      },
      {
        id: 'reuters',
        name: 'Reuters',
        rss_url: 'https://feeds.reuters.com/reuters/topNews',
        category: 'general',
        country: 'us',
        language: 'en',
        bias_score: 0.0, // Center
        credibility_score: 0.9,
        priority: 'high'
      },
      {
        id: 'ap-news',
        name: 'Associated Press',
        rss_url: 'https://feeds.apnews.com/rss/apf-topnews',
        category: 'general',
        country: 'us',
        language: 'en',
        bias_score: 0.0, // Center
        credibility_score: 0.9,
        priority: 'high'
      },
      {
        id: 'npr',
        name: 'NPR',
        rss_url: 'https://feeds.npr.org/1001/rss.xml',
        category: 'general',
        country: 'us',
        language: 'en',
        bias_score: -0.1, // Slightly left-leaning
        credibility_score: 0.85,
        priority: 'high'
      },
      {
        id: 'fox-news',
        name: 'Fox News',
        rss_url: 'http://feeds.foxnews.com/foxnews/latest',
        category: 'general',
        country: 'us',
        language: 'en',
        bias_score: 0.4, // Right-leaning
        credibility_score: 0.6,
        priority: 'high'
      },
      {
        id: 'wsj',
        name: 'Wall Street Journal',
        rss_url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
        category: 'business',
        country: 'us',
        language: 'en',
        bias_score: 0.2, // Slightly right-leaning
        credibility_score: 0.85,
        priority: 'high'
      },
      {
        id: 'guardian',
        name: 'The Guardian',
        rss_url: 'https://www.theguardian.com/world/rss',
        category: 'general',
        country: 'gb',
        language: 'en',
        bias_score: -0.3, // Left-leaning
        credibility_score: 0.8,
        priority: 'high'
      },
      {
        id: 'nyt',
        name: 'New York Times',
        rss_url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        category: 'general',
        country: 'us',
        language: 'en',
        bias_score: -0.2, // Slightly left-leaning
        credibility_score: 0.85,
        priority: 'high'
      },
      {
        id: 'washington-post',
        name: 'Washington Post',
        rss_url: 'http://feeds.washingtonpost.com/rss/national',
        category: 'general',
        country: 'us',
        language: 'en',
        bias_score: -0.2, // Slightly left-leaning
        credibility_score: 0.8,
        priority: 'high'
      },
      // International Sources
      {
        id: 'al-jazeera',
        name: 'Al Jazeera',
        rss_url: 'https://www.aljazeera.com/xml/rss/all.xml',
        category: 'general',
        country: 'qa',
        language: 'en',
        bias_score: -0.1,
        credibility_score: 0.75,
        priority: 'medium'
      },
      {
        id: 'dw',
        name: 'Deutsche Welle',
        rss_url: 'https://rss.dw.com/rdf/rss-en-all',
        category: 'general',
        country: 'de',
        language: 'en',
        bias_score: 0.0,
        credibility_score: 0.8,
        priority: 'medium'
      },
      {
        id: 'france24',
        name: 'France 24',
        rss_url: 'https://www.france24.com/en/rss',
        category: 'general',
        country: 'fr',
        language: 'en',
        bias_score: 0.0,
        credibility_score: 0.8,
        priority: 'medium'
      },
      // Technology Sources
      {
        id: 'techcrunch',
        name: 'TechCrunch',
        rss_url: 'https://techcrunch.com/feed/',
        category: 'technology',
        country: 'us',
        language: 'en',
        bias_score: 0.0,
        credibility_score: 0.8,
        priority: 'medium'
      },
      {
        id: 'ars-technica',
        name: 'Ars Technica',
        rss_url: 'http://feeds.arstechnica.com/arstechnica/index',
        category: 'technology',
        country: 'us',
        language: 'en',
        bias_score: 0.0,
        credibility_score: 0.85,
        priority: 'medium'
      },
      // Business Sources
      {
        id: 'bloomberg',
        name: 'Bloomberg',
        rss_url: 'https://feeds.bloomberg.com/politics/news.rss',
        category: 'business',
        country: 'us',
        language: 'en',
        bias_score: 0.1,
        credibility_score: 0.85,
        priority: 'medium'
      },
      // Middle East Sources for better Palestine coverage
      {
        id: 'haaretz',
        name: 'Haaretz',
        rss_url: 'https://www.haaretz.com/cmlink/1.628752',
        category: 'general',
        country: 'il',
        language: 'en',
        bias_score: -0.2,
        credibility_score: 0.8,
        priority: 'medium'
      },
      {
        id: 'times-of-israel',
        name: 'Times of Israel',
        rss_url: 'https://www.timesofisrael.com/feed/',
        category: 'general',
        country: 'il',
        language: 'en',
        bias_score: 0.1,
        credibility_score: 0.75,
        priority: 'medium'
      },
      {
        id: 'middle-east-eye',
        name: 'Middle East Eye',
        rss_url: 'https://www.middleeasteye.net/rss.xml',
        category: 'general',
        country: 'gb',
        language: 'en',
        bias_score: -0.2,
        credibility_score: 0.7,
        priority: 'medium'
      },
      {
        id: 'arab-news',
        name: 'Arab News',
        rss_url: 'https://www.arabnews.com/rss.xml',
        category: 'general',
        country: 'sa',
        language: 'en',
        bias_score: 0.1,
        credibility_score: 0.7,
        priority: 'medium'
      }
    ];
  }

  // Get sources by category
  getSourcesByCategory(category) {
    return this.sources.filter(source => source.category === category);
  }

  // Get sources by bias range
  getSourcesByBias(minBias = -1, maxBias = 1) {
    return this.sources.filter(source => 
      source.bias_score >= minBias && source.bias_score <= maxBias
    );
  }

  // Get balanced source mix
  getBalancedSources(count = 10) {
    const leftSources = this.sources.filter(s => s.bias_score < -0.1);
    const centerSources = this.sources.filter(s => s.bias_score >= -0.1 && s.bias_score <= 0.1);
    const rightSources = this.sources.filter(s => s.bias_score > 0.1);

    const result = [];
    const perCategory = Math.floor(count / 3);
    
    result.push(...leftSources.slice(0, perCategory));
    result.push(...centerSources.slice(0, perCategory));
    result.push(...rightSources.slice(0, perCategory));
    
    // Fill remaining slots with high-priority sources
    const remaining = count - result.length;
    const highPriority = this.sources
      .filter(s => s.priority === 'high' && !result.includes(s))
      .slice(0, remaining);
    
    result.push(...highPriority);
    
    return result.slice(0, count);
  }

  // Get all available sources
  getAllSources() {
    return this.sources;
  }

  // Get source statistics
  getSourceStats() {
    const total = this.sources.length;
    const byBias = {
      left: this.sources.filter(s => s.bias_score < -0.1).length,
      center: this.sources.filter(s => s.bias_score >= -0.1 && s.bias_score <= 0.1).length,
      right: this.sources.filter(s => s.bias_score > 0.1).length
    };
    const byCategory = {};
    const byCountry = {};
    
    this.sources.forEach(source => {
      byCategory[source.category] = (byCategory[source.category] || 0) + 1;
      byCountry[source.country] = (byCountry[source.country] || 0) + 1;
    });

    return {
      total,
      byBias,
      byCategory,
      byCountry,
      averageCredibility: this.sources.reduce((sum, s) => sum + s.credibility_score, 0) / total
    };
  }
}

export default RSSAdapter;
