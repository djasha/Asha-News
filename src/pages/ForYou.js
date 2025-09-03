import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Tab Components
const MyFeedTab = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Mock personalized articles
  React.useEffect(() => {
    const mockArticles = [
      {
        id: '1',
        title: 'Breaking: Major Climate Agreement Reached at Global Summit',
        summary: 'World leaders announce unprecedented commitment to renewable energy transition with $2 trillion investment plan.',
        source: 'Climate News Network',
        bias: 'center',
        category: 'Environment',
        readTime: '4 min read',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sourceCount: 15,
        biasBreakdown: { left: 6, center: 5, right: 4 },
        trending: true,
        image: null
      },
      {
        id: '2',
        title: 'Tech Giants Face New Antitrust Legislation in Congress',
        summary: 'Bipartisan bill targets monopolistic practices in social media and e-commerce platforms.',
        source: 'Tech Policy Review',
        bias: 'left',
        category: 'Technology',
        readTime: '6 min read',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sourceCount: 23,
        biasBreakdown: { left: 12, center: 7, right: 4 },
        trending: false,
        image: null
      },
      {
        id: '3',
        title: 'Economic Recovery Shows Strong Q3 Growth Despite Inflation Concerns',
        summary: 'GDP growth exceeds expectations while consumer spending remains resilient across key sectors.',
        source: 'Financial Analytics',
        bias: 'right',
        category: 'Business',
        readTime: '5 min read',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sourceCount: 18,
        biasBreakdown: { left: 3, center: 8, right: 7 },
        trending: true,
        image: null
      },
      {
        id: '4',
        title: 'Healthcare AI Breakthrough: Early Cancer Detection Accuracy Reaches 95%',
        summary: 'New machine learning algorithm shows remarkable success in identifying early-stage cancers.',
        source: 'Medical Innovation Today',
        bias: 'center',
        category: 'Healthcare',
        readTime: '7 min read',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        sourceCount: 12,
        biasBreakdown: { left: 4, center: 6, right: 2 },
        trending: false,
        image: null
      }
    ];

    setTimeout(() => {
      setArticles(mockArticles);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredArticles = articles.filter(article => {
    if (filter === 'all') return true;
    if (filter === 'trending') return article.trending;
    return article.category.toLowerCase() === filter.toLowerCase();
  });

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'bg-blue-500';
      case 'right': return 'bg-red-500';
      case 'center': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const refreshFeed = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          My Feed
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={refreshFeed}
            disabled={loading}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Feed'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'trending', 'environment', 'technology', 'business', 'healthcare'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filter === filterOption
                ? 'bg-primary-600 text-white'
                : 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Articles Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div key={article.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full ${getBiasColor(article.bias)} mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {article.trending && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded-full">
                        Trending
                      </span>
                    )}
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {article.source} • {article.readTime}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-4 line-clamp-2">
                    {article.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      <span>{article.sourceCount} sources</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{article.biasBreakdown.left}</span>
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span>{article.biasBreakdown.center}</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>{article.biasBreakdown.right}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                      <button className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredArticles.length === 0 && !loading && (
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            No articles found
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Try adjusting your filters or refresh your feed.
          </p>
        </div>
      )}
    </div>
  );
};

const DiscoverTab = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [followedTopics, setFollowedTopics] = useState([]);
  const [suggestedSources, setSuggestedSources] = useState([]);

  React.useEffect(() => {
    // Mock trending topics
    const mockTrendingTopics = [
      { id: 1, name: 'Climate Summit', articles: 45, trend: '+12%', category: 'Environment' },
      { id: 2, name: 'AI Regulation', articles: 32, trend: '+8%', category: 'Technology' },
      { id: 3, name: 'Economic Policy', articles: 28, trend: '+15%', category: 'Politics' },
      { id: 4, name: 'Space Exploration', articles: 19, trend: '+5%', category: 'Science' },
      { id: 5, name: 'Healthcare Reform', articles: 24, trend: '+9%', category: 'Healthcare' },
      { id: 6, name: 'Renewable Energy', articles: 31, trend: '+11%', category: 'Environment' }
    ];

    // Mock followed topics
    const mockFollowedTopics = [
      { id: 1, name: 'Artificial Intelligence', following: true },
      { id: 2, name: 'Climate Change', following: true },
      { id: 3, name: 'Cryptocurrency', following: true },
      { id: 4, name: 'Space Technology', following: false },
      { id: 5, name: 'Renewable Energy', following: false },
      { id: 6, name: 'Biotechnology', following: false }
    ];

    // Mock suggested sources
    const mockSuggestedSources = [
      { id: 1, name: 'Reuters', bias: 'center', followers: '2.1M', description: 'International news agency' },
      { id: 2, name: 'Associated Press', bias: 'center', followers: '1.8M', description: 'American news agency' },
      { id: 3, name: 'BBC News', bias: 'center', followers: '3.2M', description: 'British public broadcaster' },
      { id: 4, name: 'NPR', bias: 'left', followers: '1.5M', description: 'National Public Radio' },
      { id: 5, name: 'Wall Street Journal', bias: 'right', followers: '2.8M', description: 'Business and financial news' },
      { id: 6, name: 'The Guardian', bias: 'left', followers: '2.3M', description: 'British daily newspaper' }
    ];

    setTrendingTopics(mockTrendingTopics);
    setFollowedTopics(mockFollowedTopics);
    setSuggestedSources(mockSuggestedSources);
  }, []);

  const categories = ['all', 'environment', 'technology', 'politics', 'science', 'healthcare'];
  
  const filteredTopics = selectedCategory === 'all' 
    ? trendingTopics 
    : trendingTopics.filter(topic => topic.category.toLowerCase() === selectedCategory);

  const toggleFollowTopic = (topicId) => {
    setFollowedTopics(prev => 
      prev.map(topic => 
        topic.id === topicId 
          ? { ...topic, following: !topic.following }
          : topic
      )
    );
  };

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'right': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'center': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Discover
        </h2>
      </div>

      {/* Trending Topics Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Trending Topics
          </h3>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div key={topic.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {topic.name}
                </h4>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                  {topic.trend}
                </span>
              </div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                {topic.articles} articles • {topic.category}
              </p>
              <button className="w-full px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Explore Topic
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Topics You Follow Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Topics You Follow
          </h3>
          <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm">
            See All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {followedTopics.map((topic) => (
            <div key={topic.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-3 text-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                  {topic.name}
                </span>
                <button
                  onClick={() => toggleFollowTopic(topic.id)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    topic.following
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {topic.following ? '−' : '+'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Sources Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Suggested Sources
          </h3>
          <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm">
            See All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestedSources.map((source) => (
            <div key={source.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {source.name}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getBiasColor(source.bias)}`}>
                    {source.bias}
                  </span>
                </div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {source.description}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {source.followers} followers
                </p>
              </div>
              <button className="ml-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Explore More Section */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Explore More
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Search Topics
            </h4>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Find specific topics and stories
            </p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Browse Categories
            </h4>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Explore news by category
            </p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Breaking News
            </h4>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Latest breaking stories
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomFeedsTab = () => {
  const [customFeeds, setCustomFeeds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);

  React.useEffect(() => {
    // Mock existing custom feeds
    const mockFeeds = [
      {
        id: 1,
        name: 'Tech & Innovation',
        description: 'Latest technology and innovation news',
        sources: ['TechCrunch', 'Wired', 'The Verge'],
        topics: ['AI', 'Startups', 'Gadgets'],
        articleCount: 24,
        lastUpdated: '2 hours ago',
        isActive: true
      },
      {
        id: 2,
        name: 'Climate & Environment',
        description: 'Environmental news and climate change coverage',
        sources: ['Climate Central', 'Environmental News', 'Green Tech'],
        topics: ['Climate Change', 'Renewable Energy', 'Conservation'],
        articleCount: 18,
        lastUpdated: '4 hours ago',
        isActive: true
      }
    ];
    setCustomFeeds(mockFeeds);
  }, []);

  const availableSources = [
    'Reuters', 'Associated Press', 'BBC News', 'CNN', 'Fox News', 'NPR',
    'TechCrunch', 'Wired', 'The Verge', 'Wall Street Journal', 'Financial Times'
  ];

  const availableTopics = [
    'Politics', 'Technology', 'Business', 'Science', 'Health', 'Environment',
    'Sports', 'Entertainment', 'World News', 'AI', 'Climate Change', 'Economy'
  ];

  const createFeed = () => {
    if (newFeedName.trim() && selectedSources.length > 0 && selectedTopics.length > 0) {
      const newFeed = {
        id: Date.now(),
        name: newFeedName,
        description: `Custom feed for ${selectedTopics.join(', ')}`,
        sources: selectedSources,
        topics: selectedTopics,
        articleCount: Math.floor(Math.random() * 30) + 5,
        lastUpdated: 'Just now',
        isActive: true
      };
      setCustomFeeds(prev => [...prev, newFeed]);
      setShowCreateModal(false);
      setNewFeedName('');
      setSelectedSources([]);
      setSelectedTopics([]);
    }
  };

  const toggleFeedActive = (feedId) => {
    setCustomFeeds(prev =>
      prev.map(feed =>
        feed.id === feedId ? { ...feed, isActive: !feed.isActive } : feed
      )
    );
  };

  const deleteFeed = (feedId) => {
    setCustomFeeds(prev => prev.filter(feed => feed.id !== feedId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Custom Feeds
        </h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Create Feed
        </button>
      </div>

      {/* Existing Custom Feeds */}
      {customFeeds.length > 0 ? (
        <div className="space-y-4">
          {customFeeds.map((feed) => (
            <div key={feed.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {feed.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      feed.isActive 
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {feed.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-3">
                    {feed.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{feed.articleCount} articles</span>
                    <span>•</span>
                    <span>Updated {feed.lastUpdated}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFeedActive(feed.id)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      feed.isActive
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                        : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                    }`}
                  >
                    {feed.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteFeed(feed.id)}
                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {feed.sources.map((source) => (
                      <span key={source} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {feed.topics.map((topic) => (
                      <span key={topic} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            No Custom Feeds Yet
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            Create personalized feeds by combining specific sources, topics, and keywords.
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Your First Feed
          </button>
        </div>
      )}

      {/* Create Feed Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                Create Custom Feed
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Feed Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Feed Name
                </label>
                <input
                  type="text"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  placeholder="Enter feed name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-primary-light dark:text-text-primary-dark"
                />
              </div>

              {/* Sources Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Select Sources ({selectedSources.length} selected)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {availableSources.map((source) => (
                    <label key={source} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSources(prev => [...prev, source]);
                          } else {
                            setSelectedSources(prev => prev.filter(s => s !== source));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                        {source}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Topics Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Select Topics ({selectedTopics.length} selected)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {availableTopics.map((topic) => (
                    <label key={topic} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTopics(prev => [...prev, topic]);
                          } else {
                            setSelectedTopics(prev => prev.filter(t => t !== topic));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                        {topic}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-text-secondary-light dark:text-text-secondary-dark border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark"
                >
                  Cancel
                </button>
                <button
                  onClick={createFeed}
                  disabled={!newFeedName.trim() || selectedSources.length === 0 || selectedTopics.length === 0}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SavedStoriesTab = () => {
  const { getSavedArticles, toggleSaveArticle, isAuthenticated } = useAuth();
  const [savedArticles, setSavedArticles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (isAuthenticated) {
      const articles = getSavedArticles({ category: filter });
      setSavedArticles(articles);
    }
    setLoading(false);
  }, [isAuthenticated, filter, getSavedArticles]);

  const handleRemoveArticle = (article) => {
    toggleSaveArticle(article);
    setSavedArticles(prev => prev.filter(a => a.id !== article.id));
  };

  const categories = ['all', ...new Set(savedArticles.map(a => a.category))];

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'bg-blue-500';
      case 'right': return 'bg-red-500';
      case 'center': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
          Sign In Required
        </h3>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Please sign in to view your saved articles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Saved Stories
        </h2>
        <div className="flex gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-surface-elevated-light dark:bg-surface-elevated-dark border border-gray-300 dark:border-gray-600 rounded-lg text-text-primary-light dark:text-text-primary-dark"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {savedArticles.length}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Saved Articles
          </div>
        </div>
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {categories.length - 1}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Categories
          </div>
        </div>
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {savedArticles.filter(a => {
              const savedDate = new Date(a.savedAt);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return savedDate > weekAgo;
            }).length}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            This Week
          </div>
        </div>
      </div>
      
      {/* Saved Articles */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : savedArticles.length > 0 ? (
        <div className="space-y-4">
          {savedArticles.map((article) => (
            <div key={article.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full ${getBiasColor(article.bias)} mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {article.source} • {article.readTime}
                    </span>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                      {article.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-4 line-clamp-2">
                    {article.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      Saved {new Date(article.savedAt).toLocaleDateString()}
                    </span>
                    
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        Read
                      </button>
                      <button
                        onClick={() => handleRemoveArticle(article)}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            No Saved Articles Yet
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Start saving articles by clicking the bookmark icon on any article card.
          </p>
        </div>
      )}
    </div>
  );
};

const CitationsTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Citations
        </h2>
      </div>
      
      {/* Source Citations and References */}
      <div className="grid gap-6">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Source Citations
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Track and manage citations from articles you've read and referenced.
          </p>
        </div>
      </div>
    </div>
  );
};

const ManageSourcesTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Manage Sources & Topics
        </h2>
      </div>
      
      {/* Source and Topic Management */}
      <div className="grid gap-6">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Content Preferences
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Customize your news sources, hide unwanted topics, and manage your content preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

const ForYou = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('my-feed');

  const tabs = [
    { id: 'my-feed', label: 'My Feed', component: MyFeedTab },
    { id: 'discover', label: 'Discover', component: DiscoverTab },
    { id: 'custom-feeds', label: 'Custom Feeds', component: CustomFeedsTab },
    { id: 'saved-stories', label: 'Saved Stories', component: SavedStoriesTab },
    { id: 'citations', label: 'Citations', component: CitationsTab },
    { id: 'manage-sources', label: 'Manage Sources & Topics', component: ManageSourcesTab }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || MyFeedTab;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              Sign In Required
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Please sign in to access your personalized For You page.
            </p>
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            For You
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Your personalized news experience
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default ForYou;
