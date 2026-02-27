import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewsFeed from '../components/NewsFeed/NewsFeed';
import DailyBriefs from '../components/Home/DailyBriefs';
import TrendingGrid from '../components/Home/TrendingGrid';
import ImageBoard from '../components/Home/ImageBoard';
import AnalysisSection from '../components/Home/AnalysisSection';
import TopicCarousel from '../components/Home/TopicCarousel';
import GazaIsraelNews from '../components/Home/GazaIsraelNews';
import LatestFromAsha from '../components/Home/LatestFromAsha';
import StoryCard from '../components/StoryCard/StoryCard';
import directusService from '../services/directusService';
import SEOHead from "../components/SEO/SEOHead";

const Home = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [heroCluster, setHeroCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [factInput, setFactInput] = useState('');
  const [error, setError] = useState(null);

  // Handlers for StoryCard
  const handleViewStory = (cluster) => {
    navigate(`/story/${cluster.id}`);
  };

  const handleArticleClick = (article) => {
    navigate(`/article/${article.id}`);
  };

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        let heroChosen = false; // track if hero cluster already selected from real clusters
        const buildSyntheticCluster = (list) => {
          if (!Array.isArray(list) || list.length === 0) return null;
          const firstWithImg = list.find(a => a?.image_url || a?.urlToImage || a?.image || a?.cover_image) || list[0];
          const featuredImage = firstWithImg?.image_url || firstWithImg?.urlToImage || firstWithImg?.image || firstWithImg?.cover_image || null;
          const id = `local-${firstWithImg.id || firstWithImg.guid || Date.now()}`;
          const top = list.slice(0, 3).map((a, idx) => ({
            id: a.id || a.guid || `tmp-${idx}`,
            title: a.title || 'Related Article',
            source_name: a.source_name || a.source || 'Multiple Sources',
            political_bias: a.political_bias || 'center',
            similarity_score: a.similarity_score || 0.9 - idx * 0.05,
            is_primary_source: idx === 0,
            image_url: a.image_url || a.urlToImage || a.image || a.cover_image || null,
            published_at: a.published_at || a.publication_date || new Date().toISOString(),
            excerpt: a.summary || a.description || ''
          }));
          return {
            id,
            cluster_title: firstWithImg.title || 'Top Story',
            cluster_summary: firstWithImg.summary || firstWithImg.description || 'Multiple sources covering this developing story.',
            article_count: list.length,
            topic_category: firstWithImg.topic || 'general',
            featured_image: featuredImage,
            articles: top,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        };
        
        // Load story clusters first
        try {
          const clusterRes = await fetch('/api/clusters?limit=10');
          if (clusterRes.ok) {
            const clusterData = await clusterRes.json();
            if (clusterData.success) {
              const clusterList = Array.isArray(clusterData.data) ? clusterData.data : [];
              // Prefer a cluster with an explicit image or an article with image
              const hasImg = (c) => c?.featured_image || c?.image_url || c?.image || c?.top_image_url || (Array.isArray(c?.articles) && c.articles.some(a => a?.image_url || a?.urlToImage || a?.image || a?.cover_image));
              if (clusterList.length > 0) {
                const preferred = clusterList.find(hasImg) || clusterList[0];
                if (alive) {
                  setHeroCluster(preferred);
                  setClusters(clusterList.filter(c => c !== preferred));
                }
                heroChosen = true;
              }
            }
          }
        } catch (clusterError) {
          console.warn('Failed to load clusters:', clusterError);
        }
        
        // Try new RSS API first
        try {
          const res = await fetch("/api/articles?limit=50");
          if (res.ok) {
            const json = await res.json();
            const rssArticles = Array.isArray(json.data) ? json.data : [];
            
            if (rssArticles.length > 0) {
              // Load Palestine articles and combine with RSS articles
              try {
                const palestineData = await directusService.getPalestineArticles({ limit: 10 });
                const palestineArticles = palestineData.articles || [];
                
                // Combine RSS and Palestine articles
                const combinedArticles = [...rssArticles, ...palestineArticles];
                
                // Sort by publication date (newest first)
                combinedArticles.sort((a, b) => new Date(b.published_at || b.publication_date) - new Date(a.published_at || a.publication_date));

                if (alive) setArticles(combinedArticles);
                if (alive && !heroChosen) {
                  const synthetic = buildSyntheticCluster(combinedArticles);
                  if (synthetic) {
                    setHeroCluster(synthetic);
                    setClusters([]);
                    heroChosen = true;
                  }
                }
                return;
              } catch (palestineError) {
                console.warn("Failed to load Palestine articles, using RSS only:", palestineError);
                // Sort by publication date (newest first)
                rssArticles.sort((a, b) => new Date(b.published_at || b.publication_date) - new Date(a.published_at || a.publication_date));
                if (alive) setArticles(rssArticles);
                if (alive && !heroChosen) {
                  const synthetic = buildSyntheticCluster(rssArticles);
                  if (synthetic) {
                    setHeroCluster(synthetic);
                    setClusters([]);
                    heroChosen = true;
                  }
                }
                return;
              }
            }
          }
        } catch (rssError) {
          console.warn("New RSS API not available, trying fallback...", rssError);
        }
        
        // Fallback to Directus CMS
        try {
          const directusData = await directusService.getArticles({ sortBy: 'date', limit: 100 });
          const directusArticles = directusData.articles || [];
          
          // Sort by publication date (newest first)
          directusArticles.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));

          
          if (alive) setArticles(directusArticles);
          if (alive && !heroChosen) {
            const synthetic = buildSyntheticCluster(directusArticles);
            if (synthetic) {
              setHeroCluster(synthetic);
              setClusters([]);
              heroChosen = true;
            }
          }
        } catch (directusError) {
          console.error("Failed to load from Directus", directusError);
          throw directusError;
        }
        
      } catch (e) {
        console.error("Failed to load articles from all sources", e);
        if (alive) {
          setError("Failed to load latest articles. Please try refreshing the page.");
          setArticles([]);
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

  // Compute a reliable hero image URL: prefer cluster image, fallback to first article with image
  const heroImageUrl = React.useMemo(() => {
    const fromCluster = heroCluster?.featured_image || heroCluster?.image_url || heroCluster?.image || heroCluster?.top_image_url;
    if (fromCluster) return fromCluster;
    const a = (articles || []).find((x) => x?.image_url || x?.urlToImage || x?.image || x?.cover_image);
    return a ? (a.image_url || a.urlToImage || a.image || a.cover_image) : null;
  }, [heroCluster, articles]);

  // Fallback hero article for text/link when cluster missing or lacks fields
  const heroArticle = React.useMemo(() => {
    if (heroCluster?.articles?.length) {
      const withImg = heroCluster.articles.find((x) => x?.image_url || x?.urlToImage || x?.image || x?.cover_image);
      return withImg || heroCluster.articles[0];
    }
    const a = (articles || []).find((x) => x?.image_url || x?.urlToImage || x?.image || x?.cover_image);
    return a || (articles?.[0] || null);
  }, [heroCluster, articles]);

  const heroTitle = heroCluster?.title || heroCluster?.cluster_title || heroArticle?.title || 'Top Story';
  const heroSummary = heroCluster?.summary || heroCluster?.cluster_summary || heroArticle?.summary || heroArticle?.description || heroArticle?.excerpt || '';
  const heroArticleId = heroArticle?.id || heroArticle?._id || heroArticle?.guid;
  const isInternalId = typeof heroArticleId === 'string'
    ? heroArticleId.startsWith('cms-') || /^(\d+)$/.test(heroArticleId)
    : (typeof heroArticleId === 'number');
  const heroLink = heroCluster
    ? `/story/${heroCluster.id}`
    : (isInternalId
      ? `/article/${encodeURIComponent(heroArticleId)}`
      : (heroArticle?.url || heroArticle?.source_url || '#'));

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
        <div className="min-h-screen bg-surface-light dark:bg-surface-dark transition-colors duration-300">
          {/* Hero Story Cluster Section */}
          {(heroCluster || heroImageUrl || heroArticle) && (
            <section className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 py-8 lg:py-12">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {heroCluster ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                            Breaking Story Cluster
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Top Story
                          </>
                        )}
                      </div>
                      <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                        {heroTitle}
                      </h1>
                      <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        {heroSummary}
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Coverage: {Math.round(((heroCluster?.coverage_score ?? 0.5) * 100))}%
                          </span>
                          {heroCluster ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {heroCluster?.source_diversity?.unique_sources || heroCluster?.article_count || '—'} unique sources
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Source: {heroArticle?.source_name || '—'}
                            </span>
                          )}
                        </div>
                        {heroLink.startsWith('/') ? (
                          <Link 
                            to={heroLink}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <span>Read Full Story</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ) : (
                          <a
                            href={heroLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <span>Read Full Story</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Hero Image Section */}
                    <div className="relative">
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                        {heroImageUrl ? (
                          <img 
                            src={heroImageUrl} 
                            alt={heroTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400" style={{display: heroImageUrl ? 'none' : 'flex'}}>
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            <div className="text-sm">Story Cluster</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bias Distribution Overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Source Bias Distribution
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 via-gray-500 to-red-500 h-2 rounded-full"
                                style={{width: '100%'}}
                              ></div>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <span>Left</span>
                            <span>Center</span>
                            <span>Right</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Fact Check CTA */}
          <section className="py-4">
            <div className="container mx-auto px-4">
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4 lg:p-6 flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Fact Check a claim or URL</h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Paste any headline, paragraph, or link and get instant analysis.</p>
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={factInput}
                    onChange={(e) => setFactInput(e.target.value)}
                    placeholder="Paste a claim or URL..."
                    className="flex-1 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 text-text-primary-light dark:text-text-primary-dark"
                  />
                  <a
                    href={`/fact-check${factInput ? `?q=${encodeURIComponent(factInput)}` : ''}`}
                    className="inline-flex items-center px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium whitespace-nowrap"
                  >
                    Fact Check
                  </a>
                </div>
              </div>
            </div>
          </section>

          
          {/* Top Story Clusters Section */}
          {clusters.length > 0 && (
            <section className="py-8 lg:py-12 bg-background-light dark:bg-background-dark">
              <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Top Stories
                      </h2>
                    </div>
                    <Link 
                      to="/stories"
                      className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                    >
                      <span>View All Stories</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                  
                  {/* Story Cards Grid - Only show 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clusters.slice(0, 4).map((cluster) => (
                      <StoryCard
                        key={cluster.id}
                        cluster={cluster}
                        size="standard"
                        showBiasBar={true}
                        showKeyTakeaways={false}
                        onClick={handleViewStory}
                        onArticleClick={handleArticleClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Main Content Grid */}
          <div className="container mx-auto px-4 py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-3 space-y-8 lg:space-y-12">
                {/* Hero NewsFeed */}
                <NewsFeed 
                  articles={articles} 
                  layout="hero" 
                  showBiasOverview={false}
                  showFilters={false}
                  showSidebar={false}
                  isHomePage={true}
                  maxArticles={1}
                />
                
                {/* Mobile-only sections */}
                <div className="block lg:hidden space-y-8">
                  <DailyBriefs articles={articles} />
                  <TrendingGrid articles={articles} />
                  <ImageBoard articles={articles} />
                  <AnalysisSection articles={articles} />
                  <TopicCarousel articles={articles} />
                </div>
                
                {/* Desktop additional content */}
                <div className="hidden lg:block space-y-8">
                  <TrendingGrid articles={articles} />
                  <ImageBoard articles={articles} />
                  <AnalysisSection articles={articles} />
                </div>
                
                {/* Gaza-Israel News */}
                <GazaIsraelNews />
                
                {/* Latest From Asha */}
                <LatestFromAsha />
              </div>
              
              {/* Sidebar - Right Side */}
              <div className="lg:col-span-1 hidden lg:block">
                <div className="sticky top-4 space-y-6">
                  {/* Daily Briefing */}
                  <DailyBriefs articles={articles} />
                  
                  {/* Breaking News */}
                  <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                      Breaking News
                    </h3>
                    <div className="space-y-3">
                      {articles.slice(0, 3).map((article, index) => (
                        <div key={index} className="border-l-2 border-red-500 pl-3">
                          <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                            {article.source_name} • {new Date(article.published_at || article.publication_date).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Trending Topics */}
                  <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                      Trending Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['Politics', 'Technology', 'Business', 'Health', 'Sports', 'Science'].map((topic) => (
                        <span key={topic} className="px-3 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-full text-sm cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-700 transition-colors">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Today's Coverage */}
                  <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                      Today's Coverage
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Left</span>
                        <span className="text-gray-600">Center</span>
                        <span className="text-red-600">Right</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 via-gray-500 to-red-500 h-2 rounded-full"></div>
                      </div>
                      <div className="flex justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        <span>32%</span>
                        <span>48%</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Browse Topics */}
                  <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                      Browse Topics
                    </h3>
                    <div className="space-y-2">
                      {[
                        { name: 'World News', count: 156 },
                        { name: 'Politics', count: 89 },
                        { name: 'Technology', count: 67 },
                        { name: 'Business', count: 45 },
                        { name: 'Health', count: 34 },
                        { name: 'Sports', count: 28 }
                      ].map((topic) => (
                        <div key={topic.name} className="flex justify-between items-center py-1">
                          <span className="text-sm text-text-primary-light dark:text-text-primary-dark cursor-pointer hover:text-primary-600 dark:hover:text-primary-400">
                            {topic.name}
                          </span>
                          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {topic.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Most Read */}
                  <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                      Most Read
                    </h3>
                    <div className="space-y-3">
                      {articles.slice(0, 5).map((article, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400 min-w-[24px]">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400">
                              {article.title}
                            </h4>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                              {article.source_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
