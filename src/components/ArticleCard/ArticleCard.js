import React, { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSourceById } from "../../data/mockSources";
import BiasIndicator from "../BiasVisualization/BiasIndicator";
import CoverageIndicator from "../BiasVisualization/CoverageIndicator";
import SourceLogo from "../UI/SourceLogo";
import TouchFeedback from "../UI/TouchFeedback";

const ArticleCard = ({
  article,
  showBiasOverview = true,
  size = "standard",
  layout = "standard",
  className = "",
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const navigate = useNavigate();
  const source = getSourceById(article.source_id);

  const handleArticleClick = () => {
    navigate(`/article/${article.id}`);
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(article.url);
    const title = encodeURIComponent(article.title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      copy: () => {
        navigator.clipboard.writeText(article.url);
        setShowShareMenu(false);
      },
    };

    if (platform === "copy") {
      shareUrls.copy();
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
      setShowShareMenu(false);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const estimateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(" ").length;
    return Math.ceil(words / wordsPerMinute);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSizeClasses = () => {
    switch (size) {
      case "compact":
        return "p-3";
      case "large":
        return "p-6";
      default:
        return "p-4";
    }
  };

  // Standard layout
  return (
    <TouchFeedback
      onPress={handleArticleClick}
      className={`
        ${getSizeClasses()}
        bg-surface-elevated-light dark:bg-surface-elevated-dark 
        border border-primary-200/20 dark:border-primary-700/20 
        rounded-mobile 
        shadow-mobile
        hover:shadow-mobile-lg 
        transition-all duration-200 
        w-full max-w-full
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
      {article.image_url && (
        <div className="mb-4 -mx-4 -mt-4 overflow-hidden rounded-t-mobile">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Article Header */}
      <header className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SourceLogo
            sourceName={source?.name || article.source_name || "Unknown"}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark truncate">
              {source?.name || "Unknown Source"}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatDate(article.publication_date)} •{" "}
              {estimateReadingTime(article.summary)} min read •{" "}
              {Math.round(article.factual_quality * 100)}% factual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark();
            }}
            className={`p-1.5 rounded-full transition-colors ${
              isBookmarked
                ? "text-text-primary-light dark:text-text-primary-dark bg-gray-100 dark:bg-gray-700"
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

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareMenu(!showShareMenu);
              }}
              className="p-1.5 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Share article"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface-light dark:bg-surface-dark border border-primary-200 dark:border-primary-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => handleShare("twitter")}
                  className="w-full px-3 py-2 text-left text-xs text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                >
                  Twitter
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="w-full px-3 py-2 text-left text-xs text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleShare("linkedin")}
                  className="w-full px-3 py-2 text-left text-xs text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="w-full px-3 py-2 text-left text-xs text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>

          {showBiasOverview && (
            <div className="flex-shrink-0">
              <BiasIndicator
                bias={article.political_bias}
                confidence={article.confidence_score}
                size="small"
                showConfidence={true}
                showTooltip={false}
                interactive={false}
                abbreviated={true}
              />
            </div>
          )}
        </div>
      </header>

      {/* Article Content */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark leading-tight line-clamp-2">
          {article.title}
        </h2>

        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed line-clamp-2">
          {article.summary}
        </p>

        {/* Coverage Visualization */}
        {article.coverage && (
          <div className="space-y-2">
            <CoverageIndicator
              coverage={article.coverage}
              size="small"
              showDetails={true}
            />
          </div>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark rounded-full">
            {article.topic}
          </span>
        </div>
      </div>
    </TouchFeedback>
  );
};

export default memo(ArticleCard);
