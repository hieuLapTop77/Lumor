const PermissionModel = require('../models/permission.model');
const { createSuccessResponse, createErrorResponse } = require('../utils/response.utils');

/**
 * Permission Service
 * Contains business logic for permission operations
 */

class PermissionService {
  /**
   * Create a new permission group
   */
  static async createPermissionGroup(userId, groupData) {
    try {
      // Validate user IDs if provided
      if (groupData.userIds && groupData.userIds.length > 0) {
        const validation = await PermissionModel.validateFriendships(userId, groupData.userIds);
        
        if (!validation.valid) {
          return createErrorResponse(
            `Invalid users: ${validation.invalidIds.join(', ')}. Users must exist and be friends.`,
            400
          );
        }
        
        // Use only valid friend IDs
        groupData.userIds = validation.validIds;
      }

      const group = await PermissionModel.createPermissionGroup(userId, groupData);
      
      return createSuccessResponse('Permission group created successfully', { group });
    } catch (error) {
      console.error('Create permission group error:', error);
      return createErrorResponse('Failed to create permission group');
    }
  }

  /**
   * Get user's permission groups
   */
  static async getUserPermissionGroups(userId) {
    try {
      const groups = await PermissionModel.getUserPermissionGroups(userId);
      
      return createSuccessResponse('Permission groups retrieved successfully', { 
        groups,
        total: groups.length 
      });
    } catch (error) {
      console.error('Get permission groups error:', error);
      return createErrorResponse('Failed to retrieve permission groups');
    }
  }

  /**
   * Get permission group by ID
   */
  static async getPermissionGroupById(groupId, userId) {
    try {
      const group = await PermissionModel.getPermissionGroupById(groupId, userId);
      
      if (!group) {
        return createErrorResponse('Permission group not found', 404);
      }
      
      return createSuccessResponse('Permission group retrieved successfully', { group });
    } catch (error) {
      console.error('Get permission group error:', error);
      return createErrorResponse('Failed to retrieve permission group');
    }
  }

  /**
   * Update permission group
   */
  static async updatePermissionGroup(groupId, userId, updateData) {
    try {
      // Validate user IDs if provided
      if (updateData.userIds !== undefined && updateData.userIds.length > 0) {
        const validation = await PermissionModel.validateFriendships(userId, updateData.userIds);
        
        if (!validation.valid) {
          return createErrorResponse(
            `Invalid users: ${validation.invalidIds.join(', ')}. Users must exist and be friends.`,
            400
          );
        }
        
        // Use only valid friend IDs
        updateData.userIds = validation.validIds;
      }

      const group = await PermissionModel.updatePermissionGroup(groupId, userId, updateData);
      
      if (!group) {
        return createErrorResponse('Permission group not found', 404);
      }
      
      return createSuccessResponse('Permission group updated successfully', { group });
    } catch (error) {
      console.error('Update permission group error:', error);
      return createErrorResponse('Failed to update permission group');
    }
  }

  /**
   * Delete permission group
   */
  static async deletePermissionGroup(groupId, userId) {
    try {
      const deletedGroup = await PermissionModel.deletePermissionGroup(groupId, userId);
      
      if (!deletedGroup) {
        return createErrorResponse('Permission group not found', 404);
      }
      
      return createSuccessResponse('Permission group deleted successfully', { group: deletedGroup });
    } catch (error) {
      console.error('Delete permission group error:', error);
      return createErrorResponse('Failed to delete permission group');
    }
  }

  /**
   * Add users to permission group
   */
  static async addUsersToGroup(groupId, userId, userIds) {
    try {
      // Validate user IDs
      const validation = await PermissionModel.validateFriendships(userId, userIds);
      
      if (!validation.valid) {
        return createErrorResponse(
          `Invalid users: ${validation.invalidIds.join(', ')}. Users must exist and be friends.`,
          400
        );
      }

      const result = await PermissionModel.addUsersToGroup(groupId, userId, validation.validIds);
      
      return createSuccessResponse('Users added to group successfully', { 
        addedCount: result.addedCount,
        skippedCount: result.skippedCount,
        totalRequested: userIds.length
      });
    } catch (error) {
      console.error('Add users to group error:', error);
      if (error.message === 'Permission group not found') {
        return createErrorResponse('Permission group not found', 404);
      }
      return createErrorResponse('Failed to add users to group');
    }
  }

  /**
   * Remove users from permission group
   */
  static async removeUsersFromGroup(groupId, userId, userIds) {
    try {
      const result = await PermissionModel.removeUsersFromGroup(groupId, userId, userIds);
      
      return createSuccessResponse('Users removed from group successfully', { 
        removedCount: result.removedCount,
        totalRequested: userIds.length
      });
    } catch (error) {
      console.error('Remove users from group error:', error);
      if (error.message === 'Permission group not found') {
        return createErrorResponse('Permission group not found', 404);
      }
      return createErrorResponse('Failed to remove users from group');
    }
  }

  /**
   * Get user's default permission settings
   */
  static async getUserDefaultPermissions(userId) {
    try {
      const permissions = await PermissionModel.getUserDefaultPermissions(userId);
      
      if (!permissions) {
        return createErrorResponse('User not found', 404);
      }
      
      return createSuccessResponse('Default permissions retrieved successfully', { permissions });
    } catch (error) {
      console.error('Get default permissions error:', error);
      return createErrorResponse('Failed to retrieve default permissions');
    }
  }

  /**
   * Update user's default permission settings
   */
  static async updateUserDefaultPermissions(userId, permissionData) {
    try {
      // Validate custom group if specified
      if (permissionData.permissionType === 'custom' && permissionData.customGroupId) {
        const group = await PermissionModel.getPermissionGroupById(permissionData.customGroupId, userId);
        if (!group) {
          return createErrorResponse('Custom permission group not found', 400);
        }
      }

      const permissions = await PermissionModel.updateUserDefaultPermissions(userId, permissionData);
      
      if (!permissions) {
        return createErrorResponse('User not found', 404);
      }
      
      return createSuccessResponse('Default permissions updated successfully', { permissions });
    } catch (error) {
      console.error('Update default permissions error:', error);
      return createErrorResponse('Failed to update default permissions');
    }
  }
}

module.exports = PermissionService; 