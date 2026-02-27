import React, { useState, useEffect } from 'react';
import CompactArticleCard from '../ArticleCard/CompactArticleCard';
import { CMS_BASE } from '../../config/api';
import logger from '../../utils/logger';

const TrendingGrid = ({ articles = [] }) => {
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [, setLoading] = useState(true);

  // Fetch trending topics from CMS
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        const response = await fetch(`${CMS_BASE}/trending-topics`);
        const data = await response.json();
        setTrendingTopics(data.data || []);
      } catch (error) {
        logger.error('Failed to fetch trending topics:', error);
        // Keep fallback behavior
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  // Use trending articles based on CMS topics or fallback to recent articles
  const trendingArticles = trendingTopics.length > 0 
    ? articles.filter(article => 
        trendingTopics.some(topic => 
          article.title?.toLowerCase().includes(topic.name?.toLowerCase() || '')
        )
      ).slice(0, 6)
    : articles
        .sort((a, b) => new Date(b.publication_date || b.published_at) - new Date(a.publication_date || a.published_at))
        .slice(0, 6);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Trending Now
          </h2>
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Most discussed stories
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trendingArticles.map((article, index) => (
          <div key={article.id} className="relative">
            {index === 0 && (
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-surface-elevated-light dark:bg-surface-elevated-dark border border-gray-300 dark:border-gray-600 text-text-secondary-light dark:text-text-secondary-dark text-xs font-bold rounded-full flex items-center justify-center z-10">
                ★
              </div>
            )}
            <CompactArticleCard article={article} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingGrid;
