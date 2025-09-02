import React, { useState } from 'react';

const CoverageChart = ({ 
  leftCount = 0, 
  centerCount = 0, 
  rightCount = 0, 
  size = 'medium',
  showLabels = true,
  interactive = true,
  showTooltip = true,
  blindspotRisk = 'low',
  className = '' 
}) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const total = leftCount + centerCount + rightCount;
  
  if (total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          No coverage data
        </div>
      </div>
    );
  }

  const leftPercentage = (leftCount / total) * 100;
  const centerPercentage = (centerCount / total) * 100;
  const rightPercentage = (rightCount / total) * 100;

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20 md:w-24 md:h-24',
    large: 'w-24 h-24 md:w-32 md:h-32'
  };

  const radius = 45;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // Calculate stroke dash arrays for each segment
  const leftStrokeDasharray = `${(leftPercentage / 100) * circumference} ${circumference}`;
  const centerStrokeDasharray = `${(centerPercentage / 100) * circumference} ${circumference}`;
  const rightStrokeDasharray = `${(rightPercentage / 100) * circumference} ${circumference}`;

  // Calculate rotation offsets
  const leftOffset = 0;
  const centerOffset = (leftPercentage / 100) * circumference;
  const rightOffset = ((leftPercentage + centerPercentage) / 100) * circumference;

  const handleMouseEnter = (segment, event) => {
    if (!interactive || !showTooltip) return;
    
    setHoveredSegment(segment);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoveredSegment(null);
  };

  const getSegmentData = (segment) => {
    switch (segment) {
      case 'left':
        return { count: leftCount, percentage: leftPercentage, label: 'Left-leaning sources', color: 'bias-left' };
      case 'center':
        return { count: centerCount, percentage: centerPercentage, label: 'Center sources', color: 'bias-center' };
      case 'right':
        return { count: rightCount, percentage: rightPercentage, label: 'Right-leaning sources', color: 'bias-right' };
      default:
        return null;
    }
  };

  const getBlindspotColor = (risk) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getBlindspotIcon = (risk) => {
    switch (risk) {
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      default:
        return '✅';
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`} role="region" aria-label="Story coverage distribution">
      {/* Donut Chart */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg
          className="transform -rotate-90"
          width="100%"
          height="100%"
          viewBox="0 0 90 90"
          role="img"
          aria-label={`Coverage distribution: ${leftCount} left, ${centerCount} center, ${rightCount} right sources`}
        >
          {/* Background circle */}
          <circle
            cx="45"
            cy="45"
            r={normalizedRadius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Left segment */}
          {leftCount > 0 && (
            <circle
              cx="45"
              cy="45"
              r={normalizedRadius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={leftStrokeDasharray}
              strokeDashoffset={-leftOffset}
              className={`text-bias-left transition-all duration-300 ease-in-out ${interactive ? 'hover:brightness-110 cursor-pointer' : ''}`}
              strokeLinecap="round"
              onMouseEnter={(e) => handleMouseEnter('left', e)}
              onMouseLeave={handleMouseLeave}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : -1}
              aria-label={`Left-leaning sources: ${leftCount} (${Math.round(leftPercentage)}%)`}
            />
          )}
          
          {/* Center segment */}
          {centerCount > 0 && (
            <circle
              cx="45"
              cy="45"
              r={normalizedRadius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={centerStrokeDasharray}
              strokeDashoffset={-centerOffset}
              className={`text-bias-center transition-all duration-300 ease-in-out ${interactive ? 'hover:brightness-110 cursor-pointer' : ''}`}
              strokeLinecap="round"
              onMouseEnter={(e) => handleMouseEnter('center', e)}
              onMouseLeave={handleMouseLeave}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : -1}
              aria-label={`Center sources: ${centerCount} (${Math.round(centerPercentage)}%)`}
            />
          )}
          
          {/* Right segment */}
          {rightCount > 0 && (
            <circle
              cx="45"
              cy="45"
              r={normalizedRadius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={rightStrokeDasharray}
              strokeDashoffset={-rightOffset}
              className={`text-bias-right transition-all duration-300 ease-in-out ${interactive ? 'hover:brightness-110 cursor-pointer' : ''}`}
              strokeLinecap="round"
              onMouseEnter={(e) => handleMouseEnter('right', e)}
              onMouseLeave={handleMouseLeave}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : -1}
              aria-label={`Right-leaning sources: ${rightCount} (${Math.round(rightPercentage)}%)`}
            />
          )}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-gray-900 dark:text-gray-100">
              {total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              sources
            </div>
          </div>
        </div>
      </div>

      {/* Blindspot Risk Indicator */}
      <div className={`flex items-center gap-1 text-xs ${getBlindspotColor(blindspotRisk)}`}>
        <span aria-hidden="true">{getBlindspotIcon(blindspotRisk)}</span>
        <span className="font-medium">
          {blindspotRisk === 'high' ? 'High blindspot risk' :
           blindspotRisk === 'medium' ? 'Medium blindspot risk' :
           'Balanced coverage'}
        </span>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-bias-left rounded-full flex-shrink-0"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Left ({leftCount})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-bias-center rounded-full flex-shrink-0"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Center ({centerCount})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-bias-right rounded-full flex-shrink-0"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Right ({rightCount})
            </span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && hoveredSegment && (
        <div 
          className="fixed z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: tooltipPosition.x, 
            top: tooltipPosition.y,
            maxWidth: '200px'
          }}
        >
          {(() => {
            const data = getSegmentData(hoveredSegment);
            return data ? (
              <div className="text-center">
                <div className="font-semibold">{data.label}</div>
                <div>{data.count} sources ({Math.round(data.percentage)}%)</div>
                <div className="text-gray-300 mt-1">
                  {data.percentage > 60 ? 'Dominant perspective' :
                   data.percentage > 30 ? 'Significant coverage' :
                   'Limited coverage'}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Screen reader description */}
      <div className="sr-only">
        Coverage chart showing {total} total sources: {leftCount} left-leaning ({Math.round(leftPercentage)}%), {centerCount} center ({Math.round(centerPercentage)}%), and {rightCount} right-leaning ({Math.round(rightPercentage)}%). Blindspot risk is {blindspotRisk}.
      </div>
    </div>
  );
};

export default CoverageChart;
