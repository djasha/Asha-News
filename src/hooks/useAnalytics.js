// React hook for analytics integration
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

export const useAnalytics = () => {
  const location = useLocation();

  // Initialize analytics on mount
  useEffect(() => {
    analyticsService.initialize();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const title = document.title || 'Asha News';
    analyticsService.trackPageView(location.pathname, title);
  }, [location]);

  // Return tracking functions for components to use
  const trackArticleView = useCallback((article) => {
    analyticsService.trackArticleView(article);
  }, []);

  const trackStoryClusterView = useCallback((cluster) => {
    analyticsService.trackStoryClusterView(cluster);
  }, []);

  const trackFactCheck = useCallback((claim, result) => {
    analyticsService.trackFactCheck(claim, result);
  }, []);

  const trackEngagement = useCallback((action, details) => {
    analyticsService.trackEngagement(action, details);
  }, []);

  const trackPerformance = useCallback((metric, value, category) => {
    analyticsService.trackPerformance(metric, value, category);
  }, []);

  const trackConversion = useCallback((action, value) => {
    analyticsService.trackConversion(action, value);
  }, []);

  const trackNewsEvent = useCallback((eventType, data) => {
    analyticsService.trackNewsEvent(eventType, data);
  }, []);

  return {
    trackArticleView,
    trackStoryClusterView,
    trackFactCheck,
    trackEngagement,
    trackPerformance,
    trackConversion,
    trackNewsEvent
  };
};

export default useAnalytics;
