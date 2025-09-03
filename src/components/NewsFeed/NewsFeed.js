import React, { useCallback, useMemo, useState, useEffect } from "react";
import ArticleCard from "../ArticleCard/ArticleCard";
import CompactArticleCard from "../ArticleCard/CompactArticleCard";
import HeroSection from "../HeroSection/HeroSection";
import useDebounce from "../../hooks/useDebounce";
import rssService from '../../services/rssService';
import { useNavigate } from 'react-router-dom';

const NewsFeed = ({
  articles: propArticles = [],
  layout = "adaptive",
  showBiasOverview = true,
  searchQuery: propSearchQuery = "",
  className = "",
  showFilters = true,
  showSidebar = true,
  isHomePage = false,
  maxArticles = null,
}) => {
  const navigate = useNavigate();
  const [rssArticles, setRssArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(propSearchQuery);
  const [sortBy] = useState("date");
  const [filterTopic, setFilterTopic] = useState([]);
  const [filterBias, setFilterBias] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [filterSources, setFilterSources] = useState([]);
  const [isFiltering] = useState(false);

  // Fetch RSS articles on component mount
  useEffect(() => {
    const fetchRSSData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await rssService.getArticles({ sortBy: 'date' });
        setRssArticles(data.articles);
        console.log(`Loaded ${data.articles.length} RSS articles`);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load RSS articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRSSData();
  }, []);

  // Use RSS articles if available, fallback to prop articles
  const articles = rssArticles.length > 0 ? rssArticles : propArticles;
  console.log("NewsFeed using articles:", articles.length, rssArticles.length > 0 ? "(RSS)" : "(props)");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Enhanced filtering logic with advanced search operators
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Advanced search filter with operators
    if (debouncedSearchQuery) {
      const searchData =
        typeof debouncedSearchQuery === "object"
          ? debouncedSearchQuery
          : { query: debouncedSearchQuery, metadata: {} };

      if (searchData.query.trim()) {
        const searchLower = searchData.query.toLowerCase();
        filtered = filtered.filter((article) => {
          let matches =
            article.title.toLowerCase().includes(searchLower) ||
            article.summary.toLowerCase().includes(searchLower) ||
            article.source_id.toLowerCase().includes(searchLower) ||
            article.author.toLowerCase().includes(searchLower);

          // Handle exact phrases
          if (searchData.metadata.exactPhrases) {
            matches = searchData.metadata.exactPhrases.some(
              (phrase) =>
                article.title.toLowerCase().includes(phrase.toLowerCase()) ||
                article.summary.toLowerCase().includes(phrase.toLowerCase())
            );
          }

          // Handle exclusions
          if (searchData.metadata.excludeTerms) {
            const hasExcluded = searchData.metadata.excludeTerms.some(
              (term) =>
                article.title.toLowerCase().includes(term.toLowerCase()) ||
                article.summary.toLowerCase().includes(term.toLowerCase())
            );
            if (hasExcluded) matches = false;
          }

          // Handle source filters
          if (searchData.metadata.sources) {
            matches =
              matches &&
              searchData.metadata.sources.some((source) =>
                article.source_id.toLowerCase().includes(source.toLowerCase())
              );
          }

          // Handle author filters
          if (searchData.metadata.authors) {
            matches =
              matches &&
              searchData.metadata.authors.some((author) =>
                article.author.toLowerCase().includes(author.toLowerCase())
              );
          }

          return matches;
        });
      }
    }

    // Topic filter
    if (filterTopic.length > 0) {
      filtered = filtered.filter(article => filterTopic.includes(article.topic));
    }

    // Bias filter
    if (filterBias) {
      filtered = filtered.filter(article => article.political_bias === filterBias);
    }

    // Date range filter
    if (filterDateRange !== "all") {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.publication_date);
        const now = new Date();
        const daysDiff = Math.floor((now - articleDate) / (1000 * 60 * 60 * 24));
        
        switch (filterDateRange) {
          case "today":
            return daysDiff <= 0;
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          default:
            return true;
        }
      });
    }

    // Sources filter
    if (filterSources.length > 0) {
      filtered = filtered.filter(article => filterSources.includes(article.source_name));
    }

    // Limit articles if maxArticles is specified (for home page)
    if (maxArticles && filtered.length > maxArticles) {
      filtered = filtered.slice(0, maxArticles);
    }

    // Sort articles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.publication_date) - new Date(a.publication_date);
        case "quality":
          return b.factual_quality - a.factual_quality;
        case "bias":
          const biasOrder = { left: 0, center: 1, right: 2 };
          return biasOrder[a.political_bias] - biasOrder[b.political_bias];
        case "relevance":
          return b.confidence_score - a.confidence_score;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    articles,
    debouncedSearchQuery,
    filterTopic,
    filterBias,
    filterDateRange,
    filterSources,
    sortBy,
    maxArticles,
  ]);

  // Separate articles by image availability
  const { heroArticle, articlesWithImages, articlesWithoutImages } =
    useMemo(() => {
      const withImages = filteredArticles.filter(
        (article) => article.image_url
      );
      const withoutImages = filteredArticles.filter(
        (article) => !article.image_url
      );

      // Select hero article (first article with image)
      const hero = withImages[0] || null;
      const remainingWithImages = withImages.slice(1);

      return {
        heroArticle: hero,
        articlesWithImages: remainingWithImages,
        articlesWithoutImages: withoutImages,
      };
    }, [filteredArticles]);

  // Get available filter options
  const availableTopics = [
    ...new Set(articles.map((article) => article.topic)),
  ].sort();

  // Calculate active filter count
  const activeFilterCount =
    (debouncedSearchQuery.trim() ? 1 : 0) +
    (filterBias ? 1 : 0) +
    (filterTopic.length > 0 ? 1 : 0) +
    (filterDateRange !== "all" ? 1 : 0) +
    (filterSources.length > 0 ? 1 : 0);

  // Clear all filters function
  const handleClearAll = useCallback(() => {
    setSearchQuery("");
    setFilterTopic([]);
    setFilterBias(null);
    setFilterDateRange("all");
    setFilterSources([]);
  }, []);

  return (
    <div className={`${className}`}>
      {/* Loading State */}
      {(loading || isFiltering) && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-text-secondary-light dark:text-text-secondary-dark">
            {loading ? 'Loading articles...' : 'Filtering articles...'}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-primary-light dark:text-text-primary-dark mb-2">Failed to load articles</p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="transition-opacity duration-300 ease-in-out">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main Content Area */}
            <div className="flex-1 space-y-6 lg:space-y-8">
              {/* Hero Section */}
              {heroArticle && (
                <div>
                  <HeroSection article={heroArticle} />
                </div>
              )}

              {/* Top News Stories with Images */}
              {articlesWithImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark pb-2 border-b border-primary-200 dark:border-primary-700">
                      Top News Stories
                    </h3>
                    {isHomePage && articlesWithImages.length > 6 && (
                      <button
                        onClick={() => navigate('/news/top-stories')}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        Read More →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages.slice(0, isHomePage ? 6 : articlesWithImages.length).map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        showBiasOverview={showBiasOverview}
                        layout="featured"
                        size="medium"
                      />
                    ))}
                  </div>
                  {isHomePage && articlesWithImages.length > 6 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => navigate('/news/top-stories')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Read More Stories ({articlesWithImages.length - 6} more)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Politics with Images */}
              {articlesWithImages.filter(
                (article) => article.topic === "Politics"
              ).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark pb-2 border-b border-primary-200 dark:border-primary-700">
                      Politics
                    </h3>
                    {isHomePage && articlesWithImages.filter(a => a.topic === "Politics").length > 4 && (
                      <button
                        onClick={() => navigate('/news/politics')}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        Read More →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages
                      .filter((article) => article.topic === "Politics")
                      .slice(0, isHomePage ? 4 : articlesWithImages.filter(a => a.topic === "Politics").length)
                      .map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          showBiasOverview={showBiasOverview}
                          layout="featured"
                          size="medium"
                        />
                      ))}
                  </div>
                  {isHomePage && articlesWithImages.filter(a => a.topic === "Politics").length > 4 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => navigate('/news/politics')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Read More Politics ({articlesWithImages.filter(a => a.topic === "Politics").length - 4} more)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Articles Without Images - Compact Cards */}
              {articlesWithoutImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark pb-2 border-b border-primary-200 dark:border-primary-700">
                      Latest Updates
                    </h3>
                    {!isHomePage && articlesWithoutImages.length > 6 && (
                      <button
                        onClick={() => navigate('/news')}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        Read More →
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {articlesWithoutImages
                      .slice(0, isHomePage ? 6 : articlesWithoutImages.length)
                      .map((article) => (
                        <CompactArticleCard
                          key={article.id}
                          article={article}
                          showBias={showBiasOverview}
                        />
                      ))}
                  </div>
                  {isHomePage && articlesWithoutImages.length > 6 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => navigate('/news')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Read More Articles ({articlesWithoutImages.length - 6} more)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Technology with Images */}
              {articlesWithImages.filter(
                (article) => article.topic === "Technology"
              ).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark pb-2 border-b border-primary-200 dark:border-primary-700">
                      Technology
                    </h3>
                    {isHomePage && articlesWithImages.filter(a => a.topic === "Technology").length > 4 && (
                      <button
                        onClick={() => navigate('/news/technology')}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        Read More →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages
                      .filter((article) => article.topic === "Technology")
                      .slice(0, isHomePage ? 4 : articlesWithImages.filter(a => a.topic === "Technology").length)
                      .map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          showBiasOverview={showBiasOverview}
                          layout="featured"
                          size="medium"
                        />
                      ))}
                  </div>
                  {isHomePage && articlesWithImages.filter(a => a.topic === "Technology").length > 4 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => navigate('/news/technology')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Read More Technology ({articlesWithImages.filter(a => a.topic === "Technology").length - 4} more)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Business with Images */}
              {articlesWithImages.filter(
                (article) => article.topic === "Business"
              ).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark pb-2 border-b border-primary-200 dark:border-primary-700">
                      Business
                    </h3>
                    {isHomePage && articlesWithImages.filter(a => a.topic === "Business").length > 4 && (
                      <button
                        onClick={() => navigate('/news/business')}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        Read More →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages
                      .filter((article) => article.topic === "Business")
                      .slice(0, isHomePage ? 4 : articlesWithImages.filter(a => a.topic === "Business").length)
                      .map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          showBiasOverview={showBiasOverview}
                          layout="featured"
                          size="medium"
                        />
                      ))}
                  </div>
                  {isHomePage && articlesWithImages.filter(a => a.topic === "Business").length > 4 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => navigate('/news/business')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Read More Business ({articlesWithImages.filter(a => a.topic === "Business").length - 4} more)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar - Hidden on mobile */}
            {showSidebar && (
              <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
                {/* Filters in Sidebar */}
                {showFilters && (
                  <div>
                    <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 pb-1 border-b border-primary-200 dark:border-primary-700">
                      Filters
                    </h3>
                    <div className="space-y-4">
                      {/* Search Input */}
                      <div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search articles..."
                          className="w-full px-3 py-2 text-xs border border-primary-200 dark:border-primary-700 rounded-md bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      {/* Bias Filter */}
                      <div>
                        <label className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                          Bias
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {["left", "center", "right"].map((bias) => (
                            <button
                              key={bias}
                              onClick={() =>
                                setFilterBias(filterBias === bias ? null : bias)
                              }
                              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                filterBias === bias
                                  ? "bg-primary-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              {bias.charAt(0).toUpperCase() + bias.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date Range Filter */}
                      <div>
                        <label className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                          Date Range
                        </label>
                        <select
                          value={filterDateRange}
                          onChange={(e) => setFilterDateRange(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-primary-200 dark:border-primary-700 rounded-md bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                        </select>
                      </div>

                      {/* Topic Filter */}
                      <div>
                        <label className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                          Topics
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {availableTopics.map((topic) => (
                            <button
                              key={topic}
                              onClick={() => {
                                if (filterTopic.includes(topic)) {
                                  setFilterTopic(
                                    filterTopic.filter((t) => t !== topic)
                                  );
                                } else {
                                  setFilterTopic([...filterTopic, topic]);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                filterTopic.includes(topic)
                                  ? "bg-primary-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clear All Button */}
                      {activeFilterCount > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="w-full px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                        >
                          Clear All ({activeFilterCount})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Daily Briefing */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 pb-1 border-b border-primary-200 dark:border-primary-700">
                    Daily Brief
                  </h3>
                  <div className="space-y-2">
                    {filteredArticles
                      .slice(0, 3)
                      .map((article) => (
                        <div
                          key={article.id}
                          className="pb-2 border-b border-primary-100 dark:border-primary-800 last:border-b-0"
                        >
                          <h4 className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark leading-tight mb-1 hover:text-text-secondary-light dark:hover:text-text-secondary-dark cursor-pointer line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {article.source_name} •{" "}
                            {new Date(article.publication_date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Breaking News */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 pb-1 border-b border-primary-200 dark:border-primary-700">
                    Breaking News
                  </h3>
                  <div className="space-y-2">
                    {filteredArticles
                      .filter((article) => article.section === "breaking")
                      .slice(0, 6)
                      .map((article) => (
                        <div
                          key={article.id}
                          className="pb-2 border-b border-primary-100 dark:border-primary-800 last:border-b-0"
                        >
                          <h4 className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark leading-tight mb-1 hover:text-text-secondary-light dark:hover:text-text-secondary-dark cursor-pointer line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {article.source_id} •{" "}
                            {new Date(article.publication_date).getHours()}h ago
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Trending Topics */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 pb-1 border-b border-primary-200 dark:border-primary-700">
                    Trending Topics
                  </h3>
                  <div className="space-y-1">
                    {[
                      "Politics",
                      "Technology",
                      "Business",
                      "Health",
                      "Education",
                      "Local",
                      "Science",
                    ].map((topic) => (
                      <div
                        key={topic}
                        className="flex items-center justify-between py-1 hover:bg-primary-50 dark:hover:bg-primary-900 px-2 -mx-2 rounded cursor-pointer"
                      >
                        <span className="text-xs text-text-primary-light dark:text-text-primary-dark">
                          {topic}
                        </span>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                          {
                            filteredArticles.filter((a) => a.topic === topic)
                              .length
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today's Coverage */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 pb-1 border-b border-primary-200 dark:border-primary-700">
                    Today's Coverage
                  </h3>
                  <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark p-3 rounded-lg">
                    <div className="text-center mb-2">
                      <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        {filteredArticles.length}
                      </div>
                      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        stories tracked
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Left sources</span>
                        <span className="font-medium">32%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Center sources</span>
                        <span className="font-medium">48%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Right sources</span>
                        <span className="font-medium">20%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Local News */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 pb-1 border-b border-primary-200 dark:border-primary-700">
                    Local News
                  </h3>
                  <div className="space-y-2">
                    {filteredArticles
                      .filter((article) => article.section === "local")
                      .slice(0, 5)
                      .map((article) => (
                        <div
                          key={article.id}
                          className="pb-2 border-b border-primary-100 dark:border-primary-800 last:border-b-0"
                        >
                          <h4 className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark leading-tight mb-1 hover:text-text-secondary-light dark:hover:text-text-secondary-dark cursor-pointer line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {article.source_id} •{" "}
                            {new Date(article.publication_date).getHours()}h ago
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Most Read */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3 pb-1 border-b border-primary-200 dark:border-primary-700">
                    Most Read
                  </h3>
                  <div className="space-y-2">
                    {filteredArticles.slice(0, 5).map((article, index) => (
                      <div
                        key={article.id}
                        className="flex items-start gap-2 pb-2 border-b border-primary-100 dark:border-primary-800 last:border-b-0"
                      >
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-1 w-4 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark leading-tight hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                            {article.source_id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load More Button */}
      {!isFiltering && filteredArticles.length > 0 && (
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto mt-8 text-center">
            <button
              className="px-6 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              disabled
            >
              Load More Articles
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                (Coming Soon)
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
