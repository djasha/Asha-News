import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [activeSidebarItem, setActiveSidebarItem] = useState('account-information');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const topTabs = [
    { id: 'account', name: 'My Account' },
    { id: 'bias', name: 'My News Bias' },
    { id: 'alerts', name: 'Alerts' },
    { id: 'discover', name: 'Discover Topics' }
  ];

  const sidebarItems = [
    { id: 'account-information', name: 'Account Information', tab: 'account' },
    { id: 'subscription', name: 'Subscription', tab: 'account' },
    { id: 'activity', name: 'Activity', tab: 'account' },
    { id: 'newsletters', name: 'Newsletters', tab: 'account' },
    { id: 'referral', name: 'Referral', tab: 'account' },
    { id: 'support', name: 'Support', tab: 'account' },
    { id: 'preferences', name: 'Preferences', tab: 'account' },
    { id: 'link-institutions', name: 'Link Institutions', tab: 'account' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Set default sidebar item for each tab
    if (tabId === 'account') {
      setActiveSidebarItem('account-information');
    }
  };

  const renderMainContent = () => {
    if (activeTab === 'account') {
      switch (activeSidebarItem) {
        case 'account-information':
          return <AccountInformationTab user={user} />;
        case 'subscription':
          return <SubscriptionTab user={user} />;
        case 'activity':
          return <ActivityTab user={user} />;
        case 'newsletters':
          return <NewslettersTab user={user} />;
        case 'referral':
          return <ReferralTab user={user} />;
        case 'support':
          return <SupportTab user={user} />;
        case 'preferences':
          return <PreferencesTab user={user} />;
        case 'link-institutions':
          return <LinkInstitutionsTab user={user} />;
        default:
          return <AccountInformationTab user={user} />;
      }
    } else if (activeTab === 'bias') {
      return <MyNewsBiasTab user={user} />;
    } else if (activeTab === 'alerts') {
      return <AlertsTab user={user} />;
    } else if (activeTab === 'discover') {
      return <DiscoverTopicsTab user={user} />;
    }
    return <AccountInformationTab user={user} />;
  };

  const filteredSidebarItems = sidebarItems.filter(item => item.tab === activeTab);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-4">
              <Link to="/" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark text-sm">
                ← Back to Home
              </Link>
            </div>
            
            {/* Top Navigation */}
            <nav className="flex space-x-8">
              {topTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-text-primary-light dark:text-text-primary-dark border-b-2 border-primary-500'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          {activeTab === 'account' && (
            <div className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {filteredSidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSidebarItem(item.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSidebarItem === item.id
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Account Information Tab Component
const AccountInformationTab = ({ user }) => {
  const [isEditing, setIsEditing] = useState({ name: false, email: false });
  const [formData, setFormData] = useState({
    name: user?.name || 'Diaa Asha',
    email: user?.email || 'diaasha7@gmail.com'
  });

  const handleEdit = (field) => {
    setIsEditing(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = (field) => {
    // Here you would typically save to backend
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  const signInMethods = [
    { name: 'Google', connected: true, canRemove: false },
    { name: 'Apple', connected: false, canRemove: false },
    { name: 'Facebook', connected: false, canRemove: false }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
          Account Information
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
          UI: 6645419
        </p>
      </div>

      {/* Profile Picture */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <img 
              src="/api/placeholder/64/64" 
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-xl hidden">
              {formData.name.charAt(0)}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
              Profile picture
            </h3>
            <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm">
              Change photo
            </button>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
              Name
            </h3>
            {isEditing.name ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-600 rounded-lg text-text-primary-light dark:text-text-primary-dark"
                />
                <button
                  onClick={() => handleSave('name')}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => handleEdit('name')}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-text-primary-light dark:text-text-primary-dark">
                {formData.name}
              </p>
            )}
          </div>
          {!isEditing.name && (
            <button
              onClick={() => handleEdit('name')}
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark flex items-center gap-1 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
              Email
            </h3>
            {isEditing.email ? (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-600 rounded-lg text-text-primary-light dark:text-text-primary-dark"
                />
                <button
                  onClick={() => handleSave('email')}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => handleEdit('email')}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-text-primary-light dark:text-text-primary-dark">
                {formData.email}
              </p>
            )}
          </div>
          {!isEditing.email && (
            <button
              onClick={() => handleEdit('email')}
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark flex items-center gap-1 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Sign-in Methods */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Sign-in methods
        </h3>
        <div className="space-y-4">
          {signInMethods.map((method) => (
            <div key={method.name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  {method.name === 'Google' && '🔍'}
                  {method.name === 'Apple' && '🍎'}
                  {method.name === 'Facebook' && '📘'}
                </div>
                <div>
                  <p className="text-text-primary-light dark:text-text-primary-dark font-medium">
                    {method.name}
                  </p>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                    {method.connected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.connected ? (
                  method.canRemove ? (
                    <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">
                      Remove
                    </button>
                  ) : (
                    <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                      Cannot remove
                    </span>
                  )
                ) : (
                  <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">
          Sign out
        </button>
      </div>
    </div>
  );
};

// Preferences Tab Component
const PreferencesTab = ({ user }) => {
  const [preferences, setPreferences] = useState({
    appearance: 'dark',
    sourceSort: 'most-recent',
    biasFilter: 'all-bias',
    factualityFilter: true,
    locationFilter: 'all-locations',
    ownershipFilter: true,
    paywallFilter: true
  });

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const RadioOption = ({ name, value, checked, onChange, children }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-text-primary-light dark:text-text-primary-dark">{children}</span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
      />
    </label>
  );

  const CheckboxOption = ({ checked, onChange, children }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-text-primary-light dark:text-text-primary-dark">{children}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
      />
    </label>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
          Preferences
        </h1>
      </div>

      {/* Appearance */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Appearance: Dark
          </h3>
          <div className="w-12 h-6 bg-primary-600 rounded-full relative">
            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
          </div>
        </div>
      </div>

      {/* Source Sorting & Filters */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Source Sorting & Filters
          </h3>
          <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Source Sort</div>
          <RadioOption
            name="sourceSort"
            value="most-recent"
            checked={preferences.sourceSort === 'most-recent'}
            onChange={(e) => handlePreferenceChange('sourceSort', e.target.value)}
          >
            Most Recent
          </RadioOption>
          <RadioOption
            name="sourceSort"
            value="bias-first"
            checked={preferences.sourceSort === 'bias-first'}
            onChange={(e) => handlePreferenceChange('sourceSort', e.target.value)}
          >
            Bias First
          </RadioOption>
          <RadioOption
            name="sourceSort"
            value="by-location"
            checked={preferences.sourceSort === 'by-location'}
            onChange={(e) => handlePreferenceChange('sourceSort', e.target.value)}
          >
            Sort By Location
          </RadioOption>
          <RadioOption
            name="sourceSort"
            value="alphabetically"
            checked={preferences.sourceSort === 'alphabetically'}
            onChange={(e) => handlePreferenceChange('sourceSort', e.target.value)}
          >
            Sort Alphabetically
          </RadioOption>
          <RadioOption
            name="sourceSort"
            value="by-popularity"
            checked={preferences.sourceSort === 'by-popularity'}
            onChange={(e) => handlePreferenceChange('sourceSort', e.target.value)}
          >
            Sort By Popularity
          </RadioOption>
        </div>
      </div>

      {/* Bias */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Bias
          </h3>
          <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div className="space-y-1">
          <RadioOption
            name="biasFilter"
            value="all-bias"
            checked={preferences.biasFilter === 'all-bias'}
            onChange={(e) => handlePreferenceChange('biasFilter', e.target.value)}
          >
            All Bias
          </RadioOption>
          <RadioOption
            name="biasFilter"
            value="left"
            checked={preferences.biasFilter === 'left'}
            onChange={(e) => handlePreferenceChange('biasFilter', e.target.value)}
          >
            Left
          </RadioOption>
          <RadioOption
            name="biasFilter"
            value="center"
            checked={preferences.biasFilter === 'center'}
            onChange={(e) => handlePreferenceChange('biasFilter', e.target.value)}
          >
            Center
          </RadioOption>
          <RadioOption
            name="biasFilter"
            value="right"
            checked={preferences.biasFilter === 'right'}
            onChange={(e) => handlePreferenceChange('biasFilter', e.target.value)}
          >
            Right
          </RadioOption>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <CheckboxOption
            checked={preferences.factualityFilter}
            onChange={(e) => handlePreferenceChange('factualityFilter', e.target.checked)}
          >
            Factuality
          </CheckboxOption>
        </div>
      </div>

      {/* Location */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Location
          </h3>
          <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div className="space-y-1">
          <CheckboxOption
            checked={preferences.locationFilter === 'all-locations'}
            onChange={(e) => handlePreferenceChange('locationFilter', e.target.checked ? 'all-locations' : 'local')}
          >
            All Locations
          </CheckboxOption>
          <CheckboxOption
            checked={false}
            onChange={() => {}}
          >
            Local Locations
          </CheckboxOption>
          <CheckboxOption
            checked={false}
            onChange={() => {}}
          >
            National Locations
          </CheckboxOption>
          <CheckboxOption
            checked={false}
            onChange={() => {}}
          >
            International Locations
          </CheckboxOption>
        </div>
      </div>

      {/* Ownership */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Ownership
          </h3>
          <input
            type="checkbox"
            checked={preferences.ownershipFilter}
            onChange={(e) => handlePreferenceChange('ownershipFilter', e.target.checked)}
            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
          />
        </div>
      </div>

      {/* Paywall */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Paywall
          </h3>
          <input
            type="checkbox"
            checked={preferences.paywallFilter}
            onChange={(e) => handlePreferenceChange('paywallFilter', e.target.checked)}
            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
          />
        </div>
      </div>

      {/* Notice */}
      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
        Notice: Changes here will only affect articles on the same page
      </div>
    </div>
  );
};

// Reading History Tab Component
const HistoryTab = ({ user }) => {
  const [history, setHistory] = useState(user?.readingHistory || []);
  const [filter, setFilter] = useState('all');

  // Mock reading history for demonstration
  React.useEffect(() => {
    if (!history.length) {
      const mockHistory = [
        {
          id: '1',
          title: 'AI Revolution: How Machine Learning is Transforming Industries',
          source: 'Tech Today',
          readAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          bias: 'center',
          category: 'Technology',
          readTime: '5 min read',
          url: '#'
        },
        {
          id: '2',
          title: 'Global Climate Summit Reaches Historic Agreement',
          source: 'World News',
          readAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          bias: 'left',
          category: 'Environment',
          readTime: '3 min read',
          url: '#'
        },
        {
          id: '3',
          title: 'Stock Markets Rally Amid Economic Recovery Signs',
          source: 'Financial Times',
          readAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          bias: 'right',
          category: 'Business',
          readTime: '4 min read',
          url: '#'
        }
      ];
      setHistory(mockHistory);
    }
  }, [history.length]);

  const filteredHistory = history.filter(article => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toDateString();
      return new Date(article.readAt).toDateString() === today;
    }
    if (filter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(article.readAt) > weekAgo;
    }
    return true;
  });

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'bg-blue-500';
      case 'right': return 'bg-red-500';
      case 'center': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Reading History
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Track your reading habits and bias exposure
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'today', 'week'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === filterOption
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {filteredHistory.length}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Articles Read
          </div>
        </div>
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {Math.round(filteredHistory.reduce((acc, article) => acc + parseInt(article.readTime), 0) / filteredHistory.length) || 0}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Avg. Read Time (min)
          </div>
        </div>
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {new Set(filteredHistory.map(a => a.category)).size}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Categories
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        {filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((article) => (
              <div key={article.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark transition-colors">
                <div className={`w-3 h-3 rounded-full ${getBiasColor(article.bias)} mt-2`}></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark mb-1 line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{article.category}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                    <span>•</span>
                    <span>{new Date(article.readAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm">
                  Read Again
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              No reading history yet
            </h4>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Start reading articles to see your history and track your bias exposure
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Saved Articles Tab Component
const SavedArticlesTab = ({ user }) => {
  const [savedArticles, setSavedArticles] = useState(user?.savedArticles || []);
  const [filter, setFilter] = useState('all');

  // Mock saved articles for demonstration
  React.useEffect(() => {
    if (!savedArticles.length) {
      const mockSavedArticles = [
        {
          id: '1',
          title: 'The Future of Renewable Energy: Solar and Wind Power Innovations',
          source: 'Green Tech Weekly',
          savedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          bias: 'center',
          category: 'Environment',
          readTime: '6 min read',
          summary: 'Latest breakthroughs in solar panel efficiency and wind turbine technology are reshaping the renewable energy landscape.',
          url: '#',
          tags: ['renewable', 'technology', 'climate']
        },
        {
          id: '2',
          title: 'Cryptocurrency Market Analysis: Bitcoin and Ethereum Trends',
          source: 'Crypto Insights',
          savedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          bias: 'right',
          category: 'Finance',
          readTime: '4 min read',
          summary: 'Market analysis shows significant volatility in major cryptocurrencies amid regulatory discussions.',
          url: '#',
          tags: ['crypto', 'finance', 'market']
        },
        {
          id: '3',
          title: 'Healthcare AI: Machine Learning in Medical Diagnosis',
          source: 'Medical Tech Today',
          savedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          bias: 'left',
          category: 'Healthcare',
          readTime: '8 min read',
          summary: 'AI-powered diagnostic tools are improving accuracy and speed in medical diagnoses across various specialties.',
          url: '#',
          tags: ['AI', 'healthcare', 'technology']
        }
      ];
      setSavedArticles(mockSavedArticles);
    }
  }, [savedArticles.length]);

  const filteredArticles = savedArticles.filter(article => {
    if (filter === 'all') return true;
    return article.category.toLowerCase() === filter.toLowerCase();
  });

  const categories = ['all', ...new Set(savedArticles.map(a => a.category))];

  const getBiasColor = (bias) => {
    switch (bias) {
      case 'left': return 'bg-blue-500';
      case 'right': return 'bg-red-500';
      case 'center': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const removeArticle = (articleId) => {
    setSavedArticles(prev => prev.filter(article => article.id !== articleId));
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Saved Articles
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Your bookmarked articles for later reading
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Articles Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {filteredArticles.length}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Saved Articles
          </div>
        </div>
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
          <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {categories.length - 1}
          </div>
          <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            Categories
          </div>
        </div>
      </div>

      {/* Saved Articles List */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        {filteredArticles.length > 0 ? (
          <div className="space-y-6">
            {filteredArticles.map((article) => (
              <div key={article.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full ${getBiasColor(article.bias)} mt-2 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-3 line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                      <span>•</span>
                      <span>Saved {new Date(article.savedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm px-3 py-1 rounded border border-primary-600 dark:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900">
                      Read Now
                    </button>
                    <button
                      onClick={() => removeArticle(article.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm px-3 py-1 rounded border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              No saved articles yet
            </h4>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Start saving articles you want to read later by clicking the bookmark icon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = ({ hasSubscription }) => (
  <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
      Bias Analytics
    </h3>
    {hasSubscription('premium') ? (
      <p className="text-text-secondary-light dark:text-text-secondary-dark">
        Your personal bias analytics will appear here
      </p>
    ) : (
      <div>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
          Upgrade to Premium to access detailed bias analytics
        </p>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
          Upgrade to Premium
        </button>
      </div>
    )}
  </div>
);

const SubscriptionTab = ({ user, hasSubscription }) => {
  const subscriptionTier = user?.subscription?.tier || 'free';
  
  return (
    <div className="max-w-4xl space-y-6">
      {/* Current Plan */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Current Plan
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
              {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan
            </p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {subscriptionTier === 'free' && 'Limited to 10 articles per day'}
              {subscriptionTier === 'premium' && 'Unlimited articles + advanced features'}
              {subscriptionTier === 'pro' && 'All features + API access'}
            </p>
          </div>
          {subscriptionTier === 'free' && (
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: 'Free',
            price: '$0',
            features: ['10 articles/day', 'Basic bias analysis', 'Topic filtering']
          },
          {
            name: 'Premium',
            price: '$9.99',
            features: ['Unlimited articles', 'Advanced analytics', 'Email alerts', 'Saved articles']
          },
          {
            name: 'Pro',
            price: '$19.99',
            features: ['Everything in Premium', 'API access', 'Export data', 'Priority support']
          }
        ].map((plan) => (
          <div key={plan.name} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 border-2 border-transparent hover:border-primary-500 transition-colors">
            <h4 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              {plan.name}
            </h4>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              {plan.price}<span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">/month</span>
            </p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
              subscriptionTier === plan.name.toLowerCase()
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}>
              {subscriptionTier === plan.name.toLowerCase() ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Tab Component
const ActivityTab = ({ user }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
      Activity
    </h1>
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
      <p className="text-text-secondary-light dark:text-text-secondary-dark">
        Your reading activity and engagement history will appear here.
      </p>
    </div>
  </div>
);

// Newsletters Tab Component
const NewslettersTab = ({ user }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
      Newsletters
    </h1>
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
      <p className="text-text-secondary-light dark:text-text-secondary-dark">
        Manage your newsletter subscriptions and preferences here.
      </p>
    </div>
  </div>
);

// Referral Tab Component
const ReferralTab = ({ user }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
      Referral
    </h1>
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
      <p className="text-text-secondary-light dark:text-text-secondary-dark">
        Invite friends and earn rewards through our referral program.
      </p>
    </div>
  </div>
);

// Support Tab Component
const SupportTab = ({ user }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
      Support
    </h1>
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
      <p className="text-text-secondary-light dark:text-text-secondary-dark">
        Get help and contact our support team.
      </p>
    </div>
  </div>
);

// Link Institutions Tab Component
const LinkInstitutionsTab = ({ user }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
      Link Institutions
    </h1>
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
      <p className="text-text-secondary-light dark:text-text-secondary-dark">
        Connect your institutional accounts for enhanced access.
      </p>
    </div>
  </div>
);
// Enhanced Chart Components
const MultiRingDonutChart = ({ data, size = 200, strokeWidth = 20, centerText, centerSubtext, showColorBar = false }) => {
  const rings = data.rings || [data];
  const centerX = size / 2;
  const centerY = size / 2;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Color bar at top */}
      {showColorBar && rings[0] && (
        <div className="absolute -top-6 left-0 right-0">
          <div className="flex h-2 rounded overflow-hidden">
            {rings[0].map((segment, index) => (
              <div 
                key={index}
                className="h-full"
                style={{ 
                  backgroundColor: segment.color, 
                  width: `${segment.percentage}%` 
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      <svg width={size} height={size} className="transform -rotate-90">
        {rings.map((ringData, ringIndex) => {
          const ringRadius = (size / 2) - strokeWidth - (ringIndex * (strokeWidth + 8));
          let cumulativePercentage = 0;
          
          return ringData.map((segment, segmentIndex) => {
            const circumference = 2 * Math.PI * ringRadius;
            const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * circumference / 100;
            cumulativePercentage += segment.percentage;
            
            return (
              <circle
                key={`${ringIndex}-${segmentIndex}`}
                cx={centerX}
                cy={centerY}
                r={ringRadius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={strokeWidth - (ringIndex * 2)}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          });
        })}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-text-primary-light dark:text-white">
          {centerText}
        </div>
        {centerSubtext && (
          <div className="text-xs text-text-secondary-light dark:text-gray-300 mt-1">
            {centerSubtext}
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-40 flex items-end justify-between gap-1 px-4">
      {data.map((point, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <div 
            className="w-3 bg-primary-500 rounded-t transition-all duration-300 hover:bg-primary-400"
            style={{ height: `${(point.value / maxValue) * 120}px` }}
          />
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark transform rotate-45 origin-bottom-left whitespace-nowrap">
            {point.date}
          </div>
        </div>
      ))}
    </div>
  );
};

const MyNewsBiasTab = ({ user }) => {
  const [timeRange, setTimeRange] = useState('90');
  
  // Enhanced data matching Ground News
  const biasData = {
    left: 33,
    center: 49,
    right: 18,
    stories: 319,
    articles: 79
  };

  const timelineData = [
    { date: 'Apr 28', value: 12 },
    { date: 'May 5', value: 18 },
    { date: 'May 12', value: 25 },
    { date: 'May 19', value: 22 },
    { date: 'Jun 2', value: 30 },
    { date: 'Jun 9', value: 28 },
    { date: 'Jun 16', value: 35 },
    { date: 'Jun 23', value: 32 },
    { date: 'Jun 30', value: 38 },
    { date: 'Jul 7', value: 42 },
    { date: 'Jul 14', value: 45 },
    { date: 'Jul 21', value: 48 }
  ];

  const topSources = [
    { name: 'CNN', logoUrl: 'https://logo.clearbit.com/cnn.com', bias: 'left', count: 4 },
    { name: 'BBC', logoUrl: 'https://logo.clearbit.com/bbc.com', bias: 'center', count: 4 },
    { name: 'Reuters', logoUrl: 'https://logo.clearbit.com/reuters.com', bias: 'center', count: 3 },
    { name: 'Fox News', logoUrl: 'https://logo.clearbit.com/foxnews.com', bias: 'right', count: 3 },
    { name: 'NPR', logoUrl: 'https://logo.clearbit.com/npr.org', bias: 'left', count: 2 }
  ];

  const topTopics = [
    { name: 'Politics', articles: 208 },
    { name: 'US Politics', articles: 164 },
    { name: 'North America', articles: 102 },
    { name: 'Business', articles: 80 },
    { name: 'North American Politics', articles: 68 }
  ];

  const topPeople = [
    { name: 'Joe Biden', articles: 31 },
    { name: 'Donald Trump', articles: 22 },
    { name: 'Elon Musk', articles: 14 },
    { name: 'Ron DeSantis', articles: 11 },
    { name: 'Yevgeny Prigozhin', articles: 7 }
  ];

  const factualityData = [
    { type: 'Very High', percentage: 45, color: '#4ade80' },
    { type: 'High', percentage: 41, color: '#22c55e' },
    { type: 'Mixed', percentage: 8, color: '#eab308' },
    { type: 'Low', percentage: 4, color: '#f97316' },
    { type: 'Very Low', percentage: 2, color: '#ef4444' }
  ];

  const ownershipData = {
    rings: [
      // Outer ring - detailed breakdown
      [
        { type: 'Media Conglomerate', percentage: 15, color: '#8b7355' },
        { type: 'Independent News', percentage: 7, color: '#5d9cae' },
        { type: 'Public Media', percentage: 8, color: '#6b8e5a' },
        { type: 'Digital Native', percentage: 12, color: '#a67c5a' },
        { type: 'Legacy Media', percentage: 10, color: '#8a6b7a' },
        { type: 'Corporate', percentage: 18, color: '#4a5568' },
        { type: 'Private Equity', percentage: 8, color: '#6366f1' },
        { type: 'Government', percentage: 5, color: '#7c3aed' },
        { type: 'Non-profit', percentage: 6, color: '#059669' },
        { type: 'Startup', percentage: 4, color: '#dc2626' },
        { type: 'Conglomerate Sub', percentage: 7, color: '#92400e' }
      ],
      // Inner ring - main categories  
      [
        { type: 'Media Con.', percentage: 36, color: '#6b5b73' },
        { type: 'Independent', percentage: 29, color: '#5a7c7c' },
        { type: 'Corporate', percentage: 20, color: '#4a5568' },
        { type: 'Public', percentage: 15, color: '#6b8e5a' }
      ]
    ]
  };

  const topicInsightsData = {
    rings: [
      // Outer ring - subtopics
      [
        { type: 'Elections', percentage: 4, color: '#8b7ba8' },
        { type: 'Policy', percentage: 3, color: '#9d8bb8' },
        { type: 'Congress', percentage: 3, color: '#a695c4' },
        { type: 'Campaigns', percentage: 2, color: '#b8a5d4' },
        { type: 'Voting', percentage: 2, color: '#c4b5e4' },
        { type: 'International', percentage: 6, color: '#d4925a' },
        { type: 'Domestic', percentage: 4, color: '#e0a570' },
        { type: 'Conflicts', percentage: 3, color: '#ecb886' },
        { type: 'Trade', percentage: 2, color: '#f8cb9c' },
        { type: 'Markets', percentage: 5, color: '#7ba85a' },
        { type: 'Tech', percentage: 4, color: '#8bb86a' },
        { type: 'Finance', percentage: 3, color: '#9bc87a' },
        { type: 'Health Policy', percentage: 2, color: '#a87b7b' },
        { type: 'Medical', percentage: 2, color: '#b88b8b' },
        { type: 'Sports News', percentage: 6, color: '#7ba8a8' },
        { type: 'Entertainment', percentage: 4, color: '#8bb8b8' }
      ],
      // Inner ring - main topics
      [
        { type: 'Politics', percentage: 20, color: '#8b7ba8' },
        { type: 'World', percentage: 15, color: '#d4925a' },
        { type: 'Business', percentage: 12, color: '#7ba85a' },
        { type: 'Health', percentage: 4, color: '#a87b7b' },
        { type: 'Sports', percentage: 10, color: '#7ba8a8' }
      ]
    ]
  };

  const localityData = {
    local: 7,
    national: 50,
    international: 43
  };

  const blindspotData = {
    leftBlindspots: 17,
    rightBlindspots: 9
  };

  const BiasCircle = ({ percentage, color, label, size = 'large' }) => {
    const radius = size === 'large' ? 45 : 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size === 'large' ? 120 : 90} height={size === 'large' ? 120 : 90} className="transform -rotate-90">
            <circle
              cx={size === 'large' ? 60 : 45}
              cy={size === 'large' ? 60 : 45}
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx={size === 'large' ? 60 : 45}
              cy={size === 'large' ? 60 : 45}
              r={radius}
              stroke={color}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold text-text-primary-light dark:text-text-primary-dark ${size === 'large' ? 'text-xl' : 'text-lg'}`}>
              {percentage}%
            </span>
          </div>
        </div>
        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center">
          {label}
        </span>
      </div>
    );
  };

  const BarChart = ({ data, maxValue }) => (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-20 text-sm text-text-secondary-light dark:text-text-secondary-dark text-right">
            {item.label}
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-primary-600"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-8 text-sm text-text-primary-light dark:text-text-primary-dark">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            My News Bias
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Demo Data</span>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 bg-surface-elevated-light dark:bg-surface-elevated-dark border border-gray-300 dark:border-gray-600 rounded text-sm text-text-primary-light dark:text-text-primary-dark"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Section - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Side - User Profile & Bias */}
        <div className="space-y-6">
          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face" 
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <span className="text-text-primary-light dark:text-text-primary-dark font-semibold text-xl" style={{ display: 'none' }}>
                {user?.name?.charAt(0) || 'I'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {user?.name || 'Isaac S.'}
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-2">
                {biasData.stories} Stories · {biasData.articles} Articles
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </p>
            </div>
          </div>

          {/* Compact Bias Bars */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 text-sm font-bold text-white bg-red-600 px-2 py-1 rounded text-center">
                L {biasData.left}%
              </div>
              <div className="w-12 text-sm font-bold text-white bg-gray-500 px-2 py-1 rounded text-center">
                C {biasData.center}%
              </div>
              <div className="w-12 text-sm font-bold text-white bg-blue-600 px-2 py-1 rounded text-center">
                {biasData.right}%
              </div>
            </div>
            
            {/* Reading Summary */}
            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark space-y-1">
              <p>• 104 of the stories you read <strong>lean left</strong>.</p>
              <p>• 157 of the stories you read <strong>were balanced</strong>.</p>
              <p>• 57 of the stories you read <strong>lean right</strong>.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Stories Read Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                Stories Read
              </h3>
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark text-sm rounded">Day</button>
              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark text-sm rounded">Week</button>
              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark text-sm rounded">Month</button>
            </div>
          </div>
          
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg p-4">
            <TimelineChart data={timelineData} />
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-3 text-center">
              You've read <strong>41% more</strong> stories than last week
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Analysis
        </h2>
      </div>

      {/* Main Grid Layout - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Most Read News Sources */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Most Read News Sources
            </h3>
            <div className="flex gap-2 mb-4">
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm">All</button>
              <button className="px-3 py-1 text-text-secondary-light dark:text-text-secondary-dark text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Left</button>
              <button className="px-3 py-1 text-text-secondary-light dark:text-text-secondary-dark text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Center</button>
              <button className="px-3 py-1 text-text-secondary-light dark:text-text-secondary-dark text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Right</button>
            </div>
            <div className="space-y-3 mb-4">
              {topSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={source.logoUrl} 
                      alt={source.name}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center text-xs font-bold" style={{ display: 'none' }}>
                      {source.name.charAt(0)}
                    </div>
                    <span className="text-text-primary-light dark:text-text-primary-dark text-sm">
                      {source.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: source.count }, (_, i) => (
                        <div key={i} className="w-2 h-2 bg-primary-500 rounded-full mr-1" />
                      ))}
                    </div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                      {source.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              3% of the news organizations you read are owned by Nexstar Media Group
            </p>
          </div>

          {/* Most Read Topics & People */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Most read topics & people
            </h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                Most read subjects
              </h4>
              <div className="space-y-2">
                {topTopics.map((topic, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {topic.name}
                    </span>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {topic.articles} Articles
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                People you read about
              </h4>
              <div className="space-y-2">
                {topPeople.map((person, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {person.name}
                    </span>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {person.articles} Articles
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Factuality Distribution */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Factuality distribution
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Factuality ratings are done at the outlet level, so this chart tells you how much of the news you read comes from sources with strong reporting practices.
            </p>
            <div className="flex items-center justify-center mb-6">
              <MultiRingDonutChart 
                data={factualityData}
                centerText="86%"
                centerSubtext="High Factuality"
                size={180}
              />
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Very Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Mixed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>Very High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Article Bias */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Article Bias
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
              When browsing stories you most frequently selected articles from news sources that are rated center.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex w-full h-8 rounded overflow-hidden">
                <div className="bg-blue-800" style={{ width: '1%' }} />
                <div className="bg-blue-600" style={{ width: '1%' }} />
                <div className="bg-blue-400" style={{ width: '31%' }} />
                <div className="bg-gray-500" style={{ width: '55%' }} />
                <div className="bg-red-400" style={{ width: '9%' }} />
                <div className="bg-red-600" style={{ width: '3%' }} />
                <div className="bg-red-800" style={{ width: '1%' }} />
              </div>
              <div className="flex justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
                <span>FAR LEFT</span>
                <span>LEFT</span>
                <span>LEAN LEFT</span>
                <span>CENTER</span>
                <span>LEAN RIGHT</span>
                <span>RIGHT</span>
                <span>FAR RIGHT</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-text-primary-light dark:text-text-primary-dark">
                <span>1%</span>
                <span>1%</span>
                <span>31%</span>
                <span>55%</span>
                <span>9%</span>
                <span>3%</span>
                <span>1%</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              You've read 25% more articles than last week
            </p>
          </div>

          {/* Locality Bias */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Locality Bias
            </h3>
            <div className="text-center space-y-2 mb-6">
              <div className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {localityData.local}% Local
              </div>
              <div className="text-lg text-text-primary-light dark:text-text-primary-dark">
                {localityData.national}% National
              </div>
              <div className="text-lg text-text-primary-light dark:text-text-primary-dark">
                {localityData.international}% International
              </div>
            </div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
              When you read the news, only {localityData.local}% of your perspective is being informed by local sources
            </p>
          </div>

          {/* Media Ownership */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Media Ownership
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
              7% of the sources are Independent News
            </p>
            <div className="flex items-center justify-center mb-6">
              <MultiRingDonutChart 
                data={ownershipData}
                centerText="36%"
                centerSubtext="Media Con."
                size={180}
                showColorBar={true}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {ownershipData.rings[0].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {/* Topic Insights */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
              Topic Insights
            </h3>
          </div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
            An interactive chart of the topics and subtopics that you read the most about
          </p>
          <div className="flex items-center justify-center mb-6">
            <MultiRingDonutChart 
              data={topicInsightsData}
              centerText="20%"
              centerSubtext="Politics"
              size={180}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {topicInsightsData.rings[1].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">{item.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Article Bias */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Article Bias
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
            When browsing stories you most frequently selected articles from news sources that are rated center.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex w-full h-6 rounded overflow-hidden">
              <div className="bg-blue-800" style={{ width: '1%' }} />
              <div className="bg-blue-600" style={{ width: '1%' }} />
              <div className="bg-blue-400" style={{ width: '31%' }} />
              <div className="bg-gray-500" style={{ width: '55%' }} />
              <div className="bg-red-400" style={{ width: '9%' }} />
              <div className="bg-red-600" style={{ width: '3%' }} />
              <div className="bg-red-800" style={{ width: '1%' }} />
            </div>
            <div className="flex justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
              <span>FAR LEFT</span>
              <span>LEFT</span>
              <span>LEAN LEFT</span>
              <span>CENTER</span>
              <span>LEAN RIGHT</span>
              <span>RIGHT</span>
              <span>FAR RIGHT</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-text-primary-light dark:text-text-primary-dark">
              <span>1%</span>
              <span>1%</span>
              <span>31%</span>
              <span>55%</span>
              <span>9%</span>
              <span>3%</span>
              <span>1%</span>
            </div>
          </div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            You've read 25% more articles than last week
          </p>
        </div>

        {/* Locality Bias */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Locality Bias
          </h3>
          <div className="text-center space-y-2 mb-6">
            <div className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {localityData.local}% Local
            </div>
            <div className="text-lg text-text-primary-light dark:text-text-primary-dark">
              {localityData.national}% National
            </div>
            <div className="text-lg text-text-primary-light dark:text-text-primary-dark">
              {localityData.international}% International
            </div>
          </div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
            When you read the news, only {localityData.local}% of your perspective is being informed by local sources
          </p>
        </div>

        {/* Blindspot Stories */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Blindspot Stories
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
            You've read 31% more blindspots for the right
          </p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-500 mb-2">65%</div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                ({blindspotData.leftBlindspots}) Left Blindspots
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500 mb-2">35%</div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                ({blindspotData.rightBlindspots}) Right Blindspots
              </div>
            </div>
          </div>
        </div>

        {/* Topic Insights */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Topic Insights
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
            An interactive chart of the topics and subtopics that you read the most about
          </p>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">28%</div>
            <div className="text-lg text-text-primary-light dark:text-text-primary-dark">Politics</div>
          </div>
        </div>

        {/* Countries Coverage */}
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Countries you've read news about
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
            You've read 44/179 countries
          </p>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 flex items-center justify-center mb-4">
            <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm">🗺️ World Map</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">Top stories in these locales</div>
            <div>
              <div className="text-primary-600 font-medium">Electric Vehicles · Detroit, US</div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">Ford recalls 870K F-150 pickups...</p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">72% Center coverage: 64 sources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center text-white mt-8">
        <h3 className="text-xl font-bold mb-2">Subscribe to Asha Premium to get all access</h3>
        <p className="mb-4">Go deep on all the details of your news consumption habits with My News Bias. Read. Analyze. Adjust. Think Freely.</p>
        <button className="bg-white text-primary-600 px-6 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
          Get Asha Premium
        </button>
      </div>
    </div>
  );
};

// Alerts Tab Component
const AlertsTab = ({ user }) => {
  const mockAlerts = [
    {
      id: 1,
      category: 'WORLD NEWS',
      title: "UAE Warns Israel's West Bank Annexation Would Cross 'Red Line' and End Regional Integration Efforts",
      coverage: '24% Center coverage, 38% Biased',
      date: 'Dec 30, 2024',
      image: '/api/placeholder/80/60'
    },
    {
      id: 2,
      category: 'US',
      title: "Iran's near-bomb-grade uranium stock grew before Israeli attack, IAEA says",
      coverage: '32% Center coverage, 46% Biased',
      date: 'Dec 30, 2024',
      image: '/api/placeholder/80/60'
    },
    {
      id: 3,
      category: 'TECH',
      title: "New Satellite Images Show Major Construction at Israel's Dimona Site, Linked to Suspected Nuclear Program",
      coverage: '28% Center coverage, 52% Biased',
      date: 'Dec 30, 2024',
      image: '/api/placeholder/80/60'
    },
    {
      id: 4,
      category: 'WORLD',
      title: "Xi Jinping says China is 'unstoppable' and world faces 'peace or war', as Putin and Kim join him for military parade",
      coverage: '31% Center coverage, 49% Biased',
      date: 'Dec 30, 2024',
      image: '/api/placeholder/80/60'
    },
    {
      id: 5,
      category: 'WORLD NEWS',
      title: "Trump claims Putin, Xi, Kim are conspiring against the US after military parade in China",
      coverage: '27% Center coverage, 53% Biased',
      date: 'Dec 30, 2024',
      image: '/api/placeholder/80/60'
    },
    {
      id: 6,
      category: 'WORLD NEWS',
      title: "Appeals court rules Trump cannot use Alien Enemies Act to deport members of Venezuelan gang",
      coverage: '29% Center coverage, 51% Biased',
      date: 'Dec 30, 2024',
      image: '/api/placeholder/80/60'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Alerts
        </h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Delete
          </button>
          <button className="px-4 py-2 bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Manage
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {mockAlerts.map((alert) => (
          <div key={alert.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex gap-4">
              {/* Alert Image */}
              <div className="flex-shrink-0">
                <div className="w-20 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Alert Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                    {alert.category}
                  </span>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {alert.date}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 leading-tight">
                  {alert.title}
                </h3>
                
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {alert.coverage}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-6">
        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Load More Alerts
        </button>
      </div>
    </div>
  );
};

// Discover Topics Tab Component
const DiscoverTopicsTab = ({ user }) => {
  const navigate = useNavigate();

  const handleDiscoverTopics = () => {
    // Navigate to For You page with discover tab active
    navigate('/?tab=discover');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Discover Topics
      </h1>
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto">
          <svg className="w-16 h-16 mx-auto mb-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            Discover New Topics
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Explore trending topics and expand your news interests with personalized recommendations.
          </p>
          <button 
            onClick={handleDiscoverTopics}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Explore Topics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
