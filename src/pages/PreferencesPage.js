import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { usePreferences } from '../contexts/PreferencesContext';

const PreferencesPage = () => {
  const navigate = useNavigate();
  const {
    preferences,
    updateTopicPreference,
    updateDisplayPreference,
    updatePreferences,
    savePreferences,
    hasUnsavedChanges,
    triggerHaptic
  } = usePreferences();

  const [expandedSections, setExpandedSections] = useState({
    topics: true,
    balance: false,
    notifications: false,
    display: false,
    bias: false,
    mobile: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    triggerHaptic('light');
  };

  const topicOptions = [
    { key: 'politics', label: 'Politics' },
    { key: 'technology', label: 'Technology' },
    { key: 'business', label: 'Business' },
    { key: 'sports', label: 'Sports' },
    { key: 'entertainment', label: 'Entertainment' },
    { key: 'health', label: 'Health' },
    { key: 'science', label: 'Science' },
    { key: 'world', label: 'World News' },
    { key: 'climate', label: 'Climate' },
    { key: 'education', label: 'Education' }
  ];

  const handleSave = () => {
    savePreferences();
    triggerHaptic('success');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Helmet>
        <title>Preferences - Asha.News</title>
        <meta name="description" content="Customize your news reading experience" />
      </Helmet>

      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 -ml-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Preferences
          </h1>
          
          <div className="w-12"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24 max-w-2xl mx-auto">
        
        {/* Topics Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('topics')}
            className="w-full flex items-center justify-between p-4 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg border border-gray-200 dark:border-gray-700 touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </span>
              <div className="text-left">
                <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Topics of Interest
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Choose what matters to you
                </p>
              </div>
            </div>
            <svg 
              className={`w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark transition-transform ${expandedSections.topics ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.topics && (
            <div className="mt-3 p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                {topicOptions.map(topic => (
                  <label
                    key={topic.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer touch-manipulation ${
                      preferences.topics[topic.key]
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={preferences.topics[topic.key]}
                      onChange={(e) => updateTopicPreference(topic.key, e.target.checked)}
                      className="sr-only"
                    />
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      preferences.topics[topic.key]
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-transparent'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      {topic.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reading Balance Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('balance')}
            className="w-full flex items-center justify-between p-4 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg border border-gray-200 dark:border-gray-700 touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5v5M8 3H3v5m13 8h5v5m-18-5H3v5m6-14v14m6-10H9m6 6H9" />
                </svg>
              </span>
              <div className="text-left">
                <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Reading Balance
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Diversity vs Personalization
                </p>
              </div>
            </div>
            <svg 
              className={`w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark transition-transform ${expandedSections.balance ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.balance && (
            <div className="mt-3 p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <span>More Diverse</span>
                  <span>More Personal</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences.readingBalance}
                  onChange={(e) => updatePreferences({ readingBalance: parseInt(e.target.value) })}
                  className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center">
                  <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {preferences.readingBalance}% Personalized
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Display Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('display')}
            className="w-full flex items-center justify-between p-4 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg border border-gray-200 dark:border-gray-700 touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9V16a2 2 0 01-2 2h-1a1 1 0 01-1-1v-1a2 2 0 00-2-2H7z" />
                </svg>
              </span>
              <div className="text-left">
                <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Display Settings
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Customize your viewing experience
                </p>
              </div>
            </div>
            <svg 
              className={`w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark transition-transform ${expandedSections.display ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.display && (
            <div className="mt-3 p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
              
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">Dark Mode</h4>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Use dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.display.darkMode}
                    onChange={(e) => updateDisplayPreference('darkMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* Text Size */}
              <div>
                <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Text Size</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => updateDisplayPreference('textSize', size)}
                      className={`p-3 rounded-lg border-2 transition-all touch-manipulation ${
                        preferences.display.textSize === size
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark capitalize">
                        {size}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Save Button */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg transition-all duration-200 transform active:scale-95 touch-manipulation"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default PreferencesPage;
