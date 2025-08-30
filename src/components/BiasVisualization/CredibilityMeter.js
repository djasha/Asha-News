import React from 'react';

const CredibilityMeter = ({ 
  factualScore = 4.2, 
  biasScore = 3.8, 
  maxScore = 5,
  size = 'medium',
  showLabels = true,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const starSizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const renderStars = (score, color) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    
    for (let i = 0; i < maxScore; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <svg key={i} className={`${starSizeClasses[size]} ${color}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className={`relative ${starSizeClasses[size]}`}>
            <svg className={`absolute ${starSizeClasses[size]} text-slate-300 dark:text-slate-600`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <svg className={`${starSizeClasses[size]} ${color}`} fill="currentColor" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <svg key={i} className={`${starSizeClasses[size]} text-slate-300 dark:text-slate-600`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    
    return stars;
  };

  return (
    <div className={`credibility-meter ${className}`}>
      <div className="space-y-2">
        {/* Factual Accuracy */}
        <div className="flex items-center justify-between">
          {showLabels && (
            <span className={`text-text-secondary-light dark:text-text-secondary-dark font-medium ${sizeClasses[size]}`}>
              Factual Accuracy
            </span>
          )}
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-0.5">
              {renderStars(factualScore, 'text-emerald-500')}
            </div>
            <span className={`ml-2 text-text-primary-light dark:text-text-primary-dark font-semibold ${sizeClasses[size]}`}>
              {factualScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Bias Transparency */}
        <div className="flex items-center justify-between">
          {showLabels && (
            <span className={`text-text-secondary-light dark:text-text-secondary-dark font-medium ${sizeClasses[size]}`}>
              Bias Transparency
            </span>
          )}
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-0.5">
              {renderStars(biasScore, 'text-blue-500')}
            </div>
            <span className={`ml-2 text-text-primary-light dark:text-text-primary-dark font-semibold ${sizeClasses[size]}`}>
              {biasScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Overall Score */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            {showLabels && (
              <span className={`text-text-primary-light dark:text-text-primary-dark font-semibold ${sizeClasses[size]}`}>
                Overall Score
              </span>
            )}
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-0.5">
                {renderStars((factualScore + biasScore) / 2, 'text-primary-600 dark:text-primary-500')}
              </div>
              <span className={`ml-2 text-text-primary-light dark:text-text-primary-dark font-bold ${sizeClasses[size]}`}>
                {((factualScore + biasScore) / 2).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredibilityMeter;
