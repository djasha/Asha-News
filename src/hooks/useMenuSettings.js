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

const REQUIRED_MISSION_CONTROL_ENTRY = {
  label: 'Mission Control',
  path: '/mc',
};

function ensureMissionControlDesktop(items) {
  const list = Array.isArray(items) ? [...items] : [];
  if (list.some((item) => item?.path === '/mc' || item?.path === '/mission-control')) {
    return list;
  }
  return [
    ...list.slice(0, 1),
    {
      ...REQUIRED_MISSION_CONTROL_ENTRY,
      fontSize: '16',
      fontWeight: '600',
      enabled: true,
      sort_order: 2,
    },
    ...list.slice(1),
  ];
}

function ensureMissionControlMobile(items) {
  const list = Array.isArray(items) ? [...items] : [];
  if (list.some((item) => item?.path === '/mc' || item?.path === '/mission-control')) {
    return list;
  }
  const shifted = list.map((item) => ({
    ...item,
    sort_order: typeof item?.sort_order === 'number' && item.sort_order >= 2
      ? item.sort_order + 1
      : item?.sort_order,
  }));
  return [
    {
      ...REQUIRED_MISSION_CONTROL_ENTRY,
      label: 'MC',
      icon: 'layers',
      enabled: true,
      sort_order: 2,
    },
    ...shifted,
  ].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function ensureMissionControlSide(categories) {
  const list = Array.isArray(categories) ? [...categories] : [];
  const hasEntry = list.some((cat) =>
    Array.isArray(cat?.items) &&
    cat.items.some((item) => item?.path === '/mc' || item?.path === '/mission-control')
  );
  if (hasEntry) return list;

  const insertion = { label: 'Mission Control', path: '/mc', enabled: true, sort_order: 2 };
  const coreIndex = list.findIndex((cat) => /core|features/i.test(String(cat?.title || '')));
  if (coreIndex >= 0) {
    const core = list[coreIndex];
    const coreItems = Array.isArray(core.items) ? [...core.items] : [];
    const nextItems = [
      ...coreItems.slice(0, 1),
      insertion,
      ...coreItems.slice(1),
    ];
    list[coreIndex] = { ...core, items: nextItems };
    return list;
  }

  return [
    {
      id: 'mission-control',
      title: 'Core',
      enabled: true,
      sort_order: 1,
      items: [insertion],
    },
    ...list,
  ];
}

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
          setData(ensureMissionControlDesktop(CORE_NAV_ITEMS_DESKTOP));
        } else if (menuType === 'mobile') {
          setData(ensureMissionControlMobile(CORE_NAV_ITEMS_MOBILE));
        } else if (menuType === 'side') {
          setData(ensureMissionControlSide(CORE_SIDE_MENU));
        }
        return;
      }
      
      // Check cache
      if (cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        if (menuType === 'desktop' && desktopMenuCache) {
          setData(ensureMissionControlDesktop(desktopMenuCache));
          setLoading(false);
          return;
        }
        if (menuType === 'mobile' && mobileMenuCache) {
          setData(ensureMissionControlMobile(mobileMenuCache));
          setLoading(false);
          return;
        }
        if (menuType === 'side' && sideMenuCache) {
          setData(ensureMissionControlSide(sideMenuCache));
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
          desktopMenuCache = ensureMissionControlDesktop(result.items || []);
          setData(desktopMenuCache);
        } else if (menuType === 'mobile') {
          mobileMenuCache = ensureMissionControlMobile(result.items || []);
          setData(mobileMenuCache);
        } else if (menuType === 'side') {
          sideMenuCache = ensureMissionControlSide(result.categories || []);
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
