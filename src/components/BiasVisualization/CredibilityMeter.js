import React from 'react';

const CredibilityMeter = ({ 
  factualAccuracy = 0.8, 
  biasTransparency = 0.7, 
  size = 'medium',
  showLabels = true,
  className = '' 
}) => {
  // Convert to 5-star scale
  const accuracyStars = Math.round(factualAccuracy * 5);
  const transparencyStars = Math.round(biasTransparency * 5);
  const overallRating = Math.round(((factualAccuracy + biasTransparency) / 2) * 5);

  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const starSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const renderStars = (rating, maxStars = 5) => {
    const stars = [];
    for (let i = 1; i <= maxStars; i++) {
      const isFilled = i <= rating;
      
      stars.push(
        <span
          key={i}
          className={`inline-block ${starSizes[size]} ${
            isFilled 
              ? 'text-yellow-400' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
          aria-hidden="true"
        >
          {isFilled ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  return (
    <div className={`credibility-meter space-y-2 ${className}`}>
      {/* Overall Rating */}
      <div className="flex items-center justify-between">
        <span className={`font-medium text-gray-900 dark:text-gray-100 ${sizeClasses[size]}`}>
          Overall Credibility
        </span>
        <div className="flex items-center space-x-1">
          {renderStars(overallRating)}
          <span className={`ml-2 font-medium text-gray-700 dark:text-gray-300 ${sizeClasses[size]}`}>
            {overallRating}/5
          </span>
        </div>
      </div>

      {showLabels && (
        <>
          {/* Factual Accuracy */}
          <div className="flex items-center justify-between">
            <span className={`text-gray-600 dark:text-gray-400 ${sizeClasses[size]}`}>
              Factual Accuracy
            </span>
            <div className="flex items-center space-x-1">
              {renderStars(accuracyStars)}
              <span className={`ml-2 text-gray-600 dark:text-gray-400 ${sizeClasses[size]}`}>
                {accuracyStars}/5
              </span>
            </div>
          </div>

          {/* Bias Transparency */}
          <div className="flex items-center justify-between">
            <span className={`text-gray-600 dark:text-gray-400 ${sizeClasses[size]}`}>
              Bias Transparency
            </span>
            <div className="flex items-center space-x-1">
              {renderStars(transparencyStars)}
              <span className={`ml-2 text-gray-600 dark:text-gray-400 ${sizeClasses[size]}`}>
                {transparencyStars}/5
              </span>
            </div>
          </div>
        </>
      )}

      {/* Accessibility label */}
      <div className="sr-only">
        Credibility rating: {overallRating} out of 5 stars. 
        Factual accuracy: {accuracyStars} out of 5 stars. 
        Bias transparency: {transparencyStars} out of 5 stars.
      </div>
    </div>
  );
};

export default CredibilityMeter;
