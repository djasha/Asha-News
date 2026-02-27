// News Sources Service - Fetches from CMS only

class NewsSourcesService {
  constructor() {
    this.sources = [];
    this.loading = false;
    this.loaded = false;
  }

  async loadSources() {
    if (this.loaded || this.loading) {
      return this.sources;
    }

    this.loading = true;
    try {
      const response = await fetch('/api/cms/news-sources');
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        this.sources = data.data;
        console.log(`Loaded ${this.sources.length} news sources from CMS`);
      } else {
        this.sources = [];
        console.warn('No news sources available from CMS');
      }
    } catch (error) {
      console.error('Failed to load news sources from CMS:', error);
      this.sources = [];
    } finally {
      this.loading = false;
      this.loaded = true;
    }

    return this.sources;
  }

  async getSourceById(id) {
    await this.loadSources();
    return this.sources.find(source => source.id === id || source.name === id);
  }

  async getSourcesByBias(bias) {
    await this.loadSources();
    return this.sources.filter(source => 
      source.bias_rating === bias || source.political_bias === bias
    );
  }

  async getAllSources() {
    await this.loadSources();
    return this.sources;
  }

  // Clear cache to force reload
  clearCache() {
    this.sources = [];
    this.loaded = false;
    this.loading = false;
  }
}

// Export singleton instance
const newsSourcesService = new NewsSourcesService();
export default newsSourcesService;

// Export individual functions for backward compatibility
export const getSourceById = (id) => newsSourcesService.getSourceById(id);
export const getSourcesByBias = (bias) => newsSourcesService.getSourcesByBias(bias);
export const getAllSources = () => newsSourcesService.getAllSources();
