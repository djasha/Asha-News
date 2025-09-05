/**
 * Fact Check API Routes
 * Handles claim submission, verification, and evidence aggregation
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const aiProviderService = require('../services/aiProviderService');
const googleFactCheckService = require('../services/googleFactCheckService');

// In-memory storage for development (replace with database in production)
const claims = new Map();
const evidenceCache = new Map();

/**
 * POST /api/fact-check/claims
 * Submit a new claim for fact-checking
 */
router.post('/claims', async (req, res) => {
  try {
    const { claim_text, source_url, user_id } = req.body;

    if (!claim_text || claim_text.trim().length === 0) {
      return res.status(400).json({
        error: 'Claim text is required'
      });
    }

    const claimId = uuidv4();
    const claim = {
      id: claimId,
      claim_text: claim_text.trim(),
      source_url: source_url || null,
      user_id: user_id || null,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      results: null
    };

    claims.set(claimId, claim);

    res.status(201).json({
      claim_id: claimId,
      status: 'submitted',
      message: 'Claim submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({
      error: 'Failed to submit claim'
    });
  }
});

/**
 * GET /api/fact-check/claims/:id
 * Get fact-check results for a specific claim
 */
router.get('/claims/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const claim = claims.get(id);

    if (!claim) {
      return res.status(404).json({
        error: 'Claim not found'
      });
    }

    res.json(claim);
  } catch (error) {
    console.error('Error getting claim:', error);
    res.status(500).json({
      error: 'Failed to retrieve claim'
    });
  }
});

/**
 * GET /api/fact-check/providers
 * Get available AI providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providerInfo = aiProviderService.getProviderInfo();
    res.json(providerInfo);
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({
      error: 'Failed to get provider information'
    });
  }
});

/**
 * POST /api/fact-check/analyze
 * Analyze a claim using AI with evidence integration
 */
router.post('/analyze', async (req, res) => {
  try {
    const { claim, provider = 'auto', evidence = [] } = req.body;

    if (!claim) {
      return res.status(400).json({
        error: 'Claim is required'
      });
    }

    // Use AI provider service for analysis with evidence
    const analysis = await aiProviderService.analyzeClaim(claim, provider, evidence);

    res.json({
      claim_id: require('uuid').v4(),
      claim,
      ai_analysis: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing claim:', error);
    res.status(500).json({
      error: 'Failed to analyze claim'
    });
  }
});

/**
 * POST /api/fact-check/evidence
 * Search for evidence across multiple sources
 */
router.post('/evidence', async (req, res) => {
  try {
    const { search_terms, claim, sources = ['news_api'] } = req.body;

    if (!search_terms || !Array.isArray(search_terms)) {
      return res.status(400).json({
        error: 'Search terms array is required'
      });
    }

    const cacheKey = JSON.stringify({ search_terms, sources });
    
    // Check cache first
    if (evidenceCache.has(cacheKey)) {
      return res.json(evidenceCache.get(cacheKey));
    }

    const evidence = [];

    // Search News API if included
    if (sources.includes('news_api') && process.env.NEWS_API_KEY) {
      for (const term of search_terms.slice(0, 3)) { // Limit to 3 terms to avoid rate limits
        try {
          const newsResponse = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&sortBy=relevancy&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
          );
          
          if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            
            newsData.articles?.forEach(article => {
              evidence.push({
                source: 'news_api',
                title: article.title,
                description: article.description,
                url: article.url,
                source_name: article.source.name,
                published_at: article.publishedAt,
                relevance_score: 0.8, // Placeholder
                supports_claim: null, // To be determined by further analysis
                search_term: term
              });
            });
          }
        } catch (newsError) {
          console.error('News API error:', newsError);
        }
      }
    }

    // Add Wikipedia search if included
    if (sources.includes('wikipedia')) {
      for (const term of search_terms.slice(0, 2)) {
        try {
          const wikiResponse = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
          );
          
          if (wikiResponse.ok) {
            const wikiData = await wikiResponse.json();
            
            evidence.push({
              source: 'wikipedia',
              title: wikiData.title,
              description: wikiData.extract,
              url: wikiData.content_urls?.desktop?.page,
              source_name: 'Wikipedia',
              published_at: null,
              relevance_score: 0.7,
              supports_claim: null,
              search_term: term
            });
          }
        } catch (wikiError) {
          console.error('Wikipedia API error:', wikiError);
        }
      }
    }

    // Cache results for 1 hour
    evidenceCache.set(cacheKey, evidence);
    setTimeout(() => evidenceCache.delete(cacheKey), 3600000);

    res.json(evidence);
  } catch (error) {
    console.error('Error searching evidence:', error);
    res.status(500).json({
      error: 'Failed to search evidence'
    });
  }
});

/**
 * POST /api/fact-check/credibility
 * Check source credibility
 */
router.post('/credibility', async (req, res) => {
  try {
    const { source_url } = req.body;

    if (!source_url) {
      return res.status(400).json({
        error: 'Source URL is required'
      });
    }

    // Extract domain from URL
    const domain = new URL(source_url).hostname.replace('www.', '');

    // Simple credibility scoring based on known sources
    const credibilityMap = {
      'reuters.com': { score: 0.95, rating: 'very_high', bias: 'center' },
      'apnews.com': { score: 0.95, rating: 'very_high', bias: 'center' },
      'bbc.com': { score: 0.90, rating: 'high', bias: 'center-left' },
      'npr.org': { score: 0.88, rating: 'high', bias: 'center-left' },
      'wsj.com': { score: 0.85, rating: 'high', bias: 'center-right' },
      'nytimes.com': { score: 0.82, rating: 'high', bias: 'center-left' },
      'washingtonpost.com': { score: 0.80, rating: 'high', bias: 'center-left' },
      'cnn.com': { score: 0.75, rating: 'medium', bias: 'left' },
      'foxnews.com': { score: 0.70, rating: 'medium', bias: 'right' },
      'wikipedia.org': { score: 0.85, rating: 'high', bias: 'center' },
      'snopes.com': { score: 0.90, rating: 'high', bias: 'center' },
      'factcheck.org': { score: 0.92, rating: 'very_high', bias: 'center' },
      'politifact.com': { score: 0.88, rating: 'high', bias: 'center-left' }
    };

    const credibility = credibilityMap[domain] || {
      score: 0.5,
      rating: 'unknown',
      bias: 'unknown'
    };

    res.json({
      domain,
      source_url,
      ...credibility,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking credibility:', error);
    res.status(500).json({
      error: 'Failed to check source credibility'
    });
  }
});

/**
 * GET /api/fact-check/history
 * Get claim history for a user
 */
router.get('/history', async (req, res) => {
  try {
    const { user_id, limit = 20, offset = 0, status = 'all' } = req.query;

    if (!user_id) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const userClaims = Array.from(claims.values())
      .filter(claim => claim.user_id === user_id)
      .filter(claim => status === 'all' || claim.status === status)
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    const total = Array.from(claims.values())
      .filter(claim => claim.user_id === user_id)
      .filter(claim => status === 'all' || claim.status === status)
      .length;

    res.json({
      claims: userClaims,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error getting claim history:', error);
    res.status(500).json({
      error: 'Failed to retrieve claim history'
    });
  }
});

/**
 * POST /api/fact-check/complete
 * Perform complete fact-check (combines all services)
 */
router.post('/complete', async (req, res) => {
  try {
    const { claim_text, user_id, source_url } = req.body;

    if (!claim_text) {
      return res.status(400).json({
        error: 'Claim text is required'
      });
    }

    // Step 1: Create claim record
    const claimId = uuidv4();
    const claim = {
      id: claimId,
      claim_text: claim_text.trim(),
      source_url: source_url || null,
      user_id: user_id || null,
      status: 'processing',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      results: null
    };

    claims.set(claimId, claim);

    // Step 2: Initial AI Analysis for search terms
    const initialAnalysisResponse = await fetch(`${req.protocol}://${req.get('host')}/api/fact-check/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        claim: claim_text,
        provider: req.body.provider || 'auto'
      })
    });

    const initialAnalysis = await initialAnalysisResponse.json();

    // Step 3: Search for evidence using AI-suggested terms
    const evidenceResponse = await fetch(`${req.protocol}://${req.get('host')}/api/fact-check/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_terms: initialAnalysis.ai_analysis?.search_terms || [claim_text],
        claim: claim_text,
        sources: ['news_api', 'wikipedia']
      })
    });

    const evidence = await evidenceResponse.json();

    // Step 4: Evidence-informed AI Analysis
    const finalAnalysisResponse = await fetch(`${req.protocol}://${req.get('host')}/api/fact-check/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        claim: claim_text,
        provider: req.body.provider || 'auto',
        evidence: evidence
      })
    });

    const aiAnalysis = await finalAnalysisResponse.json();

    // Step 4: Check source credibility
    const credibilityChecks = await Promise.all(
      evidence.slice(0, 5).map(async (item) => {
        if (!item.url) return null;
        
        try {
          const credResponse = await fetch(`${req.protocol}://${req.get('host')}/api/fact-check/credibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_url: item.url })
          });
          return await credResponse.json();
        } catch (error) {
          return null;
        }
      })
    );

    // Step 5: Calculate overall assessment
    const overallAssessment = calculateOverallAssessment(aiAnalysis, evidence, credibilityChecks);

    // Update claim with results
    const results = {
      claim_id: claimId,
      claim_text,
      ai_analysis: aiAnalysis,
      evidence: evidence.slice(0, 10).map((item, index) => ({
        ...item,
        credibility: credibilityChecks[index]
      })),
      overall_assessment: overallAssessment,
      completed_at: new Date().toISOString()
    };

    claim.status = 'completed';
    claim.results = results;
    claim.updated_at = new Date().toISOString();
    claims.set(claimId, claim);

    res.json(results);
  } catch (error) {
    console.error('Error performing complete fact-check:', error);
    res.status(500).json({
      error: 'Failed to complete fact-check'
    });
  }
});

/**
 * Helper function to calculate overall assessment
 */
function calculateOverallAssessment(aiAnalysis, evidence, credibilityChecks) {
  const supportingEvidence = evidence.filter(e => e.supports_claim === true).length;
  const contradictingEvidence = evidence.filter(e => e.supports_claim === false).length;
  const neutralEvidence = evidence.filter(e => e.supports_claim === null).length;

  const validCredibilityChecks = credibilityChecks.filter(c => c && c.score);
  const avgCredibility = validCredibilityChecks.length > 0
    ? validCredibilityChecks.reduce((sum, c) => sum + c.score, 0) / validCredibilityChecks.length
    : 0.5;

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
      total_sources: evidence.length,
      avg_source_credibility: avgCredibility
    },
    ai_confidence: aiAnalysis.confidence_score || 0.5
  };
}

/**
 * GET /api/fact-check/google-search
 * Search Google's fact-check database
 */
router.get('/google-search', async (req, res) => {
  try {
    const { query, pageSize = 10, pageToken, languageCode = 'en-US' } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter is required'
      });
    }

    if (!googleFactCheckService.isAvailable()) {
      console.log('Google Fact Check API not configured, using mock data');
      const mockResults = googleFactCheckService.getMockSearchResults(query);
      return res.json(mockResults);
    }

    try {
      const results = await googleFactCheckService.searchClaims(query, {
        pageSize: parseInt(pageSize),
        pageToken,
        languageCode
      });
      res.json(results);
    } catch (apiError) {
      console.log('Google API failed, falling back to mock data:', apiError.message);
      const mockResults = googleFactCheckService.getMockSearchResults(query);
      res.json(mockResults);
    }
  } catch (error) {
    console.error('Error searching fact checks:', error);
    res.status(500).json({
      error: 'Failed to search fact checks'
    });
  }
});

/**
 * POST /api/fact-check/google-image-search
 * Search Google's fact-check database by image
 */
router.post('/google-image-search', async (req, res) => {
  try {
    const { imageUri, pageSize = 10, pageToken, languageCode = 'en-US' } = req.body;

    if (!imageUri) {
      return res.status(400).json({
        error: 'Image URI is required'
      });
    }

    if (!googleFactCheckService.isAvailable()) {
      return res.status(503).json({
        error: 'Google Fact Check API not configured'
      });
    }

    const results = await googleFactCheckService.searchClaimsByImage(imageUri, {
      pageSize: parseInt(pageSize),
      pageToken,
      languageCode
    });

    res.json(results);
  } catch (error) {
    console.error('Error searching Google fact-check by image:', error);
    res.status(500).json({
      error: 'Failed to search fact-check database by image'
    });
  }
});

/**
 * GET /api/fact-check/recent-claims
 * Get recent fact-checked claims feed
 */
router.get('/recent-claims', async (req, res) => {
  try {
    const { pageSize = 20, pageToken, maxAgeDays = 7, languageCode = 'en-US' } = req.query;

    if (!googleFactCheckService.isAvailable()) {
      return res.status(503).json({
        error: 'Google Fact Check API not configured'
      });
    }

    const results = await googleFactCheckService.getRecentClaims({
      pageSize: parseInt(pageSize),
      pageToken,
      maxAgeDays: parseInt(maxAgeDays),
      languageCode
    });

    res.json(results);
  } catch (error) {
    console.error('Error getting recent claims:', error);
    res.status(500).json({
      error: 'Failed to get recent claims'
    });
  }
});

module.exports = router;
