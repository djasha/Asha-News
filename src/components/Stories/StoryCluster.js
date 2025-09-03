import React, { useState } from 'react';
import BiasChart from '../BiasVisualization/BiasChart';

const StoryCluster = ({ cluster, onArticleClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { mainArticle, articles, sources, biasDistribution, isBlindspot } = cluster;

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor((now - publishedDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const getBiasColor = (sourceName) => {
    const leftSources = ['CNN', 'MSNBC', 'The Guardian', 'NPR', 'BBC', 'Reuters'];
    const rightSources = ['Fox News', 'Wall Street Journal', 'New York Post', 'Daily Mail'];
    
    const lowerSource = sourceName.toLowerCase();
    
    if (leftSources.some(source => lowerSource.includes(source.toLowerCase()))) {
      return 'text-blue-600 dark:text-blue-400';
    }
    if (rightSources.some(source => lowerSource.includes(source.toLowerCase()))) {
      return 'text-red-600 dark:text-red-400';
    }
    
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Main Story Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark line-clamp-2">
                {mainArticle.title}
              </h2>
              {isBlindspot && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Blindspot
                </div>
              )}
            </div>
            
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4 line-clamp-2">
              {mainArticle.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                {sources.size} sources
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTimeAgo(mainArticle.published_at)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {articles.length} articles
              </span>
            </div>

            {/* Bias Distribution */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                  Coverage Perspective
                </span>
                {isBlindspot && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    One-sided coverage detected
                  </span>
                )}
              </div>
              <BiasChart biasDistribution={biasDistribution} size="medium" showLabels={false} />
            </div>
          </div>

          {mainArticle.image && (
            <div className="ml-6 flex-shrink-0">
              <img
                src={mainArticle.image}
                alt={mainArticle.title}
                className="w-32 h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {isExpanded ? 'Hide' : 'View'} All Perspectives
          </button>
          
          <button
            onClick={() => onArticleClick(mainArticle)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-primary-light dark:text-text-primary-dark rounded-lg transition-colors"
          >
            Read Main Story
          </button>
        </div>
      </div>

      {/* Expanded Articles List */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              All Perspectives on This Story
            </h3>
            
            <div className="space-y-4">
              {articles.map((article, index) => (
                <div
                  key={article.id || index}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onArticleClick(article)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-medium ${getBiasColor(article.source_name)}`}>
                        {article.source_name}
                      </span>
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {formatTimeAgo(article.published_at)}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                      {article.title}
                    </h4>
                    
                    {article.description && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
                        {article.description}
                      </p>
                    )}
                  </div>
                  
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-20 h-16 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCluster;
