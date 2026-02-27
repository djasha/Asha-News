import React from 'react';

const SkeletonLoader = ({ variant = 'article', count = 1 }) => {
  const renderArticleSkeleton = () => (
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-mobile p-4 shadow-mobile animate-pulse">
      {/* Image placeholder */}
      <div className="w-full h-48 bg-primary-200 dark:bg-primary-800 rounded-mobile mb-4"></div>
      
      {/* Source and date */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-primary-200 dark:bg-primary-800 rounded-full"></div>
        <div className="w-20 h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
        <div className="w-16 h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
      </div>
      
      {/* Title */}
      <div className="space-y-2 mb-3">
        <div className="w-full h-5 bg-primary-200 dark:bg-primary-800 rounded"></div>
        <div className="w-3/4 h-5 bg-primary-200 dark:bg-primary-800 rounded"></div>
      </div>
      
      {/* Summary */}
      <div className="space-y-2 mb-4">
        <div className="w-full h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
        <div className="w-full h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
        <div className="w-2/3 h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
      </div>
      
      {/* Bias indicator */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-6 bg-primary-200 dark:bg-primary-800 rounded-full"></div>
        <div className="w-12 h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-mobile p-4 shadow-mobile animate-pulse">
      <div className="w-full h-32 bg-primary-200 dark:bg-primary-800 rounded-mobile mb-3"></div>
      <div className="w-3/4 h-4 bg-primary-200 dark:bg-primary-800 rounded mb-2"></div>
      <div className="w-1/2 h-3 bg-primary-200 dark:bg-primary-800 rounded"></div>
    </div>
  );

  const renderTextSkeleton = () => (
    <div className="animate-pulse space-y-2">
      <div className="w-full h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
      <div className="w-5/6 h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
      <div className="w-4/5 h-4 bg-primary-200 dark:bg-primary-800 rounded"></div>
    </div>
  );

  const skeletonComponents = {
    article: renderArticleSkeleton,
    card: renderCardSkeleton,
    text: renderTextSkeleton,
  };

  const SkeletonComponent = skeletonComponents[variant] || renderArticleSkeleton;

  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <SkeletonComponent />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
