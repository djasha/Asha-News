import React, { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext();

// Default preferences
const defaultPreferences = {
  // Topics of Interest
  topics: {
    politics: true,
    technology: true,
    business: false,
    sports: false,
    entertainment: false,
    health: false,
    science: false,
    world: true,
    climate: false,
    education: false
  },
  
  // Reading Balance (0 = diversity, 100 = personalization)
  readingBalance: 70,
  
  // Notifications
  notifications: {
    breakingNews: true,
    dailyDigest: true,
    topicAlerts: false,
    biasAlerts: true,
    weeklyReport: false
  },
  
  // Display Settings
  display: {
    darkMode: false,
    textSize: 'medium', // small, medium, large
    compactMode: false,
    showImages: true,
    autoPlayVideos: false
  },
  
  // Bias Settings
  biasSettings: {
    defaultFilter: 'all', // all, left, center, right
    showBiasIndicators: true,
    highlightBiasConflicts: true,
    balanceRecommendations: true
  },
  
  // Mobile-specific
  mobile: {
    hapticFeedback: true,
    oneHandedMode: false,
    swipeGestures: true,
    bottomNavigation: true
  },
  
  // Setup
  isFirstTime: true,
  setupCompleted: false,
  lastUpdated: null
};

// Storage utilities
const STORAGE_KEY = 'asha_news_preferences';

const saveToStorage = (preferences) => {
  try {
    const dataToSave = {
      ...preferences,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.warn('Failed to save preferences to localStorage:', error);
    return false;
  }
};

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new preference additions
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load preferences from localStorage:', error);
  }
  return defaultPreferences;
};

const exportPreferences = (preferences) => {
  const dataStr = JSON.stringify(preferences, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `asha-news-preferences-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const importPreferences = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        // Validate and merge with defaults
        const merged = { ...defaultPreferences, ...imported };
        resolve(merged);
      } catch (error) {
        reject(new Error('Invalid preferences file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Haptic feedback simulation
const triggerHaptic = (type = 'light') => {
  if (window.navigator && window.navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 100, 50]
    };
    window.navigator.vibrate(patterns[type] || patterns.light);
  }
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    setPreferences(loaded);
    setIsLoading(false);
  }, []);

  // Auto-save preferences when they change
  useEffect(() => {
    if (!isLoading && hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveToStorage(preferences);
        setHasUnsavedChanges(false);
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [preferences, isLoading, hasUnsavedChanges]);

  const updatePreferences = (updates, triggerHapticFeedback = true) => {
    setPreferences(prev => {
      const updated = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      return updated;
    });
    setHasUnsavedChanges(true);
    
    if (triggerHapticFeedback && preferences.mobile.hapticFeedback) {
      triggerHaptic('light');
    }
  };

  const updateTopicPreference = (topic, enabled) => {
    updatePreferences(prev => ({
      ...prev,
      topics: {
        ...prev.topics,
        [topic]: enabled
      }
    }));
  };

  const updateNotificationPreference = (type, enabled) => {
    updatePreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: enabled
      }
    }));
  };

  const updateDisplayPreference = (setting, value) => {
    updatePreferences(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [setting]: value
      }
    }));
  };

  const updateBiasPreference = (setting, value) => {
    updatePreferences(prev => ({
      ...prev,
      biasSettings: {
        ...prev.biasSettings,
        [setting]: value
      }
    }));
  };

  const updateMobilePreference = (setting, value) => {
    updatePreferences(prev => ({
      ...prev,
      mobile: {
        ...prev.mobile,
        [setting]: value
      }
    }));
  };

  const completeSetup = () => {
    updatePreferences({
      isFirstTime: false,
      setupCompleted: true
    });
    triggerHaptic('success');
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    saveToStorage(defaultPreferences);
    triggerHaptic('medium');
  };

  const savePreferences = () => {
    const success = saveToStorage(preferences);
    setHasUnsavedChanges(false);
    triggerHaptic(success ? 'success' : 'error');
    return success;
  };

  const getFilteredTopics = () => {
    return Object.entries(preferences.topics)
      .filter(([_, enabled]) => enabled)
      .map(([topic, _]) => topic);
  };

  const shouldShowArticle = (article) => {
    const selectedTopics = getFilteredTopics();
    
    // If no topics selected, show all
    if (selectedTopics.length === 0) return true;
    
    // Check if article topic matches selected topics
    const articleTopic = article.topic?.toLowerCase() || '';
    return selectedTopics.some(topic => 
      articleTopic.includes(topic) || topic.includes(articleTopic)
    );
  };

  const value = {
    preferences,
    isLoading,
    hasUnsavedChanges,
    updatePreferences,
    updateTopicPreference,
    updateNotificationPreference,
    updateDisplayPreference,
    updateBiasPreference,
    updateMobilePreference,
    completeSetup,
    resetPreferences,
    savePreferences,
    exportPreferences: () => exportPreferences(preferences),
    importPreferences,
    getFilteredTopics,
    shouldShowArticle,
    triggerHaptic
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export default PreferencesContext;
