import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { V1_CORE_ONLY } from '../../config/v1';

const BreakingNewsAlert = () => {
  const [breakingNews, setBreakingNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();

  // Fetch breaking news from active backend APIs.
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        if (V1_CORE_ONLY) {
          const response = await fetch('/api/articles?limit=40').catch(() => undefined);
          if (!response || !response.ok) return;
          const data = await response.json().catch(() => ({}));
          const items = Array.isArray(data?.data)
            ? data.data
                .filter((item) => item.breaking === true || item.breaking_news === true)
                .slice(0, 8)
                .map((item) => ({
                  id: item.id,
                  headline: item.title,
                  summary: item.summary,
                  article_id: item.id,
                  article_url: item.url,
                  created_at: item.published_at || item.publication_date,
                }))
            : [];

          setBreakingNews(items);
          setIsVisible(items.length > 0);
          return;
        }

        let response;
        try {
          response = await fetch('/api/cms/breaking-news');
        } catch (_) {
          response = undefined;
        }
        if (!response || !response.ok) {
          // In static deployments, this may be 404; quietly return
          if (response && response.status === 404) return;
          return;
        }
        const data = await response.json().catch(() => ({}));
        
        if (data.data && data.data.length > 0) {
          const activeBreakingNews = data.data.filter(item => item.active);
          setBreakingNews(activeBreakingNews);
          setIsVisible(activeBreakingNews.length > 0);
        }
      } catch (error) {
        // Swallow network errors outside development to avoid noisy console
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch breaking news:', error);
        }
      }
    };

    fetchBreakingNews();
    
    // Refresh breaking news every 2 minutes
    const interval = setInterval(fetchBreakingNews, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate breaking news items
  useEffect(() => {
    if (breakingNews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % breakingNews.length);
      }, 5000); // Change every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [breakingNews.length]);

  const handleNewsClick = (newsItem) => {
    if (newsItem.article_url) {
      window.open(newsItem.article_url, '_blank');
    } else if (newsItem.article_id) {
      navigate(`/article/${newsItem.article_id}`);
    } else if (newsItem.topic_slug) {
      navigate(`/topic/${newsItem.topic_slug}`);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible || breakingNews.length === 0) {
    return null;
  }

  const currentNews = breakingNews[currentIndex];

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg transition-all duration-300 ${
      isMinimized ? 'h-2' : 'h-auto'
    }`}>
      {!isMinimized && (
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Breaking News Badge */}
              <div className="flex items-center gap-2 bg-red-700 px-3 py-1 rounded-full text-sm font-bold">
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                BREAKING
              </div>

              {/* News Content */}
              <div 
                className="flex-1 cursor-pointer hover:text-red-100 transition-colors"
                onClick={() => handleNewsClick(currentNews)}
              >
                <h3 className="font-semibold text-sm md:text-base line-clamp-1">
                  {currentNews.headline}
                </h3>
                {currentNews.summary && (
                  <p className="text-red-100 text-xs md:text-sm line-clamp-1 mt-1">
                    {currentNews.summary}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-red-200 text-xs hidden md:block">
                {new Date(currentNews.created_at || currentNews.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-4">
              {/* Pagination dots */}
              {breakingNews.length > 1 && (
                <div className="flex gap-1">
                  {breakingNews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-white' : 'bg-red-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Minimize button */}
              <button
                onClick={toggleMinimize}
                className="p-1 hover:bg-red-700 rounded transition-colors"
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-red-700 rounded transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized state - clickable bar */}
      {isMinimized && (
        <div 
          className="w-full h-2 bg-red-600 cursor-pointer hover:bg-red-500 transition-colors"
          onClick={toggleMinimize}
          title="Click to expand breaking news"
        />
      )}
    </div>
  );
};

export default BreakingNewsAlert;
