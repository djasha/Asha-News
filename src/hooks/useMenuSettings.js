import { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import {
  V1_CORE_ONLY,
  CORE_NAV_ITEMS_DESKTOP,
  CORE_NAV_ITEMS_MOBILE,
  CORE_SIDE_MENU,
} from '../config/v1';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let desktopMenuCache = null;
let mobileMenuCache = null;
let sideMenuCache = null;
let cacheTimestamp = null;

export const useMenuSettings = (menuType = 'desktop') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiBaseUrl = API_BASE;

  useEffect(() => {
    const fetchMenuSettings = async () => {
      const now = Date.now();

      if (V1_CORE_ONLY) {
        setLoading(false);
        setError(null);
        if (menuType === 'desktop') {
          setData(CORE_NAV_ITEMS_DESKTOP);
        } else if (menuType === 'mobile') {
          setData(CORE_NAV_ITEMS_MOBILE);
        } else if (menuType === 'side') {
          setData(CORE_SIDE_MENU);
        }
        return;
      }
      
      // Check cache
      if (cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        if (menuType === 'desktop' && desktopMenuCache) {
          setData(desktopMenuCache);
          setLoading(false);
          return;
        }
        if (menuType === 'mobile' && mobileMenuCache) {
          setData(mobileMenuCache);
          setLoading(false);
          return;
        }
        if (menuType === 'side' && sideMenuCache) {
          setData(sideMenuCache);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/menu-settings/${menuType}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${menuType} menu settings`);
        }

        const result = await response.json();
        
        // Update cache
        cacheTimestamp = now;
        if (menuType === 'desktop') {
          desktopMenuCache = result.items || [];
          setData(desktopMenuCache);
        } else if (menuType === 'mobile') {
          mobileMenuCache = result.items || [];
          setData(mobileMenuCache);
        } else if (menuType === 'side') {
          sideMenuCache = result.categories || [];
          setData(sideMenuCache);
        }

        setError(null);
      } catch (err) {
        console.error(`Error fetching ${menuType} menu:`, err);
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuSettings();
  }, [menuType, apiBaseUrl]);

  return { data, loading, error };
};

// Clear cache function (useful after updating settings)
export const clearMenuCache = () => {
  desktopMenuCache = null;
  mobileMenuCache = null;
  sideMenuCache = null;
  cacheTimestamp = null;
};

export default useMenuSettings;
