import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSourceById } from "../../data/mockSources";
import ArticleCard from "../ArticleCard/ArticleCard";
import AIAnalysisCard from "../BiasVisualization/AIAnalysisCard";
import BiasIndicator from "../BiasVisualization/BiasIndicator";

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
  const navigate = useNavigate();
  const source = getSourceById(article.source_id);

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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
                    {source?.name?.charAt(0) || "N"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {source?.name || article.source_id}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{formatDate(article.publication_date)}</span>
                    <span>•</span>
                    <span>By {article.author}</span>
                    <span>•</span>
                    <span>{estimateReadingTime(article.summary)} min read</span>
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
              <p className="text-lg leading-relaxed text-text-primary-light dark:text-text-primary-dark mb-8 font-medium">
                {article.summary}
              </p>

              <div className="space-y-6 text-base leading-relaxed text-text-primary-light dark:text-text-primary-dark">
                <p>
                  This comprehensive analysis examines the multifaceted
                  implications of recent developments, providing readers with
                  essential context and balanced perspectives from multiple
                  sources.
                </p>

                <p>
                  The situation has evolved rapidly over the past several days,
                  with key stakeholders weighing in on the significance of these
                  events. Our analysis draws from over a dozen credible sources
                  to present a complete picture.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-10 mb-6">
                  Key Developments
                </h3>

                <p>
                  Multiple sources have confirmed the timeline of events, though
                  interpretations vary significantly across the political
                  spectrum. This divergence in coverage highlights the
                  importance of consuming news from diverse perspectives.
                </p>

                <p>
                  The economic implications are particularly noteworthy, with
                  analysts projecting various scenarios based on current trends
                  and historical precedents. Market reactions have been mixed,
                  reflecting uncertainty about long-term outcomes.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-10 mb-6">
                  International Response
                </h3>

                <p>
                  International observers have provided varied assessments, with
                  some emphasizing diplomatic solutions while others focus on
                  security considerations. This range of perspectives
                  illustrates the complexity of the situation.
                </p>

                <p>
                  Regional allies have expressed cautious optimism about
                  potential resolutions, though concerns remain about
                  implementation challenges and timeline feasibility.
                </p>
              </div>
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

              {/* Read Full Article Link */}
              <a
                href={article.url}
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
            {/* AI Summary */}
            <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Gradient shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>

              <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                        AI Summary
                      </h3>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Powered by AI
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    ✨ Smart
                  </div>
                </div>

                <button className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg">
                  Generate Summary
                </button>
              </div>
            </section>

            {/* Fact-Check Approval */}
            <section className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Fact-Check Status
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {Math.round(article.factual_quality * 100)}% Factually
                    Accurate
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <div className="flex justify-between">
                  <span>Sources Verified:</span>
                  <span className="font-medium">12/12</span>
                </div>
                <div className="flex justify-between">
                  <span>Claims Checked:</span>
                  <span className="font-medium">8/8</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium">2 hours ago</span>
                </div>
              </div>
            </section>

            {/* Coverage Information */}
            <section className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Coverage Analysis
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      Sources Covering
                    </span>
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      24 outlets
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900 rounded">
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      8
                    </div>
                    <div className="text-blue-700 dark:text-blue-300">Left</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold text-gray-600 dark:text-gray-400">
                      10
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      Center
                    </div>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900 rounded">
                    <div className="font-bold text-red-600 dark:text-red-400">
                      6
                    </div>
                    <div className="text-red-700 dark:text-red-300">Right</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Same News from Other Sources */}
            <section className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Same Story, Different Sources
              </h3>
              <div className="space-y-3">
                {relatedArticles
                  .filter(
                    (a) => a.topic === article.topic && a.id !== article.id
                  )
                  .slice(0, 4)
                  .map((relatedArticle) => (
                    <div
                      key={relatedArticle.id}
                      className="flex items-start gap-3 p-3 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg cursor-pointer transition-colors"
                      onClick={() => navigate(`/article/${relatedArticle.id}`)}
                    >
                      <div className="w-8 h-8 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                          {getSourceById(
                            relatedArticle.source_id
                          )?.name?.charAt(0) || "N"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2 mb-1">
                          {relatedArticle.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          <span>
                            {getSourceById(relatedArticle.source_id)?.name ||
                              relatedArticle.source_id}
                          </span>
                          <span>•</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              relatedArticle.political_bias === "left"
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : relatedArticle.political_bias === "right"
                                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {relatedArticle.political_bias}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <button
                onClick={() =>
                  navigate(`/search?topic=${article.topic.toLowerCase()}`)
                }
                className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
              >
                View All Coverage
              </button>
            </section>

            {/* Bias Analysis - Desktop Sidebar */}
            <section className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Bias Analysis
              </h3>
              <BiasIndicator
                bias={article.political_bias}
                confidence={article.confidence_score}
                size="large"
                showConfidence={true}
                abbreviated={false}
                showTooltip={false}
                interactive={false}
              />
              <div className="mt-4 space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <p>
                  <strong>Confidence Score:</strong>{" "}
                  {Math.round(article.confidence_score * 100)}%
                </p>
                <p>
                  <strong>Topic:</strong> {article.topic}
                </p>
              </div>
            </section>

            {/* Source Information - Sidebar */}
            <section className="p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Source Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                      {source?.name?.charAt(0) || "N"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                      {source?.name}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {source?.description}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark space-y-1">
                  <p>
                    <strong>Reliability:</strong>{" "}
                    {source?.reliability_score
                      ? Math.round(source.reliability_score * 100)
                      : "N/A"}
                    %
                  </p>
                  <p>
                    <strong>Political Lean:</strong>{" "}
                    {source?.political_lean || "Center"}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;
