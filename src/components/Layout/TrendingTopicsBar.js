import React from "react";
import { useNavigate } from "react-router-dom";

const TrendingTopicsBar = () => {
  const navigate = useNavigate();

  const trendingTopics = [
    { name: "Israel-Gaza", slug: "israel-gaza", icon: "🇮🇱" },
    { name: "Donald Trump", slug: "donald-trump", icon: "🇺🇸" },
    { name: "Artificial Intelligence", slug: "artificial-intelligence", icon: "🤖" },
    { name: "Social Media", slug: "social-media", icon: "📱" },
    { name: "Xi Jinping", slug: "xi-jinping", icon: "🇨🇳" },
    { name: "NFL", slug: "nfl", icon: "🏈" },
    { name: "Education", slug: "education", icon: "🎓" },
    { name: "Stock Markets", slug: "stock-markets", icon: "📈" },
    { name: "Vladimir Putin", slug: "vladimir-putin", icon: "🇷🇺" },
    { name: "US Economy", slug: "us-economy", icon: "💰" },
    { name: "Apple", slug: "apple", icon: "🍎" },
    { name: "NATO", slug: "nato", icon: "🛡️" },
  ];

  const handleTopicClick = (slug) => {
    navigate(`/topic/${slug}`);
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark py-2 overflow-hidden">
      <div className="flex animate-scroll">
        {/* First set of topics */}
        <div className="flex items-center space-x-1 whitespace-nowrap">
          {trendingTopics.map((topic) => (
            <button
              key={topic.slug}
              onClick={() => handleTopicClick(topic.slug)}
              className="flex items-center gap-2 px-3 py-1 bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900 text-text-primary-light dark:text-text-primary-dark rounded-full text-sm font-medium transition-colors duration-200 mx-1 flex-shrink-0"
            >
              <span className="text-xs">{topic.icon}</span>
              <span>{topic.name}</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                +
              </span>
            </button>
          ))}
        </div>
        
        {/* Duplicate set for seamless scrolling */}
        <div className="flex items-center space-x-1 whitespace-nowrap ml-1">
          {trendingTopics.map((topic) => (
            <button
              key={`${topic.slug}-duplicate`}
              onClick={() => handleTopicClick(topic.slug)}
              className="flex items-center gap-2 px-3 py-1 bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900 text-text-primary-light dark:text-text-primary-dark rounded-full text-sm font-medium transition-colors duration-200 mx-1 flex-shrink-0"
            >
              <span className="text-xs">{topic.icon}</span>
              <span>{topic.name}</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                +
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingTopicsBar;
