// API Testing Dashboard Component
import React, { useState, useEffect } from 'react';
import { newsApiService } from '../../services/newsApiService';
import MediaStackAdapter from '../../adapters/mediastackAdapter';

const ApiTestDashboard = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testParams, setTestParams] = useState({
    keywords: '',
    categories: '',
    countries: 'us',
    languages: 'en',
    limit: 10
  });
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    // Register MediaStack adapter
    const mediastackAdapter = new MediaStackAdapter({
      apiKey: '6768fb947705ab100626939c395aadb0'
    });
    newsApiService.registerApi('mediastack', mediastackAdapter);
  }, []);

  const registerMediaStackApi = () => {
    const mediastackAdapter = new MediaStackAdapter({
      apiKey: '6768fb947705ab100626939c395aadb0'
    });
    newsApiService.registerApi('mediastack', mediastackAdapter);
    alert('MediaStack API registered successfully!');
  };

  const registerRSSApi = () => {
    // RSS adapter is auto-registered in newsApiService constructor
    alert('RSS Feeds are already registered and ready to use!');
  };

  const runApiTest = async (apiName) => {
    setIsLoading(true);
    try {
      const result = await newsApiService.testApi(apiName, testParams);
      setTestResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
      
      if (result.success && result.sampleArticle) {
        const fullResults = await newsApiService.fetchFromApi(apiName, testParams);
        setArticles(fullResults);
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const adapter = newsApiService.apis.get('mediastack');
      if (adapter && adapter.fetchSources) {
        const sourcesData = await adapter.fetchSources({ limit: 50 });
        setSources(sourcesData);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setArticles([]);
    setSources([]);
  };

  const getStatusColor = (success) => {
    return success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getResponseTimeColor = (responseTime) => {
    if (responseTime < 1000) return 'text-green-600 dark:text-green-400';
    if (responseTime < 3000) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6">
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
          News API Testing Dashboard
        </h1>

        {/* Test Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={testParams.keywords}
              onChange={(e) => setTestParams(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="e.g., technology, politics"
              className="w-full px-3 py-2 border border-primary-200 dark:border-primary-700 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Categories
            </label>
            <select
              value={testParams.categories}
              onChange={(e) => setTestParams(prev => ({ ...prev, categories: e.target.value }))}
              className="w-full px-3 py-2 border border-primary-200 dark:border-primary-700 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="technology">Technology</option>
              <option value="sports">Sports</option>
              <option value="health">Health</option>
              <option value="science">Science</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Countries
            </label>
            <input
              type="text"
              value={testParams.countries}
              onChange={(e) => setTestParams(prev => ({ ...prev, countries: e.target.value }))}
              placeholder="e.g., us,gb,ca"
              className="w-full px-3 py-2 border border-primary-200 dark:border-primary-700 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Languages
            </label>
            <input
              type="text"
              value={testParams.languages}
              onChange={(e) => setTestParams(prev => ({ ...prev, languages: e.target.value }))}
              placeholder="e.g., en,es,fr"
              className="w-full px-3 py-2 border border-primary-200 dark:border-primary-700 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Limit
            </label>
            <input
              type="number"
              value={testParams.limit}
              onChange={(e) => setTestParams(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-primary-200 dark:border-primary-700 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
            />
          </div>
        </div>

        {/* API Test Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => runApiTest('mediastack')}
            disabled={isLoading}
            className="px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test MediaStack API'}
          </button>
          
          <button
            onClick={() => runApiTest('rss')}
            disabled={isLoading}
            className="px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test RSS Feed'}
          </button>
          
          <button
            onClick={() => runApiTest('newsapi')}
            disabled={isLoading}
            className="px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test NewsAPI.org'}
          </button>
          
          <button
            onClick={() => runApiTest('newsapi-ai')}
            disabled={isLoading}
            className="px-4 py-2 bg-accent-light dark:bg-accent-dark text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test NewsAPI.ai'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 mr-2"
          >
            Clear Results
          </button>
          
          <button
            onClick={fetchSources}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Fetch Sources
          </button>
        </div>

        {/* Available APIs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Available APIs
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => registerMediaStackApi()}
              className="px-4 py-2 bg-accent-light hover:bg-accent-dark text-white rounded-lg transition-colors mr-2"
            >
              Register MediaStack API
            </button>
            <button
              onClick={() => registerRSSApi()}
              className="px-4 py-2 bg-accent-light hover:bg-accent-dark text-white rounded-lg transition-colors"
            >
              Register RSS Feeds
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Test Results
            </h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-text-primary-light dark:text-text-primary-dark">
                      {result.apiName}
                    </h3>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Status: </span>
                      <span className={getStatusColor(result.success)}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Response Time: </span>
                      <span className={getResponseTimeColor(result.responseTime)}>
                        {result.responseTime}ms
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Articles: </span>
                      <span className="text-text-primary-light dark:text-text-primary-dark">
                        {result.articleCount}
                      </span>
                    </div>
                    
                    {result.error && (
                      <div className="col-span-full">
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">Error: </span>
                        <span className="text-red-600 dark:text-red-400">{result.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources Results */}
        {sources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Available Sources ({sources.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {sources.map((source, index) => (
                <div key={index} className="border border-primary-200 dark:border-primary-700 rounded-lg p-3">
                  <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    {source.name}
                  </h4>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    ID: {source.id}
                  </p>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Category: {source.category} | Country: {source.country} | Language: {source.language}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Articles Results */}
        {articles.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Sample Articles ({articles.length})
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {articles.map((article, index) => (
                <div 
                  key={index} 
                  className="border border-primary-200 dark:border-primary-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2 hover:text-accent-light">
                    {article.title}
                  </h4>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                    {article.summary}
                  </p>
                  <div className="flex justify-between items-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    <span>Source: {article.source_name}</span>
                    <span>Author: {article.author}</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTestDashboard;
