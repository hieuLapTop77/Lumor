const { validationResult } = require('express-validator');
const PermissionService = require('../services/permission.service');

/**
 * Permission Controller
 * Handles HTTP requests for permission operations
 */

class PermissionController {
  /**
   * Create a new permission group
   * POST /api/v2/permissions/groups
   */
  static async createPermissionGroup(req, res) {
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

      const userId = req.user.id;
      const groupData = req.body;
      
      const result = await PermissionService.createPermissionGroup(userId, groupData);
      
      return res.status(result.success ? 201 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Create permission group error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's permission groups
   * GET /api/v2/permissions/groups
   */
  static async getUserPermissionGroups(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await PermissionService.getUserPermissionGroups(userId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get permission groups error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get permission group by ID
   * GET /api/v2/permissions/groups/:groupId
   */
  static async getPermissionGroupById(req, res) {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;
      
      const result = await PermissionService.getPermissionGroupById(parseInt(groupId), userId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get permission group error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update permission group
   * PUT /api/v2/permissions/groups/:groupId
   */
  static async updatePermissionGroup(req, res) {
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

      const userId = req.user.id;
      const { groupId } = req.params;
      const updateData = req.body;
      
      const result = await PermissionService.updatePermissionGroup(parseInt(groupId), userId, updateData);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Update permission group error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete permission group
   * DELETE /api/v2/permissions/groups/:groupId
   */
  static async deletePermissionGroup(req, res) {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;
      
      const result = await PermissionService.deletePermissionGroup(parseInt(groupId), userId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Delete permission group error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Add users to permission group
   * POST /api/v2/permissions/groups/add-users
   */
  static async addUsersToGroup(req, res) {
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

      const userId = req.user.id;
      const { groupId, userIds } = req.body;
      
      const result = await PermissionService.addUsersToGroup(groupId, userId, userIds);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Add users to group error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Remove users from permission group
   * POST /api/v2/permissions/groups/remove-users
   */
  static async removeUsersFromGroup(req, res) {
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

      const userId = req.user.id;
      const { groupId, userIds } = req.body;
      
      const result = await PermissionService.removeUsersFromGroup(groupId, userId, userIds);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Remove users from group error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's default permission settings
   * GET /api/v2/permissions/defaults
   */
  static async getUserDefaultPermissions(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await PermissionService.getUserDefaultPermissions(userId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get default permissions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user's default permission settings
   * PUT /api/v2/permissions/defaults
   */
  static async updateUserDefaultPermissions(req, res) {
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

      const userId = req.user.id;
      const permissionData = req.body;
      
      const result = await PermissionService.updateUserDefaultPermissions(userId, permissionData);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Update default permissions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = PermissionController; 