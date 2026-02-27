import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams, useParams } from 'react-router-dom';
import NewsFeed from '../components/NewsFeed/NewsFeed';
import SEOHead from '../components/SEO/SEOHead';
import useDebounce from '../hooks/useDebounce';
import directusService from '../services/directusService';

const CategoryPage = () => {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  
  // Get category from URL path or search params
  const categoryFromPath = location.pathname.split('/').pop();
  const categoryFromParams = params.category;
  const currentCategory = categoryFromParams || (categoryFromPath !== 'search' ? categoryFromPath : '');
  
  const [searchQuery] = useState(searchParams.get('q') || '');
  const [allArticles, setAllArticles] = useState([]);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch all articles from both sources
  useEffect(() => {
    const fetchAllArticles = async () => {
      try {
        // Fetch from Directus CMS
        const directusData = await directusService.getArticles({ limit: 100 });
        
        // Use Directus articles
        const combinedArticles = directusData.articles || [];

        // Remove duplicates based on title or URL
        const uniqueArticles = combinedArticles.filter((article, index, self) => 
          index === self.findIndex(a => 
            a.title === article.title || 
            (a.url && article.url && a.url === article.url)
          )
        );

        setAllArticles(uniqueArticles);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        setAllArticles([]);
      }
    };

    fetchAllArticles();
  }, []);

  // Filter articles based on search, category, and filters
  const filteredArticles = useMemo(() => {
    let filtered = allArticles;

    // Category filter (from URL)
    if (currentCategory && currentCategory !== 'search') {
      filtered = filtered.filter(article => 
        article.topic?.toLowerCase() === currentCategory.toLowerCase() ||
        article.category?.toLowerCase() === currentCategory.toLowerCase()
      );
    }

    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(article =>
        (article.title || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (article.summary || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (article.author || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [debouncedSearchQuery, allArticles, currentCategory]);

  // Get page title based on category
  const getPageTitle = () => {
    if (currentCategory && currentCategory !== 'search') {
      return `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} News`;
    }
    return searchQuery ? `Search Results for "${searchQuery}"` : 'Search News';
  };

  return (
    <>
      <SEOHead
        title={`${getPageTitle()} - Asha.News`}
        description={`Browse ${currentCategory || 'news'} articles with AI-powered bias analysis and fact-checking.`}
        canonicalUrl={location.pathname}
      />
      <NewsFeed
        articles={filteredArticles}
        searchQuery={searchQuery}
        showFilters={true}
        showSidebar={true}
        isHomePage={false}
        className="min-h-screen"
      />
    </>
  );
};

export default CategoryPage;
