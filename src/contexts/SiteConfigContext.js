import React, { createContext, useContext, useState, useEffect } from 'react';
import { V1_CORE_ONLY } from '../config/v1';

const SiteConfigContext = createContext();

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};

export const SiteConfigProvider = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState({
    site_name: 'Asha.News',
    site_description: 'Unbiased news aggregation with AI-powered bias analysis',
    contact_email: 'contact@asha.news',
    support_email: 'support@asha.news'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSiteConfig = async () => {
    try {
      if (V1_CORE_ONLY) {
        setError(null);
        return;
      }

      let response;
      try {
        response = await fetch('/api/cms/site-config');
      } catch (_) {
        response = undefined;
      }
      let data = {};
      try {
        if (response && typeof response.json === 'function') {
          data = await response.json();
        }
      } catch (_) {
        data = {};
      }
      
      if (data && data.data) {
        setSiteConfig(data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch site configuration:', err);
      setError(err.message);
      // Keep fallback configuration
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteConfig();
  }, []);

  const value = {
    siteConfig,
    loading,
    error,
    refreshConfig: () => {
      setLoading(true);
      fetchSiteConfig();
    }
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export default SiteConfigContext;
