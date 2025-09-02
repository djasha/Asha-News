import React from 'react';

const CoverageIndicator = ({ 
  coverage, 
  size = 'medium',
  showDetails = true,
  className = '' 
}) => {
  if (!coverage) return null;

  const { total_sources, left_sources, center_sources, right_sources, coverage_percentage } = coverage;
  
  // Calculate percentages
  const leftPercentage = Math.round((left_sources / total_sources) * 100);
  const centerPercentage = Math.round((center_sources / total_sources) * 100);
  const rightPercentage = Math.round((right_sources / total_sources) * 100);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'text-xs',
          bar: 'h-6',
          text: 'text-xs'
        };
      case 'large':
        return {
          container: 'text-sm',
          bar: 'h-8',
          text: 'text-sm'
        };
      default:
        return {
          container: 'text-xs',
          bar: 'h-7',
          text: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`${sizeClasses.container} ${className}`}>
      {/* Coverage Bar with Labels */}
      <div className={`w-full ${sizeClasses.bar} bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden flex relative`}>
        {/* Left sources */}
        <div 
          className="bg-blue-600 dark:bg-blue-500 transition-all duration-300 flex items-center justify-center relative"
          style={{ width: `${leftPercentage}%` }}
          title={`Left: ${left_sources} sources (${leftPercentage}%)`}
        >
          {leftPercentage >= 8 && (
            <span className="text-white text-xs font-bold tracking-tight">
              Left {leftPercentage}%
            </span>
          )}
        </div>
        {/* Center sources */}
        <div 
          className="bg-gray-300 dark:bg-gray-400 transition-all duration-300 flex items-center justify-center relative"
          style={{ width: `${centerPercentage}%` }}
          title={`Center: ${center_sources} sources (${centerPercentage}%)`}
        >
          {centerPercentage >= 8 && (
            <span className="text-gray-800 dark:text-gray-900 text-xs font-bold tracking-tight">
              Center {centerPercentage}%
            </span>
          )}
        </div>
        {/* Right sources */}
        <div 
          className="bg-red-600 dark:bg-red-500 transition-all duration-300 flex items-center justify-center relative"
          style={{ width: `${rightPercentage}%` }}
          title={`Right: ${right_sources} sources (${rightPercentage}%)`}
        >
          {rightPercentage >= 8 && (
            <span className="text-white text-xs font-bold tracking-tight">
              Right {rightPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <span className={`${sizeClasses.text} text-text-secondary-light dark:text-text-secondary-dark`}>
              {total_sources} sources
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-bias-left-light dark:bg-bias-left-dark rounded-full"></div>
              <span className={`${sizeClasses.text} text-text-secondary-light dark:text-text-secondary-dark`}>
                {left_sources}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-bias-center-light dark:bg-bias-center-dark rounded-full"></div>
              <span className={`${sizeClasses.text} text-text-secondary-light dark:text-text-secondary-dark`}>
                {center_sources}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-bias-right-light dark:bg-bias-right-dark rounded-full"></div>
              <span className={`${sizeClasses.text} text-text-secondary-light dark:text-text-secondary-dark`}>
                {right_sources}
              </span>
            </div>
          </div>
          
          {coverage_percentage && (
            <span className={`${sizeClasses.text} font-medium text-text-primary-light dark:text-text-primary-dark`}>
              {coverage_percentage}% coverage
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverageIndicator;
