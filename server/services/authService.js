const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const queryBridge = require('../db/queryBridge');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
    this.saltRounds = 12;

    this.users = new Map();
    this.refreshTokens = new Map();
    this.passwordResetTokens = new Map();
    
    // Initialize with admin user
    this.initializeAdminUser();
  }

  /**
   * Database query helper (replaces Directus HTTP calls)
   */
  async directusFetch(endpoint, options = {}) {
    return queryBridge(endpoint, options);
  }

  /**
   * Initialize default admin user in Directus
   */
  async initializeAdminUser() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@asha.news';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    try {
      // Check if admin user already exists
      const existingUsers = await this.directusFetch(`/items/users?filter[email][_eq]=${adminEmail}`);
      
      if (existingUsers.data.length === 0) {
        // Create admin user
        await this.directusFetch('/items/users', {
          method: 'POST',
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            subscription: 'pro',
            status: 'active',
            verified: true,
            preferences: {
              theme: 'light',
              notifications: true,
              biasAlerts: true,
              newsletter: true
            }
          })
        });
        logger.info('✅ Admin user created in Directus');
      }
    } catch (error) {
      logger.error('Failed to initialize admin user:', error.message);
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Registration result
   */
  async register(userData) {
    const { email, password, firstName, lastName, subscription = 'free' } = userData;
    
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      throw new Error('Email, password, first name, and last name are required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    // Check if user already exists in Directus
    const existingUsers = await this.directusFetch(`/items/users?filter[email][_eq]=${email.toLowerCase()}`);
    if (existingUsers.data.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Create user in Directus
    const newUser = await this.directusFetch('/items/users', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase(),
        password: password, // Directus will hash this automatically
        first_name: firstName,
        last_name: lastName,
        role: 'user',
        subscription,
        status: 'active',
        verified: false,
        preferences: {
          theme: 'light',
          notifications: true,
          biasAlerts: true,
          newsletter: false
        }
      })
    });

    // Generate verification token (in production, send email)
    const verificationToken = this.generateVerificationToken(newUser.data.id);

    return {
      success: true,
      user: this.sanitizeUser(newUser.data),
      verificationToken, // In production, don't return this - send via email
      message: 'User registered successfully. Please verify your email.'
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} Login result with tokens
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Get user from Directus
    const users = await this.directusFetch(`/items/users?filter[email][_eq]=${email.toLowerCase()}`);
    if (users.data.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users.data[0];

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Verify password by comparing with stored hash
    // Directus uses Argon2 for password hashing, not bcrypt
    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.directusFetch(`/items/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_login: new Date().toISOString() })
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in Directus
    await this.directusFetch('/items/refresh_tokens', {
      method: 'POST',
      body: JSON.stringify({
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: this.jwtExpiresIn
      },
      message: 'Login successful'
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    // Get token from Directus
    const tokens = await this.directusFetch(`/items/refresh_tokens?filter[token][_eq]=${refreshToken}`);
    if (tokens.data.length === 0) {
      throw new Error('Invalid refresh token');
    }

    const tokenData = tokens.data[0];

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires_at)) {
      await this.directusFetch(`/items/refresh_tokens/${tokenData.id}`, { method: 'DELETE' });
      throw new Error('Refresh token expired');
    }

    // Get user from Directus
    const user = await this.directusFetch(`/items/users/${tokenData.user_id}`);
    if (!user.data) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user.data);
    const newRefreshToken = this.generateRefreshToken(user.data);

    // Remove old refresh token and store new one
    await this.directusFetch(`/items/refresh_tokens/${tokenData.id}`, { method: 'DELETE' });
    await this.directusFetch('/items/refresh_tokens', {
      method: 'POST',
      body: JSON.stringify({
        token: newRefreshToken,
        user_id: user.data.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    });

    return {
      success: true,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.jwtExpiresIn
      }
    };
  }

  /**
   * Logout user
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Object} Logout result
   */
  async logout(refreshToken) {
    if (refreshToken) {
      try {
        const tokens = await this.directusFetch(`/items/refresh_tokens?filter[token][_eq]=${refreshToken}`);
        if (tokens.data.length > 0) {
          await this.directusFetch(`/items/refresh_tokens/${tokens.data[0].id}`, { method: 'DELETE' });
        }
      } catch (error) {
        logger.error('Error removing refresh token:', error.message);
      }
    }

    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token data
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object} User data
   */
  async getUserByEmail(email) {
    try {
      const users = await this.directusFetch(`/items/users?filter[email][_eq]=${email.toLowerCase()}`);
      return users.data.length > 0 ? users.data[0] : null;
    } catch (error) {
      logger.error('Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Object} User data
   */
  async getUserById(id) {
    try {
      const user = await this.directusFetch(`/items/users/${id}`);
      return user.data;
    } catch (error) {
      logger.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateProfile(userId, updateData) {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const allowedFields = ['firstName', 'lastName', 'preferences'];
    const updates = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    Object.assign(user, updates);
    user.updatedAt = new Date().toISOString();

    return {
      success: true,
      user: this.sanitizeUser(user),
      message: 'Profile updated successfully'
    };
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Change result
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (!this.isValidPassword(newPassword)) {
      throw new Error('New password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, this.saltRounds);
    user.updatedAt = new Date().toISOString();

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Object} Reset request result
   */
  async requestPasswordReset(email) {
    const user = this.users.get(email.toLowerCase());
    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent'
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    this.passwordResetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt
    });

    return {
      success: true,
      resetToken, // In production, send via email instead
      message: 'If the email exists, a reset link has been sent'
    };
  }

  /**
   * Reset password with token
   * @param {string} resetToken - Password reset token
   * @param {string} newPassword - New password
   * @returns {Object} Reset result
   */
  async resetPassword(resetToken, newPassword) {
    const tokenData = this.passwordResetTokens.get(resetToken);
    if (!tokenData) {
      throw new Error('Invalid or expired reset token');
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      this.passwordResetTokens.delete(resetToken);
      throw new Error('Reset token has expired');
    }

    if (!this.isValidPassword(newPassword)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    const user = this.findUserById(tokenData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, this.saltRounds);
    user.updatedAt = new Date().toISOString();

    // Remove reset token
    this.passwordResetTokens.delete(resetToken);

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }

  // Private helper methods

  generateUserId() {
    return 'user-' + crypto.randomBytes(8).toString('hex');
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: this.refreshTokenExpiresIn }
    );
  }

  generateVerificationToken(userId) {
    return crypto.randomBytes(32).toString('hex');
  }

  findUserById(userId) {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        return user;
      }
    }
    return null;
  }

  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Get authentication statistics
   */
  getAuthStats() {
    return {
      total_users: this.users.size,
      active_refresh_tokens: this.refreshTokens.size,
      pending_password_resets: this.passwordResetTokens.size,
      user_roles: this.getUserRoleStats(),
      subscription_tiers: this.getSubscriptionStats()
    };
  }

  getUserRoleStats() {
    const stats = {};
    for (const user of this.users.values()) {
      stats[user.role] = (stats[user.role] || 0) + 1;
    }
    return stats;
  }

  getSubscriptionStats() {
    const stats = {};
    for (const user of this.users.values()) {
      stats[user.subscription] = (stats[user.subscription] || 0) + 1;
    }
    return stats;
  }
}

module.exports = AuthService;
