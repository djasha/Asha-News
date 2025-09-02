import React from 'react';

const SourceCounter = ({ 
  coverage, 
  size = 'medium',
  variant = 'badge',
  className = '' 
}) => {
  if (!coverage) return null;

  const { total_sources, coverage_percentage } = coverage;

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          text: 'text-xs',
          padding: 'px-2 py-1'
        };
      case 'large':
        return {
          text: 'text-sm',
          padding: 'px-3 py-2'
        };
      default:
        return {
          text: 'text-xs',
          padding: 'px-2 py-1'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Badge variant (like Ground.news)
  if (variant === 'badge') {
    return (
      <div className={`
        inline-flex items-center gap-1 
        ${sizeClasses.padding} 
        bg-primary-100 dark:bg-primary-800 
        text-primary-700 dark:text-primary-300 
        rounded-full 
        ${sizeClasses.text} 
        font-medium
        ${className}
      `}>
        <span>{total_sources}</span>
        <span className="text-text-secondary-light dark:text-text-secondary-dark">sources</span>
      </div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <span className={`
        ${sizeClasses.text} 
        text-text-secondary-light dark:text-text-secondary-dark 
        font-medium
        ${className}
      `}>
        {total_sources} sources
        {coverage_percentage && (
          <span className="ml-1 text-text-primary-light dark:text-text-primary-dark">
            • {coverage_percentage}%
          </span>
        )}
      </span>
    );
  }

  // Compact variant
  return (
    <div className={`
      inline-flex items-center gap-1 
      ${sizeClasses.text} 
      text-text-secondary-light dark:text-text-secondary-dark
      ${className}
    `}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
      <span>{total_sources}</span>
    </div>
  );
};

export default SourceCounter;
