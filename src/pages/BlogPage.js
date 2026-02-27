import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import directusService from '../services/directusService';

const BlogPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await directusService.getArticles({ 
          sortBy: 'date', 
          limit: 50,
          article_type: 'blog'
        });
        // Articles are already filtered by backend API
        const blogArticles = data.articles;
        setArticles(blogArticles);
      } catch (err) {
        console.error('Failed to fetch blog articles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogArticles();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Asha News Blog",
    "description": "Insights, analysis, and commentary from the Asha News team",
    "url": "https://asha.news/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Asha News"
    },
    "blogPost": articles.slice(0, 10).map((article, index) => ({
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.summary,
      "url": `https://asha.news/article/${article.id}`,
      "datePublished": article.publication_date,
      "author": {
        "@type": "Person",
        "name": article.author || "Asha News Team"
      }
    }))
  };

  return (
    <>
      <SEOHead
        title="Blog - Asha News"
        description="Insights, analysis, and commentary from the Asha News team on media bias, journalism, and news analysis."
        keywords="blog, news analysis, media bias, journalism, commentary, insights"
        canonicalUrl="/blog"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                Asha News Blog
              </h1>
              <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark max-w-3xl">
                Insights, analysis, and commentary from our team on media bias, journalism, 
                and the evolving landscape of news consumption.
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-6 rounded mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    Unable to load blog articles
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && articles.length === 0 && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                    No blog posts yet
                  </h3>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                    We're working on bringing you insightful content. Check back soon!
                  </p>
                  <Link 
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                  </Link>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {!loading && !error && articles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <article 
                    key={article.id}
                    className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-border-light dark:border-border-dark"
                  >
                    {article.image_url && (
                      <div className="aspect-video bg-background-light dark:bg-background-dark">
                        <img 
                          src={article.image_url} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          {article.article_type === 'blog' ? 'Blog Post' : 'Article'}
                        </span>
                        {article.topic && (
                          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {article.topic}
                          </span>
                        )}
                      </div>
                      
                      <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 line-clamp-2">
                        <Link 
                          to={`/article/${article.id}`}
                          className="hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {article.title}
                        </Link>
                      </h2>
                      
                      {article.summary && (
                        <p className="text-text-secondary-light dark:text-text-secondary-dark line-clamp-3 mb-4">
                          {article.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
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
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              Bias Analysis:
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
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPage;
