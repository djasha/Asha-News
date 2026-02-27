// Topic Categories Service - Fetches from CMS only

class TopicCategoriesService {
  constructor() {
    this.categories = [];
    this.loading = false;
    this.loaded = false;
  }

  async loadCategories() {
    if (this.loaded || this.loading) {
      return this.categories;
    }

    this.loading = true;
    try {
      const response = await fetch('/api/cms/topics');
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        this.categories = data.data;
        console.log(`Loaded ${this.categories.length} topic categories from CMS`);
      } else {
        this.categories = [];
        console.warn('No topic categories available from CMS');
      }
    } catch (error) {
      console.error('Failed to load topic categories from CMS:', error);
      this.categories = [];
    } finally {
      this.loading = false;
      this.loaded = true;
    }

    return this.categories;
  }

  async getAllCategories() {
    await this.loadCategories();
    return this.categories.filter(cat => cat.enabled !== false);
  }

  async getCategoryBySlug(slug) {
    await this.loadCategories();
    return this.categories.find(cat => cat.slug === slug || cat.id === slug);
  }

  async getTrendingCategories(limit = 12) {
    await this.loadCategories();
    return this.categories
      .filter(cat => cat.enabled !== false)
      .slice(0, limit);
  }

  async getMainCategories() {
    await this.loadCategories();
    const mainCategories = ['politics', 'technology', 'world', 'business', 'palestine'];
    return this.categories.filter(cat => 
      mainCategories.includes(cat.slug || cat.id) && cat.enabled !== false
    );
  }

  // Clear cache to force reload
  clearCache() {
    this.categories = [];
    this.loaded = false;
    this.loading = false;
  }
}

// Export singleton instance
const topicCategoriesService = new TopicCategoriesService();
export default topicCategoriesService;
