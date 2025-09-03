import React from 'react';
import { useNavigate } from 'react-router-dom';

const CompactArticleCard = ({ article, showImage = false, showBias = true, onClick }) => {
  const navigate = useNavigate();

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'bg-blue-500';
      case 'right': return 'bg-red-500';
      case 'center': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getBiasLabel = (bias) => {
    switch (bias) {
      case 'left': return 'Left';
      case 'right': return 'Right';
      case 'center': return 'Center';
      default: return 'Neutral';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(article);
    } else {
      navigate(`/article/${encodeURIComponent(article.url)}`, { 
        state: { article } 
      });
    }
  };

  return (
    <div 
      className="flex gap-3 p-4 bg-surface-light dark:bg-surface-dark hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      {showImage && article.image_url && (
        <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
          <img 
            src={article.image_url} 
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.parentElement.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
          {article.title}
        </h3>
        
        {article.summary && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2 mb-3 leading-relaxed">
            {article.summary}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
          <div className="flex items-center gap-2">
            <span className="font-medium">{article.source_name}</span>
            <span>•</span>
            <span>{new Date(article.publication_date).toLocaleDateString()}</span>
          </div>
          
          {showBias && article.political_bias && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${getBiasColor(article.political_bias)}`}></div>
              <span className="font-medium">{getBiasLabel(article.political_bias)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactArticleCard;
