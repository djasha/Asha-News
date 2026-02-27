import React from 'react';

const AIAnalysisCard = ({ analysis, className = '' }) => {
  if (!analysis) {
    return null;
  }

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'right': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'center': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getToneColor = (tone) => {
    switch (tone) {
      case 'positive': return 'text-emerald-600 dark:text-emerald-400';
      case 'negative': return 'text-orange-600 dark:text-orange-400';
      case 'neutral': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatPercentage = (value) => Math.round(value * 100);

  return (
    <div className={`bg-surface-light dark:bg-surface-dark border border-primary-200 dark:border-primary-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
          AI Bias Analysis
        </h3>
        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-primary-100 dark:bg-primary-800 px-2 py-1 rounded-full">
          GPT-4
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Political Bias */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Political Bias
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBiasColor(analysis.political_bias)}`}>
              {analysis.political_bias.charAt(0).toUpperCase() + analysis.political_bias.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formatPercentage(analysis.confidence)}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatPercentage(analysis.confidence)}%
            </span>
          </div>
        </div>

        {/* Emotional Tone */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Emotional Tone
            </span>
            <span className={`text-xs font-medium ${getToneColor(analysis.emotional_tone)}`}>
              {analysis.emotional_tone.charAt(0).toUpperCase() + analysis.emotional_tone.slice(1)}
            </span>
          </div>
        </div>

        {/* Factual Ratio */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Factual Content
            </span>
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatPercentage(analysis.factual_ratio)}% factual
            </span>
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${formatPercentage(analysis.factual_ratio)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Explanation */}
      {analysis.explanation && (
        <div className="pt-3 border-t border-primary-200 dark:border-primary-700">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
            <span className="font-medium">Analysis: </span>
            {analysis.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisCard;
