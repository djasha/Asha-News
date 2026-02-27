const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const AuthService = require('../services/authService');
const { authenticateToken, requireRole, rateLimit } = require('../middleware/authMiddleware');

const authService = new AuthService();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', rateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, password, firstName, lastName, subscription } = req.body;
    
    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      subscription
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    logger.error({ err: error }, 'Registration error');
    res.status(400).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', rateLimit(20, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.json({
      success: result.success,
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
      message: result.message
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    res.status(401).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    // Update refresh token cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: result.success,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Token refresh error');
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    await authService.logout(refreshToken);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Logout error');
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Get profile error');
    res.status(404).json({
      error: 'User not found',
      message: error.message
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, preferences } = req.body;
    
    const result = await authService.updateProfile(req.user.userId, {
      firstName,
      lastName,
      preferences
    });
    
    res.json(result);
    
  } catch (error) {
    logger.error({ err: error }, 'Profile update error');
    res.status(400).json({
      error: 'Profile update failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const result = await authService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error({ err: error }, 'Password change error');
    res.status(400).json({
      error: 'Password change failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', rateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await authService.requestPasswordReset(email);
    
    res.json(result);
    
  } catch (error) {
    logger.error({ err: error }, 'Password reset request error');
    res.status(500).json({
      error: 'Password reset request failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    const result = await authService.resetPassword(resetToken, newPassword);
    
    res.json(result);
    
  } catch (error) {
    logger.error({ err: error }, 'Password reset error');
    res.status(400).json({
      error: 'Password reset failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/stats
 * Get authentication statistics (admin only)
 */
router.get('/stats', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const stats = authService.getAuthStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Auth stats error');
    res.status(500).json({
      error: 'Failed to get auth statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/verify-token
 * Verify if token is valid
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token is required'
      });
    }
    
    const decoded = authService.verifyToken(token);
    
    res.json({
      success: true,
      valid: true,
      decoded: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        subscription: decoded.subscription,
        exp: decoded.exp
      }
    });
    
  } catch (error) {
    res.json({
      success: false,
      valid: false,
      error: error.message
    });
  }
});

module.exports = router;
