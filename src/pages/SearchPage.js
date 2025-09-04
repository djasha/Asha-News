import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NewsFeed from '../components/NewsFeed/NewsFeed';
import ArticleCard from '../components/ArticleCard/ArticleCard';
import SEOHead from '../components/SEO/SEOHead';
import { searchArticles } from '../services/newsApiService';
import { mockArticles } from '../data/mockArticles';
import { useDebounce } from '../hooks/useDebounce';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedBias, setSelectedBias] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState(mockArticles);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter articles based on search and filters
  useEffect(() => {
    let filtered = mockArticles;

    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
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
        selectedTopics.some(topic => article.topics.includes(topic))
      );
    }

    setFilteredArticles(filtered);
  }, [debouncedSearchQuery, selectedBias, selectedTimeframe, selectedTopics]);

  // Update URL params when search changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      setSearchParams({ q: debouncedSearchQuery });
    } else {
      setSearchParams({});
    }
  }, [debouncedSearchQuery, setSearchParams]);

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBias('all');
    setSelectedTimeframe('all');
    setSelectedTopics([]);
  };

  const allTopics = [...new Set(mockArticles.flatMap(article => article.topics))];
  const activeFiltersCount = (selectedBias !== 'all' ? 1 : 0) + 
                            (selectedTimeframe !== 'all' ? 1 : 0) + 
                            selectedTopics.length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-light dark:bg-surface-dark border-b border-primary-200 dark:border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Back */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
              <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Search Articles
              </h1>
            </div>

            {/* Theme Toggle */}
            <button className="p-2 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters - Mobile: Above content, Desktop: Left side */}
          <aside className="w-full lg:w-80 lg:flex-shrink-0 space-y-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Search Articles
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by title, content, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-primary-300 dark:border-primary-700 rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bias Filter */}
            <div>
              <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
                Political Bias
              </h3>
              <div className="space-y-2">
                {['all', 'left', 'center', 'right'].map((bias) => (
                  <label key={bias} className="flex items-center">
                    <input
                      type="radio"
                      name="bias"
                      value={bias}
                      checked={selectedBias === bias}
                      onChange={(e) => setSelectedBias(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 dark:border-primary-700"
                    />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark capitalize">
                      {bias === 'all' ? 'All Perspectives' : bias}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Timeframe Filter */}
            <div>
              <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
                Timeframe
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' }
                ].map((timeframe) => (
                  <label key={timeframe.value} className="flex items-center">
                    <input
                      type="radio"
                      name="timeframe"
                      value={timeframe.value}
                      checked={selectedTimeframe === timeframe.value}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 dark:border-primary-700"
                    />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">
                      {timeframe.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Topics Filter */}
            <div>
              <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
                Topics
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allTopics.map((topic) => (
                  <label key={topic} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 dark:border-primary-700 rounded"
                    />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">
                      {topic}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear All Filters ({activeFiltersCount})
              </button>
            )}
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {debouncedSearchQuery ? `Search Results for "${debouncedSearchQuery}"` : 'All Articles'}
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => navigate(`/article/${article.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <svg className="mx-auto h-8 w-8 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.816-6.207-2.175.193-.39.398-.777.618-1.159A8.962 8.962 0 0112 13.5c2.34 0 4.5-.816 6.207-2.175-.193-.39-.398-.777-.618-1.159A8.962 8.962 0 0112 11.5z" />
                </svg>
                <h3 className="mt-2 text-base font-medium text-text-primary-light dark:text-text-primary-dark">
                  No articles found
                </h3>
                <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Try adjusting your search terms or filters to find more articles.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
