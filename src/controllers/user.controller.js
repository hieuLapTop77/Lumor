const { validationResult } = require('express-validator');
const UserService = require('../services/user.service');
const ResponseUtils = require('../utils/response.utils');

/**
 * User Controller
 * Handles HTTP requests for user operations
 */

class UserController {
  /**
   * Get current user profile
   * GET /api/v2/users/me
   */
  static async getCurrentUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const result = await UserService.getUserProfile(userId);
      
      return ResponseUtils.success(res, 'Profile retrieved successfully', result);
    } catch (error) {
      console.error('Get current user profile error:', error);
      if (error.message === 'User not found') {
        return ResponseUtils.notFound(res, 'User not found');
      }
      return ResponseUtils.serverError(res, 'Failed to retrieve profile');
    }
  }

  /**
   * Get user profile by ID
   * GET /api/v2/users/:userId
   */
  static async getUserProfileById(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.getUserProfile(parseInt(userId));
      
      return ResponseUtils.success(res, 'User profile retrieved successfully', result);
    } catch (error) {
      console.error('Get user profile by ID error:', error);
      if (error.message === 'User not found') {
        return ResponseUtils.notFound(res, 'User not found');
      }
      return ResponseUtils.serverError(res, 'Failed to retrieve user profile');
    }
  }

  /**
   * Update current user profile
   * PUT /api/v2/users/me
   */
  static async updateCurrentUserProfile(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const userId = req.user.id;
      const updateData = req.body;
      
      const result = await UserService.updateUserProfile(userId, updateData);
      
      return ResponseUtils.success(res, 'Profile updated successfully', result);
    } catch (error) {
      console.error('Update current user profile error:', error);
      if (error.message === 'User not found') {
        return ResponseUtils.notFound(res, 'User not found');
      }
      return ResponseUtils.serverError(res, 'Failed to update profile');
    }
  }

  /**
   * Search users
   * GET /api/v2/users/search
   */
  static async searchUsers(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { q, limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user.id;
      
      const result = await UserService.searchUsers(q, limit, offset, currentUserId);
      
      return ResponseUtils.success(res, 'Users found successfully', result);
    } catch (error) {
      console.error('Search users error:', error);
      return ResponseUtils.serverError(res, 'Failed to search users');
    }
  }

  /**
   * Get user statistics
   * GET /api/v2/users/me/statistics
   */
  static async getUserStatistics(req, res) {
    try {
      const userId = req.user.id;
      const result = await UserService.getUserStatistics(userId);
      
      return ResponseUtils.success(res, 'User statistics retrieved successfully', result);
    } catch (error) {
      console.error('Get user statistics error:', error);
      if (error.message === 'User not found') {
        return ResponseUtils.notFound(res, 'User not found');
      }
      return ResponseUtils.serverError(res, 'Failed to retrieve user statistics');
    }
  }

  /**
   * Get user activity
   * GET /api/v2/users/me/activity
   */
  static async getUserActivity(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;
      
      const result = await UserService.getUserActivity(userId, parseInt(days));
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get user activity error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete user account
   * DELETE /api/v2/users/me
   */
  static async deleteUserAccount(req, res) {
    try {
      const userId = req.user.id;
      const result = await UserService.deleteUserAccount(userId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Delete user account error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Setup user sync settings
   * PUT /api/v2/users/sync-settings
   */
  static async setupSyncSettings(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const userId = req.user.id;
      const { autoSyncEnabled, autoSyncPermissionType, autoSyncCustomGroupId } = req.body;
      
      const result = await UserService.updateSyncSettings(userId, {
        autoSyncEnabled,
        autoSyncPermissionType,
        autoSyncCustomGroupId
      });
      
      return ResponseUtils.success(res, 'Cài đặt đồng bộ đã được cập nhật thành công', result);
    } catch (error) {
      console.error('Setup sync settings error:', error);
      if (error.message === 'User not found') {
        return ResponseUtils.notFound(res, 'Không tìm thấy người dùng');
      }
      return ResponseUtils.serverError(res, 'Không thể cập nhật cài đặt đồng bộ');
    }
  }

  /**
   * Get user sync settings
   * GET /api/v2/users/sync-settings
   */
  static async getSyncSettings(req, res) {
    try {
      const userId = req.user.id;
      const result = await UserService.getSyncSettings(userId);
      
      return ResponseUtils.success(res, 'Lấy cài đặt đồng bộ thành công', result);
    } catch (error) {
      console.error('Get sync settings error:', error);
      if (error.message === 'User not found') {
        return ResponseUtils.notFound(res, 'Không tìm thấy người dùng');
      }
      return ResponseUtils.serverError(res, 'Không thể lấy cài đặt đồng bộ');
    }
  }
}

module.exports = UserController; 