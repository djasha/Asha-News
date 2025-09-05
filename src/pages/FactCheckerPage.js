import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

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
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [checkHistory, setCheckHistory] = useState([]);
  const [savedClaims, setSavedClaims] = useState([]);
  const [error, setError] = useState(null);

  const siteUrl = process.env.REACT_APP_SITE_URL || 'https://asha.news';

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
        
        // Load AI providers
        const providersResponse = await fetch(`${apiBaseUrl}/fact-check/providers`);
        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          setAvailableProviders(providersData.providers || []);
        }
        
        // Load recent claims feed
        await loadRecentClaimsFeed();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Load recent claims feed from Google Fact Check API
  const loadRecentClaimsFeed = async () => {
    setIsLoadingFeed(true);
    setFeedError(null);
    
    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      
      // Try the recent claims endpoint first
      let response = await fetch(`${apiBaseUrl}/fact-check/recent-claims?pageSize=10`);
      
      if (!response.ok) {
        // Fallback to a direct search with a broad query
        response = await fetch(`${apiBaseUrl}/fact-check/google-search?query=covid&pageSize=10`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both response formats (claims array or results array)
      const claims = data.claims || data.results || [];
      setRecentClaims(claims);
      
      if (claims.length === 0) {
        setFeedError('No recent claims available at the moment.');
      }
    } catch (error) {
      console.error('Error loading recent claims feed:', error);
      setFeedError('Failed to load recent claims feed. Please try again later.');
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // Handle unified search (text or image URL)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      let response;
      const query = searchQuery.trim();
      
      // Enhanced image URL detection
      const isImageUrl = 
        // Direct image file extensions
        /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|heic|heif)(\?.*)?$/i.test(query) ||
        // URLs with image extensions anywhere in the path
        /^https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|heic|heif)/i.test(query) ||
        // Common image hosting patterns
        /^https?:\/\/.*(imgur|flickr|instagram|pinterest|unsplash|pexels|shutterstock|getty)/i.test(query) ||
        // Image-specific URL patterns
        /\/images?\//i.test(query) ||
        /\/photos?\//i.test(query) ||
        /\/media\//i.test(query) ||
        // Query parameters indicating images
        /[?&](image|img|photo|pic)/i.test(query) ||
        // Base64 image data
        /^data:image\//i.test(query);
      
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      
      if (isImageUrl) {
        response = await fetch(`${apiBaseUrl}/fact-check/google-image-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUri: query, pageSize: 10 })
        });
      } else {
        response = await fetch(`${apiBaseUrl}/fact-check/google-search?query=${encodeURIComponent(query)}&pageSize=10`);
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
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${apiBaseUrl}/fact-check/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: aiClaim.trim(),
          provider: selectedProvider
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze claim');
      }
      
      const result = await response.json();
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

  // Handle save/unsave claim
  const handleSaveClaim = (claim) => {
    const claimText = claim.text || (claim.claim && claim.claim.text);
    
    // Check if already saved
    const isAlreadySaved = savedClaims.some(saved => saved.text === claimText);
    
    if (isAlreadySaved) {
      // Remove from saved claims
      setSavedClaims(prev => prev.filter(saved => saved.text !== claimText));
    } else {
      // Add to saved claims
      const savedClaim = {
        id: Date.now(),
        text: claimText,
        claimant: claim.claimant || (claim.claim && claim.claim.claimant),
        timestamp: new Date().toISOString(),
        source: 'database',
        claimReview: claim.claimReview || []
      };
      
      setSavedClaims(prev => [savedClaim, ...prev.slice(0, 19)]); // Keep last 20
    }
  };

  // Check if claim is saved
  const isClaimSaved = (claim) => {
    const claimText = claim.text || (claim.claim && claim.claim.text);
    return savedClaims.some(saved => saved.text === claimText);
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
    <div className="min-h-screen bg-surface-primary-light dark:bg-surface-primary-dark">
      <Helmet>
        <title>Fact Check - Asha.News</title>
        <meta name="description" content="Verify claims, analyze evidence, and explore source credibility with Asha.News fact check tools." />
        <link rel="canonical" href={`${siteUrl}/fact-check`} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <div className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Fact Check
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-2xl">
            Verify claims with AI-powered analysis and access professional fact-checking databases. 
            Search by text or image to get comprehensive fact-checking results.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content Area - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Unified Search */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
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
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                    disabled={isSearching}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isSearching ? (
                      <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
                >
                  {isSearching && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Enter text to search claims or paste an image URL for image-based fact checking
              </p>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                  Search Results ({searchResults.length})
                </h3>
                <div className="space-y-6">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <div className="flex gap-4">
                        {/* Publisher/Source Image */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                            {result.claimReview?.[0]?.publisher?.site ? (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${result.claimReview[0].publisher.site}&sz=64`}
                                alt={result.claimReview[0].publisher.name}
                                className="w-8 h-8"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: result.claimReview?.[0]?.publisher?.site ? 'none' : 'flex'}}>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 011 1l4 4v9a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-semibold text-text-primary-light dark:text-text-primary-dark leading-tight pr-4">
                              {result.text || result.claim?.text || 'No claim text available'}
                            </h5>
                            <button
                              onClick={() => handleSaveClaim(result)}
                              className={`flex-shrink-0 transition-colors duration-200 ${
                                isClaimSaved(result) 
                                  ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300' 
                                  : 'text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400'
                              }`}
                              title={isClaimSaved(result) ? "Remove from saved claims" : "Save claim"}
                            >
                              <svg className="w-5 h-5" fill={isClaimSaved(result) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-4 text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">
                            {(result.claimant || result.claim?.claimant) && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Claimed by: {result.claimant || result.claim?.claimant}</span>
                              </div>
                            )}
                            {(result.claimDate || result.claim?.claimDate) && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Claimed: {new Date(result.claimDate || result.claim?.claimDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Reviews */}
                          {result.claimReview && result.claimReview.length > 0 && (
                            <div className="space-y-3">
                              {result.claimReview.map((review, reviewIndex) => (
                                <div key={reviewIndex} className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                                        {review.publisher?.site && (
                                          <img
                                            src={`https://www.google.com/s2/favicons?domain=${review.publisher.site}&sz=32`}
                                            alt={review.publisher.name}
                                            className="w-4 h-4"
                                            onError={(e) => e.target.style.display = 'none'}
                                          />
                                        )}
                                      </div>
                                      <span className="font-medium text-sm text-text-primary-light dark:text-text-primary-dark">
                                        {review.publisher?.name || 'Unknown Publisher'}
                                      </span>
                                      {review.publisher?.site && (
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                          ({review.publisher.site})
                                        </span>
                                      )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      review.textualRating?.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                      review.textualRating?.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                      review.textualRating?.toLowerCase().includes('mixed') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                      {review.textualRating || 'No rating'}
                                    </span>
                                  </div>
                                  
                                  {review.title && (
                                    <h6 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                                      {review.title}
                                    </h6>
                                  )}
                                  
                                  <div className="flex justify-between items-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                    {review.reviewDate && (
                                      <span>Reviewed: {new Date(review.reviewDate).toLocaleDateString()}</span>
                                    )}
                                    {review.url && (
                                      <a
                                        href={review.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1"
                                      >
                                        Read full review
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Google Fact Check Feed */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Live Fact-Check Feed
                </h3>
                <button
                  onClick={loadRecentClaimsFeed}
                  disabled={isLoadingFeed}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  {isLoadingFeed ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              </div>

              {feedError && (
                <div className="mb-4 p-3 border-l-4 border-error bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-error">{feedError}</p>
                </div>
              )}

              {isLoadingFeed && recentClaims.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    Loading recent fact-checked claims...
                  </p>
                </div>
              ) : recentClaims.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    Latest fact-checked claims from Google's professional database
                  </p>
                  {recentClaims.slice(0, 6).map((claim, index) => (
                    <div key={index} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="flex gap-3">
                        {/* Publisher/Source Image */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                            {claim.claimReview?.[0]?.publisher?.site ? (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${claim.claimReview[0].publisher.site}&sz=48`}
                                alt={claim.claimReview[0].publisher.name}
                                className="w-6 h-6"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: claim.claimReview?.[0]?.publisher?.site ? 'none' : 'flex'}}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 011 1l4 4v9a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark leading-tight pr-3">
                              {claim.text}
                            </h5>
                            <button
                              onClick={() => handleSaveClaim(claim)}
                              className={`flex-shrink-0 transition-colors duration-200 ${
                                isClaimSaved(claim) 
                                  ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300' 
                                  : 'text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400'
                              }`}
                              title={isClaimSaved(claim) ? "Remove from saved claims" : "Save claim"}
                            >
                              <svg className="w-4 h-4" fill={isClaimSaved(claim) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Metadata */}
                          <div className="flex flex-wrap gap-3 text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">
                            {claim.claimant && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{claim.claimant}</span>
                              </div>
                            )}
                            {claim.claimDate && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{new Date(claim.claimDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Reviews */}
                          {claim.claimReview && claim.claimReview.length > 0 && (
                            <div className="space-y-2">
                              {claim.claimReview.slice(0, 2).map((review, reviewIndex) => (
                                <div key={reviewIndex} className="bg-surface-light dark:bg-surface-dark rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                                        {review.publisher?.site && (
                                          <img
                                            src={`https://www.google.com/s2/favicons?domain=${review.publisher.site}&sz=24`}
                                            alt={review.publisher.name}
                                            className="w-3 h-3"
                                            onError={(e) => e.target.style.display = 'none'}
                                          />
                                        )}
                                      </div>
                                      <span className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                                        {review.publisher?.name || 'Unknown Publisher'}
                                      </span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      review.textualRating?.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                      review.textualRating?.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                      review.textualRating?.toLowerCase().includes('mixed') || review.textualRating?.toLowerCase().includes('misleading') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                      {review.textualRating || 'No rating'}
                                    </span>
                                  </div>
                                  
                                  {review.title && (
                                    <h6 className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                                      {review.title}
                                    </h6>
                                  )}
                                  
                                  <div className="flex justify-between items-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                    {review.reviewDate && (
                                      <span>{new Date(review.reviewDate).toLocaleDateString()}</span>
                                    )}
                                    {review.url && (
                                      <a
                                        href={review.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1"
                                      >
                                        Read review
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentClaims.length > 8 && (
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center pt-2">
                      Showing 8 of {recentClaims.length} recent claims
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    No recent claims available. Try refreshing the feed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column (1/3 width) */}
          <div className="space-y-8">
            {/* AI Fact Check Panel */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                AI Claim Analysis
              </h2>
              
              <div className="space-y-4">
                {/* Provider Selection */}
                <div>
                  <label htmlFor="provider-select" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    AI Provider
                  </label>
                  <select
                    id="provider-select"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  <label htmlFor="claim-input" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Claim to Analyze
                  </label>
                  <textarea
                    id="claim-input"
                    value={aiClaim}
                    onChange={(e) => setAiClaim(e.target.value)}
                    placeholder="Enter the claim you want to fact-check..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                  />
                </div>
                
                {/* Check Button */}
                <button
                  onClick={handleAiFactCheck}
                  disabled={isAiLoading || !aiClaim.trim()}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {isAiLoading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isAiLoading ? 'Analyzing...' : 'Analyze Claim'}
                </button>
              </div>
            </div>

            {/* AI Results */}
            {aiResults && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                  AI Analysis Results
                </h3>
                
                {aiResults.overall_assessment && (
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">Assessment</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        aiResults.overall_assessment.verdict?.toLowerCase().includes('false') ? 'bg-error/10 text-error' :
                        aiResults.overall_assessment.verdict?.toLowerCase().includes('true') ? 'bg-success/10 text-success' :
                        aiResults.overall_assessment.verdict?.toLowerCase().includes('mixed') ? 'bg-warning/10 text-warning' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {aiResults.overall_assessment.verdict || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-3">
                      {aiResults.overall_assessment.explanation}
                    </p>
                    {aiResults.overall_assessment.confidence_score && (
                      <div className="flex items-center">
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark mr-2">
                          Confidence:
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${aiResults.overall_assessment.confidence_score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-2">
                          {aiResults.overall_assessment.confidence_score}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Evidence Sources */}
                {aiResults.evidence && aiResults.evidence.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-4">
                      Supporting Evidence ({aiResults.evidence.length})
                    </h4>
                    <div className="space-y-4">
                      {aiResults.evidence.slice(0, 3).map((evidence, index) => (
                        <div key={index} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-sm text-text-primary-light dark:text-text-primary-dark">
                              {evidence.title || evidence.source_name || 'Evidence Source'}
                            </h5>
                            {evidence.credibility_score && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                evidence.credibility_score >= 80 ? 'bg-success/10 text-success' :
                                evidence.credibility_score >= 60 ? 'bg-warning/10 text-warning' :
                                'bg-error/10 text-error'
                              }`}>
                                {evidence.credibility_score}% credible
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                            {evidence.description || evidence.extract || 'No description available'}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {evidence.source_name || evidence.source || 'Unknown source'}
                            </span>
                            {evidence.url && (
                              <a
                                href={evidence.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs font-medium"
                              >
                                View source →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {aiResults.evidence.length > 3 && (
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
                          +{aiResults.evidence.length - 3} more evidence sources
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Analysis Context */}
                {aiResults.ai_analysis && (
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-3">AI Analysis</h4>
                    {aiResults.ai_analysis.provider_name && (
                      <div className="flex items-center mb-3">
                        <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                          Powered by {aiResults.ai_analysis.provider_name}
                        </span>
                      </div>
                    )}
                    {aiResults.ai_analysis.context && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                        {aiResults.ai_analysis.context}
                      </p>
                    )}
                    {aiResults.ai_analysis.key_points && aiResults.ai_analysis.key_points.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Key Points:</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {aiResults.ai_analysis.key_points.map((point, index) => (
                            <li key={index} className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Save Result Button */}
                <div className="pt-4">
                  <button
                    onClick={() => {
                      const savedResult = {
                        id: Date.now(),
                        text: aiClaim,
                        verdict: aiResults.overall_assessment?.verdict,
                        confidence: aiResults.overall_assessment?.confidence_score,
                        timestamp: new Date().toISOString(),
                        source: 'ai'
                      };
                      setSavedClaims(prev => [savedResult, ...prev.slice(0, 19)]);
                    }}
                    className="w-full px-4 py-2 bg-surface-elevated-light hover:bg-gray-200 dark:bg-surface-elevated-dark dark:hover:bg-gray-600 text-text-primary-light dark:text-text-primary-dark text-sm font-medium rounded-md transition-colors duration-200"
                  >
                    Save Analysis Result
                  </button>
                </div>
              </div>
            )}

            {/* Check History */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                Check History
              </h3>
              
              {checkHistory.length > 0 ? (
                <div className="space-y-3">
                  {checkHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                          {item.text}
                        </p>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {item.verdict && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.verdict.toLowerCase().includes('false') ? 'bg-error/10 text-error' :
                          item.verdict.toLowerCase().includes('true') ? 'bg-success/10 text-success' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {item.verdict}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
                  No check history yet. Start by analyzing a claim above.
                </p>
              )}
            </div>

            {/* Saved Claims */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
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
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
                  No saved claims yet. Save interesting results from your fact-checks.
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
