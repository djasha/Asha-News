import React from 'react';

const CoverageChart = ({ 
  leftCount = 5, 
  centerCount = 8, 
  rightCount = 3, 
  size = 'medium',
  showLabels = true,
  className = '' 
}) => {
  const total = leftCount + centerCount + rightCount;
  
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  // Calculate percentages for the donut chart
  const leftPercentage = (leftCount / total) * 100;
  const centerPercentage = (centerCount / total) * 100;
  const rightPercentage = (rightCount / total) * 100;

  // SVG circle parameters
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash arrays for each segment
  const leftDash = (leftPercentage / 100) * circumference;
  const centerDash = (centerPercentage / 100) * circumference;
  const rightDash = (rightPercentage / 100) * circumference;

  return (
    <div className={`coverage-chart-container ${className}`}>
      <div className="flex flex-col items-center">
        <div className={`relative ${sizeClasses[size]}`}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-200 dark:text-slate-700"
            />
            
            {/* Left segment */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="var(--color-bias-left)"
              strokeWidth="8"
              strokeDasharray={`${leftDash} ${circumference}`}
              strokeDashoffset="0"
              className="transition-all duration-500"
            />
            
            {/* Center segment */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="var(--color-bias-center)"
              strokeWidth="8"
              strokeDasharray={`${centerDash} ${circumference}`}
              strokeDashoffset={-leftDash}
              className="transition-all duration-500"
            />
            
            {/* Right segment */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="var(--color-bias-right)"
              strokeWidth="8"
              strokeDasharray={`${rightDash} ${circumference}`}
              strokeDashoffset={-(leftDash + centerDash)}
              className="transition-all duration-500"
            />
          </svg>
          
          {/* Center count */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold text-text-primary-light dark:text-text-primary-dark ${textSizeClasses[size]}`}>
              {total}
            </span>
          </div>
        </div>
        
        {showLabels && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-bias-left)' }}></div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">{leftCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-bias-center)' }}></div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">{centerCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-bias-right)' }}></div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">{rightCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverageChart;
