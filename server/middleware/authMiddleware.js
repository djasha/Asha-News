const AuthService = require('../services/authService');
const queryBridge = require('../db/queryBridge');
const logger = require('../utils/logger');

const authService = new AuthService();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'admin@asha.news')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function verifySupabaseToken(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !token) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) return null;
    const supabaseUser = await response.json();

    let role = 'user';
    let subscription = 'free';

    try {
      const encodedEmail = encodeURIComponent(String(supabaseUser.email || '').toLowerCase());
      const users = await queryBridge(`/items/users?filter[email][_eq]=${encodedEmail}&limit=1`);
      const dbUser = Array.isArray(users?.data) ? users.data[0] : null;
      if (dbUser?.role) role = dbUser.role;
      if (dbUser?.subscription) subscription = dbUser.subscription;
    } catch (lookupError) {
      logger.warn({ err: lookupError }, 'Failed to enrich Supabase user from DB');
    }

    return {
      userId: supabaseUser.id,
      email: supabaseUser.email,
      role,
      subscription,
      provider: 'supabase',
      supabase_user: supabaseUser
    };
  } catch (error) {
    logger.warn({ err: error }, 'Supabase token verification failed');
    return null;
  }
}

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn({ path: req.path, method: req.method }, 'Missing bearer token');
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  const supabaseDecoded = await verifySupabaseToken(token);
  if (supabaseDecoded) {
    req.user = supabaseDecoded;
    return next();
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    logger.warn({ path: req.path, method: req.method, err: error?.message }, 'Token verification failed');
    return res.status(403).json({
      error: 'Invalid token',
      message: error.message
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}, your role: ${userRole}`
      });
    }

    next();
  };
};

const isAdminUser = (user) => {
  const email = String(user?.email || '').toLowerCase();
  return user?.role === 'admin' || ADMIN_EMAILS.includes(email);
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    logger.warn({ path: req.path, method: req.method }, 'Admin access denied: unauthenticated');
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate first'
    });
  }

  if (!isAdminUser(req.user)) {
    logger.warn({ path: req.path, method: req.method, user: req.user?.email || req.user?.userId || null }, 'Admin access denied: insufficient role');
    return res.status(403).json({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    });
  }

  next();
};

/**
 * Middleware to check subscription level
 */
const requireSubscription = (subscriptions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    const userSubscription = req.user.subscription;
    const allowedSubscriptions = Array.isArray(subscriptions) ? subscriptions : [subscriptions];

    if (!allowedSubscriptions.includes(userSubscription)) {
      return res.status(403).json({
        error: 'Subscription upgrade required',
        message: `Required subscription: ${allowedSubscriptions.join(' or ')}, your subscription: ${userSubscription}`,
        upgrade_url: '/subscription/upgrade'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - sets user if token is valid but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const supabaseDecoded = await verifySupabaseToken(token);
    if (supabaseDecoded) {
      req.user = supabaseDecoded;
      return next();
    }

    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token invalid but continue without user
      req.user = null;
    }
  }

  next();
};

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      requests.set(ip, timestamps.filter(time => time > windowStart));
      if (requests.get(ip).length === 0) {
        requests.delete(ip);
      }
    }

    // Check current requests
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes`,
        retry_after: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  isAdminUser,
  requireSubscription,
  optionalAuth,
  rateLimit
};
