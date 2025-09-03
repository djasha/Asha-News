import React, { createContext, useContext, useReducer, useEffect } from 'react';
import userDataService from '../services/userDataService';

// Auth state management
const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const token = localStorage.getItem('asha_token');
    const user = localStorage.getItem('asha_user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: parsedUser, token }
        });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('asha_token');
        localStorage.removeItem('asha_user');
      }
    }
  }, []);

  // Auth service functions
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      // TODO: Replace with actual API call
      const response = await mockLogin(email, password);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Store in localStorage
        localStorage.setItem('asha_token', token);
        localStorage.setItem('asha_user', JSON.stringify(user));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.error
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: 'Network error. Please try again.'
      });
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      // TODO: Replace with actual API call
      const response = await mockRegister(userData);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Store in localStorage
        localStorage.setItem('asha_token', token);
        localStorage.setItem('asha_user', JSON.stringify(user));
        
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user, token }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: response.error
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: 'Network error. Please try again.'
      });
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('asha_token');
    localStorage.removeItem('asha_user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('asha_user', JSON.stringify(updatedUser));
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific subscription tier
  const hasSubscription = (tier = 'premium') => {
    return state.user?.subscription?.tier === tier && 
           state.user?.subscription?.status === 'active';
  };

  // Check if user has access to feature
  const hasFeatureAccess = (feature) => {
    if (!state.isAuthenticated) {
      return FREE_FEATURES.includes(feature);
    }
    
    if (hasSubscription('pro')) {
      return PRO_FEATURES.includes(feature);
    }
    
    if (hasSubscription('premium')) {
      return PREMIUM_FEATURES.includes(feature);
    }
    
    return FREE_FEATURES.includes(feature);
  };

  // Check daily usage limits
  const checkUsageLimit = (feature) => {
    if (hasSubscription()) return { allowed: true };
    
    const today = new Date().toDateString();
    const usage = state.user?.dailyUsage?.[today] || {};
    
    switch (feature) {
      case 'article_view':
        return {
          allowed: (usage.articles || 0) < 10,
          current: usage.articles || 0,
          limit: 10
        };
      default:
        return { allowed: true };
    }
  };

  // Track usage for free tier users
  const trackUsage = (feature, data = {}) => {
    if (hasSubscription()) return; // No tracking for premium users
    
    const today = new Date().toDateString();
    const currentUsage = state.user?.dailyUsage?.[today] || {};
    
    let updatedUsage = { ...currentUsage };
    
    switch (feature) {
      case 'article_view':
        updatedUsage.articles = (updatedUsage.articles || 0) + 1;
        break;
      case 'search':
        updatedUsage.searches = (updatedUsage.searches || 0) + 1;
        break;
      default:
        break;
    }
    
    const updatedUser = {
      ...state.user,
      dailyUsage: {
        ...state.user?.dailyUsage,
        [today]: updatedUsage
      }
    };
    
    // Update localStorage and state
    localStorage.setItem('asha_user', JSON.stringify(updatedUser));
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: { dailyUsage: updatedUser.dailyUsage }
    });
  };

  // User data functions
  const toggleFollowSource = (source) => {
    if (state.user) {
      return userDataService.toggleFollowSource(state.user.id, source);
    }
  };

  const toggleFollowTopic = (topic) => {
    if (state.user) {
      return userDataService.toggleFollowTopic(state.user.id, topic);
    }
  };

  const toggleSaveArticle = (article) => {
    if (state.user) {
      return userDataService.toggleSaveArticle(state.user.id, article);
    }
  };

  const addToReadingHistory = (article) => {
    if (state.user) {
      return userDataService.addToReadingHistory(state.user.id, article);
    }
  };

  const getSavedArticles = (filters) => {
    if (state.user) {
      return userDataService.getSavedArticles(state.user.id, filters);
    }
    return [];
  };

  const getReadingHistory = (filters) => {
    if (state.user) {
      return userDataService.getReadingHistory(state.user.id, filters);
    }
    return [];
  };

  const getFollowedSources = () => {
    if (state.user) {
      return userDataService.getFollowedSources(state.user.id);
    }
    return [];
  };

  const getFollowedTopics = () => {
    if (state.user) {
      return userDataService.getFollowedTopics(state.user.id);
    }
    return [];
  };

  const updateInterests = (interests) => {
    if (state.user) {
      return userDataService.updateInterests(state.user.id, interests);
    }
  };

  const getInterests = () => {
    if (state.user) {
      return userDataService.getInterests(state.user.id);
    }
    return { topics: [], categories: [], biasPreference: 'balanced', sourceTypes: [] };
  };

  const getReadingAnalytics = () => {
    if (state.user) {
      return userDataService.getReadingAnalytics(state.user.id);
    }
    return null;
  };

  const getPersonalizedRecommendations = (availableArticles) => {
    if (state.user) {
      return userDataService.getPersonalizedRecommendations(state.user.id, availableArticles);
    }
    return availableArticles;
  };

  const isFollowingSource = (sourceId) => {
    if (state.user) {
      return userDataService.isFollowingSource(state.user.id, sourceId);
    }
    return false;
  };

  const isFollowingTopic = (topicId) => {
    if (state.user) {
      return userDataService.isFollowingTopic(state.user.id, topicId);
    }
    return false;
  };

  const isArticleSaved = (articleId) => {
    if (state.user) {
      return userDataService.isArticleSaved(state.user.id, articleId);
    }
    return false;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasSubscription,
    hasFeatureAccess,
    checkUsageLimit,
    trackUsage,
    // User data functions
    toggleFollowSource,
    toggleFollowTopic,
    toggleSaveArticle,
    addToReadingHistory,
    getSavedArticles,
    getReadingHistory,
    getFollowedSources,
    getFollowedTopics,
    updateInterests,
    getInterests,
    getReadingAnalytics,
    getPersonalizedRecommendations,
    isFollowingSource,
    isFollowingTopic,
    isArticleSaved
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Feature definitions
const FREE_FEATURES = [
  'basic_feed',
  'basic_bias_analysis',
  'topic_filtering',
  'article_view' // limited to 10/day
];

const PREMIUM_FEATURES = [
  ...FREE_FEATURES,
  'unlimited_articles',
  'advanced_filtering',
  'bias_analytics',
  'blindspot_detection',
  'saved_articles',
  'email_alerts',
  'reading_history'
];

const PRO_FEATURES = [
  ...PREMIUM_FEATURES,
  'api_access',
  'export_functionality',
  'advanced_analytics',
  'priority_support'
];

// Mock authentication functions (replace with real API calls)
const mockLogin = async (email, password) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation
  if (email === 'admin@asha.news' && password === 'admin123') {
    return {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'admin@asha.news',
          name: 'Admin User',
          role: 'admin',
          subscription: {
            tier: 'pro',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          preferences: {
            topics: ['Politics', 'Technology', 'International'],
            biasPreference: 'balanced',
            emailAlerts: true
          },
          createdAt: new Date().toISOString()
        },
        token: 'mock-jwt-token-admin'
      }
    };
  }
  
  if (email === 'user@example.com' && password === 'password123') {
    return {
      success: true,
      data: {
        user: {
          id: '2',
          email: 'user@example.com',
          name: 'Test User',
          role: 'user',
          subscription: {
            tier: 'free',
            status: 'active'
          },
          preferences: {
            topics: ['Technology', 'Science'],
            biasPreference: 'balanced',
            emailAlerts: false
          },
          dailyUsage: {},
          createdAt: new Date().toISOString()
        },
        token: 'mock-jwt-token-user'
      }
    };
  }
  
  return {
    success: false,
    error: 'Invalid email or password'
  };
};

const mockRegister = async (userData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation
  if (userData.email && userData.password && userData.name) {
    return {
      success: true,
      data: {
        user: {
          id: Date.now().toString(),
          email: userData.email,
          name: userData.name,
          role: 'user',
          subscription: {
            tier: 'free',
            status: 'active'
          },
          preferences: {
            topics: [],
            biasPreference: 'balanced',
            emailAlerts: false
          },
          dailyUsage: {},
          createdAt: new Date().toISOString()
        },
        token: `mock-jwt-token-${Date.now()}`
      }
    };
  }
  
  return {
    success: false,
    error: 'Please fill in all required fields'
  };
};

export default AuthContext;
