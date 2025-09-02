import React, { useState, memo } from 'react';

const BiasIndicator = ({ 
  bias = 'center', 
  confidence = 0.8, 
  size = 'medium',
  showConfidence = true,
  showTooltip = false,
  interactive = false,
  abbreviated = false,
  className = '' 
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);

  const getBiasColor = (biasType) => {
    switch (biasType) {
      case 'left':
        return 'text-white bg-bias-left border-bias-left';
      case 'right':
        return 'text-white bg-bias-right border-bias-right';
      default:
        return 'text-white bg-bias-center border-bias-center';
    }
  };

  const getBiasShape = (biasType) => {
    switch (biasType) {
      case 'left':
        return '◀'; // Triangle pointing left
      case 'right':
        return '▶'; // Triangle pointing right
      default:
        return '●'; // Circle for center
    }
  };

  const getBiasLabel = (biasType, abbreviated = false) => {
    if (abbreviated) {
      switch (biasType) {
        case 'left':
          return 'L';
        case 'right':
          return 'R';
        default:
          return 'C';
      }
    }
    
    switch (biasType) {
      case 'left':
        return 'Left-leaning';
      case 'right':
        return 'Right-leaning';
      default:
        return 'Center';
    }
  };

  const sizeClasses = {
    small: 'w-4 h-4 text-xs',
    medium: 'w-5 h-5 md:w-6 md:h-6 text-xs md:text-sm',
    large: 'w-6 h-6 md:w-8 md:h-8 text-sm md:text-base'
  };

  const confidenceColor = confidence >= 0.8 ? 'text-green-600 dark:text-green-400' : 
                          confidence >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-red-600 dark:text-red-400';

  const confidenceLabel = confidence >= 0.8 ? 'High confidence' :
                         confidence >= 0.6 ? 'Medium confidence' :
                         'Low confidence';

  const handleMouseEnter = () => {
    if (interactive && showTooltip) {
      setShowTooltipState(true);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setShowTooltipState(false);
    }
  };

  const handleKeyDown = (event) => {
    if (interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setShowTooltipState(!showTooltipState);
    }
  };

  return (
    <div className={`flex items-center gap-2 relative ${className}`}>
      {/* Bias indicator circle */}
      <div 
        className={`
          ${sizeClasses[size]} 
          ${getBiasColor(bias)} 
          rounded-full 
          border-2
          flex items-center justify-center 
          font-bold
          shadow-sm
          transition-all duration-200 ease-in-out
          ${interactive ? 'hover:scale-110 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50' : ''}
        `}
        role={interactive ? 'button' : 'img'}
        tabIndex={interactive ? 0 : -1}
        aria-label={`${getBiasLabel(bias)} bias with ${Math.round(confidence * 100)}% confidence`}
        title={showTooltip ? undefined : `Bias: ${getBiasLabel(bias)} (${Math.round(confidence * 100)}% confidence)`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
      >
        <span aria-hidden="true">{getBiasShape(bias)}</span>
      </div>

      {/* Confidence indicator */}
      {showConfidence && (
        <div className="flex flex-col items-start min-w-0">
          <span className={`text-xs font-medium ${confidenceColor} truncate`}>
            {Math.round(confidence * 100)}%
          </span>
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark capitalize truncate">
            {getBiasLabel(bias, abbreviated)}
          </span>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (showTooltipState || !interactive) && (
        <div className="absolute z-50 px-3 py-2 text-xs font-medium text-text-primary-dark bg-surface-dark rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 left-1/2 -top-12 min-w-max">
          <div className="text-center">
            <div className="font-semibold">{getBiasLabel(bias)}</div>
            <div className="text-text-secondary-dark">{confidenceLabel}</div>
            <div className="text-text-secondary-dark">{Math.round(confidence * 100)}% confidence</div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-dark"></div>
        </div>
      )}

      {/* Screen reader only detailed description */}
      <div className="sr-only">
        Political bias indicator showing {getBiasLabel(bias)} orientation with {confidenceLabel} at {Math.round(confidence * 100)} percent accuracy.
      </div>
    </div>
  );
};

export default memo(BiasIndicator);
