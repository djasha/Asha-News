import React from 'react';

const BiasChart = ({ biasDistribution, size = 'medium', showLabels = true }) => {
  const { left, center, right } = biasDistribution;
  
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-4',
    large: 'h-6'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="w-full">
      {/* Bias Distribution Bar */}
      <div className={`w-full ${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex`}>
        {left > 0 && (
          <div 
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${left}%` }}
            title={`Left: ${left}%`}
          />
        )}
        {center > 0 && (
          <div 
            className="bg-gray-400 h-full transition-all duration-300"
            style={{ width: `${center}%` }}
            title={`Center: ${center}%`}
          />
        )}
        {right > 0 && (
          <div 
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${right}%` }}
            title={`Right: ${right}%`}
          />
        )}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className={`flex justify-between mt-2 ${textSizeClasses[size]} text-text-secondary-light dark:text-text-secondary-dark`}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Left {left}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Center {center}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Right {right}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiasChart;
