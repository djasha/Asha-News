import React, { useState, useEffect, useRef } from 'react';

const SearchInput = ({ 
  value = '', 
  onChange, 
  placeholder = "Search articles...",
  debounceMs = 300,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      onChange(parseSearchQuery(newValue));
    }, debounceMs);
  };

  const parseSearchQuery = (query) => {
    // Advanced search operators
    const operators = {
      exact: /"([^"]+)"/g,
      exclude: /-(\w+)/g,
      source: /source:(\w+)/g,
      author: /author:(\w+)/g,
      topic: /topic:(\w+)/g
    };

    let parsedQuery = query;
    const metadata = {};

    // Extract exact phrases
    const exactMatches = [...query.matchAll(operators.exact)];
    if (exactMatches.length > 0) {
      metadata.exactPhrases = exactMatches.map(match => match[1]);
      parsedQuery = parsedQuery.replace(operators.exact, '');
    }

    // Extract exclusions
    const excludeMatches = [...query.matchAll(operators.exclude)];
    if (excludeMatches.length > 0) {
      metadata.excludeTerms = excludeMatches.map(match => match[1]);
      parsedQuery = parsedQuery.replace(operators.exclude, '');
    }

    // Extract source filters
    const sourceMatches = [...query.matchAll(operators.source)];
    if (sourceMatches.length > 0) {
      metadata.sources = sourceMatches.map(match => match[1]);
      parsedQuery = parsedQuery.replace(operators.source, '');
    }

    // Extract author filters
    const authorMatches = [...query.matchAll(operators.author)];
    if (authorMatches.length > 0) {
      metadata.authors = authorMatches.map(match => match[1]);
      parsedQuery = parsedQuery.replace(operators.author, '');
    }

    // Extract topic filters
    const topicMatches = [...query.matchAll(operators.topic)];
    if (topicMatches.length > 0) {
      metadata.topics = topicMatches.map(match => match[1]);
      parsedQuery = parsedQuery.replace(operators.topic, '');
    }

    return {
      query: parsedQuery.trim(),
      metadata,
      original: query
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Trigger immediate search on Enter
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onChange(parseSearchQuery(localValue));
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 sm:py-3 border border-primary-300 dark:border-primary-700 rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
          aria-label="Search articles"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-r-lg"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};


export default SearchInput;
