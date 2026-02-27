import React from 'react';
import { useNavigate } from 'react-router-dom';
import BiasIndicator from '../BiasVisualization/BiasIndicator';

const HeroSection = ({ article }) => {
  const navigate = useNavigate();

  if (!article || !article.image_url) {
    return null;
  }

  const handleClick = () => {
    navigate(`/article/${article.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const estimateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(" ").length;
    return Math.ceil(words / wordsPerMinute);
  };

  return (
    <div 
      className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
        {/* Bias Indicator - Top Right */}
        <div className="absolute top-4 right-4">
          <BiasIndicator
            bias={article.political_bias}
            confidence={article.confidence_score}
            size="small"
            className="bg-white/10 backdrop-blur-sm"
          />
        </div>

        {/* Topic Tag */}
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
            {article.topic}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight mb-3 lg:mb-4">
          {article.title}
        </h1>

        {/* Summary */}
        <p className="text-gray-200 text-sm lg:text-base leading-relaxed mb-4 line-clamp-2 lg:line-clamp-3">
          {article.summary}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-gray-300 text-xs lg:text-sm">
            <span>{article.source_name || 'Unknown Source'}</span>
            <span>•</span>
            <span>{formatDate(article.publication_date)}</span>
            <span>•</span>
            <span>{estimateReadingTime(article.summary)} min read</span>
            <span>•</span>
            <span>{Math.round(article.factual_quality * 100)}% factual</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
