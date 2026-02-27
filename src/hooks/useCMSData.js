// Custom hook for fetching CMS data with loading states and error handling
import { useState, useEffect } from 'react';
import { CMS_BASE } from '../config/api';

export const useCMSData = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dependencyKey = JSON.stringify(dependencies);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fullUrl = endpoint.startsWith('/api/cms/') 
          ? endpoint.replace('/api/cms/', `${CMS_BASE}/`)
          : `${CMS_BASE}${endpoint}`;
        let response;
        try {
          response = await fetch(fullUrl);
        } catch (_) {
          response = undefined;
        }
        let result = {};
        try {
          if (response && typeof response.json === 'function') {
            result = await response.json();
          }
        } catch (_) {
          result = {};
        }
        if (!response || !response.ok) {
          if (response && response.status === 404) {
            // Treat missing CMS endpoints on static deployments as empty
            setData(null);
            return;
          }
          throw new Error(result.error || `HTTP ${response ? response.status : 'FETCH_FAILED'}`);
        }
        setData(result.data);
      } catch (err) {
        console.error(`Failed to fetch ${endpoint}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, dependencyKey]);

  const refetch = () => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fullUrl = endpoint.startsWith('/api/cms/') 
          ? endpoint.replace('/api/cms/', `${CMS_BASE}/`)
          : `${CMS_BASE}${endpoint}`;
        const response = await fetch(fullUrl).catch(() => undefined);
        let result = {};
        try {
          if (response && typeof response.json === 'function') {
            result = await response.json();
          }
        } catch (_) {
          result = {};
        }
        if (!response || !response.ok) {
          throw new Error(result.error || `HTTP ${response ? response.status : 'FETCH_FAILED'}`);
        }
        setData(result.data);
      } catch (err) {
        console.error(`Failed to fetch ${endpoint}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  return { data, loading, error, refetch };
};

// Specialized hooks for common CMS endpoints
export const useSiteConfig = () => {
  return useCMSData('/api/cms/site-config');
};

export const useNavigation = (location) => {
  return useCMSData(`/api/cms/navigation${location ? `?location=${location}` : ''}`, [location]);
};

export const useTopics = () => {
  return useCMSData('/api/cms/topics');
};

export const useNewsSources = () => {
  return useCMSData('/api/cms/news-sources');
};

export const useBreakingNews = () => {
  return useCMSData('/api/cms/breaking-news');
};

export const useTrendingTopics = () => {
  return useCMSData('/api/cms/trending-topics');
};

export const usePageContent = (page) => {
  return useCMSData(`/api/cms/page-content?page=${page}`, [page]);
};

export const useHomepageSections = () => {
  return useCMSData('/api/cms/homepage-sections');
};

export const useDailyBriefs = (date, period) => {
  let endpoint = '/api/cms/daily-briefs';
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (period) params.append('period', period);
  if (params.toString()) endpoint += `?${params.toString()}`;
  
  return useCMSData(endpoint, [date, period]);
};

// === NEW CRITICAL COLLECTIONS HOOKS ===

export const useFactCheckClaims = (filters = {}) => {
  let endpoint = '/api/cms/fact-check-claims';
  const params = new URLSearchParams();
  
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  if (filters.category) params.append('category', filters.category);
  if (filters.verdict) params.append('verdict', filters.verdict);
  if (filters.published !== undefined) params.append('published', filters.published);
  
  if (params.toString()) endpoint += `?${params.toString()}`;
  
  return useCMSData(endpoint, [filters.limit, filters.offset, filters.category, filters.verdict, filters.published]);
};

export const useFactCheckClaim = (claimId) => {
  return useCMSData(`/api/cms/fact-check-claims/${claimId}`, [claimId]);
};

export const useStoryClusters = (filters = {}) => {
  let endpoint = '/api/cms/story-clusters';
  const params = new URLSearchParams();
  
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  if (filters.status) params.append('status', filters.status);
  if (filters.featured !== undefined) params.append('featured', filters.featured);
  if (filters.topic) params.append('topic', filters.topic);
  
  if (params.toString()) endpoint += `?${params.toString()}`;
  
  return useCMSData(endpoint, [filters.limit, filters.offset, filters.status, filters.featured, filters.topic]);
};

export const useStoryCluster = (clusterId) => {
  return useCMSData(`/api/cms/story-clusters/${clusterId}`, [clusterId]);
};

export const useUserPreferences = (userId) => {
  let endpoint = '/api/cms/user-preferences';
  if (userId) endpoint += `?user_id=${userId}`;
  
  return useCMSData(endpoint, [userId]);
};

export const useUserPreference = (prefId) => {
  return useCMSData(`/api/cms/user-preferences/${prefId}`, [prefId]);
};

// === CMS MUTATION HOOKS ===

export const useCMSMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (endpoint, method = 'POST', data = null) => {
    setLoading(true);
    setError(null);

    try {
      const fullUrl = endpoint.startsWith('/api/cms/') 
        ? endpoint.replace('/api/cms/', `${CMS_BASE}/`)
        : `${CMS_BASE}${endpoint}`;

      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result.data;
    } catch (err) {
      console.error(`Failed to ${method} ${endpoint}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createFactCheckClaim = (claimData) => {
    return mutate('/api/cms/fact-check-claims', 'POST', claimData);
  };

  const updateFactCheckClaim = (claimId, updateData) => {
    return mutate(`/api/cms/fact-check-claims/${claimId}`, 'PUT', updateData);
  };

  const createStoryCluster = (clusterData) => {
    return mutate('/api/cms/story-clusters', 'POST', clusterData);
  };

  const updateStoryCluster = (clusterId, updateData) => {
    return mutate(`/api/cms/story-clusters/${clusterId}`, 'PUT', updateData);
  };

  const createUserPreferences = (prefData) => {
    return mutate('/api/cms/user-preferences', 'POST', prefData);
  };

  const updateUserPreferences = (prefId, updateData) => {
    return mutate(`/api/cms/user-preferences/${prefId}`, 'PUT', updateData);
  };

  return {
    loading,
    error,
    mutate,
    createFactCheckClaim,
    updateFactCheckClaim,
    createStoryCluster,
    updateStoryCluster,
    createUserPreferences,
    updateUserPreferences,
  };
};
