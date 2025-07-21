const AuthService = require('../services/auth.service');
const ResponseUtils = require('../utils/response.utils');
const { validationResult } = require('express-validator');

/**
 * Authentication controller handling HTTP requests for auth operations
 */

class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { username, email, password, displayName } = req.body;

      // Register user through service
      const result = await AuthService.register({
        username,
        email,
        password,
        displayName
      });

      return ResponseUtils.created(res, 'User registered successfully', result);
    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific errors
      if (error.message === 'Email already exists' || error.message === 'Username already exists') {
        return ResponseUtils.error(res, error.message, 409);
      }

      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async login(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { email, password } = req.body;

      // Authenticate user through service
      const result = await AuthService.login({ email, password });

      return ResponseUtils.success(res, 'Login successful', result);
    } catch (error) {
      console.error('Login error:', error);

      // Handle authentication errors
      if (error.message === 'Invalid email or password') {
        return ResponseUtils.unauthorized(res, error.message);
      }

      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return ResponseUtils.unauthorized(res, 'No token provided');
      }

      const userProfile = await AuthService.getProfile(token);

      return ResponseUtils.success(res, 'Profile retrieved successfully', {
        user: userProfile
      });
    } catch (error) {
      console.error('Get profile error:', error);

      if (error.message === 'Invalid or expired token' || error.message === 'User not found') {
        return ResponseUtils.unauthorized(res, error.message);
      }

      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Refresh user token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async refreshToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return ResponseUtils.unauthorized(res, 'No token provided');
      }

      const result = await AuthService.refreshToken(token);

      return ResponseUtils.success(res, 'Token refreshed successfully', result);
    } catch (error) {
      console.error('Refresh token error:', error);

      if (error.message === 'Invalid or expired token' || error.message === 'User not found') {
        return ResponseUtils.unauthorized(res, error.message);
      }

      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async changePassword(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Validate new password strength
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return ResponseUtils.error(res, 'Password does not meet requirements', 400, {
          passwordErrors: passwordValidation.errors
        });
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);

      return ResponseUtils.success(res, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);

      if (error.message === 'Current password is incorrect') {
        return ResponseUtils.error(res, error.message, 400);
      }

      if (error.message === 'User not found') {
        return ResponseUtils.notFound(res, 'User');
      }

      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async requestPasswordReset(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { email } = req.body;

      const resetToken = await AuthService.generateResetToken(email);

      // In a real application, you would send this token via email
      // For demo purposes, we'll return it in the response
      return ResponseUtils.success(res, 'Password reset token generated', {
        resetToken,
        message: 'In a real application, this token would be sent to your email'
      });
    } catch (error) {
      console.error('Request password reset error:', error);

      if (error.message === 'User not found') {
        // For security, don't reveal if email exists or not
        return ResponseUtils.success(res, 'If the email exists, a reset token has been sent');
      }

      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Reset password using reset token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resetPassword(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { resetToken, newPassword } = req.body;

      // Validate new password strength
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return ResponseUtils.error(res, 'Password does not meet requirements', 400, {
          passwordErrors: passwordValidation.errors
        });
      }

      await AuthService.resetPassword(resetToken, newPassword);

      return ResponseUtils.success(res, 'Password reset successfully');
    } catch (error) {
      console.error('Reset password error:', error);

      if (error.message === 'Invalid or expired reset token') {
        return ResponseUtils.error(res, error.message, 400);
      }

      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Logout user (client-side token invalidation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    try {
      // In a stateless JWT implementation, logout is handled client-side
      // The client should remove the token from storage
      // For enhanced security, you could implement a token blacklist

      return ResponseUtils.success(res, 'Logout successful', {
        message: 'Please remove the token from client storage'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Verify JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async verifyToken(req, res) {
    try {
      // Token đã được verify bởi authenticateToken middleware
      // req.user đã chứa thông tin user từ token
      return ResponseUtils.success(res, 'Token is valid', {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          displayName: req.user.display_name
        },
        tokenInfo: {
          isValid: true,
          userId: req.user.id
        }
      });
    } catch (error) {
      console.error('Verify token error:', error);
      return ResponseUtils.serverError(res);
    }
  }

  /**
   * Validate password strength
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validatePassword(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return ResponseUtils.badRequest(res, 'Password is required');
      }

      const validation = AuthService.validatePassword(password);

      return ResponseUtils.success(res, 'Password validation completed', {
        isValid: validation.isValid,
        errors: validation.errors
      });
    } catch (error) {
      console.error('Validate password error:', error);
      return ResponseUtils.serverError(res);
    }
  }
}

module.exports = AuthController; 