import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroundNewsStyleCluster from '../Stories/GroundNewsStyleCluster';
import storyClusteringService from '../../services/storyClusteringService';

const StoryClusters = ({ articles }) => {
  const [storyClusters, setStoryClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (articles && articles.length > 0) {
      clusterArticles();
    }
  }, [articles]); // eslint-disable-line react-hooks/exhaustive-deps

  const clusterArticles = async () => {
    try {
      setLoading(true);
      
      // Use a subset of articles for home page (performance)
      const articlesForClustering = articles.slice(0, 50);
      
      // Cluster the articles
      const clusters = storyClusteringService.clusterArticles(articlesForClustering);
      
      // Show only top 3 clusters on home page
      setStoryClusters(clusters.slice(0, 3));
    } catch (error) {
      console.error('Error clustering articles:', error);
      setStoryClusters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article) => {
    navigate(`/article/${encodeURIComponent(article.url)}`, { 
      state: { article } 
    });
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
