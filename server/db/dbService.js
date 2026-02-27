/**
 * Database Service — drop-in replacement for DirectusService
 * Uses Drizzle ORM for direct PostgreSQL access (no Directus middleware).
 */
const { eq, ilike, desc, asc, and, inArray, count } = require('drizzle-orm');
const logger = require('../utils/logger');
const { getDb } = require('./index');
const schema = require('./schema');

class DbService {
  get db() {
    return getDb();
  }

  // ─── Utility ────────────────────────────────────────────────

  extractSummaryFromContent(content, maxLength = 300) {
    if (!content || !content.trim()) return '';
    let text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let summary = '';
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if ((summary + trimmed).length <= maxLength) {
        summary += (summary ? ' ' : '') + trimmed;
      } else break;
    }
    if (!summary && text.length > 0) {
      summary = text.substring(0, maxLength);
      const lastSpace = summary.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.8) summary = summary.substring(0, lastSpace);
      summary += '...';
    }
    return summary.trim();
  }

  mapBiasScore(biasScore) {
    if (biasScore <= 0.2) return 'far_left';
    if (biasScore <= 0.4) return 'lean_left';
    if (biasScore <= 0.6) return 'center';
    if (biasScore <= 0.8) return 'lean_right';
    return 'far_right';
  }

  // ─── Articles ───────────────────────────────────────────────

  async getArticles(options = {}) {
    try {
      const { limit = 50, offset = 0, category, source, status } = options;
      const conditions = [];
      if (status) conditions.push(eq(schema.articles.status, status));
      if (category) conditions.push(ilike(schema.articles.category, `%${category}%`));
      if (source) conditions.push(ilike(schema.articles.source_name, `%${source}%`));

      const rows = await this.db
        .select()
        .from(schema.articles)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.articles.date_created))
        .limit(limit)
        .offset(offset);

      return rows.map(article => {
        let summary = (article.summary || '').trim();
        if (!summary || summary.length < 10) summary = (article.byline || '').trim();
        if ((!summary || summary.length < 10) && article.content) {
          summary = this.extractSummaryFromContent(article.content, 300);
        }
        if (summary.length > 350) summary = summary.substring(0, 347) + '...';
        return {
          id: article.id,
          title: article.title || 'Untitled',
          summary: summary || article.title,
          content: article.content || '',
          source_url: article.url || '',
          source_name: article.source_name || article.author_name || 'Unknown Source',
          category: article.category || 'General',
          published_at: article.date_created,
          political_bias: article.political_bias || 'center',
          credibility_score: article.credibility_score || 0.7,
          image_url: article.featured_image_alt,
          breaking_news: article.breaking_news || false,
          featured: article.featured || false,
        };
      });
    } catch (error) {
      logger.error('DbService getArticles error:', error.message);
      return [];
    }
  }

  async getArticleCount(options = {}) {
    try {
      const { status, category, source } = options;
      const conditions = [];
      if (status) conditions.push(eq(schema.articles.status, status));
      if (category) conditions.push(ilike(schema.articles.category, `%${category}%`));
      if (source) conditions.push(ilike(schema.articles.source_name, `%${source}%`));

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.articles)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return result?.count || 0;
    } catch (error) {
      logger.error('DbService getArticleCount error:', error.message);
      return 0;
    }
  }

  async getArticleById(articleId) {
    try {
      const [article] = await this.db
        .select()
        .from(schema.articles)
        .where(eq(schema.articles.id, articleId))
        .limit(1);

      if (!article) return null;
      return {
        id: article.id,
        title: article.title || 'Untitled',
        summary: article.summary || '',
        content: article.content || '',
        source_url: article.source_url || article.url || '',
        source_name: article.source_name || 'Unknown Source',
        category: article.category || 'General',
        published_at: article.published_at || article.date_created,
        bias_score: article.bias_score || 0.5,
        political_bias: this.mapBiasScore(article.bias_score || 0.5),
        author_name: article.author_name || 'Asha News',
        image_url: article.image_url || article.featured_image_alt || null,
        status: article.status || 'published',
        date_created: article.date_created,
        date_updated: article.date_updated,
      };
    } catch (error) {
      logger.error(`DbService getArticleById error for ${articleId}:`, error.message);
      return null;
    }
  }

  async findArticleBySourceUrl(sourceUrl) {
    try {
      if (!sourceUrl) return null;
      const [article] = await this.db
        .select({
          id: schema.articles.id,
          title: schema.articles.title,
          source_name: schema.articles.source_name,
          category: schema.articles.category,
          summary: schema.articles.summary,
        })
        .from(schema.articles)
        .where(eq(schema.articles.url, sourceUrl))
        .limit(1);
      return article || null;
    } catch (error) {
      logger.error('DbService findArticleBySourceUrl error:', error.message);
      return null;
    }
  }

  async createArticle(articleData) {
    try {
      const [created] = await this.db
        .insert(schema.articles)
        .values(articleData)
        .returning();
      return created;
    } catch (error) {
      logger.error('DbService createArticle error:', error.message);
      throw error;
    }
  }

  async updateArticleById(articleId, updates) {
    try {
      const [updated] = await this.db
        .update(schema.articles)
        .set({ ...updates, date_updated: new Date() })
        .where(eq(schema.articles.id, articleId))
        .returning();
      return updated;
    } catch (error) {
      logger.error(`DbService updateArticleById error for ${articleId}:`, error.message);
      throw error;
    }
  }

  async upsertArticleBySourceUrl(article) {
    const payload = {
      title: article.title || 'Untitled',
      summary: article.summary || '',
      content: article.content || '',
      url: article.source_url || article.url,
      source_name: article.source_name || article.source || 'Unknown Source',
      category: article.category || 'General',
      published_at: article.published_at ? new Date(article.published_at) : new Date(),
      bias_score: typeof article.bias_score === 'number' ? article.bias_score : 0.5,
      political_bias: article.political_bias || 'center',
      author_name: article.author || article.author_name || 'Unknown Author',
      featured_image_alt: article.image_url || null,
      breaking_news: !!article.breaking,
      featured: !!article.featured,
      word_count: article.word_count || null,
      reading_time: article.reading_time || null,
      fact_check_status: article.fact_check_status || 'unverified',
      credibility_score: article.credibility_score || 0.8,
    };
    const existing = await this.findArticleBySourceUrl(payload.url);
    if (existing && existing.id) {
      return this.updateArticleById(existing.id, payload);
    }
    return this.createArticle(payload);
  }

  async deleteArticle(id) {
    try {
      await this.db.delete(schema.articles).where(eq(schema.articles.id, id));
      return true;
    } catch (error) {
      logger.error(`DbService deleteArticle error for ${id}:`, error.message);
      throw error;
    }
  }

  // ─── Tags ───────────────────────────────────────────────────

  async findTagByName(name) {
    try {
      if (!name) return null;
      const [tag] = await this.db
        .select()
        .from(schema.tags)
        .where(ilike(schema.tags.name, name))
        .limit(1);
      return tag || null;
    } catch (error) {
      logger.error('DbService findTagByName error:', error.message);
      return null;
    }
  }

  async createTag({ name, slug }) {
    try {
      const [created] = await this.db
        .insert(schema.tags)
        .values({ name, slug: slug || name })
        .returning();
      return created;
    } catch (error) {
      logger.error('DbService createTag error:', error.message);
      throw error;
    }
  }

  async upsertTag(name, slug) {
    const existing = await this.findTagByName(name);
    if (existing) return existing;
    return this.createTag({ name, slug });
  }

  async linkArticleTags(articleId, tagIds = []) {
    if (!articleId || !Array.isArray(tagIds) || tagIds.length === 0) return;
    try {
      const existing = await this.db
        .select()
        .from(schema.articlesTags)
        .where(eq(schema.articlesTags.articles_id, articleId));

      const hasTag = new Set(existing.map(l => String(l.tags_id)));
      const toCreate = tagIds
        .filter(id => id && !hasTag.has(String(id)))
        .map(tid => ({ articles_id: articleId, tags_id: tid }));

      if (toCreate.length > 0) {
        await this.db.insert(schema.articlesTags).values(toCreate);
      }
    } catch (error) {
      logger.error('DbService linkArticleTags error:', error.message);
    }
  }

  // ─── Story Clusters ────────────────────────────────────────

  async saveCluster(cluster) {
    try {
      const [created] = await this.db
        .insert(schema.storyClusters)
        .values(cluster)
        .returning();
      return created;
    } catch (error) {
      logger.error('DbService saveCluster error:', error.message);
      throw error;
    }
  }

  async saveClusterArticles(clusterId, articleIds) {
    try {
      // Clear existing relationships
      await this.db
        .delete(schema.articlesStoryClusters)
        .where(eq(schema.articlesStoryClusters.story_clusters_id, clusterId));

      if (articleIds.length === 0) return;

      const values = articleIds.map(articleId => ({
        story_clusters_id: clusterId,
        articles_id: articleId,
      }));
      await this.db.insert(schema.articlesStoryClusters).values(values);
      logger.info(`Linked ${articleIds.length} articles to cluster ${clusterId}`);
    } catch (error) {
      logger.error('DbService saveClusterArticles error:', error.message);
      throw error;
    }
  }

  async getClusters(options = {}) {
    try {
      const { limit = 20, offset = 0, status = 'active', sort = '-created_at' } = options;
      const orderCol = sort.startsWith('-') ? desc(schema.storyClusters.created_at) : asc(schema.storyClusters.created_at);

      const rows = await this.db
        .select()
        .from(schema.storyClusters)
        .where(eq(schema.storyClusters.status, status))
        .orderBy(orderCol)
        .limit(limit)
        .offset(offset);

      // Fetch linked articles for each cluster
      for (const cluster of rows) {
        const junctions = await this.db
          .select({ articles_id: schema.articlesStoryClusters.articles_id })
          .from(schema.articlesStoryClusters)
          .where(eq(schema.articlesStoryClusters.story_clusters_id, cluster.id));

        const articleIds = junctions.map(j => j.articles_id).filter(Boolean);
        if (articleIds.length > 0) {
          const articles = await this.db
            .select()
            .from(schema.articles)
            .where(inArray(schema.articles.id, articleIds));
          cluster.articles_story_clusters = articles.map(a => ({ id: a.id, articles_id: a }));
        } else {
          cluster.articles_story_clusters = [];
        }
      }
      return rows;
    } catch (error) {
      logger.error('DbService getClusters error:', error.message);
      return [];
    }
  }

  async getClusterCount(options = {}) {
    try {
      const { status = 'active', category } = options;
      const conditions = [eq(schema.storyClusters.status, status)];
      if (category) conditions.push(eq(schema.storyClusters.topic_category, category));

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.storyClusters)
        .where(and(...conditions));
      return result?.count || 0;
    } catch (error) {
      logger.error('DbService getClusterCount error:', error.message);
      return 0;
    }
  }

  async getClusterById(clusterId) {
    try {
      const [cluster] = await this.db
        .select()
        .from(schema.storyClusters)
        .where(eq(schema.storyClusters.id, clusterId))
        .limit(1);

      if (!cluster) return null;

      const junctions = await this.db
        .select({ articles_id: schema.articlesStoryClusters.articles_id })
        .from(schema.articlesStoryClusters)
        .where(eq(schema.articlesStoryClusters.story_clusters_id, clusterId));

      const articleIds = junctions.map(j => j.articles_id).filter(Boolean);
      if (articleIds.length > 0) {
        const articles = await this.db
          .select()
          .from(schema.articles)
          .where(inArray(schema.articles.id, articleIds));
        cluster.articles_story_clusters = articles.map(a => ({ id: a.id, articles_id: a }));
      } else {
        cluster.articles_story_clusters = [];
      }
      return cluster;
    } catch (error) {
      logger.error(`DbService getClusterById error for ${clusterId}:`, error.message);
      return null;
    }
  }

  // ─── RSS Sources ────────────────────────────────────────────

  async getRSSSources(filter = {}) {
    try {
      const conditions = [];
      if (filter.enabled !== undefined) conditions.push(eq(schema.rssSources.enabled, filter.enabled));
      if (filter.status) conditions.push(eq(schema.rssSources.status, filter.status));

      const rows = await this.db
        .select()
        .from(schema.rssSources)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(schema.rssSources.name));
      return rows;
    } catch (error) {
      logger.error('DbService getRSSSources error:', error.message);
      return [];
    }
  }

  async getRSSSourceById(id) {
    try {
      const [source] = await this.db
        .select()
        .from(schema.rssSources)
        .where(eq(schema.rssSources.id, id))
        .limit(1);
      return source || null;
    } catch (error) {
      logger.error(`DbService getRSSSourceById error for ${id}:`, error.message);
      return null;
    }
  }

  async createRSSSource(sourceData) {
    try {
      const [created] = await this.db
        .insert(schema.rssSources)
        .values(sourceData)
        .returning();
      return created;
    } catch (error) {
      logger.error('DbService createRSSSource error:', error.message);
      throw error;
    }
  }

  async updateRSSSource(id, updates) {
    try {
      const [updated] = await this.db
        .update(schema.rssSources)
        .set(updates)
        .where(eq(schema.rssSources.id, id))
        .returning();
      return updated;
    } catch (error) {
      logger.error(`DbService updateRSSSource error for ${id}:`, error.message);
      throw error;
    }
  }

  async deleteRSSSource(id) {
    try {
      await this.db.delete(schema.rssSources).where(eq(schema.rssSources.id, id));
      return true;
    } catch (error) {
      logger.error(`DbService deleteRSSSource error for ${id}:`, error.message);
      throw error;
    }
  }

  // ─── Generic CRUD (replaces DirectusService generic methods) ─

  _getTable(collection) {
    const tableMap = {
      articles: schema.articles,
      story_clusters: schema.storyClusters,
      articles_story_clusters: schema.articlesStoryClusters,
      tags: schema.tags,
      articles_tags: schema.articlesTags,
      rss_sources: schema.rssSources,
      RSS_Sources: schema.rssSources,
      global_settings: schema.globalSettings,
      site_configuration: schema.siteConfiguration,
      feature_flags: schema.featureFlags,
      navigation_items: schema.navigationItems,
      menu_items: schema.menuItems,
      topic_categories: schema.topicCategories,
      homepage_sections: schema.homepageSections,
      breaking_news: schema.breakingNews,
      curated_collections: schema.curatedCollections,
      editorial_briefs: schema.editorialBriefs,
      daily_briefs: schema.dailyBriefs,
      page_content: schema.pageContent,
      legal_pages: schema.legalPages,
      fact_check_claims: schema.factCheckClaims,
      news_sources: schema.newsSources,
      trending_topics: schema.trendingTopics,
      users: schema.users,
      subscription_tiers: schema.subscriptionTiers,
      user_subscriptions: schema.userSubscriptions,
      api_configs: schema.apiConfigs,
      api_configurations: schema.apiConfigurations,
      refresh_tokens: schema.refreshTokens,
    };
    return tableMap[collection];
  }

  async createItem(collection, data) {
    try {
      const table = this._getTable(collection);
      if (!table) throw new Error(`Unknown collection: ${collection}`);
      const [created] = await this.db.insert(table).values(data).returning();
      return created;
    } catch (error) {
      logger.error(`DbService createItem error for ${collection}:`, error.message);
      throw error;
    }
  }

  async updateItem(collection, id, data) {
    try {
      const table = this._getTable(collection);
      if (!table) throw new Error(`Unknown collection: ${collection}`);
      // Find the id column — assume first column named 'id'
      const idCol = table.id;
      const [updated] = await this.db.update(table).set(data).where(eq(idCol, id)).returning();
      return updated;
    } catch (error) {
      logger.error(`DbService updateItem error for ${collection}:`, error.message);
      throw error;
    }
  }

  async deleteItem(collection, id) {
    try {
      const table = this._getTable(collection);
      if (!table) throw new Error(`Unknown collection: ${collection}`);
      await this.db.delete(table).where(eq(table.id, id));
      return true;
    } catch (error) {
      logger.error(`DbService deleteItem error for ${collection}:`, error.message);
      throw error;
    }
  }

  async getItemById(collection, id) {
    try {
      const table = this._getTable(collection);
      if (!table) throw new Error(`Unknown collection: ${collection}`);
      const [item] = await this.db.select().from(table).where(eq(table.id, id)).limit(1);
      return item || null;
    } catch (error) {
      logger.error(`DbService getItemById error for ${collection}:`, error.message);
      return null;
    }
  }

  async getItems(collection, options = {}) {
    try {
      const table = this._getTable(collection);
      if (!table) throw new Error(`Unknown collection: ${collection}`);
      const { limit = 100, offset = 0, sort } = options;

      let query = this.db.select().from(table);

      // Basic sort support
      if (sort && table[sort.replace('-', '')]) {
        const colName = sort.replace('-', '');
        query = query.orderBy(sort.startsWith('-') ? desc(table[colName]) : asc(table[colName]));
      }

      const rows = await query.limit(limit).offset(offset);
      return rows;
    } catch (error) {
      logger.error(`DbService getItems error for ${collection}:`, error.message);
      return [];
    }
  }

  // ─── Subscription Tiers ─────────────────────────────────────

  async getSubscriptionTiers() {
    try {
      return await this.db
        .select()
        .from(schema.subscriptionTiers)
        .where(eq(schema.subscriptionTiers.is_active, true))
        .orderBy(asc(schema.subscriptionTiers.sort_order));
    } catch (error) {
      logger.error('DbService getSubscriptionTiers error:', error.message);
      return [];
    }
  }

  async getSubscriptionTierBySlug(slug) {
    try {
      const [tier] = await this.db
        .select()
        .from(schema.subscriptionTiers)
        .where(eq(schema.subscriptionTiers.slug, slug))
        .limit(1);
      return tier || null;
    } catch (error) {
      logger.error('DbService getSubscriptionTierBySlug error:', error.message);
      return null;
    }
  }

  async createSubscriptionTier(data) {
    try {
      const [created] = await this.db.insert(schema.subscriptionTiers).values(data).returning();
      return created;
    } catch (error) {
      logger.error('DbService createSubscriptionTier error:', error.message);
      throw error;
    }
  }

  async updateSubscriptionTier(id, data) {
    try {
      const [updated] = await this.db
        .update(schema.subscriptionTiers)
        .set({ ...data, date_updated: new Date() })
        .where(eq(schema.subscriptionTiers.id, id))
        .returning();
      return updated;
    } catch (error) {
      logger.error('DbService updateSubscriptionTier error:', error.message);
      throw error;
    }
  }

  async deleteSubscriptionTier(id) {
    try {
      await this.db.delete(schema.subscriptionTiers).where(eq(schema.subscriptionTiers.id, id));
      return true;
    } catch (error) {
      logger.error('DbService deleteSubscriptionTier error:', error.message);
      throw error;
    }
  }

  // ─── User Subscriptions ─────────────────────────────────────

  async getUserSubscription(userId) {
    try {
      const [sub] = await this.db
        .select()
        .from(schema.userSubscriptions)
        .where(and(
          eq(schema.userSubscriptions.user_id, userId),
          eq(schema.userSubscriptions.status, 'active')
        ))
        .limit(1);
      return sub || null;
    } catch (error) {
      logger.error('DbService getUserSubscription error:', error.message);
      return null;
    }
  }

  // ─── Raw SQL escape hatch ───────────────────────────────────

  async rawQuery(queryText, params = []) {
    const { getPool } = require('./index');
    const result = await getPool().query(queryText, params);
    return result.rows;
  }
}

module.exports = new DbService();
