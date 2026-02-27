import React from 'react';
import './BiasBar.css';

const BiasBar = ({ 
  biasScore = 0.5, 
  biasDirection = 'center', 
  confidence = 0.8,
  showLabels = true,
  showTooltip = true,
  size = 'medium',
  className = ''
}) => {
  // Convert bias score (0-1) to position (-100 to +100)
  const position = (biasScore - 0.5) * 200;
  
  // Determine color based on bias direction and score
  const getBiasColor = () => {
    if (biasDirection === 'left' || biasScore < 0.3) return '#3B82F6'; // Blue
    if (biasDirection === 'right' || biasScore > 0.7) return '#EF4444'; // Red
    return '#10B981'; // Green for center
  };

  // Get bias label
  const getBiasLabel = () => {
    if (biasScore < 0.2) return 'Far Left';
    if (biasScore < 0.4) return 'Left';
    if (biasScore < 0.6) return 'Center';
    if (biasScore < 0.8) return 'Right';
    return 'Far Right';
  };

  // Get confidence indicator
  const getConfidenceLevel = () => {
    if (confidence < 0.3) return 'Low';
    if (confidence < 0.7) return 'Medium';
    return 'High';
  };

  const sizeClasses = {
    small: 'bias-bar--small',
    medium: 'bias-bar--medium',
    large: 'bias-bar--large'
  };

  return (
    <div className={`bias-bar ${sizeClasses[size]} ${className}`}>
      {showLabels && (
        <div className="bias-bar__header">
          <span className="bias-bar__label">Political Bias</span>
          <span className="bias-bar__value">{getBiasLabel()}</span>
        </div>
      )}
      
      <div className="bias-bar__container">
        {/* Background track */}
        <div className="bias-bar__track">
          {/* Left section */}
          <div className="bias-bar__section bias-bar__section--left">
            <span className="bias-bar__section-label">Left</span>
          </div>
          
          {/* Center section */}
          <div className="bias-bar__section bias-bar__section--center">
            <span className="bias-bar__section-label">Center</span>
          </div>
          
          {/* Right section */}
          <div className="bias-bar__section bias-bar__section--right">
            <span className="bias-bar__section-label">Right</span>
          </div>
        </div>
        
        {/* Bias indicator */}
        <div 
          className="bias-bar__indicator"
          style={{
            left: `${50 + position}%`,
            backgroundColor: getBiasColor(),
            opacity: confidence
          }}
          title={showTooltip ? `Bias: ${getBiasLabel()}, Confidence: ${getConfidenceLevel()} (${Math.round(confidence * 100)}%)` : ''}
        >
          <div className="bias-bar__indicator-dot"></div>
        </div>
        
        {/* Center line */}
        <div className="bias-bar__center-line"></div>
      </div>
      
      {showLabels && (
        <div className="bias-bar__footer">
          <div className="bias-bar__confidence">
            <span className="bias-bar__confidence-label">Confidence:</span>
            <span className={`bias-bar__confidence-value bias-bar__confidence-value--${getConfidenceLevel().toLowerCase()}`}>
              {getConfidenceLevel()} ({Math.round(confidence * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiasBar;
