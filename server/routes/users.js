/**
 * User Management Routes
 * Handles user profiles, roles, and permissions.
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const contentRepository = require('../services/contentRepository');
const { authenticateToken } = require('../middleware/authMiddleware');

const isProduction = process.env.NODE_ENV === 'production';
const strictAuth = isProduction || process.env.STRICT_AUTH === 'true';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'admin@asha.news')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

const verifyToken = async (req, res, next) => {
  if (!strictAuth) return next();
  return authenticateToken(req, res, next);
};

const isAdminUser = (req) => {
  const email = String(req.user?.email || '').toLowerCase();
  return req.user?.role === 'admin' || ADMIN_EMAILS.includes(email);
};

const requireAdmin = async (req, res, next) => {
  if (!strictAuth) return next();
  if (!isAdminUser(req)) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

/**
 * Get user role by email
 * GET /api/users/role/:email
 */
router.get('/role/:email', verifyToken, async (req, res) => {
  try {
    const email = String(req.params.email || '').toLowerCase();

    // Do not expose privileged role lookup publicly.
    if (!req.user) {
      return res.json({ success: true, role: 'user' });
    }

    if (!isAdminUser(req) && String(req.user.email || '').toLowerCase() !== email) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (ADMIN_EMAILS.includes(email)) {
      return res.json({ success: true, role: 'admin' });
    }

    const users = await contentRepository.getItems('users', {
      filter: { email: { _eq: email } },
      limit: 1
    });

    return res.json({ success: true, role: users?.[0]?.role || 'user' });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user role');
    res.json({ success: true, role: 'user' });
  }
});

/**
 * Get user profile by id/provider id
 * GET /api/users/:uid
 */
router.get('/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;

    if (strictAuth && !isAdminUser(req) && req.user?.userId !== uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const userById = await contentRepository.getItemById('users', uid);
    if (userById) {
      return res.json({ success: true, user: userById });
    }

    const users = await contentRepository.getItems('users', {
      filter: { provider_id: { _eq: uid } },
      limit: 1
    });

    return res.json({ success: true, user: users?.[0] || null });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create or update user
 * POST /api/users
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      firebase_uid,
      provider_uid,
      provider = 'supabase',
      email,
      displayName,
      firstName,
      lastName,
      photoURL
    } = req.body;
    const effectiveProviderUid = provider_uid || firebase_uid;

    if (!effectiveProviderUid || !email) {
      return res.status(400).json({ success: false, error: 'provider_uid (or firebase_uid) and email are required' });
    }

    const emailLower = String(email).toLowerCase();
    if (strictAuth && !isAdminUser(req) && String(req.user?.email || '').toLowerCase() !== emailLower) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const existingUsers = await contentRepository.getItems('users', {
      filter: { email: { _eq: emailLower } },
      limit: 1
    });

    const role = ADMIN_EMAILS.includes(emailLower)
      ? 'admin'
      : (existingUsers?.[0]?.role || 'user');

    const userData = {
      email: emailLower,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      avatar_url: photoURL,
      provider,
      provider_id: effectiveProviderUid,
      role,
      status: 'active'
    };

    let user;
    if (existingUsers && existingUsers.length > 0) {
      user = await contentRepository.updateItem('users', existingUsers[0].id, userData);
    } else {
      user = await contentRepository.createItem('users', userData);
    }

    res.json({ success: true, user });
  } catch (error) {
    logger.error({ err: error }, 'Error creating/updating user');
    res.status(500).json({ success: false, error: error.message });
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

    let user = await contentRepository.getItemById('users', uid);
    if (!user) {
      const users = await contentRepository.getItems('users', {
        filter: { provider_id: { _eq: uid } },
        limit: 1
      });
      user = users?.[0] || null;
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = await contentRepository.updateItem('users', user.id, { role });
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
router.get('/', verifyToken, requireAdmin, async (req, res) => {
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

    const users = await contentRepository.getItems('users', {
      filter,
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      sort: '-created_at'
    });

    res.json({ success: true, users: users || [] });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching users');
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
