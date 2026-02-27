import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryCard from '../components/StoryCard/StoryCard';
import storyClusteringService from '../services/storyClusteringService';
import newsApiService from '../services/newsApiService';
import directusService from '../services/directusService';
import SEOHead from '../components/SEO/SEOHead';

const StoriesPage = () => {
  const [storyClusters, setStoryClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBy, setFilterBy] = useState('all'); // all, blindspots, diverse
  const [sortBy, setSortBy] = useState('relevance'); // relevance, recent, sources
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Try backend clusters first
      let query = '/api/clusters?limit=50';
      if (selectedTopic) {
        query += `&category=${encodeURIComponent(selectedTopic)}`;
      }
      let backendClusters = [];
      try {
        const res = await fetch(query);
        if (res.ok) {
          const json = await res.json();
          backendClusters = Array.isArray(json.data) ? json.data : [];
        }
      } catch (e) {
        console.warn('Backend clusters not available, will fallback:', e);
      }

      // 1a) If backend empty, request auto-cluster
      if (backendClusters.length === 0) {
        try {
          await fetch('/api/clusters/auto-cluster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold: 0.75, max_articles: 120, category: selectedTopic || undefined })
          });
          const res2 = await fetch(query);
          if (res2.ok) {
            const json2 = await res2.json();
            backendClusters = Array.isArray(json2.data) ? json2.data : [];
          }
        } catch (e) {
          console.warn('Auto-cluster failed:', e);
        }
      }

      // Normalize backend bias distribution to simple percentages
      const toLcrPercentages = (dist, totalArticles) => {
        if (!dist || typeof dist !== 'object') return { left: 33, center: 34, right: 33 };
        const total = Number(totalArticles) || 0;
        const valPct = (v) => {
          if (v == null) return 0;
          if (typeof v === 'number') return Math.max(0, Math.min(100, v));
          if (typeof v === 'object') {
            if (typeof v.percentage === 'number') return Math.max(0, Math.min(100, v.percentage));
            if (typeof v.count === 'number' && total > 0) return Math.round((v.count / total) * 100);
          }
          return 0;
        };
        const left = valPct(dist.far_left) + valPct(dist.lean_left) + valPct(dist.left);
        const center = valPct(dist.center);
        const right = valPct(dist.lean_right) + valPct(dist.right) + valPct(dist.far_right);
        // Normalize so they sum to ~100
        const sum = left + center + right;
        if (sum > 0) {
          const nl = Math.round((left / sum) * 100);
          const nc = Math.round((center / sum) * 100);
          let nr = 100 - nl - nc;
          if (nr < 0) nr = 0; // guard
          return { left: nl, center: nc, right: nr };
        }
        return { left: 33, center: 34, right: 33 };
      };

      // Map backend cluster shape to UI cluster shape
      const mapBackendCluster = (c) => {
        const arts = Array.isArray(c.articles) ? c.articles : [];
        const articles = arts.map(a => ({
          id: a.id,
          title: a.title,
          description: a.excerpt || a.summary || '',
          source_name: a.source_name,
          published_at: a.published_at || a.publication_date || new Date().toISOString(),
          image: a.image_url || null
        }));
        const sources = new Set(articles.map(a => a.source_name).filter(Boolean));
        const biasDistribution = toLcrPercentages(c.bias_distribution, c.article_count || articles.length);
        const times = articles.map(a => new Date(a.published_at)).filter(d => !isNaN(d));
        const range = times.length
          ? { earliest: new Date(Math.min(...times)), latest: new Date(Math.max(...times)) }
          : { earliest: new Date(), latest: new Date() };
        return {
          id: c.id,
          mainArticle: articles[0] || null,
          articles,
          sources,
          biasDistribution,
          publishedRange: range,
          topics: new Set([c.topic_category || 'general']),
          isBlindspot: [biasDistribution.left, biasDistribution.center, biasDistribution.right].filter(v => (v || 0) > 0).length === 1
        };
      };

      if (backendClusters.length > 0) {
        // Fetch details for first 12 clusters to obtain articles/sources
        const detailedClusters = await Promise.all(
          backendClusters.slice(0, 12).map(async (c) => {
            try {
              const r = await fetch(`/api/clusters/${c.id}`);
              if (r.ok) {
                const j = await r.json();
                return j.data ? { ...c, ...j.data } : c;
              }
            } catch (e) {
              console.warn('Failed to fetch cluster details', c.id, e);
            }
            return c;
          })
        );
        const mapped = detailedClusters.map(mapBackendCluster);
        const hasMultiSource = mapped.some(c => (c.sources?.size || 0) >= 2);
        if (hasMultiSource) {
          setStoryClusters(mapped);
        } else {
          // Backend returned clusters without usable articles/sources; fallback to client-side clustering
          let articles = [];
          try {
            const directusData = await directusService.getArticles({ sortBy: 'date', limit: 200, category: selectedTopic || undefined });
            articles = directusData.articles || [];
          } catch (e) {
            console.warn('Directus articles unavailable, falling back to News APIs:', e);
            articles = await newsApiService.getCachedArticles({ limit: 120, category: selectedTopic || 'general' });
          }
          if (!articles || articles.length === 0) {
            setError('No articles found');
            setStoryClusters([]);
          } else {
            const clusters = storyClusteringService.clusterArticles(articles);
            setStoryClusters(clusters);
          }
        }
      } else {
        // 2) Fallback: fetch articles (prefer Directus) and cluster client-side
        let articles = [];
        try {
          const directusData = await directusService.getArticles({ sortBy: 'date', limit: 200, category: selectedTopic || undefined });
          articles = directusData.articles || [];
        } catch (e) {
          console.warn('Directus articles unavailable, falling back to News APIs:', e);
          // Fetch articles from multiple sources via adapters (may require keys)
          articles = await newsApiService.getCachedArticles({
            limit: 120,
            category: selectedTopic || 'general'
          });
        }

        if (!articles || articles.length === 0) {
          setError('No articles found');
          setStoryClusters([]);
        } else {
          const clusters = storyClusteringService.clusterArticles(articles);
          setStoryClusters(clusters);
        }
      }

      // Load trending topics (CMS first, else from clusters)
      try {
        const cmsTopics = await directusService.getTrendingTopics(10);
        if (Array.isArray(cmsTopics) && cmsTopics.length > 0) {
          setTrendingTopics(cmsTopics.map(t => t.name || t.title || t.slug).filter(Boolean).slice(0, 10));
        } else {
          // derive from clusters
          const counts = {};
          (backendClusters.length > 0 ? backendClusters : storyClusters).forEach(c => {
            const t = c.topic_category || 'General';
            counts[t] = (counts[t] || 0) + 1;
          });
          const top = Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([k]) => k).slice(0,10);
          setTrendingTopics(top);
        }
      } catch (e) {
        console.warn('Failed to load trending topics:', e);
      }

    } catch (err) {
      console.error('Error loading stories:', err);
      setError('Failed to load stories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStory = (clusterId) => {
    navigate(`/story/${clusterId}`);
  };

  const handleArticleClick = (article) => {
    if (article && article.id) {
      navigate(`/article/${article.id}`);
    } else {
      console.error('Invalid article object:', article);
    }
  };

  const getFilteredClusters = () => {
    let filtered = [...storyClusters];

    const getSourceCount = (cluster) => {
      if (cluster?.sources && typeof cluster.sources.size === 'number') return cluster.sources.size;
      if (Array.isArray(cluster?.articles) && cluster.articles.length > 0) {
        const set = new Set(cluster.articles.map(a => a.source_name).filter(Boolean));
        return set.size;
      }
      if (typeof cluster?.source_count === 'number') return cluster.source_count;
      return 0;
    };

    // Apply filters
    switch (filterBy) {
      case 'blindspots':
        filtered = filtered.filter(cluster => cluster.isBlindspot && getSourceCount(cluster) >= 2);
        break;
      case 'diverse':
        filtered = filtered.filter(cluster => !cluster.isBlindspot && getSourceCount(cluster) >= 3);
        break;
      default:
        // Only show clusters with multiple sources
        filtered = filtered.filter(cluster => getSourceCount(cluster) >= 2);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.publishedRange.latest) - new Date(a.publishedRange.latest));
        break;
      case 'sources':
        filtered.sort((a, b) => getSourceCount(b) - getSourceCount(a));
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
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
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
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
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

          {/* Trending Topics */}
          {trendingTopics.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Top 10 Trending Topics</div>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSelectedTopic(topic === selectedTopic ? '' : topic);
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${selectedTopic === topic ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              <StoryCard
                key={cluster.id}
                cluster={cluster}
                size="standard"
                showBiasBar={true}
                showKeyTakeaways={true}
                onClick={handleViewStory}
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
