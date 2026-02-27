import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SubscriptionDashboard = () => {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch subscription status
      const subResponse = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('asha_token')}`
        },
        credentials: 'include'
      });
      
      const subData = await subResponse.json();
      
      if (subData.success) {
        setSubscription(subData.subscription);
      }

      // Fetch usage statistics
      const usageResponse = await fetch('/api/subscription/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('asha_token')}`
        },
        credentials: 'include'
      });
      
      const usageData = await usageResponse.json();
      
      if (usageData.success) {
        setUsage(usageData.usage);
      }
      
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      setError('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/subscription/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('asha_token')}`
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      setError('Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('asha_token')}`
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchSubscriptionData(); // Refresh data
      } else {
        setError(data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      setError('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('asha_token')}`
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchSubscriptionData(); // Refresh data
      } else {
        setError(data.message || 'Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      setError('Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              Sign In Required
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Please sign in to view your subscription details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'canceled':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'past_due':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">
          Subscription Dashboard
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Subscription Status Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Current Plan
          </h2>
          
          {subscription ? (
            <div className="space-y-3">
              <div>
                <span className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {subscription.planName}
                </span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              
              {subscription.amount && (
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  ${subscription.amount / 100}/month
                </p>
              )}
              
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary-dark">
                  {subscription.status === 'canceled' ? 'Access ends' : 'Next billing'}: {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
              
              {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                <p className="text-sm text-primary-600 dark:text-primary-400">
                  Trial ends: {formatDate(subscription.trialEnd)}
                </p>
              )}
            </div>
          ) : (
            <div>
              <span className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Free Plan
              </span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
                Upgrade to unlock premium features
              </p>
            </div>
          )}
        </div>

        {/* Usage Statistics Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Usage This Month
          </h2>
          
          {usage ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    AI Analysis Requests
                  </span>
                  <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {usage.aiRequests} / {usage.aiLimit === -1 ? '∞' : usage.aiLimit}
                  </span>
                </div>
                {usage.aiLimit !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((usage.aiRequests / usage.aiLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Fact Check Requests
                  </span>
                  <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {usage.factCheckRequests} / {usage.factCheckLimit === -1 ? '∞' : usage.factCheckLimit}
                  </span>
                </div>
                {usage.factCheckLimit !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((usage.factCheckRequests / usage.factCheckLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              No usage data available
            </p>
          )}
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          {subscription && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          )}

          {subscription && subscription.status === 'active' && (
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Loading...' : 'Cancel Subscription'}
            </button>
          )}

          {subscription && subscription.status === 'canceled' && (
            <button
              onClick={handleReactivateSubscription}
              disabled={actionLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Loading...' : 'Reactivate Subscription'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDashboard;
