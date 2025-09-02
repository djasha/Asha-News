import React, { useState } from 'react';
import { getBiasSegmentData, handleTooltipMouseEnter, handleTooltipMouseLeave, calculateBiasPercentages } from '../../utils/biasUtils';

const BiasBar = ({ 
  leftCount = 0, 
  centerCount = 0, 
  rightCount = 0, 
  size = 'medium',
  showLabels = true,
  showTooltip = true,
  interactive = true,
  className = '' 
}) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const { leftPercentage, centerPercentage, rightPercentage, total } = calculateBiasPercentages(leftCount, centerCount, rightCount);
  
  if (total === 0) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-full h-6 ${className}`}>
        <div className="flex items-center justify-center h-full text-xs text-gray-500 dark:text-gray-400">
          No coverage data
        </div>
      </div>
    );
  }

  const sizeClasses = {
    small: 'h-3',
    medium: 'h-4 md:h-6',
    large: 'h-6 md:h-8'
  };

  const widthClasses = {
    small: 'w-32 sm:w-40',
    medium: 'w-40 sm:w-48 md:w-56',
    large: 'w-48 sm:w-56 md:w-64 lg:w-72'
  };

  const handleMouseEnter = (segment, event) => {
    handleTooltipMouseEnter(segment, event, setHoveredSegment, setTooltipPosition, interactive, showTooltip);
  };

  const handleMouseLeave = () => {
    handleTooltipMouseLeave(setHoveredSegment, interactive);
  };

  return (
    <div className={`space-y-2 ${className}`} role="region" aria-label="Bias distribution visualization">
      {/* Bias distribution bar */}
      <div 
        className={`flex rounded-full overflow-hidden ${sizeClasses[size]} ${widthClasses[size]} bg-gray-200 dark:bg-gray-700 relative`}
        role="img"
        aria-label={`Bias distribution: ${leftCount} left, ${centerCount} center, ${rightCount} right sources`}
      >
        {leftCount > 0 && (
          <div 
            className={`bg-bias-left transition-all duration-300 ease-in-out ${interactive ? 'hover:brightness-110 cursor-pointer' : ''}`}
            style={{ width: `${leftPercentage}%` }}
            onMouseEnter={(e) => handleMouseEnter('left', e)}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={`Left-leaning sources: ${leftCount} (${Math.round(leftPercentage)}%)`}
          />
        )}
        {centerCount > 0 && (
          <div 
            className={`bg-bias-center transition-all duration-300 ease-in-out ${interactive ? 'hover:brightness-110 cursor-pointer' : ''}`}
            style={{ width: `${centerPercentage}%` }}
            onMouseEnter={(e) => handleMouseEnter('center', e)}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={`Center sources: ${centerCount} (${Math.round(centerPercentage)}%)`}
          />
        )}
        {rightCount > 0 && (
          <div 
            className={`bg-bias-right transition-all duration-300 ease-in-out ${interactive ? 'hover:brightness-110 cursor-pointer' : ''}`}
            style={{ width: `${rightPercentage}%` }}
            onMouseEnter={(e) => handleMouseEnter('right', e)}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={`Right-leaning sources: ${rightCount} (${Math.round(rightPercentage)}%)`}
          />
        )}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 gap-1">
          <span className="flex items-center gap-1 min-w-0">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-bias-left rounded-full flex-shrink-0"></div>
            <span className="truncate">Left ({leftCount})</span>
          </span>
          <span className="flex items-center gap-1 min-w-0">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-bias-center rounded-full flex-shrink-0"></div>
            <span className="truncate">Center ({centerCount})</span>
          </span>
          <span className="flex items-center gap-1 min-w-0">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-bias-right rounded-full flex-shrink-0"></div>
            <span className="truncate">Right ({rightCount})</span>
          </span>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && hoveredSegment && (
        <div 
          className="fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: tooltipPosition.x, 
            top: tooltipPosition.y,
            maxWidth: '200px'
          }}
        >
          {(() => {
            const data = getBiasSegmentData(hoveredSegment, leftCount, centerCount, rightCount);
            return data ? (
              <div className="text-center">
                <div className="font-semibold">{data.label}</div>
                <div>{data.count} sources ({Math.round(data.percentage)}%)</div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default BiasBar;
