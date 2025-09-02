import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title = "Asha.News - AI-Powered News Analysis",
  description = "Combat media bias with AI-powered news analysis. Get balanced perspectives from 200+ sources with bias detection, fact-checking, and blindspot identification.",
  keywords = "news, bias analysis, AI news, fact checking, media bias, balanced news, political bias, news sources",
  canonicalUrl,
  ogImage = "/images/og-default.png",
  ogType = "website",
  article = null,
  noIndex = false,
  structuredData = null
}) => {
  const siteUrl = process.env.REACT_APP_SITE_URL || "https://asha.news";
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  // Default structured data for the site
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Asha.News",
    "description": description,
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Asha.News",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/images/logo.png`
      }
    }
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Asha.News" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:site" content="@AshaNews" />
      <meta name="twitter:creator" content="@AshaNews" />
      
      {/* Article-specific meta tags */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publication_date} />
          <meta property="article:author" content={article.author} />
          <meta property="article:section" content={article.topic} />
          <meta property="article:tag" content={article.topic} />
          {article.ai_analysis && (
            <meta property="article:tag" content={`bias-${article.ai_analysis.political_bias}`} />
          )}
        </>
      )}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content="Asha.News" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="theme-color" content="#3B82F6" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://api.openai.com" />
    </Helmet>
  );
};

export default SEOHead;
