const UserModel = require('../models/user.model');
const ResponseUtils = require('../utils/response.utils');

/**
 * User Service
 * Contains business logic for user operations
 */

class UserService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove sensitive information
      const { password_hash, refresh_token, ...safeUser } = user;
      
      return { user: safeUser };
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId, updateData) {
    try {
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const updatedUser = await UserModel.updateProfile(userId, updateData);
      if (!updatedUser) {
        throw new Error('Failed to update profile');
      }

      // Remove sensitive information
      const { password_hash, refresh_token, ...safeUser } = updatedUser;
      
      return { user: safeUser };
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  /**
   * Search users by query
   */
  static async searchUsers(query, limit = 20, offset = 0, currentUserId = null) {
    try {
      const { users, total } = await UserModel.search(query, limit, offset);
      
      // Remove sensitive information and mark current user
      const safeUsers = users.map(user => {
        const { password_hash, refresh_token, ...safeUser } = user;
        return {
          ...safeUser,
          isCurrentUser: currentUserId ? user.id === currentUserId : false
        };
      });

      return {
        users: safeUsers,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const stats = await UserModel.getStatistics(userId);
      
      return { statistics: stats };
    } catch (error) {
      console.error('Get user statistics error:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(userId, days = 30) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get activity data from user model
      const activity = await UserModel.getActivity(userId, days);
      
      return { activity };
    } catch (error) {
      console.error('Get user activity error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteUserAccount(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const deleted = await UserModel.delete(userId);
      if (!deleted) {
        throw new Error('Failed to delete account');
      }

      return { message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Delete user account error:', error);
      throw error;
    }
  }

  /**
   * Update user sync settings
   */
  static async updateSyncSettings(userId, syncData) {
    try {
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const updatedSettings = await UserModel.updateSyncSettings(userId, {
        auto_sync_enabled: syncData.autoSyncEnabled,
        auto_sync_permission_type: syncData.autoSyncPermissionType,
        auto_sync_custom_group_id: syncData.autoSyncCustomGroupId
      });

      return {
        syncSettings: {
          autoSyncEnabled: updatedSettings.auto_sync_enabled,
          autoSyncPermissionType: updatedSettings.auto_sync_permission_type,
          autoSyncCustomGroupId: updatedSettings.auto_sync_custom_group_id,
          lastSyncAt: updatedSettings.last_sync_at,
          syncStatus: updatedSettings.sync_status
        }
      };
    } catch (error) {
      console.error('Update sync settings error:', error);
      throw error;
    }
  }

  /**
   * Get user sync settings
   */
  static async getSyncSettings(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        syncSettings: {
          autoSyncEnabled: user.auto_sync_enabled || false,
          autoSyncPermissionType: user.auto_sync_permission_type || 'friends',
          autoSyncCustomGroupId: user.auto_sync_custom_group_id,
          lastSyncAt: user.last_sync_at,
          syncStatus: user.sync_status || 'never_synced'
        },
        permissionOptions: [
          { value: 'friends', label: 'Chỉ bạn bè', description: 'Ảnh sẽ chỉ hiển thị với bạn bè' },
          { value: 'close_friends', label: 'Bạn thân', description: 'Ảnh chỉ hiển thị với bạn thân' },
          { value: 'public', label: 'Công khai', description: 'Ảnh hiển thị công khai cho mọi người' },
          { value: 'custom', label: 'Tùy chỉnh', description: 'Chọn nhóm người cụ thể' }
        ]
      };
    } catch (error) {
      console.error('Get sync settings error:', error);
      throw error;
    }
  }
}

module.exports = UserService; 