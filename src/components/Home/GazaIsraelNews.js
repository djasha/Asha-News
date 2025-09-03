import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rssService from '../../services/rssService';

const GazaIsraelNews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGazaIsraelNews();
  }, []);

  const fetchGazaIsraelNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await rssService.getArticles({
        sortBy: 'date',
        limit: 100
      });

      // Filter for Gaza/Israel related articles
      const gazaIsraelArticles = data.articles.filter(article => {
        const searchText = `${article.title} ${article.summary}`.toLowerCase();
        return searchText.includes('gaza') || 
               searchText.includes('israel') || 
               searchText.includes('palestine') ||
               searchText.includes('hamas') ||
               searchText.includes('idf') ||
               searchText.includes('west bank') ||
               searchText.includes('jerusalem');
      });

      // Get latest 6 articles
      setArticles(gazaIsraelArticles.slice(0, 6));
    } catch (err) {
      setError(err.message);
      console.error('Failed to load Gaza/Israel news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article) => {
    navigate(`/article/${encodeURIComponent(article.url)}`, { 
      state: { article } 
    });
  };

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'bg-blue-500';
      case 'right': return 'bg-red-500';
      case 'center': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getBiasPercentage = (bias) => {
    const biasCount = articles.filter(a => a.political_bias === bias).length;
    return articles.length > 0 ? Math.round((biasCount / articles.length) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Israel-Gaza News
          </h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-text-secondary-light dark:text-text-secondary-dark">
              Follow
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-text-secondary-light dark:text-text-secondary-dark">
              Read More
            </button>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-text-primary-light dark:text-text-primary-dark mb-2">Failed to load Israel-Gaza news</p>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Israel-Gaza News
          </h2>
        </div>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
          No Israel-Gaza news articles found at the moment.
        </p>
      </div>
    );
  }

  const leftPercentage = getBiasPercentage('left');
  const centerPercentage = getBiasPercentage('center');
  const rightPercentage = getBiasPercentage('right');

  return (
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Israel-Gaza News
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Follow
          </button>
          <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Read More
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Main Article */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Latest Israel-Gaza News
          </h3>
          
          {articles[0] && (
            <div 
              className="cursor-pointer group"
              onClick={() => handleArticleClick(articles[0])}
            >
              <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {/* Always show an image - either from article or fallback */}
                <img 
                  src={articles[0].image_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center'}
                  alt={articles[0].title}
                  className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // If primary image fails, try fallback
                    if (e.target.src !== 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center') {
                      e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center';
                    } else {
                      // If fallback also fails, create a colored placeholder
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                      e.target.parentElement.style.minHeight = '384px';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${getBiasColor(articles[0].political_bias)}`}></div>
                      <span className="text-xs text-white/90 font-medium">{leftPercentage}% Left</span>
                      <span className="text-xs text-white/90 font-medium">{centerPercentage}% Center</span>
                      <span className="text-xs text-white/90 font-medium">{rightPercentage}% Right</span>
                    </div>
                    <h4 className="text-white font-bold text-xl leading-tight group-hover:text-primary-300 transition-colors">
                      {articles[0].title}
                    </h4>
                    <p className="text-white/80 text-sm mt-2 font-medium">
                      {articles[0].source_name} • {new Date(articles[0].publication_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stacked Articles */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Israel-Gaza Blindspots
          </h3>
          
          <div className="space-y-4">
            {articles.slice(1, 5).map((article, index) => (
              <div 
                key={article.id}
                className="flex gap-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleArticleClick(article)}
              >
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-gray-400 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${getBiasColor(article.political_bias)}`}></div>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {article.political_bias === 'left' ? 'Left' : article.political_bias === 'right' ? 'Right' : 'Center'} {getBiasPercentage(article.political_bias)}%
                    </span>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      • {new Date(article.publication_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h4>
                  
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {article.source_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GazaIsraelNews;
