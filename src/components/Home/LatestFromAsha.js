import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import directusService from '../../services/directusService';

const LatestFromAsha = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAshaArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await directusService.getArticles({ 
          sortBy: 'date', 
          limit: 6 
        });
        setArticles(data.articles || []);
      } catch (err) {
        console.error('Failed to fetch Asha articles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAshaArticles();
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Latest from Asha News
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Latest from Asha News
          </h2>
        </div>
        <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
          <p>Unable to load latest articles. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Latest from Asha News
          </h2>
        </div>
        <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
          <p>No articles published yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Latest from Asha News
        </h2>
        <Link 
          to="/blog" 
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          View All →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <article 
            key={article.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
          >
            {article.image_url && (
              <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                <img 
                  src={article.image_url} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  Asha News
                </span>
                {article.topic && (
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {article.topic}
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                <Link 
                  to={`/article/${article.id}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {article.title}
                </Link>
              </h3>
              
              {article.summary && (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-3 mb-3">
                  {article.summary}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
                <div className="flex items-center gap-2">
                  {article.author && (
                    <span>By {article.author}</span>
                  )}
                </div>
                <time dateTime={article.publication_date}>
                  {new Date(article.publication_date).toLocaleDateString()}
                </time>
              </div>
              
              {article.bias_score !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      Bias Score:
                    </span>
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      article.bias_score < 0.3 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : article.bias_score > 0.7
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {article.political_bias}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default LatestFromAsha;
