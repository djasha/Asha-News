import React from 'react';
import NewsFeed from '../components/NewsFeed/NewsFeed';
import BiasBar from '../components/BiasVisualization/BiasBar';
import CoverageChart from '../components/BiasVisualization/CoverageChart';
import CredibilityMeter from '../components/BiasVisualization/CredibilityMeter';

const Home = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header Navigation */}
      <header className="bg-surface-light dark:bg-surface-dark border-b border-primary-200 dark:border-primary-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Asha<span className="text-primary-600 dark:text-primary-400">.</span>News
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-text-primary-light dark:text-text-primary-dark hover:text-primary-600 dark:hover:text-primary-400 font-medium">Home</a>
              <a href="#" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 font-medium">Blindspots</a>
              <a href="#" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 font-medium">Sources</a>
              <a href="#" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 font-medium">About</a>
            </nav>

            {/* Search and Theme Toggle */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="search" 
                  placeholder="Search news..." 
                  className="w-64 px-4 py-2 bg-accent-paper-light dark:bg-accent-paper-dark border border-primary-200 dark:border-primary-700 rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button className="btn-primary">Sign In</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Stories Banner */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 rounded-lg p-6 border border-primary-200 dark:border-primary-700">
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Today's Top Stories
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Breaking news analyzed from multiple perspectives to combat media bias
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Coverage Balance:</span>
              <BiasBar 
                leftCount={12} 
                centerCount={18} 
                rightCount={8} 
                size="medium"
                showLabels={true}
                showTooltip={true}
                interactive={true}
              />
            </div>
          </div>
        </section>

        {/* Main News Grid - Ground.news style */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Trending Topics */}
          <aside className="lg:col-span-1">
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Trending Topics
              </h3>
              <div className="space-y-3">
                {['Politics', 'Technology', 'Climate', 'Economy', 'Health'].map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between p-2 rounded hover:bg-accent-paper-light dark:hover:bg-accent-paper-dark cursor-pointer">
                    <span className="text-text-primary-light dark:text-text-primary-dark font-medium">{topic}</span>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-primary-100 dark:bg-primary-800 px-2 py-1 rounded-full">
                      {Math.floor(Math.random() * 50) + 10}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bias Analysis Widget */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Today's Coverage
              </h3>
              <div className="space-y-4">
                <CoverageChart 
                  leftCount={15} 
                  centerCount={22} 
                  rightCount={11} 
                  size="medium"
                  showLabels={true}
                  interactive={true}
                  showTooltip={true}
                  blindspotRisk="low"
                />
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <p className="mb-2">Balanced coverage detected across the political spectrum.</p>
                  <div className="flex items-center space-x-2">
                    <span>Quality Score:</span>
                    <CredibilityMeter 
                      factualAccuracy={0.87} 
                      biasTransparency={0.82} 
                      size="small"
                      showLabels={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-3">
            <NewsFeed showBiasOverview={false} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
            </div>
            <div className="text-center space-y-2">
              <BiasIndicator bias="center" confidence={0.92} size="large" />
              <span className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Center</span>
            </div>
            <div className="text-center space-y-2">
              <BiasIndicator bias="right" confidence={0.78} size="large" />
              <span className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Right Bias</span>
            </div>
            <div className="text-center space-y-2">
              <BiasIndicator bias="mixed" confidence={0.65} size="large" />
              <span className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Mixed</span>
            </div>
          </div>
        </div>

        {/* Coverage Chart Demo */}
        <div className="card">
          <h3 className="text-headline font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Coverage Distribution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Balanced Coverage
              </h4>
              <CoverageChart leftCount={8} centerCount={12} rightCount={7} size="large" />
            </div>
            <div className="text-center">
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Left Blindspot
              </h4>
              <CoverageChart leftCount={2} centerCount={5} rightCount={15} size="large" />
            </div>
            <div className="text-center">
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Right Blindspot
              </h4>
              <CoverageChart leftCount={18} centerCount={4} rightCount={1} size="large" />
            </div>
          </div>
        </div>

        {/* Credibility Meter Demo */}
        <div className="card">
          <h3 className="text-headline font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Source Credibility
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                Reuters
              </h4>
              <CredibilityMeter factualScore={4.8} biasScore={4.2} size="medium" />
            </div>
            <div>
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                Associated Press
              </h4>
              <CredibilityMeter factualScore={4.6} biasScore={4.0} size="medium" />
            </div>
            <div>
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                BBC News
              </h4>
              <CredibilityMeter factualScore={4.3} biasScore={3.8} size="medium" />
            </div>
          </div>
        </div>

        {/* Responsive Layout Demo */}
        <div className="card">
          <h3 className="text-headline font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Responsive Layout System
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-caption text-text-secondary-light dark:text-text-secondary-dark">
                    Article {item}
                  </span>
                  <BiasIndicator 
                    bias={item % 4 === 0 ? 'left' : item % 3 === 0 ? 'right' : item % 2 === 0 ? 'mixed' : 'center'} 
                    confidence={0.8} 
                    size="small" 
                    showConfidence={false}
                  />
                </div>
                <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                  Sample News Headline {item}
                </h4>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">
                  This is a sample article summary that demonstrates responsive card layouts.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
