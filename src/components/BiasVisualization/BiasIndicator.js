import React from 'react';

const BiasIndicator = ({ 
  bias = 'center', 
  confidence = 0.8, 
  size = 'medium',
  showConfidence = true,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 text-xs',
    medium: 'w-6 h-6 text-sm',
    large: 'w-8 h-8 text-base'
  };

  const getBiasColor = (biasType) => {
    switch (biasType) {
      case 'left':
        return 'var(--color-bias-left)';
      case 'right':
        return 'var(--color-bias-right)';
      case 'mixed':
        return 'var(--color-bias-mixed)';
      default:
        return 'var(--color-bias-center)';
    }
  };

  const getBiasShape = (biasType) => {
    switch (biasType) {
      case 'left':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2L2 12l10 10V2z" />
          </svg>
        );
      case 'right':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2v20l10-10L12 2z" />
          </svg>
        );
      case 'mixed':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const getBiasLabel = (biasType) => {
    switch (biasType) {
      case 'left':
        return 'Left Bias';
      case 'right':
        return 'Right Bias';
      case 'mixed':
        return 'Mixed Coverage';
      default:
        return 'Center/Neutral';
    }
  };

  return (
    <div className={`bias-indicator-container inline-flex items-center space-x-2 ${className}`}>
      <div 
        className={`bias-indicator ${sizeClasses[size]} flex items-center justify-center rounded-full text-white`}
        style={{ backgroundColor: getBiasColor(bias) }}
        aria-label={`${getBiasLabel(bias)}${showConfidence ? ` with ${Math.round(confidence * 100)}% confidence` : ''}`}
        title={`${getBiasLabel(bias)}${showConfidence ? ` (${Math.round(confidence * 100)}% confidence)` : ''}`}
      >
        {getBiasShape(bias)}
      </div>
      
      {showConfidence && (
        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  );
};

export default BiasIndicator;
