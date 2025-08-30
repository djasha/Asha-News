import React from 'react';
import BiasBar from '../components/BiasVisualization/BiasBar';
import BiasIndicator from '../components/BiasVisualization/BiasIndicator';
import CoverageChart from '../components/BiasVisualization/CoverageChart';
import CredibilityMeter from '../components/BiasVisualization/CredibilityMeter';

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-responsive-headline font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
          Welcome to Asha.News
        </h1>
        <p className="text-responsive-body text-text-secondary-light dark:text-text-secondary-dark max-w-3xl mx-auto mb-8">
          AI-powered news aggregation platform that combats media bias by providing balanced, 
          transparent news consumption from multiple perspectives.
        </p>
        <button className="btn-primary">
          Explore News Feed
        </button>
      </section>

      {/* Design System Demo */}
      <section className="space-y-8">
        <h2 className="text-responsive-headline font-bold text-text-primary-light dark:text-text-primary-dark text-center">
          Bias Visualization Components
        </h2>
        
        {/* Typography Demo */}
        <div className="card">
          <h3 className="text-headline font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Typography System
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-label text-text-secondary-light dark:text-text-secondary-dark">Headline</span>
              <h4 className="text-responsive-headline font-bold text-text-primary-light dark:text-text-primary-dark">
                Breaking: Major Political Development
              </h4>
            </div>
            <div>
              <span className="text-label text-text-secondary-light dark:text-text-secondary-dark">Body Text</span>
              <p className="text-responsive-body text-text-primary-light dark:text-text-primary-dark">
                This is an example of body text that demonstrates our responsive typography system. 
                The text scales appropriately across different screen sizes while maintaining readability.
              </p>
            </div>
            <div>
              <span className="text-label text-text-secondary-light dark:text-text-secondary-dark">Caption</span>
              <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">
                This is caption text used for metadata and supporting information.
              </p>
            </div>
          </div>
        </div>

        {/* Bias Bar Demo */}
        <div className="card">
          <h3 className="text-headline font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Bias Distribution Bar
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Story: "Climate Change Policy Updates"
              </h4>
              <BiasBar leftPercentage={25} centerPercentage={50} rightPercentage={25} size="large" />
            </div>
            <div>
              <h4 className="text-body font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Story: "Economic Recovery Plans"
              </h4>
              <BiasBar leftPercentage={40} centerPercentage={30} rightPercentage={30} size="medium" />
            </div>
          </div>
        </div>

        {/* Bias Indicators Demo */}
        <div className="card">
          <h3 className="text-headline font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Bias Indicators
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <BiasIndicator bias="left" confidence={0.85} size="large" />
              <span className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Left Bias</span>
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
