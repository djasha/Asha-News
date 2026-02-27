import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import ArticleCard from '../components/ArticleCard/ArticleCard';
import useDebounce from '../hooks/useDebounce';

const SearchPage = () => {
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get category from URL path or search params
  const categoryFromPath = location.pathname.split('/').pop();
  const categoryFromParams = params.category;
  const currentCategory = categoryFromParams || (categoryFromPath !== 'search' ? categoryFromPath : '');
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBias, setSelectedBias] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState([]);
  
  // Get source and topic filters from URL
  const sourceFilter = searchParams.get('source') || '';
  const topicFilter = searchParams.get('topic') || '';
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle article click
  const handleArticleClick = (article) => {
    navigate(`/article/${article.id}`);
  };

  // Fetch all articles from the backend API
  useEffect(() => {
    const fetchAllArticles = async () => {
      try {
        setLoading(true);
        
        // Fetch from backend API (includes reading_time, proper source_name, etc.)
        const response = await fetch('/api/articles?limit=100&sort=published_at&order=desc');
        const data = await response.json();
        
        if (data.success && data.data) {
          setAllArticles(data.data);
        } else {
          console.error('Invalid API response:', data);
          setAllArticles([]);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        // Fallback to empty array
        setAllArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllArticles();
  }, []);

  // Filter articles based on search, category, and filters
  const filteredArticles = useMemo(() => {
    let filtered = allArticles;

    // Category filter (from URL)
    if (currentCategory && currentCategory !== 'search') {
      filtered = filtered.filter(article => 
        article.topic?.toLowerCase() === currentCategory.toLowerCase() ||
        article.category?.toLowerCase() === currentCategory.toLowerCase()
      );
    }

    // Source filter (from URL params)
    if (sourceFilter) {
      filtered = filtered.filter(article =>
        article.source_name?.toLowerCase() === sourceFilter.toLowerCase()
      );
    }

    // Topic filter (from URL params)
    if (topicFilter) {
      filtered = filtered.filter(article =>
        article.topic?.toLowerCase() === topicFilter.toLowerCase() ||
        article.category?.toLowerCase() === topicFilter.toLowerCase()
      );
    }

    // Search filter
    if (debouncedSearchQuery) {
      const normalizedQuery = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(article => {
        const title = String(article.title || '').toLowerCase();
        const summary = String(article.summary || '').toLowerCase();
        const author = String(article.author || '').toLowerCase();
        return (
          title.includes(normalizedQuery) ||
          summary.includes(normalizedQuery) ||
          author.includes(normalizedQuery)
        );
      });
    }

    // Bias filter
    if (selectedBias !== 'all') {
      filtered = filtered.filter(article => article.political_bias === selectedBias);
    }

    // Timeframe filter
    if (selectedTimeframe !== 'all') {
      const now = new Date();
      const timeframes = {
        'today': 1,
        'week': 7,
        'month': 30
      };
      
      if (timeframes[selectedTimeframe]) {
        const cutoffDate = new Date(now.getTime() - timeframes[selectedTimeframe] * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(article => new Date(article.publication_date) >= cutoffDate);
      }
    }

    // Topic filter
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(article => 
        selectedTopics.some(topic => article.topics?.includes(topic))
      );
    }

    return filtered;
  }, [debouncedSearchQuery, selectedBias, selectedTimeframe, selectedTopics, allArticles, currentCategory, sourceFilter, topicFilter]);

  // Update URL params when search changes
  useEffect(() => {
    const nextParams = {};

    if (sourceFilter) nextParams.source = sourceFilter;
    if (topicFilter) nextParams.topic = topicFilter;
    if (debouncedSearchQuery) nextParams.q = debouncedSearchQuery;

    setSearchParams(nextParams, { replace: true });
  }, [debouncedSearchQuery, setSearchParams, sourceFilter, topicFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBias('all');
    setSelectedTimeframe('all');
    setSelectedTopics([]);
    // Clear URL params
    setSearchParams({});
  };

  // Get page title based on category and filters
  const getPageTitle = () => {
    if (sourceFilter && topicFilter) {
      return `${sourceFilter} - ${topicFilter} Articles`;
    }
    if (sourceFilter) {
      return `Articles from ${sourceFilter}`;
    }
    if (topicFilter) {
      return `${topicFilter} News`;
    }
    if (currentCategory && currentCategory !== 'search') {
      return `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} News`;
    }
    return searchQuery ? `Search Results for "${searchQuery}"` : 'Search News';
  };

  return (
    <>
      <SEOHead
        title={`${getPageTitle()} - Asha.News`}
        description={`Browse ${currentCategory || 'news'} articles with AI-powered bias analysis and fact-checking.`}
        canonicalUrl={location.pathname}
      />
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              {getPageTitle()}
            </h1>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={sourceFilter ? `Search in ${sourceFilter} articles...` : "Search articles..."}
                  className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(sourceFilter || topicFilter) && (
              <div className="flex flex-wrap gap-3 items-center mb-4">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Active filters:
                </span>
                {sourceFilter && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Source: {sourceFilter}
                  </span>
                )}
                {topicFilter && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Topic: {topicFilter}
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {loading ? (
                'Loading articles...'
              ) : (
                <>
                  Showing {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </>
              )}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                size="standard"
                showImage={true}
                showBias={true}
                onClick={handleArticleClick}
              />
            ))}
          </div>

          {/* Empty State */}
          {!loading && filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
                No articles found
              </h3>
              <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {searchQuery
                  ? `No articles match "${searchQuery}"`
                  : 'Try adjusting your filters'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
