import React from 'react';
import Carousel from '../UI/Carousel';

const TopicCarousel = ({ articles }) => {
  const topicSections = [
    {
      id: 'politics',
      title: 'Politics',
      icon: '🏛️',
      color: 'from-red-500 to-blue-500',
      articles: articles.filter(a => 
        a.category?.toLowerCase().includes('politics') || 
        a.tags?.some(tag => ['politics', 'government', 'election'].includes(tag.toLowerCase()))
      ).slice(0, 4)
    },
    {
      id: 'technology',
      title: 'Technology',
      icon: '💻',
      color: 'from-blue-500 to-purple-500',
      articles: articles.filter(a => 
        a.category?.toLowerCase().includes('technology') || 
        a.tags?.some(tag => ['tech', 'ai', 'startup', 'innovation'].includes(tag.toLowerCase()))
      ).slice(0, 4)
    },
    {
      id: 'world',
      title: 'World News',
      icon: '🌍',
      color: 'from-green-500 to-blue-500',
      articles: articles.filter(a => 
        a.category?.toLowerCase().includes('world') || 
        a.tags?.some(tag => ['international', 'global', 'foreign'].includes(tag.toLowerCase()))
      ).slice(0, 4)
    },
    {
      id: 'business',
      title: 'Business',
      icon: '📈',
      color: 'from-yellow-500 to-orange-500',
      articles: articles.filter(a => 
        a.category?.toLowerCase().includes('business') || 
        a.tags?.some(tag => ['economy', 'finance', 'market', 'business'].includes(tag.toLowerCase()))
      ).slice(0, 4)
    }
  ];

  const TopicSection = ({ topic }) => (
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl text-text-secondary-light dark:text-text-secondary-dark">{topic.icon}</span>
        <div>
          <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">
            {topic.title}
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {topic.articles.length} stories
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {topic.articles.map((article, index) => (
          <div key={article.id} className="group cursor-pointer">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
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
              <div className="flex-1">
                <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {article.source_name}
                  </span>
                  {article.bias_score && (
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        article.bias_score < -0.3 ? 'bg-blue-500' :
                        article.bias_score > 0.3 ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {Math.abs(article.bias_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 px-4 py-2 bg-surface-elevated-light dark:bg-surface-elevated-dark border border-gray-300 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900 text-text-primary-light dark:text-text-primary-dark rounded-lg text-sm font-medium transition-colors">
        View All {topic.title}
      </button>
    </div>
  );

  return (
    <section className="mb-8">
      <Carousel title="Topics" showDots={false}>
        {topicSections.map((topic) => (
          <TopicSection key={topic.id} topic={topic} />
        ))}
      </Carousel>
    </section>
  );
};

export default TopicCarousel;
