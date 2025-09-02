import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';

const BiasMethodologyPage = () => {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "How We Analyze Bias - AI Methodology",
    "description": "Learn about Asha.News AI-powered bias analysis methodology using GPT-4 for political bias detection, emotional tone analysis, and factual content assessment.",
    "url": "https://asha.news/bias-methodology",
    "mainEntity": {
      "@type": "Article",
      "headline": "How We Analyze Bias",
      "description": "Understanding our AI-powered approach to detecting political bias, emotional tone, and factual content in news articles.",
      "author": {
        "@type": "Organization",
        "name": "Asha.News"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Asha.News"
      }
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="How We Analyze Bias - AI Methodology | Asha.News"
        description="Learn about Asha.News AI-powered bias analysis methodology using GPT-4 for political bias detection, emotional tone analysis, and factual content assessment."
        keywords="bias analysis methodology, AI news analysis, GPT-4 bias detection, political bias analysis, news fact checking, media bias detection"
        canonicalUrl="/bias-methodology"
        structuredData={structuredData}
      />
      
      {/* Header */}
      <header className="bg-surface-light dark:bg-surface-dark border-b border-primary-200 dark:border-primary-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
            
            <div className="text-2xl font-logo font-bold text-text-primary-light dark:text-text-primary-dark">
              Asha<span className="text-primary-500 dark:text-primary-400">.</span>News
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              How We Analyze Bias
            </h1>
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-3xl mx-auto">
              Understanding our AI-powered approach to detecting political bias, emotional tone, and factual content in news articles.
            </p>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-8 border border-primary-200 dark:border-primary-700">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-8 h-8 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                AI-Powered Analysis
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none text-text-primary-light dark:text-text-primary-dark">
              <p>
                Our bias analysis system uses OpenAI's GPT-4 to examine each article's title and summary, 
                providing objective assessments across multiple dimensions.
              </p>
            </div>
          </div>

          {/* Analysis Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Political Bias */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 border border-primary-200 dark:border-primary-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Political Bias
                </h3>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                Determines whether content leans left, right, or maintains a center/neutral position.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Left: Progressive perspectives</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Center: Balanced reporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Right: Conservative perspectives</span>
                </div>
              </div>
            </div>

            {/* Emotional Tone */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 border border-primary-200 dark:border-primary-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Emotional Tone
                </h3>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                Analyzes the emotional framing and language used in the article.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Positive: Optimistic framing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Neutral: Objective tone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Negative: Critical framing</span>
                </div>
              </div>
            </div>

            {/* Factual Content */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 border border-primary-200 dark:border-primary-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Factual Ratio
                </h3>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Measures the proportion of factual reporting versus opinion, speculation, or commentary.
              </p>
            </div>

            {/* Confidence Score */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 border border-primary-200 dark:border-primary-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Confidence Score
                </h3>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Indicates how confident our AI is in the bias assessment, helping you understand the reliability of the analysis.
              </p>
            </div>
          </div>

          {/* Methodology */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-8 border border-primary-200 dark:border-primary-700">
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
              Our Methodology
            </h2>
            
            <div className="space-y-6 text-text-secondary-light dark:text-text-secondary-dark">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center text-primary-500 dark:text-primary-400 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                    Content Analysis
                  </h3>
                  <p>
                    We analyze each article's title and summary using advanced natural language processing 
                    to identify linguistic patterns, word choices, and framing techniques.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center text-primary-500 dark:text-primary-400 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                    Multi-Dimensional Assessment
                  </h3>
                  <p>
                    Our AI evaluates multiple aspects simultaneously: political leaning, emotional tone, 
                    factual content ratio, and provides explanations for its assessments.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center text-primary-500 dark:text-primary-400 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                    Transparency & Limitations
                  </h3>
                  <p>
                    We provide confidence scores and explanations for each analysis. Remember that AI analysis 
                    is a tool to aid understanding, not a definitive judgment of truth or bias.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Important Disclaimer
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Our AI bias analysis is designed to help readers understand different perspectives in news coverage. 
                  It should not be considered the final word on bias or truth. We encourage readers to consume news 
                  from multiple sources and think critically about all information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BiasMethodologyPage;
