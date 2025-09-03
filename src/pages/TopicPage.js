import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import ArticleCard from "../components/ArticleCard/ArticleCard";
import HeroSection from "../components/HeroSection/HeroSection";
import { mockArticles } from "../data/mockArticles";
import { getSourceById } from "../data/mockSources";

const TopicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [heroArticle, setHeroArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Topic mapping
  const topicMap = {
    "israel-gaza": "Israel-Gaza",
    "donald-trump": "Donald Trump",
    "artificial-intelligence": "Artificial Intelligence",
    "social-media": "Social Media",
    "xi-jinping": "Xi Jinping",
    "nfl": "NFL",
    "education": "Education",
    "stock-markets": "Stock Markets",
    "vladimir-putin": "Vladimir Putin",
    "us-economy": "US Economy",
    "apple": "Apple",
    "nato": "NATO",
  };

  const topicName = topicMap[slug] || slug.replace("-", " ");

  useEffect(() => {
    // Simulate loading and filter articles by topic
    setIsLoading(true);
    
    setTimeout(() => {
      // Filter articles related to the topic
      const topicArticles = mockArticles.filter(article => 
        article.title.toLowerCase().includes(topicName.toLowerCase()) ||
        article.summary.toLowerCase().includes(topicName.toLowerCase()) ||
        article.topic.toLowerCase().includes(topicName.toLowerCase())
      );

      // If no specific matches, show some general articles
      const finalArticles = topicArticles.length > 0 ? topicArticles : mockArticles.slice(0, 12);
      
      setArticles(finalArticles);
      setHeroArticle(finalArticles[0] || null);
      setIsLoading(false);
    }, 500);
  }, [slug, topicName]);

  // Calculate coverage statistics
  const coverageStats = {
    totalSources: new Set(articles.map(a => a.source_id)).size,
    leftBias: articles.filter(a => a.political_bias === 'left').length,
    centerBias: articles.filter(a => a.political_bias === 'center').length,
    rightBias: articles.filter(a => a.political_bias === 'right').length,
    totalArticles: articles.length,
  };

  // Get unique sources
  const uniqueSources = [...new Set(articles.map(a => a.source_id))]
    .map(sourceId => getSourceById(sourceId))
    .filter(Boolean)
    .slice(0, 8);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                  onClick={() => navigate('/auth/signin')}
                  className="px-4 py-2 bg-transparent border border-text-secondary-light dark:border-text-secondary-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900 hover:border-primary-600 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors font-medium flex-shrink-0"
                >
                  Follow
                </button>
              </div>
              
              <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-6">
                Stay current with all the latest and breaking news about {topicName}, compare headlines and perspectives between news sources on stories happening today. In total, {coverageStats.totalArticles} stories have been published about {topicName} which Asha News has aggregated in the past 3 months.
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
                    size="medium"
                    showBiasOverview={true}
                    onClick={() => navigate(`/article/${article.id}`)}
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
                  <div key={source.id} className="flex items-center justify-between">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Suggest a Source */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Suggest a source
              </h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                Looking for a source we don't already have? Suggest one <button className="text-primary-600 dark:text-primary-400 underline hover:no-underline">here</button>.
              </p>
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
