/**
 * Google Fact Check Tools API Service
 * Provides access to Google's fact-checking database and image search
 */

class GoogleFactCheckService {
  constructor() {
    this.apiKey = process.env.GOOGLE_FACTCHECK_API_KEY;
    this.baseUrl = 'https://factchecktools.googleapis.com/v1alpha1';
  }

  /**
   * Search for fact-checked claims by text query
   */
  async searchClaims(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('Google Fact Check API key not configured');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      query: query,
      ...options
    });

    // Add optional parameters
    if (options.languageCode) params.set('languageCode', options.languageCode);
    if (options.reviewPublisherSiteFilter) params.set('reviewPublisherSiteFilter', options.reviewPublisherSiteFilter);
    if (options.maxAgeDays) params.set('maxAgeDays', options.maxAgeDays.toString());
    if (options.pageSize) params.set('pageSize', options.pageSize.toString());
    if (options.pageToken) params.set('pageToken', options.pageToken);
    if (options.offset) params.set('offset', options.offset.toString());

    try {
      const url = `${this.baseUrl}/claims:search?${params}`;
      console.log('Google Fact Check API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Fact Check API error response:', errorText);
        throw new Error(`Google Fact Check API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatClaimsResponse(data);
    } catch (error) {
      console.error('Google Fact Check search error:', error);
      throw error;
    }
  }

  /**
   * Search for fact-checked claims by image
   */
  async searchClaimsByImage(imageUri, options = {}) {
    if (!this.apiKey) {
      throw new Error('Google Fact Check API key not configured');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      imageUri: imageUri
    });

    // Add optional parameters
    if (options.languageCode) params.set('languageCode', options.languageCode);
    if (options.pageSize) params.set('pageSize', options.pageSize.toString());
    if (options.pageToken) params.set('pageToken', options.pageToken);
    if (options.offset) params.set('offset', options.offset.toString());

    try {
      const response = await fetch(`${this.baseUrl}/claims:imageSearch?${params}`);
      
      if (!response.ok) {
        throw new Error(`Google Fact Check Image API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatImageSearchResponse(data);
    } catch (error) {
      console.error('Google Fact Check image search error:', error);
      throw error;
    }
  }

  /**
   * Get recent fact-checked claims feed
   */
  async getRecentClaims(options = {}) {
    const defaultOptions = {
      pageSize: 10,
      maxAgeDays: 7,
      languageCode: 'en-US',
      ...options
    };

    // Use a broad search query to get recent claims since empty query isn't allowed
    // Search for common terms that will return recent fact-checks
    const broadQueries = ['covid', 'election', 'climate', 'vaccine', 'politics', 'health'];
    const randomQuery = broadQueries[Math.floor(Math.random() * broadQueries.length)];
    
    // Remove problematic parameters that might cause 400 errors
    const cleanOptions = {
      pageSize: defaultOptions.pageSize,
      languageCode: defaultOptions.languageCode
    };
    
    return await this.searchClaims(randomQuery, cleanOptions);
  }

  /**
   * Format claims search response
   */
  formatClaimsResponse(data) {
    if (!data.claims) {
      return {
        claims: [],
        nextPageToken: null,
        total: 0
      };
    }

    const formattedClaims = data.claims.map(claim => ({
      text: claim.text,
      claimant: claim.claimant,
      claimDate: claim.claimDate,
      claimReview: claim.claimReview?.map(review => ({
        publisher: {
          name: review.publisher?.name,
          site: review.publisher?.site
        },
        url: review.url,
        title: review.title,
        reviewDate: review.reviewDate,
        textualRating: review.textualRating,
        languageCode: review.languageCode
      })) || []
    }));

    return {
      claims: formattedClaims,
      nextPageToken: data.nextPageToken || null,
      total: formattedClaims.length
    };
  }

  /**
   * Format image search response
   */
  formatImageSearchResponse(data) {
    if (!data.results) {
      return {
        results: [],
        nextPageToken: null,
        total: 0
      };
    }

    const formattedResults = data.results.map(result => ({
      claim: result.claim ? {
        text: result.claim.text,
        claimant: result.claim.claimant,
        claimDate: result.claim.claimDate
      } : null,
      claimReview: result.claimReview?.map(review => ({
        publisher: {
          name: review.publisher?.name,
          site: review.publisher?.site
        },
        url: review.url,
        title: review.title,
        reviewDate: review.reviewDate,
        textualRating: review.textualRating,
        languageCode: review.languageCode
      })) || []
    }));

    return {
      results: formattedResults,
      nextPageToken: data.nextPageToken || null,
      total: formattedResults.length
    };
  }

  /**
   * Check if the service is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Get mock data for development/testing
   */
  getMockSearchResults(query) {
    const mockPublishers = [
      { name: "Snopes", site: "snopes.com" },
      { name: "PolitiFact", site: "politifact.com" },
      { name: "FactCheck.org", site: "factcheck.org" },
      { name: "Lead Stories", site: "leadstories.com" },
      { name: "AFP Fact Check", site: "factcheck.afp.com" },
      { name: "Reuters Fact Check", site: "reuters.com" },
      { name: "Full Fact", site: "fullfact.org" }
    ];

    const mockRatings = ["False", "True", "Mostly False", "Mostly True", "Mixed", "Misleading", "Unproven"];
    
    const mockClaims = [
      {
        text: `Viral claim about ${query}: Social media posts suggest misleading information regarding recent developments.`,
        claimant: "Social Media Users",
        claimDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        claimReview: [{
          publisher: mockPublishers[Math.floor(Math.random() * mockPublishers.length)],
          url: `https://example.com/fact-check-${query.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Fact Check: Viral Claims About ${query} Are Misleading`,
          reviewDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          textualRating: mockRatings[Math.floor(Math.random() * mockRatings.length)],
          languageCode: "en"
        }]
      },
      {
        text: `Recent reports claim that ${query} has been linked to various unsubstantiated theories circulating online.`,
        claimant: "News Websites",
        claimDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        claimReview: [{
          publisher: mockPublishers[Math.floor(Math.random() * mockPublishers.length)],
          url: `https://example.com/verification-${query.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Investigation: Claims About ${query} Lack Scientific Evidence`,
          reviewDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
          textualRating: mockRatings[Math.floor(Math.random() * mockRatings.length)],
          languageCode: "en"
        }]
      },
      {
        text: `Breaking: Experts weigh in on controversial statements regarding ${query} that have been spreading rapidly.`,
        claimant: "Public Figures",
        claimDate: new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString(),
        claimReview: [{
          publisher: mockPublishers[Math.floor(Math.random() * mockPublishers.length)],
          url: `https://example.com/analysis-${query.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Expert Analysis: What the Evidence Says About ${query}`,
          reviewDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
          textualRating: mockRatings[Math.floor(Math.random() * mockRatings.length)],
          languageCode: "en"
        }]
      }
    ];

    return {
      claims: mockClaims,
      nextPageToken: null,
      total: mockClaims.length
    };
  }
}

module.exports = new GoogleFactCheckService();
