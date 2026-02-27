import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GroundNewsStyleCluster from '../Stories/GroundNewsStyleCluster';
import storyClusteringService from '../../services/storyClusteringService';

const StoryClusters = ({ articles, limit = 3 }) => {
  const [storyClusters, setStoryClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const useServerClusters = (process.env.REACT_APP_USE_SERVER_CLUSTERS ?? 'true') === 'true';

  // Compute bias distribution similar to client service
  const computeBiasDistribution = useCallback((articles = []) => {
    const distribution = { left: 0, center: 0, right: 0 };
    const leftSources = ['CNN', 'MSNBC', 'The Guardian', 'NPR', 'BBC', 'Reuters'];
    const rightSources = ['Fox News', 'Wall Street Journal', 'New York Post', 'Daily Mail'];
    articles.forEach(a => {
      const name = (a.source_name || '').toLowerCase();
      if (leftSources.some(s => name.includes(s.toLowerCase()))) distribution.left++;
      else if (rightSources.some(s => name.includes(s.toLowerCase()))) distribution.right++;
      else distribution.center++;
    });
    const total = Math.max(1, articles.length);
    return {
      left: Math.round((distribution.left / total) * 100),
      center: Math.round((distribution.center / total) * 100),
      right: Math.round((distribution.right / total) * 100)
    };
  }, []);

  const selectMainArticle = (articles = []) => {
    if (!articles.length) return null;
    return [...articles].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))[0];
  };

  const mapServerCluster = useCallback((c) => {
    const ca = Array.isArray(c.cluster_articles) ? c.cluster_articles : [];
    const articles = ca.map(rel => {
      const a = rel.articles_id || {};
      return {
        id: a.id,
        title: a.title,
        description: a.summary,
        source_name: a.source_name,
        published_at: a.published_at,
        image: a.image_url,
        url: a.source_url || a.url,
      };
    });
    const sources = new Set(articles.map(a => a.source_name).filter(Boolean));
    const biasDistribution = computeBiasDistribution(articles);
    const mainArticle = selectMainArticle(articles) || { title: c.cluster_title, published_at: c.updated_at || c.created_at };
    return {
      id: c.id,
      mainArticle,
      articles,
      sources,
      biasDistribution,
      isBlindspot: [biasDistribution.left, biasDistribution.center, biasDistribution.right].filter(v => v > 0).length === 1,
    };
  }, [computeBiasDistribution]);

  const fetchServerClusters = useCallback(async () => {
    const resp = await fetch(`/api/clusters?limit=${Math.max(limit, 5)}`);
    if (!resp.ok) throw new Error(`Failed to load server clusters: ${resp.status}`);
    const json = await resp.json();
    const data = Array.isArray(json.data) ? json.data : [];
    // Filter to clusters that actually have articles
    const mapped = data
      .filter(c => Array.isArray(c.cluster_articles) && c.cluster_articles.length > 0)
      .map(mapServerCluster)
      .slice(0, limit);
    return mapped;
  }, [limit, mapServerCluster]);

  const loadClusters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (useServerClusters) {
        const serverClusters = await fetchServerClusters();
        if (serverClusters.length > 0) {
          setStoryClusters(serverClusters);
          return;
        }
      }
      // Fallback to client-side clustering
      const result = await storyClusteringService.getClusteredStories({ limit: 100 });
      setStoryClusters(result.clusters.slice(0, limit));
    } catch (err) {
      console.error('Error loading story clusters:', err);
      setError(err.message);
      setStoryClusters([]);
    } finally {
      setLoading(false);
    }
  }, [fetchServerClusters, limit, useServerClusters]);

  useEffect(() => {
    loadClusters();
  }, [loadClusters]);

  

  const handleArticleClick = (article) => {
    if (article && article.id) {
      navigate(`/article/${article.id}`);
    } else {
      console.error('Invalid article object:', article);
    }
  };

  const handleViewAllStories = () => {
    navigate('/stories');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Story Clusters
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-2/3"></div>
                <div className="flex gap-4">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
              Story Clusters
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              See how different sources cover the same stories
            </p>
          </div>
        </div>
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            Failed to load story clusters
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            {error}
          </p>
          <button 
            onClick={loadClusters}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!storyClusters || storyClusters.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
              Story Clusters
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              See how different sources cover the same stories
            </p>
          </div>
        </div>
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            No story clusters found
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Story clusters require multiple sources covering the same story. Check back as more articles are loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
            Story Clusters
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            See how different sources cover the same stories
          </p>
        </div>
        <button
          onClick={handleViewAllStories}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          View All Stories
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {storyClusters.map((cluster) => (
          <GroundNewsStyleCluster
            key={cluster.id}
            cluster={cluster}
            onArticleClick={handleArticleClick}
          />
        ))}
      </div>

      {storyClusters.length > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={handleViewAllStories}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Explore All Story Clusters
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryClusters;
