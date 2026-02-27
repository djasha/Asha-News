import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ArticleCard from '../components/ArticleCard/ArticleCard';
import { API_SERVER } from '../config/api';

const SourcePage = () => {
  const { sourceName } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null);

  const decodedSourceName = decodeURIComponent(sourceName);

  useEffect(() => {
    const fetchSourceArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const API_URL = API_SERVER;
        
        // Fetch articles from this source
        const response = await fetch(`${API_URL}/api/articles?source=${encodeURIComponent(decodedSourceName)}&limit=50`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setArticles(data.data);
          
          // Set source info from first article
          if (data.data.length > 0) {
            const firstArticle = data.data[0];
            setSourceInfo({
              name: firstArticle.source_name || decodedSourceName,
              political_bias: firstArticle.political_bias,
              category: firstArticle.category
            });
          }
        } else {
          setArticles([]);
        }
      } catch (err) {
        console.error('Error fetching source articles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSourceArticles();
  }, [decodedSourceName]);

  const getPoliticalLeanColor = (bias) => {
    if (!bias) return 'gray';
    const lowerBias = bias.toLowerCase();
    if (lowerBias.includes('left')) return 'blue';
    if (lowerBias.includes('right')) return 'red';
    return 'gray';
  };

  const getBiasColorClasses = (bias) => {
    const color = getPoliticalLeanColor(bias);
    if (color === 'blue') {
      return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    } else if (color === 'red') {
      return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
    }
    return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <Helmet>
        <title>{decodedSourceName} - Latest Articles | Asha News</title>
        <meta 
          name="description" 
          content={`Latest news articles from ${decodedSourceName}. Read unbiased news coverage with balanced perspectives.`} 
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Source Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                {decodedSourceName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                {decodedSourceName}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {sourceInfo?.political_bias && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getBiasColorClasses(sourceInfo.political_bias)}`}>
                    {sourceInfo.political_bias.charAt(0).toUpperCase() + sourceInfo.political_bias.slice(1)} Lean
                  </span>
                )}
                {sourceInfo?.category && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700">
                    {sourceInfo.category}
                  </span>
                )}
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Failed to Load Articles
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* No Articles */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              No Articles Found
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              No articles available from {decodedSourceName} at this time.
            </p>
            <button
              onClick={() => navigate('/sources')}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Browse All Sources
            </button>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                size="default"
                showBiasOverview={true}
                onClick={() => navigate(`/article/${article.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcePage;
