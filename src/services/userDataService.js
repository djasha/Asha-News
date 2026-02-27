// User Data Service - Handles follow, save, and interests functionality
// This simulates database operations with localStorage for now

class UserDataService {
  constructor() {
    this.storageKeys = {
      followedSources: 'asha_followed_sources',
      followedTopics: 'asha_followed_topics',
      savedArticles: 'asha_saved_articles',
      readingHistory: 'asha_reading_history',
      userInterests: 'asha_user_interests'
    };
  }

  // Initialize user data structure
  initializeUserData(userId) {
    const userData = {
      userId,
      followedSources: [],
      followedTopics: [],
      savedArticles: [],
      readingHistory: [],
      interests: {
        topics: [],
        categories: [],
        biasPreference: 'balanced',
        sourceTypes: []
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`user_data_${userId}`, JSON.stringify(userData));
    return userData;
  }

  // Get user data
  getUserData(userId) {
    const stored = localStorage.getItem(`user_data_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.initializeUserData(userId);
  }

  // Update user data
  updateUserData(userId, updates) {
    const userData = this.getUserData(userId);
    const updatedData = {
      ...userData,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`user_data_${userId}`, JSON.stringify(updatedData));
    return updatedData;
  }

  // FOLLOW FUNCTIONALITY
  
  // Follow/unfollow a source
  toggleFollowSource(userId, source) {
    const userData = this.getUserData(userId);
    const isFollowing = userData.followedSources.some(s => s.id === source.id);
    
    let updatedSources;
    if (isFollowing) {
      updatedSources = userData.followedSources.filter(s => s.id !== source.id);
    } else {
      updatedSources = [...userData.followedSources, {
        ...source,
        followedAt: new Date().toISOString()
      }];
    }

    return this.updateUserData(userId, { followedSources: updatedSources });
  }

  // Follow/unfollow a topic
  toggleFollowTopic(userId, topic) {
    const userData = this.getUserData(userId);
    const isFollowing = userData.followedTopics.some(t => t.id === topic.id);
    
    let updatedTopics;
    if (isFollowing) {
      updatedTopics = userData.followedTopics.filter(t => t.id !== topic.id);
    } else {
      updatedTopics = [...userData.followedTopics, {
        ...topic,
        followedAt: new Date().toISOString()
      }];
    }

    return this.updateUserData(userId, { followedTopics: updatedTopics });
  }

  // Get followed sources
  getFollowedSources(userId) {
    const userData = this.getUserData(userId);
    return userData.followedSources || [];
  }

  // Get followed topics
  getFollowedTopics(userId) {
    const userData = this.getUserData(userId);
    return userData.followedTopics || [];
  }

  // Check if user follows a source
  isFollowingSource(userId, sourceId) {
    const followedSources = this.getFollowedSources(userId);
    return followedSources.some(s => s.id === sourceId);
  }

  // Check if user follows a topic
  isFollowingTopic(userId, topicId) {
    const followedTopics = this.getFollowedTopics(userId);
    return followedTopics.some(t => t.id === topicId);
  }

  // SAVE FUNCTIONALITY

  // Save/unsave an article
  toggleSaveArticle(userId, article) {
    const userData = this.getUserData(userId);
    const isSaved = userData.savedArticles.some(a => a.id === article.id);
    
    let updatedSaved;
    if (isSaved) {
      updatedSaved = userData.savedArticles.filter(a => a.id !== article.id);
    } else {
      updatedSaved = [...userData.savedArticles, {
        ...article,
        savedAt: new Date().toISOString()
      }];
    }

    return this.updateUserData(userId, { savedArticles: updatedSaved });
  }

  // Get saved articles
  getSavedArticles(userId, filters = {}) {
    const userData = this.getUserData(userId);
    let savedArticles = userData.savedArticles || [];

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      savedArticles = savedArticles.filter(a => 
        a.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.source) {
      savedArticles = savedArticles.filter(a => 
        a.source?.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    if (filters.dateRange) {
      const now = new Date();
      const cutoff = new Date(now.getTime() - filters.dateRange * 24 * 60 * 60 * 1000);
      savedArticles = savedArticles.filter(a => 
        new Date(a.savedAt) > cutoff
      );
    }

    return savedArticles.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }

  // Check if article is saved
  isArticleSaved(userId, articleId) {
    const savedArticles = this.getSavedArticles(userId);
    return savedArticles.some(a => a.id === articleId);
  }

  // READING HISTORY

  // Add article to reading history
  addToReadingHistory(userId, article) {
    const userData = this.getUserData(userId);
    const existingIndex = userData.readingHistory.findIndex(a => a.id === article.id);
    
    let updatedHistory;
    if (existingIndex !== -1) {
      // Update existing entry
      updatedHistory = [...userData.readingHistory];
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        lastReadAt: new Date().toISOString(),
        readCount: (updatedHistory[existingIndex].readCount || 1) + 1
      };
    } else {
      // Add new entry
      updatedHistory = [{
        ...article,
        readAt: new Date().toISOString(),
        lastReadAt: new Date().toISOString(),
        readCount: 1
      }, ...userData.readingHistory];
    }

    // Keep only last 1000 articles
    if (updatedHistory.length > 1000) {
      updatedHistory = updatedHistory.slice(0, 1000);
    }

    return this.updateUserData(userId, { readingHistory: updatedHistory });
  }

  // Get reading history
  getReadingHistory(userId, filters = {}) {
    const userData = this.getUserData(userId);
    let history = userData.readingHistory || [];

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      history = history.filter(a => 
        a.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.timeRange) {
      const now = new Date();
      let cutoff;
      
      switch (filters.timeRange) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      
      history = history.filter(a => new Date(a.lastReadAt) > cutoff);
    }

    return history.sort((a, b) => new Date(b.lastReadAt) - new Date(a.lastReadAt));
  }

  // INTERESTS MANAGEMENT

  // Update user interests
  updateInterests(userId, interests) {
    const userData = this.getUserData(userId);
    const updatedInterests = {
      ...userData.interests,
      ...interests,
      updatedAt: new Date().toISOString()
    };

    return this.updateUserData(userId, { interests: updatedInterests });
  }

  // Get user interests
  getInterests(userId) {
    const userData = this.getUserData(userId);
    return userData.interests || {
      topics: [],
      categories: [],
      biasPreference: 'balanced',
      sourceTypes: []
    };
  }

  // Add interest topic
  addInterestTopic(userId, topic) {
    const interests = this.getInterests(userId);
    if (!interests.topics.includes(topic)) {
      interests.topics.push(topic);
      return this.updateInterests(userId, interests);
    }
    return this.getUserData(userId);
  }

  // Remove interest topic
  removeInterestTopic(userId, topic) {
    const interests = this.getInterests(userId);
    interests.topics = interests.topics.filter(t => t !== topic);
    return this.updateInterests(userId, interests);
  }

  // ANALYTICS AND INSIGHTS

  // Get user reading analytics
  getReadingAnalytics(userId) {
    const history = this.getReadingHistory(userId);
    const savedArticles = this.getSavedArticles(userId);
    
    // Calculate bias exposure
    const biasExposure = {
      left: 0,
      center: 0,
      right: 0
    };

    history.forEach(article => {
      if (article.bias) {
        biasExposure[article.bias]++;
      }
    });

    // Calculate category preferences
    const categoryStats = {};
    history.forEach(article => {
      if (article.category) {
        categoryStats[article.category] = (categoryStats[article.category] || 0) + 1;
      }
    });

    // Calculate source diversity
    const uniqueSources = new Set(history.map(a => a.source)).size;
    
    return {
      totalArticlesRead: history.length,
      totalArticlesSaved: savedArticles.length,
      biasExposure,
      categoryPreferences: categoryStats,
      sourceDiversity: uniqueSources,
      averageReadingTime: this.calculateAverageReadingTime(history),
      readingStreak: this.calculateReadingStreak(history)
    };
  }

  // Calculate average reading time
  calculateAverageReadingTime(history) {
    if (history.length === 0) return 0;
    
    const totalMinutes = history.reduce((sum, article) => {
      const readTime = article.readTime || '0 min read';
      const minutes = parseInt(readTime.match(/\d+/)?.[0] || 0);
      return sum + minutes;
    }, 0);
    
    return Math.round(totalMinutes / history.length);
  }

  // Calculate reading streak
  calculateReadingStreak(history) {
    if (history.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const hasReadingOnDay = history.some(article => {
        const readDate = new Date(article.lastReadAt);
        return readDate >= dayStart && readDate < dayEnd;
      });
      
      if (hasReadingOnDay) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today might not have readings yet)
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  // PERSONALIZED RECOMMENDATIONS

  // Get personalized article recommendations
  getPersonalizedRecommendations(userId, availableArticles) {
    const interests = this.getInterests(userId);
    const followedTopics = this.getFollowedTopics(userId);
    const followedSources = this.getFollowedSources(userId);
    const history = this.getReadingHistory(userId);
    
    // Score articles based on user preferences
    const scoredArticles = availableArticles.map(article => {
      let score = 0;
      
      // Interest topics match
      if (interests.topics.some(topic => 
        article.title?.toLowerCase().includes(topic.toLowerCase()) ||
        article.summary?.toLowerCase().includes(topic.toLowerCase())
      )) {
        score += 3;
      }
      
      // Followed topics match
      if (followedTopics.some(topic => 
        article.category?.toLowerCase() === topic.name?.toLowerCase()
      )) {
        score += 2;
      }
      
      // Followed sources match
      if (followedSources.some(source => 
        article.source?.toLowerCase() === source.name?.toLowerCase()
      )) {
        score += 2;
      }
      
      // Bias preference match
      if (interests.biasPreference === 'balanced' && article.bias === 'center') {
        score += 1;
      } else if (interests.biasPreference === article.bias) {
        score += 1;
      }
      
      // Avoid recently read articles
      if (history.some(h => h.id === article.id)) {
        score -= 2;
      }
      
      return { ...article, recommendationScore: score };
    });
    
    // Sort by score and return top recommendations
    return scoredArticles
      .filter(article => article.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 20);
  }

  // Export user data (for backup/migration)
  exportUserData(userId) {
    return this.getUserData(userId);
  }

  // Import user data (for backup/migration)
  importUserData(userId, userData) {
    localStorage.setItem(`user_data_${userId}`, JSON.stringify({
      ...userData,
      lastUpdated: new Date().toISOString()
    }));
    return this.getUserData(userId);
  }

  // Clear all user data
  clearUserData(userId) {
    localStorage.removeItem(`user_data_${userId}`);
    return this.initializeUserData(userId);
  }
}

// Create singleton instance
const userDataService = new UserDataService();

export default userDataService;
