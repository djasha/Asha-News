import React, { useState } from 'react';
import { getSourceById } from '../../data/mockSources';
import BiasIndicator from '../BiasVisualization/BiasIndicator';
import CredibilityMeter from '../BiasVisualization/CredibilityMeter';

const ArticleCard = ({ 
  article, 
  size = 'medium', 
  showSummary = true, 
  showMetrics = true,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullBias, setShowFullBias] = useState(false);
  
  const source = getSourceById(article.source_id);
  
  // Format publication date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Get bias color for indicator
  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'text-bias-left';
      case 'right': return 'text-bias-right';
      default: return 'text-bias-center';
    }
  };

  // Get emotional tone indicator
  const getToneIndicator = (tone) => {
    switch (tone) {

        {/* Article Header */}
        <header className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                {source?.name?.charAt(0) || 'N'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                {source?.name || 'Unknown Source'}
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {formatDate(article.publication_date)}
              </p>
            </div>
          </div>
          {showBiasOverview && (
            <BiasIndicator 
              bias={article.political_bias}
              confidence={article.confidence_score}
              size="small"
              showConfidence={true}
              showTooltip={true}
              interactive={true}
            />
          )}
        </header>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark leading-tight">
            {article.title}
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
            {article.summary}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-full">
              {article.topic}
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Horizontal layout for breaking news
  if (layout === 'horizontal') {
    return (
      <article 
        className={`
          ${getSizeClasses()}
          bg-surface-light dark:bg-surface-dark 
          border border-primary-200 dark:border-primary-700 
          rounded-lg 
          hover:shadow-md 
          transition-all duration-200 
          cursor-pointer
          w-full
          ${className}
        `}
        onClick={toggleExpanded}
        tabIndex={0}
        role="button"
      >
        <div className="flex gap-4">
          {/* Image */}
          {article.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={article.image_url} 
                alt={article.title}
                className="w-24 h-16 object-cover rounded"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0 w-4 h-4 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                    {source?.name?.charAt(0) || 'N'}
                  </span>
                </div>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                  {source?.name || 'Unknown Source'}
                </span>
              </div>
              {showBiasOverview && (
                <BiasIndicator 
                  bias={article.political_bias}
                  confidence={article.confidence_score}
                  size="small"
                  showConfidence={false}
                  showTooltip={true}
                  interactive={true}
                />
              )}
            </div>
            
            <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark leading-tight line-clamp-2 mb-1">
              {article.title}
            </h3>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatDate(article.publication_date)}
            </p>
          </div>
        </div>
      </article>
    );
  }

  // Standard layout
  return (
    <article 
      className={`
        ${getSizeClasses()}
        bg-surface-light dark:bg-surface-dark 
        border border-primary-200 dark:border-primary-700 
        rounded-lg 
        hover:shadow-md 
        transition-all duration-200 
        cursor-pointer
        w-full max-w-full
        ${className}
      `}
      onClick={toggleExpanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleExpanded();
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`Read article: ${article.title}`}
    >
      {/* Image */}
      {article.image_url && (
        <div className="mb-3 -mx-4 -mt-4">
          <img 
            src={article.image_url} 
            alt={article.title}
            className="w-full h-32 object-cover rounded-t-lg"
            loading="lazy"
          />
        </div>
      )}

      {/* Article Header */}
      <header className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex-shrink-0 w-6 h-6 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
              {source?.name?.charAt(0) || 'N'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark truncate">
              {source?.name || 'Unknown Source'}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatDate(article.publication_date)}
            </p>
          </div>
        </div>

        {showBiasOverview && (
          <div className="flex-shrink-0">
            <BiasIndicator 
              bias={article.political_bias}
              confidence={article.confidence_score}
              size="small"
              showConfidence={true}
              showTooltip={true}
              interactive={true}
            />
          </div>
        )}
      </header>

      {/* Article Content */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark leading-tight line-clamp-2">
          {article.title}
        </h2>
        
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed line-clamp-2">
          {article.summary}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-full">
            {article.topic}
          </span>
          
          {/* Emotional tone indicator */}
          <span className="flex items-center gap-1" title={`Tone: ${article.emotional_tone}`}>
            {getToneIndicator(article.emotional_tone)}
            <span className="hidden sm:inline">{article.emotional_tone}</span>
          </span>
          
          {/* Quality score */}
          <span className="flex items-center gap-1" title={`Quality: ${Math.round(article.factual_quality * 100)}%`}>
            ⭐
            <span className="hidden sm:inline">{Math.round(article.factual_quality * 100)}%</span>
          </span>
        </div>

        {/* Author */}
        {article.author && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            By {article.author}
          </p>
        )}
      </div>

      {/* Enhanced bias visualization for larger cards */}
      {(showFullBias || size === 'large') && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Source Credibility</span>
            <span>{Math.round(source?.credibility_score * 20)}/5</span>
          </div>
          
          <CredibilityMeter 
            factualAccuracy={source?.factual_accuracy || 0}
            biasTransparency={source?.bias_transparency || 0}
            size="small"
            showLabels={false}
          />
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
              <span className="ml-1 font-medium">{Math.round(article.confidence_score * 100)}%</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Bias:</span>
              <span className={`ml-1 font-medium ${getBiasColor(article.political_bias)}`}>
                {article.political_bias}
              </span>
            </div>
          </div>
        </div>
      )}

        {/* Keyboard navigation hint */}
        <div className="sr-only">
          Press Enter to read full article, Tab to navigate to next article
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
