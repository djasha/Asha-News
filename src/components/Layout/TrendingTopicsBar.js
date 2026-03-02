import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTopics } from "../../hooks/useCMSData";
import { LoadingSkeleton } from "../UI/CMSLoadingState";
import { API_BASE } from '../../config/api';
import { V1_CORE_ONLY } from '../../config/v1';

const TrendingTopicsBar = () => {
  const navigate = useNavigate();
  const { data: trendingTopics, loading, error } = useTopics();
  const [settings, setSettings] = useState(null);
  const [, setSettingsLoading] = useState(true);

  const apiBaseUrl = API_BASE;

  // Load settings
  useEffect(() => {
    if (V1_CORE_ONLY) {
      setSettingsLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/admin/topics-settings/trendingBar`);
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.success) {
          setSettings(result.data);
        }
      } catch (_) {
        // Silent fallback to built-in defaults for public pages.
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, [apiBaseUrl]);

  const handleTopicClick = (slug) => {
    if (V1_CORE_ONLY) {
      navigate('/');
      return;
    }
    navigate(`/topic/${slug}`);
  };

  if (loading) {
    return (
      <div className="bg-surface-light dark:bg-surface-dark py-2">
        <LoadingSkeleton type="topic" count={6} />
      </div>
    );
  }

  // Check if bar is disabled in settings
  if (settings && settings.enabled === false) {
    return null;
  }

  // Use fallback topics if error or no data
  const effectiveTopics = (error || !trendingTopics || trendingTopics.length === 0) 
    ? [
        { slug: 'politics', name: 'Politics', icon: '🏛️', article_count: 156, enabled: true },
        { slug: 'technology', name: 'Technology', icon: '💻', article_count: 98, enabled: true },
        { slug: 'world', name: 'World News', icon: '🌍', article_count: 234, enabled: true },
        { slug: 'business', name: 'Business', icon: '📈', article_count: 87, enabled: true },
        { slug: 'health', name: 'Health', icon: '🏥', article_count: 143, enabled: true },
        { slug: 'science', name: 'Science', icon: '🔬', article_count: 65, enabled: true }
      ]
    : trendingTopics;

  // Apply filtering settings
  let filteredTopics = effectiveTopics;
  if (settings?.filtering) {
    const { minArticleCount = 0, enabledOnly = true, sortBy = 'sort_order', excludeSlugs = [] } = settings.filtering;
    
    filteredTopics = filteredTopics.filter(topic => {
      if (enabledOnly && !topic.enabled) return false;
      if (minArticleCount > 0 && (topic.article_count || 0) < minArticleCount) return false;
      if (excludeSlugs.includes(topic.slug)) return false;
      return true;
    });

    // Apply sorting
    if (sortBy === 'article_count') {
      filteredTopics = [...filteredTopics].sort((a, b) => (b.article_count || 0) - (a.article_count || 0));
    }
  }

  // Apply display settings
  const maxTopics = settings?.display?.maxTopics || 12;
  const showIcon = settings?.display?.showIcon !== false;
  const showArticleCount = settings?.display?.showArticleCount !== false;
  const showPlusButton = settings?.display?.showPlusButton !== false;
  
  const displayTopics = filteredTopics.slice(0, maxTopics);

  // Apply animation settings
  const animationEnabled = settings?.animation?.enabled !== false;
  const speedMs = settings?.animation?.speedMs || 50;
  const direction = settings?.animation?.direction || 'left';
  const pauseOnHover = settings?.animation?.pauseOnHover !== false;

  // Generate animation style
  // Convert speedMs to duration: lower speedMs = faster animation
  // speedMs 10 (fast) -> 2s, speedMs 50 (normal) -> 10s, speedMs 200 (slow) -> 40s
  const animationDuration = `${speedMs / 5}s`;
  const animationName = direction === 'left' ? 'scroll-left' : 'scroll-right';
  
  return (
    <div className="bg-surface-light dark:bg-surface-dark py-2 overflow-hidden relative">
      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0%); }
          to { transform: translateX(-33.333%); }
        }
        @keyframes scroll-right {
          from { transform: translateX(-33.333%); }
          to { transform: translateX(0%); }
        }
        .trending-topics-scroll {
          display: inline-flex;
          ${animationEnabled ? `animation: ${animationName} ${animationDuration} linear infinite;` : ''}
          will-change: transform;
        }
        .trending-topics-scroll${pauseOnHover ? ':hover' : '.no-pause'} {
          animation-play-state: ${pauseOnHover ? 'paused' : 'running'};
        }
      `}</style>
      
      <div className={`trending-topics-scroll ${pauseOnHover ? '' : 'no-pause'}`}>
        {/* First set of topics */}
        <div className="flex items-center space-x-2 whitespace-nowrap pr-2">
          {displayTopics.map((topic) => (
            <button
              key={topic.slug}
              onClick={() => handleTopicClick(topic.slug)}
              className="flex items-center gap-2 px-3 py-1 bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900 text-text-primary-light dark:text-text-primary-dark rounded-full text-sm font-medium transition-colors duration-200 mx-1 flex-shrink-0"
            >
              {showIcon && topic.icon && <span className="text-xs">{topic.icon}</span>}
              <span>{topic.name}</span>
              {showArticleCount && topic.article_count && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {topic.article_count}
                </span>
              )}
              {showPlusButton && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  +
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Duplicate set for seamless scrolling */}
        <div className="flex items-center space-x-2 whitespace-nowrap pr-2">
          {displayTopics.map((topic) => (
            <button
              key={`${topic.slug}-duplicate`}
              onClick={() => handleTopicClick(topic.slug)}
              className="flex items-center gap-2 px-3 py-1 bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900 text-text-primary-light dark:text-text-primary-dark rounded-full text-sm font-medium transition-colors duration-200 mx-1 flex-shrink-0"
            >
              {showIcon && topic.icon && <span className="text-xs">{topic.icon}</span>}
              <span>{topic.name}</span>
              {showArticleCount && topic.article_count && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {topic.article_count}
                </span>
              )}
              {showPlusButton && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  +
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Third set for extra smooth scrolling */}
        <div className="flex items-center space-x-2 whitespace-nowrap pr-2">
          {displayTopics.map((topic) => (
            <button
              key={`${topic.slug}-triple`}
              onClick={() => handleTopicClick(topic.slug)}
              className="flex items-center gap-2 px-3 py-1 bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900 text-text-primary-light dark:text-text-primary-dark rounded-full text-sm font-medium transition-colors duration-200 mx-1 flex-shrink-0"
            >
              {showIcon && topic.icon && <span className="text-xs">{topic.icon}</span>}
              <span>{topic.name}</span>
              {showArticleCount && topic.article_count && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {topic.article_count}
                </span>
              )}
              {showPlusButton && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  +
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingTopicsBar;
