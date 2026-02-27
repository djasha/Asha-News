import React, { createContext, useContext, useReducer, useEffect } from 'react';
import userDataService from '../services/userDataService';
import { firebaseAuthService } from '../services/firebase';
import { API_BASE } from '../config/api';
import logger from '../utils/logger';

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

  // Listen to Firebase auth state changes
  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = firebaseAuthService.onAuthStateChange(async (firebaseUser) => {
      try {
        if (!mounted) return; // Prevent state updates if component unmounted
        
        if (firebaseUser) {
          // User is signed in
          const token = await firebaseUser.getIdToken();
          
          if (!mounted) return; // Check again after async operation
          
          // Fetch user role from backend
          let userRole = 'user';
          try {
            const roleResponse = await fetch(`${API_BASE}/users/role/${encodeURIComponent(firebaseUser.email)}`);
            const roleData = await roleResponse.json();
            if (roleData.success) {
              userRole = roleData.role;
            }
          } catch (err) {
            console.error('Error fetching user role:', err);
          }
          
          // Check if user exists in users list
          const allUsers = JSON.parse(localStorage.getItem('asha_all_users') || '[]');
          let existingUser = allUsers.find(u => u.id === firebaseUser.uid);
          
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: firebaseUser.displayName || firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: userRole, // Preserved from existing user or default to 'user'
            subscription: {
              tier: 'free',
              status: 'active',
              planName: 'Free'
            },
            verified: firebaseUser.emailVerified,
            createdAt: existingUser?.createdAt || new Date().toISOString()
          };
          
          // Sync with backend
          try {
            await fetch(`${API_BASE}/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firebase_uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                firstName: firebaseUser.displayName?.split(' ')[0] || '',
                lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: firebaseUser.photoURL
              })
            });
          } catch (err) {
            console.error('Error syncing user with backend:', err);
          }
          
          // Update users list for backwards compatibility
          if (!existingUser) {
            allUsers.push(user);
          } else {
            const index = allUsers.findIndex(u => u.id === firebaseUser.uid);
            allUsers[index] = { ...existingUser, ...user };
          }
          localStorage.setItem('asha_all_users', JSON.stringify(allUsers));
          
          localStorage.setItem('asha_token', token);
          localStorage.setItem('asha_user', JSON.stringify(user));
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user, token }
          });
        } else {
          // User is signed out
          if (!mounted) return;
          
          localStorage.removeItem('asha_token');
          localStorage.removeItem('asha_user');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Don't dispatch error to avoid infinite loops
        // Just log it for debugging
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Auth service functions
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await firebaseAuthService.signInWithEmail(email, password);
      
      if (result.success) {
        // Firebase auth state listener will handle the rest
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.error
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const displayName = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      const result = await firebaseAuthService.signUpWithEmail(
        userData.email,
        userData.password,
        displayName
      );
      
      if (result.success) {
        // Firebase auth state listener will handle the rest
        return { 
          success: true, 
          requiresVerification: false
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: result.error
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await firebaseAuthService.signOut();
      // Firebase auth state listener will handle clearing state
    } catch (error) {
      logger.error('Logout error:', error);
      // Force logout even if Firebase call fails
      localStorage.removeItem('asha_token');
      localStorage.removeItem('asha_user');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
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

  const loginWithGoogle = async () => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await firebaseAuthService.signInWithGoogle();
      
      if (result.success) {
        // Firebase auth state listener will handle the rest
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.error
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Google sign-in failed. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email) => {
    try {
      const result = await firebaseAuthService.resetPassword(email);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Password reset failed. Please try again.'
      };
    }
  };

  // Check if user has specific subscription tier
  const hasSubscription = (tier = 'premium') => {
    return state.user?.subscription?.tier === tier && 
           state.user?.subscription?.status === 'active';
  };

  // Note: hasFeatureAccess is defined inline in the value object below

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
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
    loginWithGoogle,
    resetPassword,
    updateUser,
    clearError,
    subscription: state.user?.subscription || null,
    toggleSaveArticle,
    addToReadingHistory,
    isArticleSaved,
    toggleFollowSource,
    isFollowingSource,
    toggleFollowTopic,
    isFollowingTopic,
    getSavedArticles,
    getReadingHistory,
    getFollowedSources,
    getFollowedTopics,
    updateInterests,
    getInterests,
    getReadingAnalytics,
    getPersonalizedRecommendations,
    checkUsageLimit,
    trackUsage,
    hasFeatureAccess: (feature) => {
      if (!state.user?.subscription) return false;
      const plan = state.user.subscription.planName?.toLowerCase();
      
      // Define feature access by plan
      const featureAccess = {
        'unlimited_ai_analysis': ['premium', 'pro'],
        'unlimited_fact_checking': ['premium', 'pro'],
        'advanced_bias_detection': ['premium', 'pro'],
        'export_reports': ['pro'],
        'api_access': ['pro'],
        'priority_support': ['premium', 'pro']
      };
      
      return featureAccess[feature]?.includes(plan) || false;
    }
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

// Note: Firebase handles token refresh automatically
// No need for custom token refresh logic

export default AuthContext;
