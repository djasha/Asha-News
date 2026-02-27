import React from 'react';

// Loading skeleton for different content types
export const LoadingSkeleton = ({ type = 'default', count = 1 }) => {
  const skeletons = {
    navigation: (
      <div className="flex space-x-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
        ))}
      </div>
    ),
    
    article: (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
      </div>
    ),
    
    card: (
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    ),
    
    topic: (
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16" />
      </div>
    ),
    
    default: (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
      </div>
    )
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {skeletons[type] || skeletons.default}
        </div>
      ))}
    </div>
  );
};

// Error state component
export const ErrorState = ({ 
  error, 
  onRetry, 
  title = "Failed to load content",
  description = "There was an error loading the content. Please try again.",
  showRetry = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
        {title}
      </h3>
      
      <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4 max-w-md">
        {description}
      </p>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-mono bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded">
          {error}
        </p>
      )}
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// Empty state component
export const EmptyState = ({ 
  title = "No content available",
  description = "There's no content to display at the moment.",
  icon = null
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon || (
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
        </svg>
      )}
      
      <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
        {title}
      </h3>
      
      <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-md">
        {description}
      </p>
    </div>
  );
};

// Main CMS loading state wrapper
const CMSLoadingState = ({ 
  loading, 
  error, 
  data, 
  onRetry,
  loadingType = 'default',
  loadingCount = 1,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorDescription,
  children 
}) => {
  if (loading) {
    return <LoadingSkeleton type={loadingType} count={loadingCount} />;
  }

  if (error) {
    return (
      <ErrorState 
        error={error}
        onRetry={onRetry}
        title={errorTitle}
        description={errorDescription}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <EmptyState 
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return children;
};

export default CMSLoadingState;
