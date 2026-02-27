import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import ArticleCard from "../components/ArticleCard/ArticleCard";
import HeroSection from "../components/HeroSection/HeroSection";
import CMSLoadingState, { ErrorState, EmptyState } from "../components/UI/CMSLoadingState";
import topicCategoriesService from "../services/topicCategoriesService";
import { useAnalytics } from "../hooks/useAnalytics";

const TopicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { trackNewsEvent } = useAnalytics();
  
  const [topic, setTopic] = useState(null);
  const [articles, setArticles] = useState([]);
  const [heroArticle, setHeroArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uniqueSources, setUniqueSources] = useState([]);

  // Fetch topic metadata and articles
  useEffect(() => {
    const fetchTopicData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get topic metadata from CMS
        const topicData = await topicCategoriesService.getCategoryBySlug(slug);
        
        if (!topicData) {
          setError(`Topic "${slug}" not found`);
          setIsLoading(false);
          return;
        }

        setTopic(topicData);

        // Try multiple query strategies for better category matching
        // 1. Try the topic name (e.g., "Politics")
        // 2. Try the slug (e.g., "politics")
        // 3. Try the id (fallback)
        const queries = [
          topicData.name,
          topicData.slug,
          slug,
          topicData.id
        ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i); // unique values only

        let fetchedArticles = [];
        let response;
        
        // Try each query until we find articles
        for (const query of queries) {
          response = await fetch(
            `/api/articles?category=${encodeURIComponent(query)}&limit=50`
          );

          if (!response.ok) {
            console.warn(`Query failed for "${query}":`, response.statusText);
            continue;
          }

          const result = await response.json();
          fetchedArticles = result.data || [];

          
          if (fetchedArticles.length > 0) {
            break; // Found articles, stop trying
          }
        }

        setArticles(fetchedArticles);
        setHeroArticle(fetchedArticles[0] || null);

        // Track page view
        trackNewsEvent('topic_page_view', {
          topic_slug: slug,
          topic_name: topicData.name,
          article_count: fetchedArticles.length
        });

      } catch (err) {
        console.error('Error fetching topic data:', err);
        setError(err.message || 'Failed to load topic');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopicData();
  }, [slug, trackNewsEvent]);

  // Calculate coverage statistics
  const coverageStats = React.useMemo(() => {
    const leftCount = articles.filter(a => 
      a.political_bias === 'left' || (a.bias_score && a.bias_score < -0.2)
    ).length;
    const rightCount = articles.filter(a => 
      a.political_bias === 'right' || (a.bias_score && a.bias_score > 0.2)
    ).length;
    const centerCount = articles.length - leftCount - rightCount;

    return {
      totalSources: new Set(articles.map(a => a.source_id || a.source_name)).size,
      leftBias: leftCount,
      centerBias: centerCount,
      rightBias: rightCount,
      totalArticles: articles.length,
    };
  }, [articles]);

  // Extract unique sources from articles
  useEffect(() => {
    if (articles.length > 0) {
      // Extract unique sources from articles
      const sourceMap = new Map();
      articles.forEach(article => {
        const sourceId = article.source_id || article.source_name;
        if (sourceId && !sourceMap.has(sourceId)) {
          sourceMap.set(sourceId, {
            id: sourceId,
            name: article.source_name || sourceId,
            political_lean: article.political_bias === 'left' ? 'Left' : 
                           article.political_bias === 'right' ? 'Right' : 'Center'
          });
        }
      });
      setUniqueSources(Array.from(sourceMap.values()).slice(0, 8));
    }
  }, [articles]);

  // Loading unique sources from separate service (legacy support)
  useEffect(() => {
    const loadUniqueSources = async () => {
      if (articles.length > 0 && uniqueSources.length === 0) {
        const sourceIds = [...new Set(articles.map(a => a.source_id).filter(Boolean))];
        try {
          const response = await fetch(`/api/cms/news-sources`);
          if (response.ok) {
            const result = await response.json();
            const allSources = result.data || [];
            const filteredSources = allSources.filter(s => sourceIds.includes(s.id || s.domain)).slice(0, 8);
            if (filteredSources.length > 0) {
              setUniqueSources(filteredSources);
            }
          }
        } catch (error) {
          console.error('Failed to load sources:', error);
        }
      }
    };
    
    loadUniqueSources();
  }, [articles, uniqueSources.length]);

  // Handle article click
  const handleArticleClick = (article) => {
    trackNewsEvent('topic_article_click', {
      article_id: article.id,
      article_title: article.title,
      topic_slug: slug
    });
    navigate(`/article/${article.id}`);
  };

  // Handle follow topic
  const handleFollowTopic = (e) => {
    e.preventDefault();
    e.stopPropagation();
    trackNewsEvent('topic_follow_click', { topic_slug: slug });
    
    // TODO: Implement actual follow topic functionality
    // For now, show a visual notification
    const button = e.currentTarget;
    const originalText = button.textContent;
    button.textContent = 'Coming soon';
    button.classList.add('bg-primary-100', 'dark:bg-primary-800');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('bg-primary-100', 'dark:bg-primary-800');
    }, 2000);
  };

  // Handle suggest source
  const handleSuggestSource = () => {
    trackNewsEvent('suggest_source_click', { topic_slug: slug });
    // Navigate to feedback page with pre-filled suggestion context
    navigate('/contact?type=suggest_source&topic=' + encodeURIComponent(topicName));
  };

  const topicName = topic?.name || slug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Helmet>
          <title>Loading... | Asha.News</title>
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CMSLoadingState type="article" count={6} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Helmet>
          <title>Error | Asha.News</title>
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Helmet>
          <title>{topicName} - No Articles Yet | Asha.News</title>
          <meta name="description" content={`No articles available for ${topicName} at the moment.`} />
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <EmptyState 
            message={`No articles found for "${topicName}"`}
            description="Check back later for updates on this topic."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Helmet>
        <title>{topicName} - News Coverage | Asha.News</title>
        <meta name="description" content={`Comprehensive news coverage about ${topicName} from multiple sources and perspectives.`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Topic Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark mb-4 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  News about {topicName}
                </h1>
                <button
                  onClick={handleFollowTopic}
                  className="px-4 py-2 bg-transparent border border-text-secondary-light dark:border-text-secondary-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900 hover:border-primary-600 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors font-medium flex-shrink-0"
                >
                  Follow
                </button>
              </div>
              
              <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-6">
                Stay current with all the latest and breaking news about {topicName}, compare headlines and perspectives between news sources on stories happening today. {coverageStats.totalArticles > 0 ? `Currently tracking ${coverageStats.totalArticles} ${coverageStats.totalArticles === 1 ? 'story' : 'stories'} about ${topicName}.` : ''}
              </p>
            </div>

            {/* Hero Article */}
            {heroArticle && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
                  Top {topicName} News
                </h2>
                <HeroSection article={heroArticle} />
              </div>
            )}

            {/* Latest Articles */}
            <div className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.slice(1).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    size="standard"
                    showImage={true}
                    showBias={true}
                    onClick={() => handleArticleClick(article)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Covered Most By */}
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Covered Most By
              </h3>
              <div className="space-y-3">
                {uniqueSources.slice(0, 5).map((source) => (
                  <button
                    key={source.id}
                    onClick={() => {
                      trackNewsEvent('source_filter_click', {
                        source_name: source.name,
                        topic_slug: slug
                      });
                      // Navigate to search/articles page filtered by this source
                      navigate(`/search?source=${encodeURIComponent(source.name)}&topic=${encodeURIComponent(topicName)}`);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                          {source.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        {source.name}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      source.political_lean === 'Left' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                      source.political_lean === 'Right' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {source.political_lean || 'Center'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggest a Source */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Suggest a source
              </h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                Looking for a source we don't already have?
              </p>
              <button
                onClick={handleSuggestSource}
                className="w-full px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium text-sm"
              >
                Suggest a Source
              </button>
            </div>

            {/* Media Bias Breakdown */}
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Media Bias Breakdown
              </h3>
              
              {/* Coverage Statistics */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                <div className="text-center mb-2">
                  <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    {coverageStats.totalArticles}
                  </div>
                  <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    stories tracked
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Left sources</span>
                    <span className="font-medium">{Math.round((coverageStats.leftBias / coverageStats.totalArticles) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Center sources</span>
                    <span className="font-medium">{Math.round((coverageStats.centerBias / coverageStats.totalArticles) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Right sources</span>
                    <span className="font-medium">{Math.round((coverageStats.rightBias / coverageStats.totalArticles) * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Bias Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 flex overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full"
                    style={{ width: `${(coverageStats.leftBias / coverageStats.totalArticles) * 100}%` }}
                  />
                  <div 
                    className="bg-gray-500 h-full"
                    style={{ width: `${(coverageStats.centerBias / coverageStats.totalArticles) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500 h-full"
                    style={{ width: `${(coverageStats.rightBias / coverageStats.totalArticles) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <div className="flex justify-between mb-1">
                  <span>Total Sources:</span>
                  <span className="font-medium">{coverageStats.totalSources}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Articles:</span>
                  <span className="font-medium">{coverageStats.totalArticles}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TopicPage;
