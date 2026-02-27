import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import InfoIcon from '../UI/InfoIcon';
import useAdminSettings from '../../hooks/useAdminSettings';
import { API_BASE } from '../../config/api';

const API_BASE_URL = API_BASE;

const StoryClusterPage = () => {
  const { clusterId } = useParams();
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [isFollowed, setIsFollowed] = useState(false);
  const [generating, setGenerating] = useState({ qa: false, factCheck: false, analysis: false, social: false });
  const [qaCollapsed, setQaCollapsed] = useState(true);
  const { clusterSettings } = useAdminSettings();

  useEffect(() => {
    fetchCluster();
    // Initialize follow state
    try {
      const followed = JSON.parse(localStorage.getItem('followedStories') || '[]');
      setIsFollowed(followed.includes(clusterId));
    } catch {}
  }, [clusterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Settings are provided by useAdminSettings(); no local fetching needed

  const fetchCluster = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}`);
      const data = await response.json();
      
      if (data.success) {
        // Use real data only - no fallbacks to avoid showing unrelated content
        setCluster(data.data);
      } else {
        setError('Failed to load story cluster');
      }
    } catch (err) {
      setError('Network error loading cluster');
      console.error('Error fetching cluster:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBiasColor = (bias) => {
    const colors = {
      'far_left': '#1e40af',
      'lean_left': '#3b82f6',
      'left': '#3b82f6',
      'center': '#6b7280',
      'lean_right': '#ef4444',
      'right': '#ef4444',
      'far_right': '#dc2626'
    };
    return colors[bias] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Relative time for timeline and sources (single definition)
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'unknown time';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'unknown time';
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Normalize title to dedupe similar/identical entries (single definition)
  const normalizeTitle = (title = '') =>
    String(title)
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const toggleAnswer = (index) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleToggleFollow = async () => {
    try {
      const key = 'followedStories';
      const followed = JSON.parse(localStorage.getItem(key) || '[]');
      const exists = followed.includes(clusterId);
      const next = exists ? followed.filter(id => id !== clusterId) : [...followed, clusterId];
      localStorage.setItem(key, JSON.stringify(next));
      setIsFollowed(!exists);
      // Best-effort backend record (no auth required fallback)
      try {
        await fetch('/api/cms/user-subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription_type: 'story_updates',
            target_id: clusterId,
            status: exists ? 'unsubscribed' : 'active'
          })
        });
      } catch (e) {
        console.warn('Follow backend not available:', e);
      }
    } catch (e) {
      console.warn('Follow toggle failed:', e);
    }
  };

  const handleGenerateQA = async () => {
    setGenerating(prev => ({ ...prev, qa: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setCluster(prev => ({
          ...prev,
          suggested_questions: data.data.suggested_questions,
          suggested_answers: data.data.suggested_answers
        }));
      }
    } catch (err) {
      console.error('Error generating Q&A:', err);
    } finally {
      setGenerating(prev => ({ ...prev, qa: false }));
    }
  };

  const handleGenerateFactCheck = async () => {
    setGenerating(prev => ({ ...prev, factCheck: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/fact-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setCluster(prev => ({
          ...prev,
          fact_check_notes: data.data.fact_check_notes
        }));
      }
    } catch (err) {
      console.error('Error generating fact-check:', err);
    } finally {
      setGenerating(prev => ({ ...prev, factCheck: false }));
    }
  };

  const handleGenerateAnalysis = async () => {
    setGenerating(prev => ({ ...prev, analysis: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setCluster(prev => ({
          ...prev,
          key_facts: data.data.key_facts
        }));
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
    } finally {
      setGenerating(prev => ({ ...prev, analysis: false }));
    }
  };

  const handleGenerateSocial = async () => {
    setGenerating(prev => ({ ...prev, social: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setCluster(prev => ({
          ...prev,
          x_posts: data.data.x_posts,
          trending_hashtags: data.data.trending_hashtags
        }));
      } else {
        alert(data.message || 'Failed to generate social content');
      }
    } catch (err) {
      console.error('Error generating social content:', err);
      alert('Error generating tweets. Check console for details.');
    } finally {
      setGenerating(prev => ({ ...prev, social: false }));
    }
  };

  const buildKeyTakeaways = () => {
    const arts = cluster?.articles || [];
    if (!Array.isArray(arts) || arts.length === 0) return [];
    const points = arts.slice(0, 5).map(a => a.title || a.excerpt || a.description || '')
      .filter(Boolean)
      .map(t => t.replace(/^[-•\s]+/, '').trim());
    const seen = new Set();
    const unique = [];
    for (const p of points) {
      const k = p.toLowerCase().slice(0, 80);
      if (!seen.has(k)) { seen.add(k); unique.push(p); }
    }
    return unique.slice(0, 5);
  };

  const BiasDistributionChart = ({ biasData }) => {
    const biasLabels = {
      far_left: 'Far Left',
      lean_left: 'Lean Left', 
      left: 'Left',
      center: 'Center',
      lean_right: 'Lean Right',
      right: 'Right',
      far_right: 'Far Right'
    };

    // Handle different bias data formats
    const normalizedBiasData = {};
    if (biasData && typeof biasData === 'object') {
      Object.entries(biasData).forEach(([bias, value]) => {
        if (typeof value === 'number') {
          // Backend format: { left: 25, center: 50, right: 25 }
          normalizedBiasData[bias] = {
            count: Math.round(value / 5), // Estimate count from percentage
            percentage: value
          };
        } else if (typeof value === 'object' && value.count !== undefined) {
          // Frontend format: { far_left: { count: 1, percentage: 20 } }
          normalizedBiasData[bias] = value;
        }
      });
    }

    return (
      <div className="space-y-3">
        {Object.entries(normalizedBiasData).map(([bias, data]) => (
          <div key={bias} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getBiasColor(bias) }}
              ></div>
              <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                {biasLabels[bias] || bias}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    backgroundColor: getBiasColor(bias),
                    width: `${data.percentage || 0}%`
                  }}
                ></div>
              </div>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark w-8 text-right">
                {(typeof data === 'object' ? data.count : data) || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">Story Not Found</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">{error}</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!cluster) return null;

  return (
    <>
      <Helmet>
        <title>{cluster.cluster_title} - Asha.News</title>
        <meta name="description" content={cluster.cluster_summary} />
        <meta property="og:title" content={cluster.cluster_title} />
        <meta property="og:description" content={cluster.cluster_summary} />
        {cluster.featured_image && (
          <meta property="og:image" content={cluster.featured_image} />
        )}
      </Helmet>

      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        {/* Header */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border-b border-border-light dark:border-border-dark">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="flex items-center space-x-2 text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
              <Link to="/" className="hover:text-text-primary-light dark:hover:text-text-primary-dark">Home</Link>
              <span>/</span>
              <Link to="/stories" className="hover:text-text-primary-light dark:hover:text-text-primary-dark">Stories</Link>
              <span>/</span>
              <span className="text-text-primary-light dark:text-text-primary-dark">Story Cluster</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                  {cluster.cluster_title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <span>{cluster.article_count} sources</span>
                  <span>•</span>
                  <span>Updated {formatDate(cluster.updated_at)}</span>
                  <span>•</span>
                  <span className="capitalize">{cluster.topic_category}</span>
                </div>
              </div>
              <div>
                <button
                  onClick={handleToggleFollow}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isFollowed ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700' : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {isFollowed ? 'Following Story' : 'Follow Story'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {cluster.featured_image && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <img 
              src={cluster.featured_image} 
              alt={cluster.cluster_title}
              className="w-full h-64 object-cover rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Summary Section */}
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Story Summary</h2>
                  <InfoIcon 
                    content="AI-generated summary combining key information from all sources covering this story"
                    position="right"
                  />
                </div>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  {(() => {
                    // Ensure summary is a string
                    let fullSummary = cluster.cluster_summary || '';
                    if (typeof fullSummary !== 'string') {
                      fullSummary = String(fullSummary);
                    }
                    const max = Number(clusterSettings?.summaryMaxChars) || 500;
                    
                    // Show full summary if expanded OR if under max chars
                    if (expandedSummary || fullSummary.length <= max) {
                      return fullSummary;
                    }
                    
                    // Show truncated summary with ellipsis
                    return fullSummary.slice(0, max).trimEnd() + '…';
                  })()}
                </p>
                {buildKeyTakeaways().length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Key takeaways</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {buildKeyTakeaways().map((pt, idx) => (
                        <li key={idx} className="leading-snug">{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(() => {
                  let fullSummary = cluster.cluster_summary || '';
                  if (typeof fullSummary !== 'string') {
                    fullSummary = String(fullSummary);
                  }
                  const max = Number(clusterSettings?.summaryMaxChars) || 500;
                  return fullSummary.length > max && (
                    <button
                      onClick={() => setExpandedSummary(!expandedSummary)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                    >
                      {expandedSummary ? 'Show Less' : 'Read More'}
                    </button>
                  );
                })()}
              </div>

              {/* Story Timeline */}
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Story Timeline</h2>
                  <InfoIcon 
                    content="Chronological updates and key events from all sources"
                    position="right"
                  />
                </div>
                <div className="relative">
                  <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-4">
                    {(() => {
                      const seen = new Set();
                      const items = (cluster.articles || [])
                        .slice()
                        .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
                        .filter((a) => {
                          const key = normalizeTitle(a.title);
                          if (!key) return true;
                          if (seen.has(key)) return false;
                          seen.add(key);
                          return true;
                        });
                      return items.map((a, idx) => (
                        <div key={a.id || idx} className="pl-4 relative">
                          <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                          <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mb-1">{formatRelativeTime(a.published_at)}</div>
                          <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">{a.title}</div>
                          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{a.source_name}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Key Facts - show with generate button if missing */}
              {clusterSettings?.showKeyFacts && (
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Key Facts</h2>
                    <InfoIcon 
                      content="Important facts extracted and verified across multiple sources"
                      position="right"
                    />
                  </div>
                  {(!cluster.key_facts || cluster.key_facts.length === 0) && (
                    <button
                      onClick={handleGenerateAnalysis}
                      disabled={generating.analysis}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
                    >
                      {generating.analysis ? 'Generating...' : 'Generate Analysis'}
                    </button>
                  )}
                </div>
                {cluster.key_facts && cluster.key_facts.length > 0 ? (
                  <ul className="space-y-3">
                    {cluster.key_facts.map((fact, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full mt-2 mr-3"></span>
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">{fact}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click "Generate Analysis" to extract key facts from this story.</p>
                )}
              </div>
              )}

              {/* All Sources */}
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center mb-6">
                  <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">All Sources</h2>
                  <InfoIcon 
                    content="Articles from different news sources covering this story, ranked by relevance and similarity"
                    position="right"
                  />
                </div>
                <div className="space-y-4">
                  {cluster.articles && cluster.articles.slice(0, Number(clusterSettings?.sourcesPerCluster) || 6).map((article, index) => (
                    <div key={article.id} className="border border-border-light dark:border-border-dark rounded-lg p-4 hover:shadow-md transition-shadow bg-surface-light dark:bg-surface-dark">
                      <div className="flex items-start space-x-4">
                        {article.image_url && (
                          <img 
                            src={article.image_url} 
                            alt={article.title}
                            className="w-24 h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{article.source_name}</span>
                            <span 
                              className="px-2 py-1 text-xs rounded-full text-white"
                              style={{ backgroundColor: getBiasColor(article.political_bias) }}
                            >
                              {article.political_bias.replace('_', ' ')}
                            </span>
                            {article.is_primary_source && (
                              <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                                Primary Source
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-1 line-clamp-2">
                            {clusterSettings?.keepIndividualArticles !== false ? (
                              <Link 
                                to={`/article/${article.id}`}
                                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              >
                                {article.title}
                              </Link>
                            ) : (
                              <span>{article.title}</span>
                            )}
                          </h3>
                          {article.excerpt && (
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">{article.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                              {formatDate(article.published_at)}
                            </span>
                            <span className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                              {Math.round(article.similarity_score * 100)}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Fact Check / Verification */}
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Fact Check</h3>
                    <InfoIcon 
                      content="AI system cross-references claims with multiple sources to verify accuracy"
                      position="left"
                    />
                  </div>
                  {!cluster.fact_check_notes && (
                    <button
                      onClick={handleGenerateFactCheck}
                      disabled={generating.factCheck}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs flex items-center space-x-1"
                    >
                      {generating.factCheck ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify Facts</span>
                      )}
                    </button>
                  )}
                </div>
                {cluster.fact_check_notes ? (
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    {cluster.fact_check_notes}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click "Verify Facts" to fact-check claims in this story.</p>
                )}
              </div>

              {/* X/Twitter Posts - Generated on-demand via X.AI Grok */}
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Social Reaction</h3>
                    <InfoIcon 
                      content="Real X (Twitter) posts discussing this story, powered by Grok"
                      position="left"
                    />
                  </div>
                  {(!cluster.x_posts || cluster.x_posts.length === 0) && (
                    <button
                      onClick={handleGenerateSocial}
                      disabled={generating.social}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center space-x-2"
                    >
                      {generating.social ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Finding Tweets...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span>Generate Discussion</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                {cluster.x_posts && cluster.x_posts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mb-3 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>AI-generated discussion examples - not real tweets</span>
                    </div>
                    {cluster.x_posts.map((post, idx) => (
                      <div 
                        key={idx}
                        className="block p-4 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark"
                      >
                        <div className="flex items-center mb-2">
                          <span className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark">{post.author}</span>
                          {post.verified && (
                            <svg className="w-4 h-4 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="ml-auto text-xs text-text-tertiary-light dark:text-text-tertiary-dark">{formatRelativeTime(post.posted_at)}</span>
                        </div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">{post.text}</p>
                        {post.engagement && (
                          <div className="flex items-center space-x-4 text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.752 6.47a5.385 5.385 0 00-7.615 0L12 8.608 9.863 6.47a5.385 5.385 0 00-7.615 0 5.385 5.385 0 000 7.615l2.136 2.137L12 23.75l7.615-7.528 2.137-2.137a5.385 5.385 0 000-7.615z" />
                              </svg>
                              <span>{post.engagement.likes?.toLocaleString()}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h11a4 4 0 014 4v1m0 0l-3-3m3 3l3-3M20 17H9a4 4 0 01-4-4v-1m0 0l3 3m-3-3l-3 3" />
                              </svg>
                              <span>{post.engagement.retweets?.toLocaleString()}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m3.5 6A8.5 8.5 0 1120 12.5L20 20l-3.5-1z" />
                              </svg>
                              <span>{post.engagement.replies?.toLocaleString()}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Trending Hashtags */}
                    {cluster.trending_hashtags && cluster.trending_hashtags.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                        <div className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-2">Trending Hashtags</div>
                        <div className="flex flex-wrap gap-2">
                          {cluster.trending_hashtags.map((tag, idx) => (
                            <a
                              key={idx}
                              href={`https://x.com/search?q=${encodeURIComponent(tag)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                            >
                              {tag}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click "Generate Discussion" to see AI-generated examples of how this story might be discussed on X (Twitter).
                  </p>
                )}
              </div>
              
              {/* Bias Distribution */}
              {clusterSettings?.showPerspectives && clusterSettings?.showBiasCharts && (
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Source Perspectives</h3>
                  <InfoIcon 
                    content="Shows the political bias distribution of sources covering this story. A diverse distribution indicates balanced coverage."
                    position="left"
                  />
                </div>
                <BiasDistributionChart biasData={cluster.bias_distribution} />
                
                {/* Coverage Quality Metrics */}
                <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Completeness</span>
                      <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{cluster.coverage_quality?.completeness || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Accuracy</span>
                      <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{cluster.coverage_quality?.accuracy || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Timeliness</span>
                      <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{cluster.coverage_quality?.timeliness || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Questions & Answers - show with generate button */}
              {clusterSettings?.showQA && (
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Questions & Answers</h3>
                    <InfoIcon 
                      content="AI-generated questions and answers based on the content from all sources"
                      position="left"
                    />
                  </div>
                  {(!cluster.suggested_questions || cluster.suggested_questions.length === 0) && (
                    <button
                      onClick={handleGenerateQA}
                      disabled={generating.qa}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
                    >
                      {generating.qa ? 'Generating...' : 'Generate Q&A'}
                    </button>
                  )}
                </div>
                {cluster.suggested_questions && cluster.suggested_questions.length > 0 && cluster.suggested_answers && cluster.suggested_answers.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setQaCollapsed((v) => !v)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {qaCollapsed ? `Show Q&A (${cluster.suggested_questions.length})` : 'Hide Q&A'}
                    </button>
                  </div>
                  {!qaCollapsed && cluster.suggested_questions.map((question, index) => (
                    <div key={index} className="border border-border-light dark:border-border-dark rounded-lg">
                      <button
                        onClick={() => toggleAnswer(index)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                      >
                        <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark pr-2">
                          {question}
                        </span>
                        <svg 
                          className={`w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark transition-transform ${expandedAnswers[index] ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedAnswers[index] && (
                        <div className="px-4 pb-3 border-t border-border-light dark:border-border-dark">
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark pt-2">
                            {cluster.suggested_answers[index]}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click "Generate Q&A" to create questions and answers about this story.</p>
                )}
              </div>
              )}

              {/* Source Diversity */}
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Source Diversity</h3>
                  <InfoIcon 
                    content="Measures how diverse the sources are in terms of geography, bias, and publication type"
                    position="left"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Unique Sources</span>
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{cluster.source_diversity?.unique_sources || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Countries</span>
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{cluster.source_diversity?.unique_countries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Bias Perspectives</span>
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{cluster.source_diversity?.unique_biases || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Diversity Score</span>
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{Math.round((cluster.source_diversity?.diversity_score || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border-t border-border-light dark:border-border-dark py-6">
          <div className="max-w-7xl mx-auto px-4">
            <Link 
              to="/" 
              className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to All Stories
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoryClusterPage;
