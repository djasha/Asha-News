/**
 * User Management Routes
 * Handles user profiles, roles, and permissions
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const DirectusService = require('../services/directusService');

// Simplified middleware for development
// TODO: Add Firebase Admin SDK verification for production
const verifyToken = async (req, res, next) => {
  // For now, allow all requests in development
  // In production, verify Firebase token here
  next();
};

// Middleware to check if user is admin
// For now, this is a placeholder - actual verification happens at API level
const requireAdmin = async (req, res, next) => {
  // In development, we rely on frontend authentication
  // In production, add proper token verification
  next();
};

// Initialize Directus service
const directus = new DirectusService();

// Predefined admin emails
// admin@asha.news is the MAIN ADMIN account
const ADMIN_EMAILS = [
  'admin@asha.news'  // Main Admin Account
];

/**
 * Get user profile by Firebase UID
 * GET /api/users/:uid
 */
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Try to get user from Directus
    const users = await directus.getItems('users', {
      filter: { firebase_uid: { _eq: uid } },
      limit: 1
    });
    
    if (users && users.length > 0) {
      return res.json({ success: true, user: users[0] });
    }
    
    // User not in Directus yet
    return res.json({ success: true, user: null });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get user role by email
 * GET /api/users/role/:email
 */
router.get('/role/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Check if email is in admin list
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.json({ success: true, role: 'admin' });
    }
    
    // Try to get user role from Directus
    const users = await directus.getItems('users', {
      filter: { email: { _eq: email } },
      fields: ['role'],
      limit: 1
    });
    
    if (users && users.length > 0) {
      return res.json({ success: true, role: users[0].role || 'user' });
    }
    
    // Default role
    return res.json({ success: true, role: 'user' });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user role');
    res.json({ success: true, role: 'user' }); // Default to user on error
  }
});

/**
 * Create or update user
 * POST /api/users
 */
router.post('/', async (req, res) => {
  try {
    logger.info('📥 POST /api/users - Received user sync request:', req.body);
    const { firebase_uid, email, displayName, firstName, lastName, photoURL } = req.body;
    
    if (!firebase_uid || !email) {
      logger.warn('Missing required fields: firebase_uid, email');
      return res.status(400).json({ success: false, error: 'firebase_uid and email are required' });
    }
    
    // Determine role
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
    
    // Check if user exists in app_users collection (not system users)
    logger.info('🔍 Checking if user exists:', firebase_uid);
    const existingUsers = await directus.getItems('app_users', {
      filter: { firebase_uid: { _eq: firebase_uid } },
      limit: 1
    });
    logger.info('📊 Existing users found:', existingUsers?.length || 0);
    
    const userData = {
      firebase_uid,
      email,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      photo_url: photoURL,
      role,
      status: 'active'
    };
    
    let user;
    if (existingUsers && existingUsers.length > 0) {
      // Update existing user
      logger.info('🔄 Updating existing user:', existingUsers[0].id);
      user = await directus.updateItem('app_users', existingUsers[0].id, userData);
      logger.info('✅ User updated successfully');
    } else {
      // Create new user
      logger.info('➕ Creating new user in Directus');
      user = await directus.createItem('app_users', userData);
      logger.info('✅ User created successfully:', user?.id);
    }
    
    res.json({ success: true, user });
  } catch (error) {
    logger.error({ err: error }, '❌ Error creating/updating user');
    logger.error({ err: error, details: error.response?.data }, 'Error creating/updating user details');
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

/**
 * Update user role (admin only)
 * PUT /api/users/:uid/role
 */
router.put('/:uid/role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;
    
    if (!['user', 'premium', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    
    // Get user from Directus
    const users = await directus.getItems('app_users', {
      filter: { firebase_uid: { _eq: uid } },
      limit: 1
    });
    
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Update user role
    const updatedUser = await directus.updateItem('app_users', users[0].id, { role });
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error({ err: error }, 'Error updating user role');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all users (admin only)
 * GET /api/users
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    let filter = {};
    if (search) {
      filter = {
        _or: [
          { email: { _contains: search } },
          { display_name: { _contains: search } },
          { first_name: { _contains: search } },
          { last_name: { _contains: search } }
        ]
      };
    }
    
    logger.info('Fetching users from Directus...');
    const users = await directus.getItems('app_users', {
      filter,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      sort: ['-date_created']
    });
    
    res.json({ success: true, users: users || [] });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching users');
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
