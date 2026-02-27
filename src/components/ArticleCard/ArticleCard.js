import React, { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SourceLogo from "../UI/SourceLogo";
import TouchFeedback from "../UI/TouchFeedback";
import { useAnalytics } from "../../hooks/useAnalytics";

/**
 * Simplified, unified ArticleCard component
 * Used consistently across HomePage, TopicPage, StoriesPage
 * 
 * Features:
 * - Real data only (no fake calculations)
 * - Minimal, clean UI
 * - Size variants: compact, standard, large
 * - Only essential actions (save/bookmark)
 */
const ArticleCard = ({
  article,
  size = "standard",
  showImage = true,
  showBias = true,
  className = "",
  onClick
}) => {
  const { 
    isAuthenticated, 
    toggleSaveArticle, 
    isArticleSaved,
    addToReadingHistory
  } = useAuth();
  
  const { trackArticleView, trackEngagement } = useAnalytics();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const navigate = useNavigate();

  // Check if article is saved
  useEffect(() => {
    if (isAuthenticated && article?.id) {
      setIsBookmarked(isArticleSaved(article.id));
    }
  }, [isAuthenticated, article?.id, isArticleSaved]);

  // Early return if article is null/undefined
  if (!article) {
    return (
      <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500">Article not available</p>
      </div>
    );
  }

  const handleArticleClick = () => {
    // Track article view analytics
    trackArticleView({
      id: article.id,
      title: article.title,
      category: article.topic || article.category || "General",
      source: article.source_name || "Unknown",
      biasRating: article.political_bias,
      publishedAt: article.published_at || article.publication_date
    });

    // Add to reading history
    if (isAuthenticated) {
      addToReadingHistory({
        id: article.id,
        title: article.title,
        summary: article.summary,
        source: article.source_name || "Unknown",
        category: article.topic || article.category || "General",
        bias: article.political_bias,
        url: article.url || article.source_url
      });
    }

    // Call custom onClick or navigate
    if (onClick) {
      onClick(article);
    } else {
      navigate(`/article/${article.id}`);
    }
  };

  const toggleBookmark = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Could show a login prompt here
      navigate('/auth/signin');
      return;
    }

    // Track bookmark engagement
    trackEngagement('article_save', {
      action: isBookmarked ? 'remove' : 'add',
      article_id: article.id,
      article_title: article.title,
      source: article.source_name || "Unknown"
    });

    const articleData = {
      id: article.id,
      title: article.title,
      summary: article.summary,
      source: article.source_name || "Unknown",
      category: article.topic || article.category || "General",
      bias: article.political_bias,
      url: article.url || article.source_url,
      image: article.image_url,
      publishedAt: article.published_at || article.publication_date
    };
    
    toggleSaveArticle(articleData);
    setIsBookmarked(!isBookmarked);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown date";
      
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return "Yesterday";
      
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  const getBiasPill = (bias) => {
    const biasLower = (bias || 'center').toLowerCase();
    
    if (biasLower.includes('left') || biasLower === 'liberal') {
      return {
        label: 'Left',
        className: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      };
    }
    if (biasLower.includes('right') || biasLower === 'conservative') {
      return {
        label: 'Right',
        className: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
      };
    }
    return {
      label: 'Center',
      className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    };
  };

  // Size-based configurations
  const sizeConfig = {
    compact: {
      container: "p-3",
      imageHeight: "h-32",
      titleLines: "line-clamp-1",
      summaryLines: "line-clamp-1",
      showSummary: false,
      showBiasPill: false
    },
    standard: {
      container: "p-4",
      imageHeight: "h-48",
      titleLines: "line-clamp-2",
      summaryLines: "line-clamp-2",
      showSummary: true,
      showBiasPill: true
    },
    large: {
      container: "p-6",
      imageHeight: "h-64",
      titleLines: "line-clamp-3",
      summaryLines: "line-clamp-3",
      showSummary: true,
      showBiasPill: true
    }
  };

  const config = sizeConfig[size] || sizeConfig.standard;
  const bias = getBiasPill(article.political_bias);
  const publishDate = article.published_at || article.publication_date;
  const readingTime = article.reading_time || 1;

  return (
    <TouchFeedback
      onPress={handleArticleClick}
      className={`
        ${config.container}
        bg-surface-elevated-light dark:bg-surface-elevated-dark 
        border border-border-light dark:border-border-dark
        rounded-lg
        shadow-sm
        hover:shadow-md 
        transition-all duration-200 
        w-full max-w-full
        cursor-pointer
        ${className}
      `}
      role="button"
      aria-label={`Read article: ${article.title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleArticleClick();
        }
      }}
    >
      {/* Image */}
      {showImage && article.image_url && (
        <div className={`mb-3 -mx-${config.container.includes('p-3') ? '3' : config.container.includes('p-6') ? '6' : '4'} -mt-${config.container.includes('p-3') ? '3' : config.container.includes('p-6') ? '6' : '4'} overflow-hidden rounded-t-lg`}>
          <img
            src={article.image_url}
            alt={article.title}
            className={`w-full ${config.imageHeight} object-cover`}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Header: Source + Bookmark */}
      <header className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SourceLogo
            sourceName={article.source_name || "Unknown"}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark truncate">
              {article.source_name || "Unknown Source"}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatDate(publishDate)} • {readingTime} min read
            </p>
          </div>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={toggleBookmark}
          className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
            isBookmarked
              ? "text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900"
              : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          <svg
            className="w-4 h-4"
            fill={isBookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </header>

      {/* Article Content */}
      <div className="space-y-2">
        <h2 className={`text-base font-semibold text-text-primary-light dark:text-text-primary-dark leading-tight ${config.titleLines}`}>
          {article.title}
        </h2>

        {config.showSummary && article.summary && (
          <p className={`text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed ${config.summaryLines}`}>
            {article.summary}
          </p>
        )}

        {/* Footer: Category + Bias */}
        <div className="flex items-center justify-between gap-2 text-xs pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {article.topic && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark rounded-full">
                {article.topic}
              </span>
            )}
            {article.breaking_news && (
              <span className="px-2 py-1 bg-red-500 text-white rounded-full font-medium">
                BREAKING
              </span>
            )}
          </div>
          
          {showBias && config.showBiasPill && (
            <span className={`px-2 py-1 rounded-full font-medium ${bias.className}`}>
              {bias.label}
            </span>
          )}
        </div>
      </div>
    </TouchFeedback>
  );
};

export default memo(ArticleCard);
