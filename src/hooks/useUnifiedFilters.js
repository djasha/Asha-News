import { useMemo, useState } from 'react';

export const DEFAULT_UNIFIED_FILTERS = {
  topic: '',
  source: '',
  bias: 'all',
  timeframe: '24h',
  contentType: 'all',
};

export function useUnifiedFilters(initialFilters = {}) {
  const [filters, setFilters] = useState({
    ...DEFAULT_UNIFIED_FILTERS,
    ...initialFilters,
  });

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters({ ...DEFAULT_UNIFIED_FILTERS, ...initialFilters });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') return;
      params.set(key, String(value));
    });
    return params.toString();
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    queryString,
  };
}

export default useUnifiedFilters;

