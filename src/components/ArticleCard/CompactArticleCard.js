import React from 'react';

const CompactArticleCard = ({ article, showImage = true, showBias = true }) => {
  const getBiasColor = (score) => {
    if (!score) return 'bg-gray-500';
    if (score < -0.3) return 'bg-blue-500';
    if (score > 0.3) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getBiasLabel = (score) => {
    if (!score) return 'Neutral';
    if (score < -0.3) return 'Left';
    if (score > 0.3) return 'Right';
    return 'Center';
  };

  return (
    <div className="flex gap-3 p-3 bg-surface-light dark:bg-surface-dark hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer">
      {showImage && (
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
          {article.image_url ? (
            <img 
              src={article.image_url} 
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              📰
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2 mb-1">
          {article.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
          <span className="truncate">{article.source_name}</span>
          
          {showBias && article.bias_score && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <div className={`w-2 h-2 rounded-full ${getBiasColor(article.bias_score)}`}></div>
              <span>{getBiasLabel(article.bias_score)}</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
          {new Date(article.publication_date).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default CompactArticleCard;
