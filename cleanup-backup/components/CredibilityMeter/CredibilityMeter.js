import React from 'react';
import './CredibilityMeter.css';

const CredibilityMeter = ({ 
  credibilityScore = 0.8,
  factualAccuracy = 0.85,
  sourceQuality = 0.75,
  evidenceStrength = 0.7,
  showDetails = true,
  showTooltip = true,
  size = 'medium',
  className = ''
}) => {
  // Calculate overall score (0-100)
  const overallScore = Math.round(credibilityScore * 100);
  
  // Get credibility level and color
  const getCredibilityLevel = () => {
    if (credibilityScore >= 0.8) return { level: 'High', color: '#10B981', bgColor: '#D1FAE5' };
    if (credibilityScore >= 0.6) return { level: 'Medium', color: '#F59E0B', bgColor: '#FEF3C7' };
    if (credibilityScore >= 0.4) return { level: 'Low', color: '#EF4444', bgColor: '#FEE2E2' };
    return { level: 'Very Low', color: '#DC2626', bgColor: '#FEE2E2' };
  };

  const { level, color, bgColor } = getCredibilityLevel();

  // Calculate arc path for circular progress
  const radius = size === 'small' ? 30 : size === 'large' ? 50 : 40;
  const strokeWidth = size === 'small' ? 4 : size === 'large' ? 8 : 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${credibilityScore * circumference} ${circumference}`;

  const sizeClasses = {
    small: 'credibility-meter--small',
    medium: 'credibility-meter--medium',
    large: 'credibility-meter--large'
  };

  const detailMetrics = [
    { label: 'Factual Accuracy', value: factualAccuracy, icon: '✓' },
    { label: 'Source Quality', value: sourceQuality, icon: '🏛️' },
    { label: 'Evidence Strength', value: evidenceStrength, icon: '📊' }
  ];

  const formatPercentage = (value) => Math.round(value * 100);

  return (
    <div className={`credibility-meter ${sizeClasses[size]} ${className}`}>
      <div className="credibility-meter__main">
        {/* Circular Progress Indicator */}
        <div className="credibility-meter__circle-container">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="credibility-meter__circle"
          >
            {/* Background circle */}
            <circle
              stroke="#E5E7EB"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress circle */}
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={0}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="credibility-meter__progress"
              transform={`rotate(-90 ${radius} ${radius})`}
            />
          </svg>
          
          {/* Center content */}
          <div className="credibility-meter__center">
            <div className="credibility-meter__score" style={{ color }}>
              {overallScore}%
            </div>
            <div className="credibility-meter__level" style={{ color }}>
              {level}
            </div>
          </div>
        </div>

        {/* Level indicator */}
        <div 
          className="credibility-meter__badge"
          style={{ backgroundColor: bgColor, color }}
          title={showTooltip ? `Credibility: ${level} (${overallScore}%)` : ''}
        >
          <span className="credibility-meter__badge-text">
            {level} Credibility
          </span>
        </div>
      </div>

      {/* Detailed metrics */}
      {showDetails && (
        <div className="credibility-meter__details">
          <div className="credibility-meter__details-header">
            <span className="credibility-meter__details-title">Breakdown</span>
          </div>
          
          <div className="credibility-meter__metrics">
            {detailMetrics.map((metric, index) => (
              <div key={index} className="credibility-meter__metric">
                <div className="credibility-meter__metric-header">
                  <span className="credibility-meter__metric-icon">{metric.icon}</span>
                  <span className="credibility-meter__metric-label">{metric.label}</span>
                  <span className="credibility-meter__metric-value">
                    {formatPercentage(metric.value)}%
                  </span>
                </div>
                
                <div className="credibility-meter__metric-bar">
                  <div className="credibility-meter__metric-track">
                    <div 
                      className="credibility-meter__metric-fill"
                      style={{ 
                        width: `${metric.value * 100}%`,
                        backgroundColor: metric.value >= 0.7 ? '#10B981' : 
                                       metric.value >= 0.5 ? '#F59E0B' : '#EF4444'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CredibilityMeter;
