import React from "react";
import { useNavigate } from "react-router-dom";

const SimpleArticleCard = ({ article }) => {
  const navigate = useNavigate();
  if (!article) {
    return (
      <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500">Article not available</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  const handleClick = () => {
    // Always navigate to article detail page using article ID
    if (article.id) {
      navigate(`/article/${article.id}`);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {article.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title || "Article image"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {article.title || "Untitled Article"}
        </h3>
        
        {article.summary && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
            {article.summary}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(article.publication_date)}</span>
          <span>{article.source_name || "Unknown Source"}</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleArticleCard;
