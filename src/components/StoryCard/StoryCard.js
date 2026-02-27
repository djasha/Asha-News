import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Unified StoryCard component
 * Used consistently across StoriesPage, HomePage, StoryClusterPage
 * 
 * Features:
 * - Real data from /api/clusters endpoint
 * - Bias distribution visualization
 * - Source count and icons
 * - Article count
 * - Blindspot indicator
 * - Expandable article list
 * - Clean, minimal UI
 */
const StoryCard = ({
  cluster,
  size = "standard", // compact | standard | large
  showBiasBar = true,
  showArticles = false, // Show expanded articles by default
  showKeyTakeaways = true,
  onClick,
  onArticleClick,
  className = ""
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(showArticles);

  // Early return if no cluster
  if (!cluster) {
    return (
      <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500">Story not available</p>
      </div>
    );
  }

  const {
    id,
    cluster_title,
    articles = [],
    bias_distribution,
    article_count,
    created_at,
    updated_at
  } = cluster;

  // Extract real data from cluster
  const title = cluster_title || 'Untitled Story';
  
  // Get actual articles array
  const articlesArray = Array.isArray(articles) ? articles : [];
  
  // Extract unique sources from articles
  const uniqueSources = [...new Set(articlesArray.map(a => a?.source_name).filter(Boolean))];
  const sourceCount = uniqueSources.length || article_count || 0;
  
  // Calculate latest published date from articles
  const publishedDates = articlesArray
    .map(a => a?.published_at || a?.date_created)
    .filter(Boolean)
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()));
  
  let latestDate;
  if (publishedDates.length > 0) {
    latestDate = new Date(Math.max(...publishedDates));
  } else if (created_at) {
    latestDate = new Date(created_at);
  } else if (updated_at) {
    latestDate = new Date(updated_at);
  } else {
    latestDate = new Date(); // Fallback to now
  }
  
  // Normalize bias distribution - extract percentage from objects if needed
  const extractPercentage = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value.percentage !== undefined) return value.percentage;
    if (typeof value === 'object' && value.count !== undefined) return value.count;
    return 0;
  };

  const biasDistribution = {
    left: extractPercentage(bias_distribution?.left),
    center: extractPercentage(bias_distribution?.center),
    right: extractPercentage(bias_distribution?.right)
  };
  
  // Check if blindspot (only one bias category has coverage)
  const activeBiasCategories = [
    biasDistribution.left || 0,
    biasDistribution.center || 0,
    biasDistribution.right || 0
  ].filter(v => v > 0).length;
  const isBlindspot = activeBiasCategories === 1 && sourceCount >= 2;

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const now = new Date();
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return `${Math.floor(diffInDays / 7)}w ago`;
    } catch (error) {
      return 'Recently';
    }
  };

  const publishedDate = latestDate;

  // Get source initials
  const getSourceInitials = (sourceName) => {
    if (!sourceName) return '?';
    return sourceName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Get bias color for source
  const getBiasColor = (sourceName) => {
    if (!sourceName) return 'bg-gray-400';
    
    const lowerSource = sourceName.toLowerCase();
    
    // Left-leaning sources
    if (['cnn', 'msnbc', 'guardian', 'npr', 'bbc', 'reuters', 'huffpost', 'vox'].some(s => lowerSource.includes(s))) {
      return 'bg-blue-500';
    }
    
    // Right-leaning sources
    if (['fox', 'wall street journal', 'wsj', 'new york post', 'nypost', 'daily mail', 'breitbart', 'newsmax'].some(s => lowerSource.includes(s))) {
      return 'bg-red-500';
    }
    
    // Center/neutral
    return 'bg-gray-400';
  };

  // Build key takeaways from articles
  const buildKeyTakeaways = () => {
    if (!Array.isArray(articlesArray) || articlesArray.length === 0) return [];
    
    // Take top 3 article titles
    const points = articlesArray
      .slice(0, 3)
      .map(a => a?.title)
      .filter(Boolean)
      .map(t => t.replace(/^[-•\s]+/, '').trim());
    
    // Deduplicate similar titles
    const seen = new Set();
    const unique = [];
    for (const p of points) {
      const key = p.toLowerCase().slice(0, 60);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    return unique;
  };

  const keyTakeaways = buildKeyTakeaways();

  // Handle clicks
  const handleCardClick = () => {
    if (onClick) {
      onClick(cluster);
    } else {
      navigate(`/story/${id}`);
    }
  };

  const handleViewAllClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleArticleItemClick = (article, e) => {
    e.stopPropagation();
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      navigate(`/article/${article.id}`);
    }
  };

  const handleViewStoryClick = (e) => {
    e.stopPropagation();
    navigate(`/story/${id}`);
  };

  // Size configurations
  const sizeConfig = {
    compact: {
      container: "p-4",
      titleSize: "text-base",
      showKeyTakeaways: false,
      showExpandButton: false
    },
    standard: {
      container: "p-4",
      titleSize: "text-lg",
      showKeyTakeaways: true,
      showExpandButton: true
    },
    large: {
      container: "p-6",
      titleSize: "text-xl",
      showKeyTakeaways: true,
      showExpandButton: true
    }
  };

  const config = sizeConfig[size] || sizeConfig.standard;

  return (
    <div 
      className={`
        ${config.container}
        bg-white dark:bg-gray-900 
        rounded-lg 
        border border-gray-200 dark:border-gray-700 
        hover:shadow-lg 
        transition-shadow 
        cursor-pointer
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="mb-4">
        {/* Story Title */}
        <h2 className={`${config.titleSize} font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight`}>
          {title}
        </h2>
        
        {/* Meta Information */}
        <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTimeAgo(publishedDate)}
          </span>
          
          {sourceCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
            </span>
          )}
          
          {isBlindspot && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Blindspot
            </span>
          )}
        </div>

        {/* Key Takeaways */}
        {showKeyTakeaways && config.showKeyTakeaways && keyTakeaways.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key takeaways</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {keyTakeaways.map((point, idx) => (
                <li key={idx} className="leading-snug">{point}</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bias Distribution Bar */}
      {showBiasBar && biasDistribution && sourceCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bias Distribution</span>
          </div>
          
          {/* Bias Bar */}
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
      )}

      {/* Source Icons Preview */}
      {sourceCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sources:</span>
            <div className="flex -space-x-1">
              {uniqueSources.slice(0, 6).map((source, index) => (
              <div
                key={`${source}-${index}`}
                className={`w-8 h-8 rounded-full ${getBiasColor(source)} flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-900`}
                title={source}
              >
                {getSourceInitials(source)}
              </div>
            ))}
              {sourceCount > 6 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold border-2 border-white dark:border-gray-900">
                  +{sourceCount - 6}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {config.showExpandButton && (
          <button
            onClick={handleViewAllClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {isExpanded ? 'Hide Details' : 'View All Sources'}
          </button>
        )}
        
        <button
          onClick={handleViewStoryClick}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
        >
          Open Story
        </button>
      </div>

      {/* Expanded Articles List */}
      {isExpanded && articlesArray.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            All Coverage ({sourceCount} {sourceCount === 1 ? 'source' : 'sources'})
          </h3>
          
          <div className="space-y-3">
            {articlesArray.map((article, index) => {
              if (!article) return null;
              return (
                <div
                  key={article.id || index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={(e) => handleArticleItemClick(article, e)}
                >
                  {/* Source Icon */}
                  <div 
                    className={`w-10 h-10 rounded-full ${getBiasColor(article?.source_name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                    title={article?.source_name || 'Unknown'}
                  >
                    {getSourceInitials(article?.source_name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {article?.source_name || 'Unknown Source'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(article?.published_at)}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">
                      {article?.title || 'Untitled'}
                    </h4>
                    
                    {(article?.description || article?.summary || article?.excerpt) && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article?.description || article?.summary || article?.excerpt}
                      </p>
                    )}
                  </div>
                  
                  {(article?.image || article?.image_url) && (
                    <img
                      src={article?.image || article?.image_url}
                      alt={article?.title || 'Article'}
                      className="w-16 h-12 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCard;
