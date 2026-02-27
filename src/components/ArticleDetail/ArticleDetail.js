import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSourceById } from "../../services/newsSourcesService";
import ArticleCard from "../ArticleCard/ArticleCard";
import AIAnalysisCard from "../BiasVisualization/AIAnalysisCard";
import BiasIndicator from "../BiasVisualization/BiasIndicator";
import ArticleContent from "./ArticleContent";
import { API_BASE } from "../../config/api";

const ArticleDetail = ({
  article,
  relatedArticles = [],
  onClose,
  isModal = false,
  showBiasOverview = true,
}) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showBiasDetails, setShowBiasDetails] = useState(false);
  const [source, setSource] = useState(null);
  const [fullContent, setFullContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(null);
  const navigate = useNavigate();

  // Load source data asynchronously
  useEffect(() => {
    const loadSource = async () => {
      if (article.source_id) {
        try {
          const sourceData = await getSourceById(article.source_id);
          setSource(sourceData);
        } catch (error) {
          console.error('Failed to load source:', error);
        }
      }
    };
    loadSource();
  }, [article.source_id]);

  // Load full article content
  useEffect(() => {
    const loadFullContent = async () => {
      // Check if article has content in database
      const hasContent = article.content && article.content.length > 100;
      
      // Use database content if available
      if (hasContent) {
        setFullContent({ 
          content: article.content, 
          source: 'database',
          title: article.title,
          summary: article.summary
        });
        return;
      }

      // Check if article has a URL for scraping
      const articleUrl = article.url || article.source_url;
      
      // If no URL and no content, use summary as content
      if (!articleUrl || articleUrl === '') {
        console.log('[ArticleDetail] No source URL available, using summary as content');
        setFullContent({ 
          content: article.summary || 'Content not available',
          source: 'summary',
          title: article.title,
          summary: article.summary
        });
        return;
      }

      // Try to scrape content from URL
      setContentLoading(true);
      setContentError(null);

      try {
        const response = await fetch(`${API_BASE}/articles/${article.id}/full-content`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data.scrapedContent) {
          setFullContent(data.data.scrapedContent);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error loading full content:', error);
        // Fallback to summary
        setFullContent({ 
          content: article.summary || article.content || 'Content not available',
          source: 'fallback',
          title: article.title,
          summary: article.summary
        });
        setContentError(null); // Clear error since we have fallback content
      } finally {
        setContentLoading(false);
      }
    };

    loadFullContent();
  }, [article.id, article.url, article.source_url, article.content, article.title, article.summary]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      setReadingProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && (onClose || isModal)) {
        if (onClose) onClose();
        else navigate(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isModal, navigate]);

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
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown date";
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return "Unknown date";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-primary-600 dark:bg-primary-400 z-50 transition-all duration-300"
        style={{ width: `${readingProgress}%` }}
      />

      {/* Main Content */}
      <main className="w-full max-w-[1350px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_350px] 2xl:grid-cols-[1fr_400px] gap-8 lg:gap-12 xl:gap-16 px-4 sm:px-6 lg:px-8 py-8">
          {/* Article Content */}
          <article className="max-w-none order-1 lg:order-none">
            {/* Article Header with Save/Share */}
            <header className="mb-8">
              {/* Source and Meta Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                    {(source?.name || article.source_name || "News")?.charAt(0) || "N"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {source?.name || article.source_name || 'Unknown Source'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{formatDate(article.published_at || article.publication_date)}</span>
                    <span>•</span>
                    <span>By {article.author_name || article.author || 'Unknown'}</span>
                    <span>•</span>
                    <span>{estimateReadingTime(article.summary || '')} min read</span>
                  </div>
                </div>

                {/* Save/Share buttons next to read time */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleBookmark}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isBookmarked
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900"
                        : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900"
                    }`}
                    aria-label={
                      isBookmarked ? "Remove bookmark" : "Add bookmark"
                    }
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
                    Save
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors text-sm font-medium"
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
                      Share
                    </button>

                    {showShareMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          <button
                            onClick={() => handleShare("twitter")}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors"
                          >
                            Twitter
                          </button>
                          <button
                            onClick={() => handleShare("facebook")}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors"
                          >
                            Facebook
                          </button>
                          <button
                            onClick={() => handleShare("linkedin")}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors"
                          >
                            LinkedIn
                          </button>
                          <button
                            onClick={() => handleShare("copy")}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4 leading-tight">
                {article.title}
              </h1>

              {/* Featured Image */}
              {article.image_url && (
                <div className="mb-6">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Bias Indicator */}
              {showBiasOverview && (
                <div className="mb-6">
                  <BiasIndicator
                    bias={article.political_bias}
                    confidence={article.confidence_score}
                    size="large"
                    showConfidence={true}
                    showTooltip={true}
                    interactive={true}
                    abbreviated={false}
                  />
                </div>
              )}

              {/* AI Analysis */}
              {article.ai_analysis && (
                <div className="mb-6">
                  <AIAnalysisCard analysis={article.ai_analysis} />
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="max-w-none">
              {/* Summary - only show if we have full content to follow */}
              {!contentLoading && fullContent && fullContent.source !== 'summary' && fullContent.content !== article.summary && (
                <p className="text-lg leading-relaxed text-text-primary-light dark:text-text-primary-dark mb-8 font-medium">
                  {article.summary}
                </p>
              )}

              {/* If only summary available, show it larger as the main content */}
              {!contentLoading && fullContent && fullContent.source === 'summary' && (
                <div className="text-base leading-relaxed text-text-primary-light dark:text-text-primary-dark mb-8">
                  <p className="text-lg leading-relaxed mb-6">
                    {article.summary}
                  </p>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                          <p className="font-medium mb-1">Summary Only</p>
                          <p className="mb-3">Full article content and source link are not available for this article from <strong>{source?.name || article.source_name || 'this source'}</strong>.</p>
                          {(source?.name || article.source_name) && (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(article.title + ' ' + (source?.name || article.source_name))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              Search on Google
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {contentLoading && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mt-4">
                    Loading full article content...
                  </p>
                </div>
              )}

              {/* Error State */}
              {contentError && !fullContent && (
                <div className="p-6 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-warning flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                        Unable to Load Full Content
                      </h3>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                        {contentError}
                      </p>
                      <a
                        href={article.url || article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                      >
                        Read on Original Site
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Content - only show if it's real content, not just summary */}
              {!contentLoading && fullContent && fullContent.content && fullContent.source !== 'summary' && (
                <div className="space-y-6 text-base leading-relaxed text-text-primary-light dark:text-text-primary-dark">
                  {fullContent.source && fullContent.source !== 'fallback' && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark bg-surface-elevated-light dark:bg-surface-elevated-dark px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Content extracted via {fullContent.source === 'api-ninja' ? 'API Ninja' : fullContent.source === 'jina-reader' ? 'Jina Reader' : 'database'}</span>
                    </div>
                  )}
                  <ArticleContent content={fullContent.content} />
                </div>
              )}
            </div>

            {/* Bottom Save/Share/Back Section */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                {/* Save/Share buttons at bottom */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                      isBookmarked
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900"
                        : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900"
                    }`}
                    aria-label={
                      isBookmarked ? "Remove bookmark" : "Add bookmark"
                    }
                  >
                    <svg
                      className="w-5 h-5"
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
                    <span>{isBookmarked ? "Saved" : "Save Article"}</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors font-medium"
                      aria-label="Share article"
                    >
                      <svg
                        className="w-5 h-5"
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
                      <span>Share Article</span>
                    </button>

                    {showShareMenu && (
                      <div className="absolute right-0 bottom-full mb-2 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                        <button
                          onClick={() => handleShare("twitter")}
                          className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                        >
                          Share on Twitter
                        </button>
                        <button
                          onClick={() => handleShare("facebook")}
                          className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                        >
                          Share on Facebook
                        </button>
                        <button
                          onClick={() => handleShare("linkedin")}
                          className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                        >
                          Share on LinkedIn
                        </button>
                        <button
                          onClick={() => handleShare("copy")}
                          className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                        >
                          Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back button at bottom */}
                <button
                  onClick={() => (onClose ? onClose() : navigate("/"))}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>Back to Articles</span>
                </button>
              </div>

              {/* Read Full Article Link - only show if URL exists */}
              {(article.url || article.source_url) && (
                <a
                  href={article.url || article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium"
                >
                  Read Full Article
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>

            {/* Bias Analysis - Mobile Collapsible */}
            <section className="mt-8 lg:hidden">
              <button
                onClick={() => setShowBiasDetails(!showBiasDetails)}
                className="w-full flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 text-left"
              >
                <span className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Bias Analysis
                </span>
                <svg
                  className={`w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark transition-transform ${
                    showBiasDetails ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showBiasDetails && (
                <div className="mt-4 p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
                  <BiasIndicator
                    bias={article.political_bias}
                    confidence={article.confidence_score}
                    size="large"
                    showConfidence={true}
                    showTooltip={false}
                    interactive={false}
                    abbreviated={false}
                  />
                  <div className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <p>
                      <strong>Factual Quality:</strong>{" "}
                      {Math.round(article.factual_quality * 100)}%
                    </p>
                    <p>
                      <strong>Confidence Score:</strong>{" "}
                      {Math.round(article.confidence_score * 100)}%
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* More Articles Grid - Under Article Content */}
            {relatedArticles.length > 0 && (
              <section className="col-span-full mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">
                  More Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.slice(0, 8).map((relatedArticle) => (
                    <ArticleCard
                      key={relatedArticle.id}
                      article={relatedArticle}
                      size="compact"
                      showBiasOverview={true}
                      onClick={() => navigate(`/article/${relatedArticle.id}`)}
                    />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <button
                    onClick={() => navigate("/search")}
                    className="px-6 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                  >
                    View All Articles
                  </button>
                </div>
              </section>
            )}
          </article>

          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block space-y-6 min-w-0 order-2 lg:order-none">
            {/* Article Q&A Chat - COMING SOON */}
            <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="relative p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                      Ask About This Article
                    </h3>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      Get AI-powered answers
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => alert('Q&A Chat - Coming Soon!\n\nThis will open an AI chat where you can:\n• Ask questions about the article\n• Get summaries & explanations\n• Find related articles\n• Fact-check claims')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Ask a Question
                </button>
                <div className="mt-3 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  <p className="font-medium mb-1">Example questions:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• What are the key points?</li>
                    <li>• What's the context?</li>
                    <li>• Find similar articles</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="p-5 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Related Articles
                </h3>
                <div className="space-y-3">
                  {relatedArticles.slice(0, 4).map((relatedArticle) => (
                    <div
                      key={relatedArticle.id}
                      className="p-3 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg cursor-pointer transition-colors group"
                      onClick={() => navigate(`/article/${relatedArticle.id}`)}
                    >
                      <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {relatedArticle.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="font-medium">{relatedArticle.source_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(relatedArticle.published_at || relatedArticle.publication_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {relatedArticles.length > 4 && (
                  <button
                    onClick={() => navigate('/search')}
                    className="w-full mt-3 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors"
                  >
                    View More →
                  </button>
                )}
              </section>
            )}

            {/* Topics & Tags */}
            {(article.tags?.length > 0 || article.category) && (
              <section className="p-5 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.category && (
                    <span 
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium hover:bg-primary-200 dark:hover:bg-primary-800 cursor-pointer transition-colors"
                      onClick={() => navigate(`/topic/${encodeURIComponent(article.category.toLowerCase().replace(/\s+/g, '-'))}`)}
                    >
                      {article.category}
                    </span>
                  )}
                  {article.tags?.slice(0, 5).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-3">
                  Click to find related articles
                </p>
              </section>
            )}

            {/* About the Source */}
            {(source || article.source_name) && (
              <section className="p-5 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  About the Source
                </h3>
                <div 
                  className="space-y-3 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900 p-3 -m-3 rounded-lg transition-colors"
                  onClick={() => navigate(`/source/${encodeURIComponent(source?.name || article.source_name)}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                        {(source?.name || article.source_name)?.charAt(0) || "N"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate group-hover:text-primary-600">
                        {source?.name || article.source_name || 'Unknown Source'}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {article.political_bias ? `${article.political_bias.charAt(0).toUpperCase() + article.political_bias.slice(1)} Lean` : 'Center'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {article.category && (
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      <strong>Category:</strong> {article.category}
                    </div>
                  )}
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    Click to see more from this source →
                  </p>
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;
