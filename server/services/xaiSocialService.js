/**
 * X.AI Grok Service for Social Features
 * Uses X.AI API directly for real-time X/Twitter data access
 */

const aiJson = require('../utils/aiJson');
const logger = require('../utils/logger');

class XAISocialService {
  constructor() {
    this.apiKey = process.env.XAI_API_KEY;
    this.model = process.env.XAI_MODEL || 'grok-4-fast-reasoning';
    this.baseUrl = 'https://api.x.ai/v1';
    this.enabled = !!this.apiKey;
  }

  /**
   * Generate tweets and hashtags for a story cluster
   * @param {Object} cluster - Story cluster with articles
   * @returns {Promise<Object>} { x_posts, trending_hashtags }
   */
  async generateSocialContent(cluster) {
    if (!this.enabled) {
      logger.warn('[XAI] API key not configured, skipping social content generation');
      return { x_posts: [], trending_hashtags: [] };
    }

    try {
      const articles = cluster.articles || [];
      if (articles.length === 0) {
        return { x_posts: [], trending_hashtags: [] };
      }

      logger.info(`🔷 Using X.AI Grok for social content: ${cluster.cluster_title?.substring(0, 60)}...`);

      const prompt = this.buildPrompt(cluster);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are Grok with real-time access to X (Twitter). Find actual trending posts and hashtags related to the news story.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        logger.error('[XAI] API error:', response.status, error);
        return { x_posts: [], trending_hashtags: [] };
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      
      logger.info('[XAI] Raw response length:', content.length);

      const parsed = aiJson.tryParseJson(content);
      
      if (parsed && (parsed.x_posts || parsed.trending_hashtags)) {
        logger.info(`✅ Generated ${parsed.x_posts?.length || 0} tweets, ${parsed.trending_hashtags?.length || 0} hashtags`);
        
        return {
          x_posts: this.validateTweets(parsed.x_posts || []),
          trending_hashtags: this.validateHashtags(parsed.trending_hashtags || [])
        };
      } else {
        logger.warn('[XAI] Failed to parse JSON response');
        return { x_posts: [], trending_hashtags: [] };
      }
    } catch (error) {
      logger.error('[XAI] Error generating social content:', error.message);
      return { x_posts: [], trending_hashtags: [] };
    }
  }

  /**
   * Build prompt for Grok to find relevant tweets
   */
  buildPrompt(cluster) {
    const title = cluster.cluster_title || '';
    const summary = cluster.cluster_summary || '';
    const articles = cluster.articles || [];
    
    const articleTitles = articles
      .slice(0, 5)
      .map((a, i) => `${i + 1}. ${a.title} (${a.source_name})`)
      .join('\n');

    return `Generate 3-5 example X (Twitter) style reactions showing how different perspectives might discuss this news story, plus relevant trending hashtags.

**Story**: ${title}

**Summary**: ${summary}

**Articles**:
${articleTitles}

**Requirements**:
1. Create realistic example tweets from diverse political perspectives (left, center, right)
2. Use plausible account names (like @CNNBreaking, @FoxNews, @BBCNews, @AJEnglish, @nytimes)
3. Show different angles and viewpoints on the story
4. Make engagement metrics realistic but varied
5. Include relevant hashtags people would use

Return JSON:
{
  "x_posts": [
    {
      "author": "@realistic_account_name",
      "text": "Full tweet text showing a specific perspective",
      "url": "",
      "engagement": {"likes": 1234, "retweets": 567, "replies": 89},
      "verified": true,
      "posted_at": "2025-10-11T15:00:00Z"
    }
  ],
  "trending_hashtags": ["#RelevantHashtag1", "#NewsHashtag2", "#TopicHashtag3"]
}

NOTE: These are AI-generated examples, not real tweets. Leave url empty.`;
  }

  /**
   * Validate and clean tweet data
   */
  validateTweets(tweets) {
    if (!Array.isArray(tweets)) return [];
    
    return tweets
      .filter(t => {
        // Must have required fields
        if (!t.author || !t.text || !t.url) return false;
        
        // URL must look valid (has status ID)
        if (!/status\/\d{10,}/i.test(t.url)) {
          logger.warn('[XAI] Invalid tweet URL:', t.url);
          return false;
        }
        
        return true;
      })
      .map(t => ({
        author: String(t.author).replace(/^@/, '@'), // ensure @ prefix
        text: String(t.text).trim(),
        url: this.normalizeTwitterUrl(t.url),
        engagement: {
          likes: parseInt(t.engagement?.likes || 0),
          retweets: parseInt(t.engagement?.retweets || 0),
          replies: parseInt(t.engagement?.replies || 0)
        },
        verified: !!t.verified,
        posted_at: t.posted_at || new Date().toISOString()
      }))
      .slice(0, 5); // max 5 tweets
  }

  /**
   * Validate and clean hashtags
   */
  validateHashtags(hashtags) {
    if (!Array.isArray(hashtags)) return [];
    
    return hashtags
      .filter(h => h && typeof h === 'string')
      .map(h => {
        // Ensure # prefix
        const tag = h.trim();
        return tag.startsWith('#') ? tag : `#${tag}`;
      })
      .filter(h => h.length > 1 && h.length < 50)
      .slice(0, 8); // max 8 hashtags
  }

  /**
   * Normalize Twitter/X URLs
   */
  normalizeTwitterUrl(url) {
    if (!url) return '';
    
    let normalized = String(url).trim();
    
    // Ensure protocol
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    
    // Convert twitter.com to x.com
    normalized = normalized.replace(/^https?:\/\/(www\.)?twitter\.com\//i, 'https://x.com/');
    
    return normalized;
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.enabled;
  }
}

module.exports = XAISocialService;
