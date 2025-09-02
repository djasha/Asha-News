import React, { useState, useEffect } from 'react';
import SearchInput from './SearchInput';
import FilterChips from './FilterChips';
import FilterModal from './FilterModal';
import { useSavedSearches } from '../../hooks/useSavedSearches';

const ResponsiveFilters = ({
  searchQuery = '',
  onSearchChange,
  filterBias,
  onBiasChange,
  filterTopic,
  onTopicChange,
  filterDateRange,
  onDateRangeChange,
  filterSources,
  onSourcesChange,
  availableTopics = [],
  availableSources = [],
  activeFilterCount = 0,
  onClearAll
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  
  const { savedSearches, deleteSearch, loadSearch } = useSavedSearches();

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else if (width < 1440) {
        setScreenSize('desktop');
      } else {
        setScreenSize('wide');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const biasOptions = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  const FilterContent = ({ isMobile = false }) => (
    <div className="space-y-4">
      {/* Search Input - only show on desktop/tablet */}
      {!isMobile && (
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search articles..."
          className="w-full"
        />
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            Saved Searches
          </label>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {savedSearches.slice(0, 3).map((search) => (
              <div key={search.id} className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const searchData = loadSearch(search.id);
                    if (searchData) {
                      onSearchChange(searchData.searchQuery);
                      onTopicChange(searchData.filterTopic);
                      onBiasChange(searchData.filterBias);
                      onDateRangeChange(searchData.filterDateRange);
                      onSourcesChange(searchData.filterSources);
                    }
                  }}
                  className="flex-1 text-left text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 py-1 transition-colors"
                >
                  {search.name}
                </button>
                <button
                  onClick={() => deleteSearch(search.id)}
                  className="text-xs text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 dark:hover:text-red-400 ml-2"
                  aria-label={`Delete ${search.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Presets */}
      <div>
        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
          Quick Filters
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onTopicChange(['Politics']);
              onBiasChange(null);
              onDateRangeChange('today');
            }}
            className="px-3 py-2 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Today's Politics
          </button>
          <button
            onClick={() => {
              onTopicChange(['Technology']);
              onBiasChange(null);
              onDateRangeChange('week');
            }}
            className="px-3 py-2 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Tech This Week
          </button>
          <button
            onClick={() => {
              onTopicChange([]);
              onBiasChange('center');
              onDateRangeChange('today');
            }}
            className="px-3 py-2 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Balanced News
          </button>
          <button
            onClick={() => {
              onTopicChange(['Business']);
              onBiasChange(null);
              onDateRangeChange('today');
            }}
            className="px-3 py-2 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Business Today
          </button>
        </div>
      </div>

      {/* Bias Filter */}
      <FilterChips
        label="Bias"
        options={['Left', 'Center', 'Right']}
        selectedValue={filterBias}
        onChange={onBiasChange}
        multiSelect={false}
      />

      {/* Date Range Filter */}
      <FilterChips
        label="Date Range"
        options={[
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
          { value: 'all', label: 'All Time' }
        ]}
        selectedValue={filterDateRange}
        onChange={onDateRangeChange}
        multiSelect={false}
      />

      {/* Topic Filter */}
      <FilterChips
        label="Topics"
        options={availableTopics}
        selectedValue={filterTopic}
        onChange={onTopicChange}
        multiSelect={true}
      />

      {/* Source Filter */}
      {availableSources.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            News Sources
          </label>
          <div className="max-h-32 overflow-y-auto space-y-2 border border-primary-200 dark:border-primary-700 rounded-lg p-3">
            {availableSources.map((source) => (
              <label key={source} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterSources.includes(source)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSourcesChange([...filterSources, source]);
                    } else {
                      onSourcesChange(filterSources.filter(s => s !== source));
                    }
                  }}
                  className="rounded border-primary-300 dark:border-primary-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {source}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Action Buttons */}
      {isMobile && (
        <div className="flex gap-3 pt-4 border-t border-primary-200 dark:border-primary-700">
          <button
            onClick={onClearAll}
            className="flex-1 px-4 py-3 text-sm font-medium border border-primary-300 dark:border-primary-700 rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark hover:bg-accent-paper-light dark:hover:bg-accent-paper-dark transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );

  // Mobile Layout
  if (screenSize === 'mobile') {
    return (
      <>
        {/* Mobile Search Bar + Filter Button */}
        <div className="sticky top-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-primary-200 dark:border-primary-800 p-4">
          <div className="flex gap-3">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search articles..."
              className="flex-1"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="relative px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors min-h-[44px] flex items-center gap-2"
              aria-label="Open filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Filter Articles"
        >
          <FilterContent isMobile={true} />
        </FilterModal>
      </>
    );
  }

  // Tablet Layout
  if (screenSize === 'tablet') {
    return (
      <div className="bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-primary-200 dark:border-primary-800 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search articles..."
              className="w-full max-w-md"
            />
          </div>
          
          {/* Expandable Filters */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FilterChips
                options={biasOptions}
                selectedValue={filterBias}
                onChange={onBiasChange}
                label="Perspective"
              />
              <FilterChips
                options={dateRangeOptions}
                selectedValue={filterDateRange}
                onChange={onDateRangeChange}
                label="Time Period"
              />
            </div>
            
            {availableTopics.length > 0 && (
              <FilterChips
                options={availableTopics.map(topic => ({ value: topic, label: topic }))}
                selectedValue={filterTopic}
                onChange={onTopicChange}
                label="Topics"
                multiSelect={true}
              />
            )}

            {activeFilterCount > 0 && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </span>
                <button
                  onClick={onClearAll}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop & Wide Screen Layout
  return (
    <div className="bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-primary-200 dark:border-primary-800">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">
            {/* Desktop Filter Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 space-y-4 border border-primary-200 dark:border-primary-700">
                <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark text-sm">
                  Filter Articles
                </h3>
                <FilterContent />
                {activeFilterCount > 0 && (
                  <div className="pt-4 border-t border-primary-200 dark:border-primary-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {activeFilterCount} active
                      </span>
                      <button
                        onClick={onClearAll}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Search Bar */}
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search articles..."
                className="w-full max-w-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveFilters;
