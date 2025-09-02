import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BiasIndicator from '../BiasVisualization/BiasIndicator';
import AIAnalysisCard from '../BiasVisualization/AIAnalysisCard';
import ArticleCard from '../ArticleCard/ArticleCard';
import { getSourceById } from '../../data/mockSources';

const ArticleDetail = ({ article, relatedArticles = [], onClose, isModal = false, showBiasOverview = true }) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showBiasDetails, setShowBiasDetails] = useState(false);
  const navigate = useNavigate();
  const source = getSourceById(article.source_id);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (onClose || isModal)) {
        if (onClose) onClose();
        else navigate(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
      }
    };

    if (platform === 'copy') {
      shareUrls.copy();
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const estimateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
                    {source?.name?.charAt(0) || 'N'}
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
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900' 
                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900'
                    }`}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors text-sm font-medium"
                      aria-label="Share article"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share
                    </button>
                    
                    {showShareMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-surface-light dark:bg-surface-dark border border-primary-200 dark:border-primary-700 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          <button onClick={() => handleShare('twitter')} className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors">Twitter</button>
                          <button onClick={() => handleShare('facebook')} className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors">Facebook</button>
                          <button onClick={() => handleShare('linkedin')} className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors">LinkedIn</button>
                          <button onClick={() => handleShare('copy')} className="w-full text-left px-3 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-md transition-colors">Copy Link</button>
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
                <p>This comprehensive analysis examines the multifaceted implications of recent developments, providing readers with essential context and balanced perspectives from multiple sources.</p>
                
                <p>The situation has evolved rapidly over the past several days, with key stakeholders weighing in on the significance of these events. Our analysis draws from over a dozen credible sources to present a complete picture.</p>
                
                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-10 mb-6">
                  Key Developments
                </h3>
                
                <p>Multiple sources have confirmed the timeline of events, though interpretations vary significantly across the political spectrum. This divergence in coverage highlights the importance of consuming news from diverse perspectives.</p>
                
                <p>The economic implications are particularly noteworthy, with analysts projecting various scenarios based on current trends and historical precedents. Market reactions have been mixed, reflecting uncertainty about long-term outcomes.</p>
                
                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-10 mb-6">
                  International Response
                </h3>
                
                <p>International observers have provided varied assessments, with some emphasizing diplomatic solutions while others focus on security considerations. This range of perspectives illustrates the complexity of the situation.</p>
                
                <p>Regional allies have expressed cautious optimism about potential resolutions, though concerns remain about implementation challenges and timeline feasibility.</p>
              </div>
            </div>

            {/* Bottom Save/Share/Back Section */}
            <div className="mt-16 pt-8 border-t border-primary-200 dark:border-primary-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                {/* Save/Share buttons at bottom */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                      isBookmarked 
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900' 
                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900'
                    }`}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>{isBookmarked ? 'Saved' : 'Save Article'}</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors font-medium"
                      aria-label="Share article"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span>Share Article</span>
                    </button>

                    {showShareMenu && (
                      <div className="absolute right-0 bottom-full mb-2 bg-surface-light dark:bg-surface-dark border border-primary-200 dark:border-primary-700 rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                        <button onClick={() => handleShare('twitter')} className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors">Share on Twitter</button>
                        <button onClick={() => handleShare('facebook')} className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors">Share on Facebook</button>
                        <button onClick={() => handleShare('linkedin')} className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors">Share on LinkedIn</button>
                        <button onClick={() => handleShare('copy')} className="w-full px-4 py-3 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors">Copy Link</button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Back button at bottom */}
                <button
                  onClick={() => onClose ? onClose() : navigate('/')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Bias Analysis - Mobile Collapsible */}
            <section className="mt-8 lg:hidden">
              <button
                onClick={() => setShowBiasDetails(!showBiasDetails)}
                className="w-full flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-primary-200 dark:border-primary-700 text-left"
              >
                <span className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Bias Analysis
                </span>
                <svg 
                  className={`w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark transition-transform ${showBiasDetails ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showBiasDetails && (
                <div className="mt-4 p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-primary-200 dark:border-primary-700">
                  <BiasIndicator 
                    bias={article.political_bias}
                    confidence={article.confidence_score}
                    size="large"
                    showConfidence={true}
                    showTooltip={false}
                    interactive={false}
                  />
                  <div className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <p><strong>Factual Quality:</strong> {Math.round(article.factual_quality * 100)}%</p>
                    <p><strong>Confidence Score:</strong> {Math.round(article.confidence_score * 100)}%</p>
                  </div>
                </div>
              )}
            </section>

            {/* Related Articles - Mobile */}
            {relatedArticles.length > 0 && (
              <section className="mt-12 lg:hidden">
                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
                  Related Articles
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                  {relatedArticles.slice(0, 5).map((relatedArticle, index) => (
                    <div key={index} className="flex-shrink-0 w-72">
                      <ArticleCard 
                        article={relatedArticle}
                        size="compact"
                        showBiasOverview={false}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block space-y-6 min-w-0 order-2 lg:order-none">
            {/* Bias Analysis - Desktop Sidebar */}
            <section className="mb-8 p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-primary-200 dark:border-primary-700">
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
                <p><strong>Factual Quality:</strong> {Math.round(article.factual_quality * 100)}%</p>
                <p><strong>Confidence Score:</strong> {Math.round(article.confidence_score * 100)}%</p>
                <p><strong>Topic:</strong> {article.topic}</p>
              </div>
            </section>

            {/* Source Information - Sidebar */}
            <section className="mb-8 p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-primary-200 dark:border-primary-700">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Source Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-200 dark:bg-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                      {source?.name?.charAt(0) || 'N'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark truncate">{source?.name}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{source?.description}</p>
                  </div>
                </div>
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark space-y-1">
                  <p><strong>Reliability:</strong> {source?.reliability_score ? Math.round(source.reliability_score * 100) : 'N/A'}%</p>
                  <p><strong>Political Lean:</strong> {source?.political_lean || 'Center'}</p>
                </div>
              </div>
            </section>

            {/* Articles by Same Author - Only show if there are other articles */}
            {relatedArticles.filter(a => a.author === article.author && a.id !== article.id).length > 0 && (
              <section className="mb-8 p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-primary-200 dark:border-primary-700">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                  More by {article.author}
                </h3>
                <div className="space-y-3">
                  {relatedArticles
                    .filter(a => a.author === article.author && a.id !== article.id)
                    .slice(0, 3)
                    .map((relatedArticle) => (
                      <div key={relatedArticle.id} className="border-b border-primary-200 dark:border-primary-700 pb-3 last:border-b-0 last:pb-0">
                        <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2 mb-1">
                          {relatedArticle.title}
                        </h4>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {new Date(relatedArticle.publication_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Quick Filters */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Quick Filters
              </h3>
              <div className="space-y-4">
                {/* Bias Filter */}
                <div>
                  <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Political Bias
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Left', 'Center', 'Right'].map((bias) => (
                      <button
                        key={bias}
                        onClick={() => navigate(`/search?bias=${bias.toLowerCase()}`)}
                        className="px-3 py-1 text-xs font-medium rounded-full border border-primary-300 dark:border-primary-700 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                      >
                        {bias}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Filter */}
                <div>
                  <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Popular Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Politics', 'Technology', 'Economy', 'Health'].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => navigate(`/search?topic=${topic.toLowerCase()}`)}
                        className="px-3 py-1 text-xs font-medium rounded-full border border-primary-300 dark:border-primary-700 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Search Link */}
                <button
                  onClick={() => navigate('/search')}
                  className="w-full px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                >
                  Advanced Search & Filters
                </button>
              </div>
            </section>

            {/* Related Articles - Desktop Sidebar */}
            {relatedArticles.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                  More Articles
                </h3>
                <div className="space-y-4">
                  {relatedArticles.slice(0, 4).map((relatedArticle, index) => (
                    <ArticleCard 
                      key={relatedArticle.id}
                      article={relatedArticle}
                      onClick={() => navigate(`/article/${relatedArticle.id}`)}
                      compact={true}
                    />
                  ))}
                </div>
                <button
                  onClick={() => navigate('/search')}
                  className="w-full mt-4 px-4 py-2 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors border border-primary-200 dark:border-primary-700"
                >
                  View All Articles
                </button>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;
