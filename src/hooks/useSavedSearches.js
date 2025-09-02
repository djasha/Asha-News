import { useState, useEffect } from 'react';

export const useSavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([]);

  // Load saved searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('asha-saved-searches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, []);

  // Save to localStorage whenever savedSearches changes
  useEffect(() => {
    localStorage.setItem('asha-saved-searches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  const saveSearch = (searchParams, name) => {
    const newSearch = {
      id: Date.now().toString(),
      name,
      searchQuery: searchParams.searchQuery || '',
      filterTopic: searchParams.filterTopic || [],
      filterBias: searchParams.filterBias || null,
      filterDateRange: searchParams.filterDateRange || 'all',
      filterSources: searchParams.filterSources || [],
      createdAt: new Date().toISOString()
    };

    setSavedSearches(prev => [newSearch, ...prev].slice(0, 10)); // Keep max 10 saved searches
    return newSearch.id;
  };

  const deleteSearch = (searchId) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
  };

  const loadSearch = (searchId) => {
    return savedSearches.find(search => search.id === searchId);
  };

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    loadSearch
  };
};
