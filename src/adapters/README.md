# News API Adapters

This directory contains adapters for different news aggregator APIs. Each adapter implements a standardized interface to ensure consistent data format across all news sources.

## Adapter Interface

Each adapter should implement the following methods:

```javascript
class NewsApiAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.rateLimit = config.rateLimit || 1000; // ms between requests
    this.features = config.features || [];
  }

  async fetchArticles(params = {}) {
    // Implementation specific to each API
    // Should return array of normalized articles
  }

  isAvailable() {
    // Check if API is available (has valid key, etc.)
    return !!this.apiKey;
  }
}
```

## Standard Article Format

All adapters should return articles in this format:

```javascript
{
  id: "unique_identifier",
  title: "Article Title",
  summary: "Brief description or excerpt",
  content: "Full article content (if available)",
  url: "https://original-article-url.com",
  source_id: "source_identifier",
  source_name: "Source Display Name",
  author: "Author Name",
  published_at: "2024-01-01T00:00:00Z", // ISO string
  image_url: "https://image-url.com/image.jpg",
  category: "politics|technology|business|etc",
  bias_score: 0.5, // -1 to 1 scale (optional)
  credibility_score: 0.8, // 0 to 1 scale (optional)
  ai_analysis: null // Will be populated by bias analyzer
}
```

## Testing

Each adapter can be tested using the newsApiService:

```javascript
import { newsApiService } from '../services/newsApiService';
import MyAdapter from './myAdapter';

// Register adapter
newsApiService.registerApi('my-api', new MyAdapter(config));

// Test the adapter
const results = await newsApiService.testApi('my-api');
console.log(results);
```
