import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ArticleFactChecker from '../components/FactCheck/ArticleFactChecker';
import SocialMediaChecker from '../components/FactCheck/SocialMediaChecker';
import BatchFactChecker from '../components/FactCheck/BatchFactChecker';
import { API_BASE } from '../config/api';

const FactCheckerPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentClaims, setRecentClaims] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [savedClaims, setSavedClaims] = useState([]);
  const [checkHistory, setCheckHistory] = useState([]);
  const [cmsArticles, setCmsArticles] = useState([]);
  const [isLoadingCms, setIsLoadingCms] = useState(false);

  const siteUrl = process.env.REACT_APP_SITE_URL || 'https://asha.news';

  useEffect(() => {
    loadRecentClaims();
    loadCmsArticles();
  }, []);

  // Load recent claims using Google Fact Check API with Perplexity fallback
  const loadRecentClaims = async () => {
    setIsLoadingFeed(true);
    try {
      const apiBaseUrl = API_BASE;
      
      // Try Google Fact Check API first
      let response = await fetch(`${apiBaseUrl}/fact-check/recent-claims?pageSize=10`);
      
      if (!response.ok) {
        // Fallback to Google search
        response = await fetch(`${apiBaseUrl}/fact-check/google-search?query=covid&pageSize=10`);
      }
      
      if (response.ok) {
        const data = await response.json();
        const claims = data.claims || data.results || [];
        setRecentClaims(claims);
      } else {
        // Final fallback to Perplexity
        const perplexityResponse = await fetch(`${apiBaseUrl}/fact-check/perplexity-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: 'recent fact-checked claims news 2024',
            model: 'llama-3.1-sonar-small-128k-online'
          })
        });
        
        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          setRecentClaims(perplexityData.results?.slice(0, 5) || []);
        }
      }
    } catch (error) {
      console.error('Error loading recent claims:', error);
      setRecentClaims([]);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // Load CMS articles with fact-check status
  const loadCmsArticles = async () => {
    setIsLoadingCms(true);
    try {
      const apiBaseUrl = API_BASE;
      const response = await fetch(`${apiBaseUrl}/cms/articles?limit=20&sortBy=date`);
      
      if (response.ok) {
        const data = await response.json();
        const articlesWithFactCheck = data.articles?.filter(article => 
          article.fact_check_status && article.fact_check_status !== 'unverified'
        ) || [];
        setCmsArticles(articlesWithFactCheck);
      }
    } catch (error) {
      console.error('Error loading CMS articles:', error);
      setCmsArticles([]);
    } finally {
      setIsLoadingCms(false);
    }
  };

  // Handle unified search (Google Fact Check API + Perplexity fallback)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setAiAnalysis(null);

    try {
      const apiBaseUrl = API_BASE;
      const query = searchQuery.trim();
      
      // Enhanced image URL detection
      const isImageUrl = 
        /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|heic|heif)(\?.*)?$/i.test(query) ||
        /^https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|heic|heif)/i.test(query) ||
        /^https?:\/\/.*(imgur|flickr|instagram|pinterest|unsplash|pexels|shutterstock|getty)/i.test(query) ||
        /\/images?\//i.test(query) ||
        /\/photos?\//i.test(query) ||
        /\/media\//i.test(query) ||
        /[?&](image|img|photo|pic)/i.test(query) ||
        /^data:image\//i.test(query);

      let response;
      
      if (isImageUrl) {
        response = await fetch(`${apiBaseUrl}/fact-check/google-image-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUri: query, pageSize: 10 })
        });
      } else {
        // Try Google Fact Check API first
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

  // Handle Perplexity AI search
  const handlePerplexitySearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setAiAnalysis(null);

    try {
      const apiBaseUrl = API_BASE;
      const response = await fetch(`${apiBaseUrl}/fact-check/perplexity-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `fact check: ${searchQuery}`,
          model: 'llama-3.1-sonar-small-128k-online'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle AI fact-check analysis
  const handleAiAnalysis = async () => {
    if (!searchQuery.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const apiBaseUrl = API_BASE;
      const response = await fetch(`${apiBaseUrl}/fact-check/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          claim: searchQuery,
          provider: 'perplexity',
          model: 'llama-3.1-sonar-small-128k-online'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data);
        
        // Add to history
        setCheckHistory(prev => [{
          id: Date.now(),
          query: searchQuery.trim(),
          verdict: data.analysis || data.content,
          confidence: data.confidence || 0.8,
          timestamp: new Date().toISOString(),
          type: 'ai'
        }, ...prev.slice(0, 9)]);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze claim. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle save/unsave claim
  const handleSaveClaim = (claim) => {
    const claimText = claim.text || (claim.claim && claim.claim.text) || claim.title;
    
    if (!claimText) return;
    
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
    const claimText = claim.text || (claim.claim && claim.claim.text) || claim.title;
    return savedClaims.some(saved => saved.text === claimText);
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AI Fact Check - Asha.News',
    description: 'Verify claims with Perplexity AI-powered analysis and comprehensive fact-checking.',
    url: `${siteUrl}/fact-check`,
    mainEntity: {
      '@type': 'WebApplication',
      name: 'AI Fact Checker',
      applicationCategory: 'FactCheckingApplication',
      operatingSystem: 'Web Browser'
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Fact Check', item: `${siteUrl}/fact-check` },
      ],
    },
  };

  const tabs = [
    {
      id: 'search',
      name: 'Search Database',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'article',
      name: 'Article Checker',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'social',
      name: 'Social Media',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2M3 8h10M3 12h10M3 16h6" />
        </svg>
      )
    },
    {
      id: 'batch',
      name: 'Batch Check',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    },
    {
      id: 'recent',
      name: 'Recent Claims',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'saved',
      name: 'Saved Claims',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    },
    {
      id: 'cms',
      name: 'CMS Articles',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>
      )
    },
    {
      id: 'history',
      name: 'History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Helmet>
          <title>AI Fact Check - Asha.News</title>
          <meta name="description" content="Verify claims with Perplexity AI-powered analysis and comprehensive fact-checking." />
          <link rel="canonical" href={`${siteUrl}/fact-check`} />
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        </Helmet>
        
        <div className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              AI Fact Check
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-2xl">
              Verify claims with Perplexity AI-powered analysis. Get real-time fact-checking with comprehensive source verification and evidence analysis.
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

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                      : 'border-transparent text-text-secondary-light hover:text-text-primary-light hover:border-gray-300 dark:text-text-secondary-dark dark:hover:text-text-primary-dark dark:hover:border-gray-600'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span className="inline-flex items-center justify-center">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search Tab */}
          {activeTab === 'search' && (
            <>
              {/* Search Section */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                  AI-Powered Fact Check
                </h2>
                
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter a claim to fact-check..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && !isSearching && !isAnalyzing && handlePerplexitySearch()}
                      disabled={isSearching || isAnalyzing}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || isAnalyzing || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </div>
                    ) : (
                      'Google Search'
                    )}
                  </button>
                  <button
                    onClick={handlePerplexitySearch}
                    disabled={isSearching || isAnalyzing || !searchQuery.trim()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </div>
                    ) : (
                      'Perplexity AI'
                    )}
                  </button>
                  <button
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing || isSearching || !searchQuery.trim()}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </div>
                    ) : (
                      'AI Analysis'
                    )}
                  </button>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• <strong>Search:</strong> Find existing fact-checks and related information</p>
                  <p>• <strong>AI Analysis:</strong> Get comprehensive AI-powered fact verification</p>
                </div>
              </div>

              {/* AI Analysis Results */}
              {aiAnalysis && (
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI Fact-Check Analysis
                  </h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap">
                        {aiAnalysis.analysis || aiAnalysis.content || aiAnalysis.message}
                      </p>
                      {aiAnalysis.sources && aiAnalysis.sources.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Sources:</h4>
                          <ul className="space-y-1">
                            {aiAnalysis.sources.map((source, index) => (
                              <li key={index}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline text-sm"
                                >
                                  {source.title || source.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="space-y-6">
                    {searchResults.map((result, index) => (
                      <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                        <div className="flex gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-3">
                              <h5 className="font-semibold text-text-primary-light dark:text-text-primary-dark leading-tight">
                                {result.title || result.text || result.claim?.text || 'Search Result'}
                              </h5>
                              <button
                                onClick={() => handleSaveClaim(result)}
                                className={`ml-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  isClaimSaved(result)
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                              >
                                {isClaimSaved(result) ? 'Saved' : 'Save'}
                              </button>
                            </div>
                            
                            {result.content && (
                              <div className="prose dark:prose-invert max-w-none mb-4">
                                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                                  {result.content}
                                </p>
                              </div>
                            )}

                            {result.claimReview && result.claimReview.length > 0 && (
                              <div className="space-y-3 mb-4">
                                {result.claimReview.map((review, reviewIndex) => (
                                  <div key={reviewIndex} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                                          {review.publisher?.name || 'Unknown Publisher'}
                                        </span>
                                      </div>
                                      {review.textualRating && (
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          review.textualRating.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                          review.textualRating.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }`}>
                                          {review.textualRating}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {review.title && (
                                      <h6 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                        {review.title}
                                      </h6>
                                    )}
                                    
                                    {review.url && (
                                      <a
                                        href={review.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
                                      >
                                        Read Full Review →
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {result.citations && result.citations.length > 0 && (
                              <div className="mt-3">
                                <h6 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Citations:</h6>
                                <div className="space-y-2">
                                  {result.citations.map((citation, citationIndex) => (
                                    <div key={citationIndex} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                      <a
                                        href={citation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
                                      >
                                        {citation.title || citation.url}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {searchResults.length === 0 && !isSearching && searchQuery && !aiAnalysis && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">No results found</h3>
                  <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Try searching with different keywords or use AI Analysis for comprehensive fact-checking.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Recent Claims Tab */}
          {activeTab === 'recent' && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Recent Fact-Checked Claims
                </h3>
                <button
                  onClick={loadRecentClaims}
                  disabled={isLoadingFeed}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {isLoadingFeed ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {isLoadingFeed ? (
                <div className="text-center py-8">
                  <svg className="w-8 h-8 animate-spin mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Loading recent claims...</p>
                </div>
              ) : recentClaims.length > 0 ? (
                <div className="space-y-4">
                  {recentClaims.map((claim, index) => (
                    <div key={index} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {claim.title || claim.text || claim.claim?.text || 'Recent Claim'}
                        </h4>
                        <button
                          onClick={() => handleSaveClaim(claim)}
                          className={`ml-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            isClaimSaved(claim)
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {isClaimSaved(claim) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                      {claim.content && (
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-3">
                          {claim.content.substring(0, 200)}...
                        </p>
                      )}
                      {claim.claimReview && claim.claimReview.length > 0 && (
                        <div className="mb-3">
                          {claim.claimReview.slice(0, 1).map((review, reviewIndex) => (
                            <div key={reviewIndex} className="flex items-center gap-2">
                              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                {review.publisher?.name}:
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                review.textualRating?.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                review.textualRating?.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {review.textualRating}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {claim.citations && claim.citations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {claim.citations.slice(0, 3).map((citation, citationIndex) => (
                            <a
                              key={citationIndex}
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
                            >
                              Source {citationIndex + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">No recent claims available</h3>
                  <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Check back later for updated fact-checked claims.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Saved Claims Tab */}
          {activeTab === 'saved' && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                Saved Claims ({savedClaims.length})
              </h3>
              
              {savedClaims.length > 0 ? (
                <div className="space-y-4">
                  {savedClaims.map((claim, index) => (
                    <div key={claim.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {claim.text}
                        </h4>
                        <button
                          onClick={() => handleSaveClaim(claim)}
                          className="ml-4 px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                        Saved on {new Date(claim.timestamp).toLocaleDateString()}
                      </p>
                      {claim.claimReview && claim.claimReview.length > 0 && (
                        <div className="space-y-2">
                          {claim.claimReview.map((review, reviewIndex) => (
                            <div key={reviewIndex} className="flex items-center gap-2">
                              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                {review.publisher?.name}:
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                review.textualRating?.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                review.textualRating?.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {review.textualRating}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">No saved claims</h3>
                  <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Save interesting claims from search results to review later.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CMS Articles Tab */}
          {activeTab === 'cms' && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                  CMS Articles with Fact-Check Status
                </h3>
                <button
                  onClick={loadCmsArticles}
                  disabled={isLoadingCms}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {isLoadingCms ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {isLoadingCms ? (
                <div className="text-center py-8">
                  <svg className="w-8 h-8 animate-spin mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Loading CMS articles...</p>
                </div>
              ) : cmsArticles.length > 0 ? (
                <div className="space-y-4">
                  {cmsArticles.map((article, index) => (
                    <div key={article.id || index} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {article.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          article.fact_check_status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          article.fact_check_status === 'disputed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {article.fact_check_status}
                        </span>
                      </div>
                      {article.summary && (
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-2">
                          {article.summary.substring(0, 150)}...
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <span>Published: {new Date(article.date).toLocaleDateString()}</span>
                        {article.political_bias && (
                          <span>Bias: {article.political_bias}</span>
                        )}
                        {article.confidence_score && (
                          <span>Confidence: {Math.round(article.confidence_score * 100)}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">No CMS articles found</h3>
                  <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    No articles with fact-check status available.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Article Checker Tab */}
          {activeTab === 'article' && (
            <ArticleFactChecker />
          )}

          {/* Social Media Checker Tab */}
          {activeTab === 'social' && (
            <SocialMediaChecker />
          )}

          {/* Batch Checker Tab */}
          {activeTab === 'batch' && (
            <BatchFactChecker />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
                Search History ({checkHistory.length})
              </h3>
              
              {checkHistory.length > 0 ? (
                <div className="space-y-4">
                  {checkHistory.map((item, index) => (
                    <div key={item.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {item.query}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.type === 'ai' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            item.type === 'search' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {item.type === 'ai' ? 'AI Analysis' : item.mode === 'image' ? 'Image Search' : 'Text Search'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        {item.confidence && (
                          <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                        )}
                      </div>
                      {item.verdict && (
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                          {typeof item.verdict === 'string' ? item.verdict.substring(0, 100) + '...' : 'Analysis completed'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">No search history</h3>
                  <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Your search and analysis history will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FactCheckerPage;
