import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroundNewsStyleCluster from '../components/Stories/GroundNewsStyleCluster';
import storyClusteringService from '../services/storyClusteringService';
import newsApiService from '../services/newsApiService';
import SEOHead from '../components/SEO/SEOHead';

const StoriesPage = () => {
  const [storyClusters, setStoryClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBy, setFilterBy] = useState('all'); // all, blindspots, diverse
  const [sortBy, setSortBy] = useState('relevance'); // relevance, recent, sources
  const navigate = useNavigate();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch articles from multiple sources
      const articles = await newsApiService.getCachedArticles({
        limit: 100, // Get more articles for better clustering
        category: 'general'
      });

      if (!articles || articles.length === 0) {
        setError('No articles found');
        return;
      }

      // Cluster the articles
      const clusters = storyClusteringService.clusterArticles(articles);
      setStoryClusters(clusters);

    } catch (err) {
      console.error('Error loading stories:', err);
      setError('Failed to load stories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article) => {
    navigate(`/article/${encodeURIComponent(article.url)}`, { 
      state: { article } 
    });
  };

  const getFilteredClusters = () => {
    let filtered = [...storyClusters];

    // Apply filters
    switch (filterBy) {
      case 'blindspots':
        filtered = filtered.filter(cluster => cluster.isBlindspot && cluster.sources.size >= 2);
        break;
      case 'diverse':
        filtered = filtered.filter(cluster => !cluster.isBlindspot && cluster.sources.size >= 3);
        break;
      default:
        // Only show clusters with multiple sources
        filtered = filtered.filter(cluster => cluster.sources.size >= 2);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.publishedRange.latest) - new Date(a.publishedRange.latest));
        break;
      case 'sources':
        filtered.sort((a, b) => b.sources.size - a.sources.size);
        break;
      default:
        // Already sorted by relevance from clustering service
        break;
    }

    return filtered;
  };

  const filteredClusters = getFilteredClusters();
  const multiSourceClusters = storyClusters.filter(cluster => cluster.sources.size >= 2);
  const blindspotCount = multiSourceClusters.filter(cluster => cluster.isBlindspot).length;
  const diverseCount = multiSourceClusters.filter(cluster => !cluster.isBlindspot && cluster.sources.size >= 3).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary-light dark:bg-surface-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Analyzing stories and clustering related articles...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-primary-light dark:bg-surface-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              {error}
            </h2>
            <button
              onClick={loadStories}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary-light dark:bg-surface-primary-dark">
      <SEOHead 
        title="Stories - Asha.News"
        description="Discover how different news sources cover the same stories. See multiple perspectives and identify coverage gaps."
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Stories
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            See how different sources cover the same stories. Discover multiple perspectives and identify coverage gaps.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {multiSourceClusters.length}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Multi-Source Stories
              </div>
            </div>
            
            <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {blindspotCount}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Blindspots
              </div>
            </div>
            
            <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {diverseCount}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Diverse Coverage
              </div>
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Filter:
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark text-sm"
              >
                <option value="all">All Stories ({multiSourceClusters.length})</option>
                <option value="blindspots">Blindspots ({blindspotCount})</option>
                <option value="diverse">Diverse Coverage ({diverseCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="recent">Most Recent</option>
                <option value="sources">Most Sources</option>
              </select>
            </div>

            <button
              onClick={loadStories}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-primary-light dark:text-text-primary-dark rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Story Clusters */}
        <div className="space-y-4">
          {filteredClusters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                No stories found
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Try adjusting your filters or refresh to load new stories.
              </p>
            </div>
          ) : (
            filteredClusters.map((cluster) => (
              <GroundNewsStyleCluster
                key={cluster.id}
                cluster={cluster}
                onArticleClick={handleArticleClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StoriesPage;
