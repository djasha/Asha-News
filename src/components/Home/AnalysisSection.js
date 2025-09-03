import React from 'react';

const AnalysisSection = ({ articles }) => {
  const analysisArticles = articles.filter(article => 
    article.tags?.includes('analysis') || 
    article.category === 'analysis' ||
    article.title.toLowerCase().includes('analysis') ||
    article.summary?.length > 200
  ).slice(0, 4);

  const featuredAnalysis = analysisArticles[0];
  const otherAnalysis = analysisArticles.slice(1, 4);

  if (!featuredAnalysis) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Deep Analysis
          </h2>
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Expert Commentary & Insights
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Analysis */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                Featured Analysis
              </span>
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {featuredAnalysis.source_name}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-3 line-clamp-2">
              {featuredAnalysis.title}
            </h3>
            
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4 line-clamp-3">
              {featuredAnalysis.summary}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {featuredAnalysis.bias_score && (
                    <>
                      <div className={`w-2 h-2 rounded-full ${
                        featuredAnalysis.bias_score < -0.3 ? 'bg-blue-500' :
                        featuredAnalysis.bias_score > 0.3 ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {Math.abs(featuredAnalysis.bias_score * 100).toFixed(0)}% bias detected
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                Read Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Other Analysis Articles */}
        <div className="space-y-4">
          {otherAnalysis.map((article, index) => (
            <div key={article.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{index + 2}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2 mb-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{article.source_name}</span>
                    {article.bias_score && (
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          article.bias_score < -0.3 ? 'bg-blue-500' :
                          article.bias_score > 0.3 ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span>{Math.abs(article.bias_score * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            View All Analysis →
          </button>
        </div>
      </div>
    </section>
  );
};

export default AnalysisSection;
