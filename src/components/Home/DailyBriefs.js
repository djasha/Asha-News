import React from 'react';
import Carousel from '../UI/Carousel';

const DailyBriefs = ({ articles }) => {
  const briefTypes = [
    {
      id: 'morning',
      title: 'Morning Brief',
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      time: '6:00 AM',
      description: 'Start your day informed',
      articles: articles.slice(0, 3)
    },
    {
      id: 'midday',
      title: 'Midday Update',
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      time: '12:00 PM',
      description: 'Latest developments',
      articles: articles.slice(3, 6)
    },
    {
      id: 'evening',
      title: 'Evening Wrap',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      time: '6:00 PM',
      description: 'Today\'s key stories',
      articles: articles.slice(6, 9)
    }
  ];

  const BriefCard = ({ brief }) => (
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-surface-light dark:bg-surface-dark rounded-lg flex items-center justify-center">
          {brief.icon}
        </div>
        <div>
          <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
            {brief.title}
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {brief.time} • {brief.description}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {brief.articles.map((article, index) => (
          <div key={article.id} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-primary-600 mt-2 flex-shrink-0"></div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2">
                {article.title}
              </h4>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {article.source_name}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Read Full Brief →
        </button>
      </div>
    </div>
  );

  return (
    <section className="mb-8">
      <Carousel title="" autoPlay={true} interval={8000} showDots={true}>
        {briefTypes.map((brief) => (
          <BriefCard key={brief.id} brief={brief} />
        ))}
      </Carousel>
    </section>
  );
};

export default DailyBriefs;
