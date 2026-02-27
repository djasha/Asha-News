import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArticleDetail from '../components/ArticleDetail/ArticleDetail';
import SEOHead from '../components/SEO/SEOHead';
import directusService from '../services/directusService';
import { API_SERVER } from '../config/api';
import logger from '../utils/logger';

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        // First, try to fetch the specific article by ID
        const API_URL = API_SERVER;
        
        if (id) {
          logger.debug('[ArticleDetailPage] Fetching specific article:', id);
          try {
            const articleResponse = await fetch(`${API_URL}/api/articles/${id}`);
            if (articleResponse.ok) {
              const articleData = await articleResponse.json();
              if (articleData.success && articleData.data) {
                logger.debug('[ArticleDetailPage] Found article directly:', articleData.data.id);
                if (alive) {
                  setArticles([articleData.data]);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (err) {
            logger.debug('[ArticleDetailPage] Direct fetch failed, trying bulk fetch');
          }
        }
        
        // Fallback: Fetch recent articles only (limit 300)
        logger.debug('[ArticleDetailPage] Fetching recent articles from:', `${API_URL}/api/articles?limit=300`);
        const response = await fetch(`${API_URL}/api/articles?limit=300`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const combinedArticles = data.success ? (data.data || []) : [];
        logger.debug('[ArticleDetailPage] Loaded', combinedArticles.length, 'articles from API');
        logger.debug('[ArticleDetailPage] First 5 article IDs:', combinedArticles.slice(0, 5).map(a => a.id));
        
        if (alive) {
          setArticles(combinedArticles);
          logger.debug('[ArticleDetailPage] State updated with', combinedArticles.length, 'articles');
        }
      } catch (e) {
        logger.error('Failed to load articles from backend:', e);
        
        // Try Directus as fallback
        try {
          const directusData = await directusService.getArticles({ sortBy: 'date', limit: 100 });
          const combinedArticles = directusData.articles || [];
          if (alive) setArticles(combinedArticles);
        } catch (directusError) {
          logger.error('Directus fallback failed:', directusError);
          
          // All data sources failed — show empty state
          logger.error('All data sources failed:', directusError);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]);
  
  const article = articles.find(a => a.id === parseInt(id) || a.id === id);
  
  // Debug logging
  useEffect(() => {
    logger.debug('[ArticleDetailPage] Looking for article ID:', id, '(type:', typeof id, ')');
    logger.debug('[ArticleDetailPage] Total articles loaded:', articles.length);
    logger.debug('[ArticleDetailPage] Article found:', !!article);
    if (articles.length > 0) {
      logger.debug('[ArticleDetailPage] Sample article IDs:', articles.slice(0, 5).map(a => `${a.id} (${typeof a.id})`));
    }
  }, [id, articles, article]);
  
  
  // Create structured data for the article
  const createArticleStructuredData = (article) => {
    if (!article) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.summary,
      "url": `https://asha.news/article/${article.id}`,
      "datePublished": article.publication_date,
      "dateModified": article.publication_date,
      "author": {
        "@type": "Organization",
        "name": article.source_name
      },
      "publisher": {
        "@type": "Organization",
        "name": "Asha.News",
        "logo": {
          "@type": "ImageObject",
          "url": "https://asha.news/images/logo.png"
        }
      },
      "image": article.image_url ? {
        "@type": "ImageObject",
        "url": article.image_url,
        "width": 1200,
        "height": 630
      } : undefined,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://asha.news/article/${article.id}`
      },
      "articleSection": article.topic,
      "keywords": [
        article.topic,
        article.political_bias,
        "news analysis",
        "bias detection"
      ].join(", ")
    };
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SEOHead
          title="Loading Article - Asha.News"
          description="Loading article with AI-powered bias analysis..."
          noIndex={true}
        />
        <div className="text-text-secondary-light dark:text-text-secondary-dark">
          Loading article...
        </div>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SEOHead
          title="Article Not Found - Asha.News"
          description="The requested article could not be found."
          noIndex={true}
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Article Not Found
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Get related articles (same topic, different articles)
  const relatedArticles = articles
    .filter(a => a.id !== article.id && a.topic === article.topic)
    .slice(0, 6);

  const articleTitle = `${article.title} - Asha.News`;
  const articleDescription = article.summary || `Read ${article.title} with AI-powered bias analysis from ${article.source_name}. Get balanced perspectives and fact-checking.`;
  const articleKeywords = `${article.title}, ${article.source_name}, ${article.topic}, ${article.political_bias} bias, news analysis, fact checking`;

  return (
    <>
      <SEOHead
        title={articleTitle}
        description={articleDescription}
        keywords={articleKeywords}
        canonicalUrl={`/article/${article.id}`}
        ogImage={article.image_url}
        ogType="article"
        article={article}
        structuredData={createArticleStructuredData(article)}
      />
      <ArticleDetail 
        article={article}
        relatedArticles={relatedArticles}
        onClose={() => navigate('/')}
      />
    </>
  );
};

export default ArticleDetailPage;
