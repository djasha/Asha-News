import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArticleDetail from '../components/ArticleDetail/ArticleDetail';
import SEOHead from '../components/SEO/SEOHead';

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/data/articles.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.articles) ? json.articles : [];
        if (alive) setArticles(list);
      } catch (e) {
        console.error('Failed to load articles.json', e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);
  
  const article = articles.find(a => a.id === id);
  
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
