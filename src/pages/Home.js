import React, { useEffect, useState } from "react";
import DailyBriefs from '../components/Home/DailyBriefs';
import TrendingGrid from '../components/Home/TrendingGrid';
import ImageBoard from '../components/Home/ImageBoard';
import AnalysisSection from '../components/Home/AnalysisSection';
import TopicCarousel from '../components/Home/TopicCarousel';
import StoryClusters from '../components/Home/StoryClusters';
import GazaIsraelNews from '../components/Home/GazaIsraelNews';
import NewsFeed from "../components/NewsFeed/NewsFeed";
import SEOHead from "../components/SEO/SEOHead";
import rssService from '../services/rssService';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        // Use RSS service for fresh categorized data
        const data = await rssService.getArticles({ sortBy: 'date' });
        const list = Array.isArray(data.articles) ? data.articles : [];
        console.log(`Loaded ${list.length} articles from RSS service`);
        console.log('Categories available:', [...new Set(list.map(a => a.topic))]);
        console.log('Sample article:', list[0]);
        if (alive) setArticles(list);
      } catch (e) {
        console.error("Failed to load articles from RSS service", e);
        // Fallback to static data
        try {
          const res = await fetch("/data/articles.json", { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const list = Array.isArray(json.articles) ? json.articles : [];
          console.log(`Fallback: Loaded ${list.length} articles from static data`);
          if (alive) setArticles(list);
        } catch (fallbackError) {
          console.error("Fallback also failed", fallbackError);
          if (alive) {
            setError("Failed to load latest articles. Please try refreshing the page.");
          }
        }
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
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {/* Main Content Area */}
            <div className="flex-1">
              {/* Hero NewsFeed */}
              <div className="mb-8">
                <NewsFeed 
                  articles={articles}
                  loading={loading}
                  error={error}
                  className=""
                  isHomePage={true}
                  maxArticles={null}
                />
              </div>

              {/* Mobile-only sections */}
              <div className="lg:hidden space-y-8 mb-8">
                <DailyBriefs articles={articles} />
                <TrendingGrid articles={articles} />
                <ImageBoard />
                <AnalysisSection articles={articles} />
                <TopicCarousel articles={articles} />
              </div>

              {/* Story Clusters - Featured section */}
              <div className="mb-8">
                <StoryClusters articles={articles} />
              </div>

              {/* Gaza/Israel News Section */}
              <div className="mb-8">
                <GazaIsraelNews />
              </div>

              {/* Desktop-only additional content sections */}
              <div className="hidden lg:block space-y-8">
                <TrendingGrid articles={articles} />
                <ImageBoard />
                <AnalysisSection articles={articles} />
              </div>
            </div>
            
            {/* Footer */}
            <footer className="max-w-7xl mx-auto mt-16 pt-8 pb-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <span className="text-lg font-serif font-bold text-text-primary-light dark:text-text-primary-dark">
                    Asha.News
                  </span>
                  <div className="flex gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <button className="hover:text-primary-600 dark:hover:text-primary-400">
                      About
                    </button>
                    <button className="hover:text-primary-600 dark:hover:text-primary-400">
                      Privacy
                    </button>
                    <button className="hover:text-primary-600 dark:hover:text-primary-400">
                      Terms
                    </button>
                    <button className="hover:text-primary-600 dark:hover:text-primary-400">
                      Contact
                    </button>
                  </div>
                </div>
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  &copy; 2024 Asha.News. All rights reserved.
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
