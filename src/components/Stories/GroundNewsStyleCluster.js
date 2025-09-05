import React, { useState } from 'react';

const GroundNewsStyleCluster = ({ cluster, onArticleClick }) => {
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
      return 'bg-blue-500';
    }
    if (rightSources.some(source => lowerSource.includes(source.toLowerCase()))) {
      return 'bg-red-500';
    }
    
    return 'bg-gray-400';
  };

  const getSourceInitials = (sourceName) => {
    return sourceName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Main Story Header - Ground.News Style */}
      <div className="p-4">
        {/* Story Title and Meta */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
            {mainArticle.title}
          </h2>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimeAgo(mainArticle.published_at)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              {articles.length} articles
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {sources.size} sources
            </span>
            {isBlindspot && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Blindspot
              </span>
            )}
          </div>
        </div>

        {/* Ground.News Style Bias Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Coverage</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{sources.size} sources</span>
          </div>
          
          {/* Bias Distribution Bar - Ground.News Style */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            {biasDistribution.left > 0 && (
              <div 
                className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${biasDistribution.left}%` }}
                title={`Left: ${biasDistribution.left}%`}
              >
                {biasDistribution.left > 15 ? `L ${biasDistribution.left}%` : ''}
              </div>
            )}
            {biasDistribution.center > 0 && (
              <div 
                className="bg-gray-400 h-full flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${biasDistribution.center}%` }}
                title={`Center: ${biasDistribution.center}%`}
              >
                {biasDistribution.center > 15 ? `C ${biasDistribution.center}%` : ''}
              </div>
            )}
            {biasDistribution.right > 0 && (
              <div 
                className="bg-red-500 h-full flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${biasDistribution.right}%` }}
                title={`Right: ${biasDistribution.right}%`}
              >
                {biasDistribution.right > 15 ? `R ${biasDistribution.right}%` : ''}
              </div>
            )}
          </div>
          
          {/* Bias Labels */}
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Left {biasDistribution.left}%</span>
            <span>Center {biasDistribution.center}%</span>
            <span>Right {biasDistribution.right}%</span>
          </div>
        </div>

        {/* Source Icons Preview */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sources:</span>
            <div className="flex -space-x-1">
              {Array.from(sources).slice(0, 6).map((source, index) => (
                <div
                  key={source}
                  className={`w-8 h-8 rounded-full ${getBiasColor(source)} flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-900`}
                  title={source}
                >
                  {getSourceInitials(source)}
                </div>
              ))}
              {sources.size > 6 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold border-2 border-white dark:border-gray-900">
                  +{sources.size - 6}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {isExpanded ? 'Hide Details' : 'View All Sources'}
          </button>
          
          <button
            onClick={() => onArticleClick(mainArticle)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
          >
            Read Story
          </button>
        </div>
      </div>

      {/* Expanded Articles List - Ground.News Style */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              All Coverage ({articles.length} articles)
            </h3>
            
            <div className="space-y-3">
              {articles.map((article, index) => (
                <div
                  key={article.id || index}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => onArticleClick(article)}
                >
                  {/* Source Icon */}
                  <div className={`w-10 h-10 rounded-full ${getBiasColor(article.source_name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {getSourceInitials(article.source_name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {article.source_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(article.published_at)}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">
                      {article.title}
                    </h4>
                    
                    {article.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                  </div>
                  
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-16 h-12 object-cover rounded flex-shrink-0"
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

export default GroundNewsStyleCluster;
