import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { buildAuthHeaders } from '../utils/authHeaders';

const RSSManagementPage = () => {
  const [automationStatus, setAutomationStatus] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch automation status and sources
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await buildAuthHeaders();

      const [statusResponse, sourcesResponse] = await Promise.all([
        fetch('/api/rss-automation/status', { headers }),
        fetch('/api/rss-automation/sources', { headers })
      ]);

      if (!statusResponse.ok || !sourcesResponse.ok) {
        throw new Error('Failed to fetch RSS automation data');
      }

      const statusData = await statusResponse.json();
      const sourcesData = await sourcesResponse.json();

      setAutomationStatus(statusData.data);
      setSources(sourcesData.data || []);
    } catch (err) {
      console.error('Error fetching RSS data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Control automation
  const controlAutomation = async (action) => {
    try {
      setActionLoading(true);
      const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`/api/rss-automation/${action}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} RSS automation`);
      }

      const result = await response.json();
      setAutomationStatus(result.data);
      
      // Show success message
      alert(`RSS automation ${action}ed successfully`);
    } catch (err) {
      console.error(`Error ${action}ing automation:`, err);
      alert(`Failed to ${action} RSS automation: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger manual fetch
  const triggerFetch = async () => {
    try {
      setActionLoading(true);
      const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch('/api/rss-automation/fetch', {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to trigger RSS fetch');
      }

      await response.json();
      alert('RSS fetch triggered successfully');
      
      // Refresh data after fetch
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error('Error triggering fetch:', err);
      alert(`Failed to trigger RSS fetch: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get bias rating color
  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'right': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'center': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded w-1/4 mb-6"></div>
            <div className="grid gap-6">
              <div className="h-48 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded"></div>
              <div className="h-96 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">RSS Management</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">Manage RSS automation and monitor news sources</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">Error: {error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Automation Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Automation Status</h2>
          </CardHeader>
          <CardContent>
            {automationStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    automationStatus.isRunning
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {automationStatus.isRunning ? 'Running' : 'Stopped'}
                  </div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Status</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    {automationStatus.enabledSources}
                  </div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Active Sources</p>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {formatDate(automationStatus.lastFetch)}
                  </div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Last Fetch</p>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {automationStatus.settings?.fetch_interval_minutes || 30}m
                  </div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Interval</p>
                </div>
              </div>
            )}
            
            {/* Control Buttons */}
            <div className="flex gap-4 mt-6 pt-6 border-t border-border-light dark:border-border-dark">
              <button
                onClick={() => controlAutomation('start')}
                disabled={actionLoading || automationStatus?.isRunning}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Loading...' : 'Start Automation'}
              </button>
              
              <button
                onClick={() => controlAutomation('stop')}
                disabled={actionLoading || !automationStatus?.isRunning}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Loading...' : 'Stop Automation'}
              </button>
              
              <button
                onClick={triggerFetch}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Fetching...' : 'Manual Fetch'}
              </button>
              
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh
              </button>
            </div>
          </CardContent>
        </Card>

        {/* RSS Sources Table */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">RSS Sources ({sources.length})</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                <thead className="bg-background-light dark:bg-background-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Bias Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Last Fetched
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
                  {sources.map((source) => (
                    <tr key={source.id} className="hover:bg-background-light dark:hover:bg-background-dark">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                            {source.name}
                          </div>
                          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate max-w-xs">
                            {source.rss_url}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBiasColor(source.bias_rating)}`}>
                          {source.bias_rating || 'center'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(source.status)}`}>
                          {source.enabled ? (source.status || 'active') : 'disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary-light dark:text-text-primary-dark">
                        {source.article_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {formatDate(source.last_fetched)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          source.priority_level === 'high' ? 'bg-red-100 text-red-800' :
                          source.priority_level === 'low' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {source.priority_level || 'medium'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {sources.length === 0 && (
              <div className="text-center py-8">
                <p className="text-text-secondary-light dark:text-text-secondary-dark">No RSS sources found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {sources.filter(s => s.enabled && s.status === 'active').length}
              </div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Active Sources</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {sources.filter(s => s.status === 'error').length}
              </div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Error Sources</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {sources.reduce((sum, s) => sum + (s.article_count || 0), 0)}
              </div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Total Articles</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RSSManagementPage;
