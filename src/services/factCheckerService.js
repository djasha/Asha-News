/**
 * Fact Checker Service
 * Handles claim verification, evidence aggregation, and source credibility analysis
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class FactCheckerService {
  constructor() {
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
  }

  /**
   * Submit a claim for fact-checking
   * @param {string} claim - The claim text to verify
   * @param {Object} options - Additional options (user_id, source_url, etc.)
   * @returns {Promise<Object>} Claim submission response with ID
   */
  async submitClaim(claim, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/fact-check/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_text: claim,
          source_url: options.sourceUrl,
          user_id: options.userId,
          submitted_at: new Date().toISOString(),
          status: 'pending'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit claim: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  }

  /**
   * Get fact-check results for a claim
   * @param {string} claimId - The claim ID
   * @returns {Promise<Object>} Fact-check results
   */
  async getClaimResults(claimId) {
    try {
      const response = await fetch(`${API_BASE_URL}/fact-check/claims/${claimId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get claim results: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting claim results:', error);
      throw error;
    }
  }

  /**
   * Get available AI providers
   * @returns {Promise<Object>} Available providers info
   */
  async getAvailableProviders() {
    try {
      const response = await fetch(`${API_BASE_URL}/fact-check/providers`);
      
      if (!response.ok) {
        throw new Error(`Failed to get providers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting providers:', error);
      throw error;
    }
  }

  /**
   * Analyze claim using specified AI provider
   * @param {string} claim - The claim to analyze
   * @param {string} provider - AI provider ('openai', 'google', or 'auto')
   * @returns {Promise<Object>} AI analysis results
   */
  async analyzeClaimWithAI(claim, provider = 'auto') {
    try {
      const response = await fetch(`${API_BASE_URL}/fact-check/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_text: claim,
          provider: provider
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing claim with AI:', error);
      throw error;
    }
  }

  /**
   * Search for evidence across multiple sources
   * @param {Array<string>} searchTerms - Terms to search for
   * @param {string} claim - Original claim for context
   * @returns {Promise<Array>} Evidence from various sources
   */
  async searchEvidence(searchTerms, claim) {
    try {
      const response = await fetch(`${API_BASE_URL}/fact-check/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_terms: searchTerms,
          claim: claim,
          sources: ['news_api', 'wikipedia', 'fact_check_sites']
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to search evidence: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching evidence:', error);
      throw error;
    }
  }

  /**
   * Get source credibility rating
   * @param {string} sourceUrl - URL of the source to check
   * @returns {Promise<Object>} Credibility assessment
   */
  async getSourceCredibility(sourceUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/fact-check/credibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source_url: sourceUrl })
      });

      if (!response.ok) {
        throw new Error(`Failed to get source credibility: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting source credibility:', error);
      throw error;
    }
  }

  /**
   * Get claim history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} User's claim history
   */
  async getClaimHistory(userId, options = {}) {
    try {
      const params = new URLSearchParams({
        user_id: userId,
        limit: options.limit || 20,
        offset: options.offset || 0,
        status: options.status || 'all'
      });

      const response = await fetch(`${API_BASE_URL}/fact-check/history?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get claim history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting claim history:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive fact-check (combines all services)
   * @param {string} claim - The claim to fact-check
   * @param {Object} options - Additional options (provider, userId, sourceUrl)
   * @returns {Promise<Object>} Complete fact-check results
   */
  async performFactCheck(claim, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/fact-check/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_text: claim,
          user_id: options.userId,
          source_url: options.sourceUrl,
          provider: options.provider || 'auto'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to perform fact-check: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing fact-check:', error);
      throw error;
    }
  }

  /**
   * Calculate overall assessment based on AI analysis and evidence
   * @param {Object} aiAnalysis - AI analysis results
   * @param {Array} evidence - Evidence array
   * @param {Array} credibilityChecks - Source credibility results
   * @returns {Object} Overall assessment
   */
  calculateOverallAssessment(aiAnalysis, evidence, credibilityChecks) {
    const supportingEvidence = evidence.filter(e => e.supports_claim === true).length;
    const contradictingEvidence = evidence.filter(e => e.supports_claim === false).length;
    const neutralEvidence = evidence.filter(e => e.supports_claim === null).length;

    const avgCredibility = credibilityChecks
      .filter(c => c && c.score)
      .reduce((sum, c) => sum + c.score, 0) / credibilityChecks.length || 0.5;

    let overallVerdict = 'unverifiable';
    let confidenceScore = 0.5;

    if (supportingEvidence > contradictingEvidence && avgCredibility > 0.7) {
      overallVerdict = 'likely_true';
      confidenceScore = Math.min(0.9, (supportingEvidence / (supportingEvidence + contradictingEvidence)) * avgCredibility);
    } else if (contradictingEvidence > supportingEvidence && avgCredibility > 0.7) {
      overallVerdict = 'likely_false';
      confidenceScore = Math.min(0.9, (contradictingEvidence / (supportingEvidence + contradictingEvidence)) * avgCredibility);
    } else if (supportingEvidence > 0 && contradictingEvidence > 0) {
      overallVerdict = 'mixed_evidence';
      confidenceScore = 0.6;
    }

    return {
      verdict: overallVerdict,
      confidence_score: confidenceScore,
      evidence_summary: {
        supporting: supportingEvidence,
        contradicting: contradictingEvidence,
        neutral: neutralEvidence,
        avg_source_credibility: avgCredibility
      }
    };
  }
}

export default new FactCheckerService();
