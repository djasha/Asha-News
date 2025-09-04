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
      const response = await fetch(`${this.baseUrl}/claims:search?${params}`);
      
      if (!response.ok) {
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
      pageSize: 20,
      maxAgeDays: 30,
      languageCode: 'en-US',
      ...options
    };

    // Search with empty query to get recent claims
    return await this.searchClaims('', defaultOptions);
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
}

module.exports = new GoogleFactCheckService();
