import React, { useCallback, useMemo, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import ArticleCard from "../ArticleCard/ArticleCard";
import HeroSection from "../HeroSection/HeroSection";
import DailyBriefs from '../Home/DailyBriefs';

const NewsFeed = ({
  articles = [],
  layout = "adaptive",
  showBiasOverview = true,
  searchQuery: propSearchQuery = "",
  className = "",
  showFilters = true,
  showSidebar = true,
}) => {
  console.log("NewsFeed received articles:", articles.length);

  const [searchQuery, setSearchQuery] = useState(propSearchQuery);
  const [sortBy] = useState("date");
  const [filterTopic, setFilterTopic] = useState([]);
  const [filterBias, setFilterBias] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [filterSources, setFilterSources] = useState([]);
  const [isFiltering] = useState(false);

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

          // Handle topic filters
          if (searchData.metadata.topics) {
            matches =
              matches &&
              searchData.metadata.topics.some((topic) =>
                article.topic.toLowerCase().includes(topic.toLowerCase())
              );
          }

          return matches;
        });
      }
    }

    // Topic filter (multi-select)
    if (filterTopic.length > 0) {
      filtered = filtered.filter((article) =>
        filterTopic.includes(article.topic)
      );
    }

    // Bias filter
    if (filterBias) {
      filtered = filtered.filter(
        (article) => article.political_bias === filterBias
      );
    }

    // Date range filter
    if (filterDateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filterDateRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter(
        (article) => new Date(article.publication_date) >= cutoffDate
      );
    }

    // Sources filter
    if (filterSources.length > 0) {
      filtered = filtered.filter((article) =>
        filterSources.includes(article.source_id)
      );
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
      {isFiltering && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-text-secondary-light dark:text-text-secondary-dark">
            Filtering articles...
          </span>
        </div>
      )}

      {/* Main Content */}
      {!isFiltering && (
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
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 lg:mb-6 pb-2 border-b border-primary-200 dark:border-primary-700">
                    Top News Stories
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages.slice(0, 6).map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        showBiasOverview={showBiasOverview}
                        layout="featured"
                        size="medium"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Politics with Images */}
              {articlesWithImages.filter(
                (article) => article.topic === "Politics"
              ).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 lg:mb-6 pb-2 border-b border-primary-200 dark:border-primary-700">
                    Politics
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages
                      .filter((article) => article.topic === "Politics")
                      .slice(0, 4)
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
                </div>
              )}

              {/* Articles Without Images - Text-only Section */}
              {articlesWithoutImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 lg:mb-6 pb-2 border-b border-primary-200 dark:border-primary-700">
                    Latest Updates
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithoutImages
                      .slice(5) // Skip first 5 already shown in sidebar
                      .map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          showBiasOverview={showBiasOverview}
                          layout="compact"
                          size="compact"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Technology with Images */}
              {articlesWithImages.filter(
                (article) => article.topic === "Technology"
              ).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 lg:mb-6 pb-2 border-b border-primary-200 dark:border-primary-700">
                    Technology
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages
                      .filter((article) => article.topic === "Technology")
                      .slice(0, 6)
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
                </div>
              )}

              {/* Business with Images */}
              {articlesWithImages.filter(
                (article) => article.topic === "Business"
              ).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 lg:mb-6 pb-2 border-b border-primary-200 dark:border-primary-700">
                    Business
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {articlesWithImages
                      .filter((article) => article.topic === "Business")
                      .slice(0, 6)
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
                  <DailyBriefs articles={filteredArticles} />
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
