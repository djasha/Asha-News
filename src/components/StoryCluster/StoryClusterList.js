import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BiasBar from '../BiasVisualization/BiasBar';
import useAdminSettings from '../../hooks/useAdminSettings';
import { API_BASE } from '../../config/api';

const API_BASE_URL = API_BASE;

const StoryClusterList = ({ 
  category = null, 
  limit = 10, 
  offset = 0,
  clusters: propClusters = null,
  loading: propLoading = false,
  error: propError = null
}) => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { clusterSettings } = useAdminSettings();

  // Use prop data if provided, otherwise fetch
  const shouldFetch = !propClusters;

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: 'active'
      });
      
      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`${API_BASE_URL}/clusters?${params}`);
      const data = await response.json();
      
      console.log('Clusters API response:', data);
      
      if (data.success) {
        if (page === 1) {
          setClusters(data.data);
        } else {
          setClusters(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === limit);
      } else {
        setError('Failed to load story clusters');
      }
    } catch (err) {
      setError('Network error loading clusters');
      console.error('Error fetching clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  // Normalize bias distribution into counts for BiasBar
  // biasData may be in different formats:
  // - { left: 30, center: 40, right: 30 } as percentages
  // - { left: { count: 2, percentage: 40 }, ... }
  // It may also include lean/far categories which we fold into left/right
  const getBiasCounts = (biasData, totalArticles) => {
    const valCount = (v, fallbackTotal = 0) => {
      if (v == null) return 0;
      if (typeof v === 'object') {
        // { count, percentage }
        if (typeof v.count === 'number') return Math.max(0, v.count | 0);
        if (typeof v.percentage === 'number' && fallbackTotal > 0) return Math.round((v.percentage / 100) * fallbackTotal);
        return 0;
      }
      if (typeof v === 'number') {
        // Treat as percentage if <=100, else as count
        if (v <= 1 && fallbackTotal > 0) return Math.round(v * fallbackTotal);
        if (v <= 100 && fallbackTotal > 0) return Math.round((v / 100) * fallbackTotal);
        return Math.max(0, v | 0);
      }
      return 0;
    };

    const total = Number(totalArticles) || 0;
    const left = valCount(biasData?.far_left, total) + valCount(biasData?.lean_left, total) + valCount(biasData?.left, total);
    const center = valCount(biasData?.center, total);
    const right = valCount(biasData?.lean_right, total) + valCount(biasData?.far_right, total) + valCount(biasData?.right, total);

    return { leftCount: left, centerCount: center, rightCount: right };
  };

  useEffect(() => {
    if (shouldFetch) {
      fetchClusters();
    } else {
      // Use provided clusters
      const slicedClusters = propClusters.slice(offset, offset + limit);
      setClusters(slicedClusters);
      setLoading(propLoading);
      setError(propError);
      setHasMore(false); // No pagination when using prop data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, page, propClusters, propLoading, propError, offset, limit, shouldFetch]);

  // Settings provided by useAdminSettings(); no local fetching needed

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      politics: 'bg-red-100 text-red-800',
      technology: 'bg-blue-100 text-blue-800',
      business: 'bg-green-100 text-green-800',
      sports: 'bg-orange-100 text-orange-800',
      health: 'bg-pink-100 text-pink-800',
      science: 'bg-purple-100 text-purple-800',
      entertainment: 'bg-yellow-100 text-yellow-800',
      world: 'bg-indigo-100 text-indigo-800',
      breaking: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading && clusters.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-500 text-xl mr-3" aria-hidden="true">!</div>
          <div>
            <h4 className="font-semibold text-red-800">Error Loading Stories</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4" aria-hidden="true">
          <svg className="w-14 h-14 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Story Clusters Found</h3>
        <p className="text-gray-600">
          {category 
            ? `No stories available in the ${category} category.`
            : 'No story clusters are currently available.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {clusters.map((cluster) => (
        <article key={cluster.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(cluster.topic_category)}`}>
                  {cluster.topic_category || 'General'}
                </span>
                <span className="text-sm text-gray-500">
                  {cluster.article_count} source{cluster.article_count !== 1 ? 's' : ''}
                </span>
                {cluster.blindspot_detected && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coverage Gap
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(cluster.created_at)}
              </span>
            </div>

            {/* Title and Summary */}
            <Link 
              to={`/story/${cluster.id}`}
              className="block group"
            >
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 mb-3 transition-colors">
                {cluster.cluster_title}
              </h2>
              {cluster.cluster_summary && (
                <p className="text-gray-700 mb-4 line-clamp-2">
                  {(() => {
                    // Ensure summary is a string, not an object or array
                    let s = cluster.cluster_summary;
                    if (typeof s !== 'string') {
                      s = String(s || '');
                    }
                    const max = Number(clusterSettings?.summaryMaxChars) || 0;
                    return max > 0 && s.length > max ? (s.slice(0, max).trimEnd() + '…') : s;
                  })()}
                </p>
              )}
            </Link>

            {/* Bias Distribution */}
            {cluster.bias_distribution && (clusterSettings?.showPerspectives && clusterSettings?.showBiasCharts) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Source Perspectives</span>
                  <span className="text-sm text-gray-500">
                    Coverage: {Math.round((cluster.coverage_score || 0.5) * 100)}%
                  </span>
                </div>
                {(() => {
                  const { leftCount, centerCount, rightCount } = getBiasCounts(cluster.bias_distribution, cluster.article_count);
                  return (
                    <BiasBar 
                      leftCount={leftCount}
                      centerCount={centerCount}
                      rightCount={rightCount}
                      size="small"
                      showLabels={false}
                      className="w-full"
                    />
                  );
                })()}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19V6m4 13V9m4 10V4M7 19v-8M3 21h18" />
                  </svg>
                  {cluster.source_diversity?.unique_sources || cluster.article_count} unique sources
                </span>
                {cluster.fact_check_notes && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Fact-checked
                  </span>
                )}
              </div>
              <Link 
                to={`/story/${cluster.id}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <span>Read Full Story</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </article>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Loading...
              </>
            ) : (
              'Load More Stories'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryClusterList;
