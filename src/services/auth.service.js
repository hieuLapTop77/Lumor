const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { authConfig } = require('../config/auth.config');

/**
 * Authentication service handling user registration, login, and token management
 */

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and token
   */
  static async register(userData) {
    const { username, email, password, displayName } = userData;

    // Check if user already exists
    const existingEmail = await UserModel.emailExists(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const existingUsername = await UserModel.usernameExists(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await UserModel.create({
      username,
      email,
      passwordHash,
      displayName: displayName || username
    });

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    return {
      user: {
        ...userResponse,
        autoSyncEnabled: false,
        autoSyncPermissionType: 'friends'
      },
      token,
      nextStep: {
        setupAutoSync: true,
        message: 'Bạn có muốn cho phép hệ thống tự động đồng bộ ảnh từ thiết bị của bạn không?',
        autoSyncSettings: {
          permissionOptions: [
            { value: 'friends', label: 'Chỉ bạn bè', description: 'Ảnh sẽ chỉ hiển thị với bạn bè' },
            { value: 'close_friends', label: 'Bạn thân', description: 'Ảnh chỉ hiển thị với bạn thân' },
            { value: 'public', label: 'Công khai', description: 'Ảnh hiển thị công khai cho mọi người' },
            { value: 'custom', label: 'Tùy chỉnh', description: 'Chọn nhóm người cụ thể' }
          ],
          defaultPermission: 'friends'
        },
        endpoint: '/api/v2/users/sync-settings'
      }
    };
  }

  /**
   * Authenticate user login
   * @param {Object} loginData - Login credentials
   * @returns {Promise<Object>} User and token
   */
  static async login(loginData) {
    const { email, password } = loginData;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    return {
      user: userResponse,
      token
    };
  }

  /**
   * Generate JWT token
   * @param {number} userId - User ID
   * @returns {string} JWT token
   */
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token payload
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh user token
   * @param {string} token - Current JWT token
   * @returns {Promise<Object>} New token and user data
   */
  static async refreshToken(token) {
    // Verify current token
    const decoded = await this.verifyToken(token);
    
    // Get current user data
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token
    const newToken = this.generateToken(user.id);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    return {
      user: userResponse,
      token: newToken
    };
  }

  /**
   * Get user profile by token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} User profile
   */
  static async getProfile(token) {
    const decoded = await this.verifyToken(token);
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive data
    const { password_hash, ...userProfile } = user;
    return userProfile;
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    // Get user with password hash
    const user = await UserModel.findByEmail((await UserModel.findById(userId)).email);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password in database
    // Note: This would require a UserModel.updatePassword method
    // For now, this is a placeholder for the concept
    
    return true;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  static validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate password reset token
   * @param {string} email - User email
   * @returns {Promise<string>} Reset token
   */
  static async generateResetToken(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      authConfig.jwt.secret,
      { expiresIn: '1h' }
    );

    return resetToken;
  }

  /**
   * Reset password using reset token
   * @param {string} resetToken - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async resetPassword(resetToken, newPassword) {
    try {
      const decoded = jwt.verify(resetToken, authConfig.jwt.secret);
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid reset token');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password in database
      // Note: This would require a UserModel.updatePassword method
      
      return true;
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }
}

module.exports = AuthService; 