import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NewsFeed from "../components/NewsFeed/NewsFeed";
import SEOHead from "../components/SEO/SEOHead";

const Home = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/data/articles.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.articles) ? json.articles : [];
        if (alive) setArticles(list);
      } catch (e) {
        console.error("Failed to load articles.json", e);
        if (alive)
          setError(
            "Failed to load latest articles. Showing nothing until fetch succeeds."
          );
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "Asha.News",
    "url": "https://asha.news",
    "description": "AI-powered news analysis platform combating media bias with balanced perspectives from 200+ sources",
    "logo": {
      "@type": "ImageObject",
      "url": "https://asha.news/images/logo.png"
    },
    "sameAs": [
      "https://twitter.com/AshaNews"
    ],
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": articles.length,
      "itemListElement": articles.slice(0, 10).map((article, index) => ({
        "@type": "NewsArticle",
        "position": index + 1,
        "headline": article.title,
        "description": article.summary,
        "url": `https://asha.news/article/${article.id}`,
        "datePublished": article.publication_date,
        "author": {
          "@type": "Organization",
          "name": article.source_name
        },
        "publisher": {
          "@type": "Organization",
          "name": "Asha.News"
        }
      }))
    }
  };

  return (
    <>
      <SEOHead
        title="Asha.News - AI-Powered News Analysis & Bias Detection"
        description="Combat media bias with AI-powered news analysis. Get balanced perspectives from 200+ sources with GPT-4 bias detection, fact-checking, and blindspot identification."
        keywords="news analysis, media bias, AI news, fact checking, political bias, balanced news, news sources, bias detection, GPT-4 news"
        canonicalUrl="/"
        structuredData={structuredData}
      />
      
      {loading && (
        <div className="px-4 py-8 text-text-secondary-light dark:text-text-secondary-dark">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            Loading latest articles...
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="px-4 py-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-mobile mx-4 mt-4">
          {error}
        </div>
      )}
      {!loading && (
        <NewsFeed
          articles={articles}
          showBiasOverview={false}
          showFilters={false}
          showSidebar={true}
        />
      )}
    </>
  );
};

export default Home;
