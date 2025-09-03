import React, { useEffect } from 'react';

const ImageBoard = () => {
  useEffect(() => {
    // Load the RSS app widget script
    const script = document.createElement('script');
    script.src = 'https://widget.rss.app/v1/imageboard.js';
    script.type = 'text/javascript';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Visual News Feed
          </h2>
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Stories at a glance
          </span>
        </div>
      </div>

      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <rssapp-imageboard id="_YyjtMQnY9aZQGeEn"></rssapp-imageboard>
      </div>
    </section>
  );
};

export default ImageBoard;
