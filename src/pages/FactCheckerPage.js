import React, { useState, useEffect } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import factCheckerService from '../services/factCheckerService';

const FactCheckerPage = () => {
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // AI fact-checking
  const [aiClaim, setAiClaim] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [availableProviders, setAvailableProviders] = useState([]);
  
  // Data and history
  const [recentClaims, setRecentClaims] = useState([]);
  const [checkHistory, setCheckHistory] = useState([]);
  const [savedClaims, setSavedClaims] = useState([]);
  const [error, setError] = useState(null);

  const siteUrl = process.env.REACT_APP_SITE_URL || 'https://asha.news';

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load AI providers
        const providers = await factCheckerService.getAvailableProviders();
        setAvailableProviders(providers.available_providers || []);
        if (providers.default_provider) {
          setSelectedProvider(providers.default_provider);
        }

        // Load recent claims
        const response = await fetch('/api/fact-check/recent-claims?pageSize=10');
        if (response.ok) {
          const data = await response.json();
          setRecentClaims(data.claims || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  // Handle unified search (text or image URL)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      let response;
      const query = searchQuery.trim();
      
      // Detect if it's an image URL (simple check for common image extensions or URL patterns)
      const isImageUrl = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(query) || 
                        /^https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|webp|svg)/i.test(query) ||
                        query.includes('image') || query.includes('img');
      
      if (isImageUrl) {
        response = await fetch('/api/fact-check/google-image-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUri: query, pageSize: 10 })
        });
      } else {
        response = await fetch(`/api/fact-check/google-search?query=${encodeURIComponent(query)}&pageSize=10`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(isImageUrl ? data.results || [] : data.claims || []);
        
        // Add to history
        setCheckHistory(prev => [{
          id: Date.now(),
          query: query,
          mode: isImageUrl ? 'image' : 'text',
          timestamp: new Date().toISOString(),
          type: 'search'
        }, ...prev.slice(0, 9)]);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle AI fact check
  const handleAiFactCheck = async () => {
    if (!aiClaim.trim()) return;

    setIsAiLoading(true);
    setError(null);
    setAiResults(null);

    try {
      const result = await factCheckerService.performFactCheck(aiClaim.trim(), {
        provider: selectedProvider
      });
      setAiResults(result);
      
      // Add to history
      setCheckHistory(prev => [{
        id: Date.now(),
        query: aiClaim.trim(),
        verdict: result.overall_assessment?.verdict,
        confidence: result.overall_assessment?.confidence_score,
        timestamp: new Date().toISOString(),
        type: 'ai'
      }, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('AI fact check error:', error);
      setError('Failed to check claim. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle save claim
  const handleSaveClaim = (claim) => {
    const savedClaim = {
      id: Date.now(),
      text: claim.text || (claim.claim && claim.claim.text),
      claimant: claim.claimant || (claim.claim && claim.claim.claimant),
      timestamp: new Date().toISOString(),
      source: 'database'
    };
    
    setSavedClaims(prev => [savedClaim, ...prev.slice(0, 19)]); // Keep last 20
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Fact Check - Asha.News',
    url: `${siteUrl}/fact-check`,
    description:
      'Verify claims, analyze evidence, and explore source credibility with Asha.News fact check tools.',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Fact Check', item: `${siteUrl}/fact-check` },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Fact Check - Asha.News"
        description="Verify claims, analyze evidence, and explore source credibility with Asha.News fact check tools."
        canonicalUrl={`${siteUrl}/fact-check`}
        structuredData={structuredData}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fact Check
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Verify claims with AI analysis and search professional fact-check databases
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unified Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Search Fact-Check Database
              </h2>
              
              {/* Search Input with Image Icon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search claims or enter image URL..."
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors duration-200"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enter text to search claims or paste an image URL for image-based fact checking
              </p>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Search Results ({searchResults.length})
                </h3>
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {result.claim?.text || 'No claim text available'}
                        </h5>
                        <button
                          onClick={() => handleSaveClaim(result)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Save claim"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
                      {result.claim?.claimant && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Claimant: {result.claim.claimant}
                        </p>
                      )}
                      {result.claimReview && result.claimReview.length > 0 && (
                        <div className="space-y-2">
                          {result.claimReview.map((review, reviewIndex) => (
                            <div key={reviewIndex} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  {review.publisher?.name || 'Unknown Publisher'}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  review.textualRating?.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  review.textualRating?.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                  {review.textualRating || 'No rating'}
                                </span>
                              </div>
                              {review.url && (
                                <a
                                  href={review.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                >
                                  View full review →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Claims Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Fact-Checked Claims
              </h3>
              {recentClaims.length > 0 ? (
                <div className="space-y-4">
                  {recentClaims.slice(0, 5).map((claim, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {claim.claim?.text || 'No claim text available'}
                        </h5>
                        <button
                          onClick={() => handleSaveClaim(claim)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Save claim"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
                      {claim.claim?.claimant && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Claimant: {claim.claim.claimant}
                        </p>
                      )}
                      {claim.claimReview && claim.claimReview.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {claim.claimReview[0].publisher?.name || 'Unknown Publisher'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              claim.claimReview[0].textualRating?.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              claim.claimReview[0].textualRating?.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {claim.claimReview[0].textualRating || 'No rating'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent claims available
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column (1/3 width) */}
          <div className="space-y-6">
            {/* AI Fact Check Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                AI Claim Analysis
              </h2>
              
              <div className="space-y-4">
                {/* Provider Selection */}
                <div>
                  <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Provider
                  </label>
                  <select
                    id="provider-select"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="auto">Auto (Best Available)</option>
                    {availableProviders.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Claim Input */}
                <div>
                  <label htmlFor="ai-claim-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter claim to analyze
                  </label>
                  <textarea
                    id="ai-claim-input"
                    value={aiClaim}
                    onChange={(e) => setAiClaim(e.target.value)}
                    placeholder="Enter the claim you want to fact-check..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={4}
                  />
                </div>
                
                {/* Check Button */}
                <button
                  onClick={handleAiFactCheck}
                  disabled={isAiLoading || !aiClaim.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {isAiLoading ? 'Analyzing...' : 'Analyze Claim'}
                </button>
              </div>
            </div>

            {/* AI Results */}
            {aiResults && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI Analysis Results
                </h3>
                
                {aiResults.overall_assessment && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Assessment</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        aiResults.overall_assessment.verdict?.toLowerCase() === 'false' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        aiResults.overall_assessment.verdict?.toLowerCase() === 'true' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {aiResults.overall_assessment.verdict || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                      {aiResults.overall_assessment.explanation}
                    </p>
                    {aiResults.overall_assessment.confidence_score && (
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">
                          Confidence:
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${aiResults.overall_assessment.confidence_score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                          {aiResults.overall_assessment.confidence_score}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Check History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Check History
              </h3>
              
              {checkHistory.length > 0 ? (
                <div className="space-y-3">
                  {checkHistory.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                          {item.query.length > 50 ? `${item.query.substring(0, 50)}...` : item.query}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.type === 'ai' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {item.type === 'ai' ? 'AI' : item.mode === 'image' ? 'IMG' : 'TXT'}
                        </span>
                      </div>
                      {item.verdict && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.verdict} ({item.confidence}% confidence)
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  No check history yet
                </p>
              )}
            </div>

            {/* Saved Claims */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Saved Claims
              </h3>
              
              {savedClaims.length > 0 ? (
                <div className="space-y-3">
                  {savedClaims.slice(0, 3).map((claim) => (
                    <div key={claim.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                        {claim.text?.length > 60 ? `${claim.text.substring(0, 60)}...` : claim.text}
                      </p>
                      {claim.claimant && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          By: {claim.claimant}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(claim.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  No saved claims yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactCheckerPage;
