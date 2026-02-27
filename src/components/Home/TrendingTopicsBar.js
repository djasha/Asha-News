import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CMS_BASE } from '../../config/api';

/**
 * Rotating/Sliding Topics Bar Component
 * Displays trending topics in a horizontal scrolling/sliding bar
 */
const TrendingTopicsBar = () => {
  const [topics, setTopics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch trending topics
    const fetchTopics = async () => {
      try {
        const response = await fetch(`${CMS_BASE}/trending-topics`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          setTopics(data.data);
        } else {
          // Fallback topics
          setTopics([
            { id: 1, name: 'Politics', slug: 'politics', article_count: 156 },
            { id: 2, name: 'Technology', slug: 'technology', article_count: 98 },
            { id: 3, name: 'World News', slug: 'world', article_count: 234 },
            { id: 4, name: 'Business', slug: 'business', article_count: 87 },
            { id: 5, name: 'Science', slug: 'science', article_count: 65 },
            { id: 6, name: 'Health', slug: 'health', article_count: 143 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching trending topics:', error);
        // Use fallback topics
        setTopics([
          { id: 1, name: 'Politics', slug: 'politics', article_count: 156 },
          { id: 2, name: 'Technology', slug: 'technology', article_count: 98 },
          { id: 3, name: 'World News', slug: 'world', article_count: 234 }
        ]);
      }
    };

    fetchTopics();
  }, []);

  // Auto-rotate topics
  useEffect(() => {
    if (!isAnimating || topics.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topics.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAnimating, topics.length]);

  const handleTopicClick = (topic) => {
    const slug = topic.slug || topic.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/topic/${slug}`);
  };

  if (topics.length === 0) return null;

  return (
    <div className="bg-primary-600 dark:bg-primary-800 py-2 border-b border-primary-700 dark:border-primary-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-sm font-semibold uppercase tracking-wide">
              Trending
            </span>
          </div>

          {/* Rotating Topics */}
          <div className="flex-1 overflow-hidden relative h-8">
            <div 
              className="absolute inset-0 transition-transform duration-500 ease-in-out flex items-center"
              style={{ transform: `translateY(-${currentIndex * 32}px)` }}
            >
              {topics.map((topic, index) => (
                <button
                  key={topic.id || index}
                  onClick={() => handleTopicClick(topic)}
                  className="h-8 flex items-center gap-2 text-white hover:text-primary-100 transition-colors cursor-pointer w-full justify-center"
                  onMouseEnter={() => setIsAnimating(false)}
                  onMouseLeave={() => setIsAnimating(true)}
                >
                  <span className="text-sm font-medium">
                    {topic.name}
                  </span>
                  {topic.article_count && (
                    <span className="text-xs opacity-75">
                      ({topic.article_count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + topics.length) % topics.length)}
              className="p-1 text-white hover:bg-primary-700 dark:hover:bg-primary-900 rounded transition-colors"
              aria-label="Previous topic"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % topics.length)}
              className="p-1 text-white hover:bg-primary-700 dark:hover:bg-primary-900 rounded transition-colors"
              aria-label="Next topic"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingTopicsBar;
