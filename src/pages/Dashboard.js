import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import useUserRole from '../hooks/useUserRole';
import { API_BASE } from '../config/api';
import { buildAuthHeaders } from '../utils/authHeaders';

// Bias Donut Chart Component
const BiasDonutChart = ({ data }) => {
  const total = data.left + data.center + data.right;
  const leftAngle = (data.left / total) * 360;
  const centerAngle = (data.center / total) * 360;
  const rightAngle = (data.right / total) * 360;

  const createPath = (startAngle, endAngle, radius = 80, innerRadius = 50) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    
    const x1 = 100 + radius * Math.cos(start);
    const y1 = 100 + radius * Math.sin(start);
    const x2 = 100 + radius * Math.cos(end);
    const y2 = 100 + radius * Math.sin(end);
    
    const x3 = 100 + innerRadius * Math.cos(end);
    const y3 = 100 + innerRadius * Math.sin(end);
    const x4 = 100 + innerRadius * Math.cos(start);
    const y4 = 100 + innerRadius * Math.sin(start);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  let currentAngle = 0;
  const leftPath = createPath(currentAngle, currentAngle + leftAngle);
  currentAngle += leftAngle;
  const centerPath = createPath(currentAngle, currentAngle + centerAngle);
  currentAngle += centerAngle;
  const rightPath = createPath(currentAngle, currentAngle + rightAngle);

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <path d={leftPath} fill="#3b82f6" className="hover:opacity-80 transition-opacity" />
      <path d={centerPath} fill="#6b7280" className="hover:opacity-80 transition-opacity" />
      <path d={rightPath} fill="#ef4444" className="hover:opacity-80 transition-opacity" />
      <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-text-primary-light dark:fill-text-primary-dark">
        Bias
      </text>
      <text x="100" y="115" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-text-secondary-light dark:fill-text-secondary-dark">
        Distribution
      </text>
    </svg>
  );
};

// Category Donut Chart Component
const CategoryDonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.percentage, 0);
  
  const createPath = (startAngle, endAngle, radius = 80, innerRadius = 50) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    
    const x1 = 100 + radius * Math.cos(start);
    const y1 = 100 + radius * Math.sin(start);
    const x2 = 100 + radius * Math.cos(end);
    const y2 = 100 + radius * Math.sin(end);
    
    const x3 = 100 + innerRadius * Math.cos(end);
    const y3 = 100 + innerRadius * Math.sin(end);
    const x4 = 100 + innerRadius * Math.cos(start);
    const y4 = 100 + innerRadius * Math.sin(start);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  let currentAngle = 0;
  const paths = data.map((item, index) => {
    const angle = (item.percentage / total) * 360;
    const path = createPath(currentAngle, currentAngle + angle);
    currentAngle += angle;
    return { path, color: item.color, type: item.type };
  });

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {paths.map((item, index) => (
        <path 
          key={index}
          d={item.path} 
          fill={item.color} 
          className="hover:opacity-80 transition-opacity"
          title={item.type}
        />
      ))}
      <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-text-primary-light dark:fill-text-primary-dark">
        Topics
      </text>
      <text x="100" y="115" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-text-secondary-light dark:fill-text-secondary-dark">
        Breakdown
      </text>
    </svg>
  );
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useUserRole();
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

  // Filter sidebar items based on active tab
  const filteredSidebarItems = sidebarItems.filter(item => item.tab === activeTab);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border-b border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
                <span>Back to Home</span>
              </Link>
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors"
                >
                  Admin Settings
                </button>
              )}
              <span className="text-text-secondary-light dark:text-text-secondary-dark">
                Welcome, {user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border-b border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {topTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:border-border-light dark:hover:border-border-dark'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Only show for account tab */}
          {activeTab === 'account' && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-4">
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
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Account Information Tab Component
const AccountInformationTab = ({ user }) => {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState({ name: false, email: false });
  const [formData, setFormData] = useState({
    name: user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'User',
    email: user?.email || ''
  });
  const [saveStatus, setSaveStatus] = useState({ name: '', email: '' });

  const handleEdit = (field) => {
    setIsEditing(prev => ({ ...prev, [field]: !prev[field] }));
    setSaveStatus(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async (field) => {
    setSaveStatus(prev => ({ ...prev, [field]: 'saving' }));
    
    try {
      if (field === 'name') {
        // Update Firebase profile
        const { firebaseAuthService } = await import('../services/firebase');
        await firebaseAuthService.updateUserProfile({ displayName: formData.name });
        const token = await firebaseAuthService.getUserToken();
        const headers = await buildAuthHeaders({
          'Content-Type': 'application/json'
        }, token);
        
        // Update backend
        await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            provider_uid: authUser?.id,
            firebase_uid: authUser?.id,
            provider: 'supabase',
            email: authUser?.email,
            displayName: formData.name,
            firstName: formData.name.split(' ')[0],
            lastName: formData.name.split(' ').slice(1).join(' ')
          })
        });
      }
      
      setSaveStatus(prev => ({ ...prev, [field]: 'saved' }));
      setIsEditing(prev => ({ ...prev, [field]: false }));
      
      // Clear success message after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [field]: '' }));
      }, 2000);
      
      // Reload to update UI
      window.location.reload();
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      setSaveStatus(prev => ({ ...prev, [field]: 'error' }));
    }
  };

  const signInMethods = [
    { name: 'Google', connected: true, icon: LinkIcon },
    { name: 'Facebook', connected: false, icon: LinkIcon },
    { name: 'Twitter', connected: false, icon: LinkIcon }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Account Information
      </h1>

      {/* Name */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Name
            </h3>
            {isEditing.name ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark"
                />
                <button
                  onClick={() => handleSave('name')}
                  disabled={saveStatus.name === 'saving'}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus.name === 'saving' ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => handleEdit('name')}
                  className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {formData.name}
              </p>
            )}
          </div>
          {!isEditing.name && (
            <button
              onClick={() => handleEdit('name')}
              className="flex items-center gap-2 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
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
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Email
            </h3>
            {isEditing.email ? (
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark"
                />
                <button
                  onClick={() => handleSave('email')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => handleEdit('email')}
                  className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {formData.email}
              </p>
            )}
          </div>
          {!isEditing.email && (
            <button
              onClick={() => handleEdit('email')}
              className="flex items-center gap-2 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Connected Accounts
        </h3>
        <div className="space-y-3">
          {signInMethods.map((method) => (
            <div key={method.name} className="flex items-center justify-between p-3 border border-border-light dark:border-border-dark rounded-lg">
              <div className="flex items-center gap-3">
                <method.icon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" aria-hidden="true" />
                <span className="text-text-primary-light dark:text-text-primary-dark">{method.name}</span>
              </div>
              <button className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                method.connected
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30'
              }`}>
                {method.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <button 
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
        >
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


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Preferences
      </h1>

      {/* Appearance */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Appearance
        </h3>
        <div className="space-y-2">
          <RadioOption
            name="appearance"
            value="light"
            checked={preferences.appearance === 'light'}
            onChange={(e) => handlePreferenceChange('appearance', e.target.value)}
          >
            Light Mode
          </RadioOption>
          <RadioOption
            name="appearance"
            value="dark"
            checked={preferences.appearance === 'dark'}
            onChange={(e) => handlePreferenceChange('appearance', e.target.value)}
          >
            Dark Mode
          </RadioOption>
          <RadioOption
            name="appearance"
            value="system"
            checked={preferences.appearance === 'system'}
            onChange={(e) => handlePreferenceChange('appearance', e.target.value)}
          >
            System Default
          </RadioOption>
        </div>
      </div>

      {/* Source Sorting */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Source Sorting
        </h3>
        <div className="space-y-2">
          <RadioOption
            name="sourceSort"
            value="most-recent"
            checked={preferences.sourceSort === 'most-recent'}
            onChange={(e) => handlePreferenceChange('sourceSort', e.target.value)}
          >
            Sort By Most Recent
          </RadioOption>
          <RadioOption
            name="sourceSort"
            value="popularity"
            checked={preferences.sourceSort === 'popularity'}
            onChange={(e) => handlePreferenceChange('sourceSort', e.target.value)}
          >
            Sort By Popularity
          </RadioOption>
        </div>
      </div>

      {/* Notice */}
      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
        Notice: Changes here will only affect articles on the same page
      </div>
    </div>
  );
};

// My News Bias Tab Component
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
  ];

  const categoryData = {
    rings: [
      [
        { type: 'Politics', percentage: 45, color: '#3b82f6' },
        { type: 'Technology', percentage: 14, color: '#10b981' },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
          My News Bias
        </h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-primary-light dark:text-text-primary-dark"
        >
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Bias Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Bias Distribution
          </h3>
          <div className="flex items-center justify-center mb-6">
            <BiasDonutChart data={biasData} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-600 dark:text-blue-400">Left</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{biasData.left}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Center</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{biasData.center}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-600 dark:text-red-400">Right</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{biasData.right}%</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Reading Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Stories Read</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{biasData.stories}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Articles Read</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{biasData.articles}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Timeline */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Reading Activity Over Time
        </h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {timelineData.map((point, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-primary-500 dark:bg-primary-400 rounded-t-sm transition-all hover:bg-primary-600 dark:hover:bg-primary-300"
                style={{ height: `${(point.value / 45) * 100}%` }}
                title={`${point.date}: ${point.value} articles`}
              ></div>
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2 transform -rotate-45 origin-left">
                {point.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Topics Read
          </h3>
          <div className="flex items-center justify-center mb-6">
            <CategoryDonutChart data={categoryData.rings[0]} />
          </div>
          <div className="space-y-3">
            {categoryData.rings[0].map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-text-primary-light dark:text-text-primary-dark">{category.type}</span>
                </div>
                <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{category.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Geographic Coverage
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Local</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{localityData.local}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">National</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{localityData.national}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">International</span>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{localityData.international}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blindspots Analysis */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Potential Blindspots
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {blindspotData.leftBlindspots}
            </div>
            <div className="text-text-secondary-light dark:text-text-secondary-dark">
              Left-leaning stories you might have missed
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {blindspotData.rightBlindspots}
            </div>
            <div className="text-text-secondary-light dark:text-text-secondary-dark">
              Right-leaning stories you might have missed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alerts Tab Component
const AlertsTab = ({ user }) => {
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  React.useEffect(() => {
    let isActive = true;

    const loadAlerts = async () => {
      try {
        const response = await fetch('/api/cms/breaking-news');
        const payload = response.ok ? await response.json() : { data: [] };
        const items = Array.isArray(payload?.data) ? payload.data : [];

        const mapped = items.map((item) => ({
          id: item.id,
          category: (item.category || item.topic || 'Breaking').toUpperCase(),
          title: item.title || item.headline || 'Untitled alert',
          coverage: item.summary || item.description || 'Breaking update available.',
          date: item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
        }));

        if (!isActive) return;
        setAlerts(mapped);
      } catch (error) {
        console.error('Failed to load alerts:', error);
        if (!isActive) return;
        setAlerts([]);
      } finally {
        if (isActive) setLoadingAlerts(false);
      }
    };

    loadAlerts();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Alerts
      </h1>

      <div className="space-y-4">
        {loadingAlerts && (
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Loading alerts...
          </div>
        )}
        {!loadingAlerts && alerts.length === 0 && (
          <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            No alerts available.
          </div>
        )}
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">
                  {alert.category}
                </div>
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
                  {alert.title}
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {alert.coverage}
                </p>
                {alert.date && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">{alert.date}</p>
                )}
              </div>
            </div>
          </div>
        ))}
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
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
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

// Subscription Tab Component
const SubscriptionTab = ({ user }) => {
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
              {subscriptionTier === 'free' ? 'Limited features' : 'Full access to all features'}
            </p>
          </div>
          {subscriptionTier === 'free' && (
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
              Upgrade
            </button>
          )}
        </div>
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

export default Dashboard;
