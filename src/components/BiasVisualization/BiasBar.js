import React from 'react';

const BiasBar = ({ 
  leftPercentage = 30, 
  centerPercentage = 40, 
  rightPercentage = 30, 
  size = 'medium',
  showLabels = true,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const widthClasses = {
    small: 'w-40 sm:w-48 md:w-56',
    medium: 'w-48 sm:w-56 md:w-64',
    large: 'w-56 sm:w-64 md:w-72'
  };

  return (
    <div className={`bias-bar-container ${className}`}>
      {showLabels && (
        <div className="flex justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
          <span>Left {leftPercentage}%</span>
          <span>Center {centerPercentage}%</span>
          <span>Right {rightPercentage}%</span>
        </div>
      )}
      
      <div className={`bias-bar ${sizeClasses[size]} ${widthClasses[size]} relative overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700`}>
        {/* Left segment */}
        <div 
          className="absolute left-0 top-0 h-full transition-all duration-300"
          style={{ 
            width: `${leftPercentage}%`,
            backgroundColor: 'var(--color-bias-left)'
          }}
          aria-label={`Left bias: ${leftPercentage}%`}
        />
        
        {/* Center segment */}
        <div 
          className="absolute top-0 h-full transition-all duration-300"
          style={{ 
            left: `${leftPercentage}%`,
            width: `${centerPercentage}%`,
            backgroundColor: 'var(--color-bias-center)'
          }}
          aria-label={`Center bias: ${centerPercentage}%`}
        />
        
        {/* Right segment */}
        <div 
          className="absolute right-0 top-0 h-full transition-all duration-300"
          style={{ 
            width: `${rightPercentage}%`,
            backgroundColor: 'var(--color-bias-right)'
          }}
          aria-label={`Right bias: ${rightPercentage}%`}
        />
      </div>
      
      {showLabels && (
        <div className="flex justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
          <span className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: 'var(--color-bias-left)' }}></div>
            Left
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: 'var(--color-bias-center)' }}></div>
            Center
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: 'var(--color-bias-right)' }}></div>
            Right
          </span>
        </div>
      )}
    </div>
  );
};

export default BiasBar;
