const PhotoModel = require('../models/photo.model');
const UserModel = require('../models/user.model');
const { pool } = require('../config/database.config');
const {
  storageConfig,
  getUserStoragePath,
  getStorageStats,
  getFileUrl
} = require('../config/storage.config');
const FileUtils = require('../utils/file.utils');
const { checkPhotoPermission, checkFriendship } = require('../utils/permission.utils');

/**
 * Photo Service - Handles photo business logic
 */
class PhotoService {
  /**
   * Upload a new photo
   */
  static async uploadPhoto(userId, file, { caption, permissionType, customGroupId }) {
    // Validate custom group if permission type is custom
    if (permissionType === 'custom') {
      if (!customGroupId) {
        throw new Error('Custom group ID is required when permission type is custom');
      }

      const isOwner = await PhotoModel.isCustomGroupOwner(customGroupId, userId);
      if (!isOwner) {
        throw new Error('Custom permission group not found');
      }
    }

    // Generate local upload path
    const uploadData = FileUtils.generateLocalUploadPath(userId, file.originalname, file.mimetype);
    
    // Save file to local storage
    await FileUtils.saveFileToLocal(file.buffer, uploadData.filePath);

    try {
      // Save photo information to database
      const photo = await PhotoModel.create({
        ownerId: userId,
        s3Key: uploadData.relativePath,
        fileName: uploadData.filename,
        originalName: uploadData.originalName,
        fileSize: file.size,
        mimeType: file.mimetype,
        caption,
        permissionType,
        customGroupId
      });

      // Get custom group info if applicable
      let customGroup = null;
      if (photo.custom_group_id) {
        const group = await PhotoModel.getCustomGroup(photo.custom_group_id);
        if (group) {
          customGroup = {
            id: group.id,
            name: group.group_name,
            description: group.description
          };
        }
      }

      // Generate file URL
      const fileUrl = FileUtils.generateLocalFileUrl(uploadData.relativePath);

      return {
        photo: PhotoModel.formatPhoto(photo, customGroup),
        fileUrl
      };
    } catch (error) {
      // Clean up uploaded file if database operation fails
      try {
        await FileUtils.deleteFileFromLocal(uploadData.relativePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Get photos of a specific user with permission filtering
   */
  static async getUserPhotos(targetUserId, currentUserId, { page = 1, limit = 12 } = {}) {
    // Get photos from database
    const photos = await PhotoModel.findByUserId(targetUserId, { page, limit });
    const totalCount = await PhotoModel.countByUserId(targetUserId);
    
    // Filter photos based on permissions and generate URLs
    const accessiblePhotos = [];
    
    for (const photo of photos) {
      const permission = await checkPhotoPermission(
        currentUserId, 
        photo.user_id, 
        photo.permission_type, 
        photo.custom_group_id
      );
      
      if (permission.hasPermission) {
        const fileUrl = FileUtils.generateLocalFileUrl(photo.file_path);
        
        // Get custom group info if applicable
        let customGroup = null;
        if (photo.custom_group_id) {
          const group = await PhotoModel.getCustomGroup(photo.custom_group_id);
          if (group) {
            customGroup = {
              id: group.id,
              name: group.group_name,
              description: group.description
            };
          }
        }
        
        accessiblePhotos.push({
          ...PhotoModel.formatPhoto(photo, customGroup),
          fileUrl
        });
      }
    }
    
    return {
      photos: accessiblePhotos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        accessibleCount: accessiblePhotos.length,
        hasNext: (page - 1) * limit + limit < totalCount,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get single photo with permission check
   */
  static async getPhotoById(photoId, currentUserId) {
    const photo = await PhotoModel.findById(photoId);
    
    if (!photo) {
      throw new Error('Photo not found');
    }
    
    // Check permission
    const permission = await checkPhotoPermission(
      currentUserId, 
      photo.user_id, 
      photo.permission_type, 
      photo.custom_group_id
    );
    
    if (!permission.hasPermission) {
      throw new Error(`Access denied: ${permission.reason}`);
    }
    
    // Generate file URL
    const fileUrl = FileUtils.generateLocalFileUrl(photo.file_path);
    
    // Get custom group info if applicable
    let customGroup = null;
    if (photo.custom_group_id) {
      const group = await PhotoModel.getCustomGroup(photo.custom_group_id);
      if (group) {
        customGroup = {
          id: group.id,
          name: group.group_name,
          description: group.description
        };
      }
    }
    
    return {
      photo: PhotoModel.formatPhoto(photo, customGroup),
      fileUrl
    };
  }

  /**
   * Update photo details
   */
  static async updatePhoto(photoId, userId, updateData) {
    // Check ownership
    const ownership = await PhotoModel.isOwner(photoId, userId);
    
    if (!ownership.exists) {
      throw new Error('Photo not found');
    }
    
    if (!ownership.isOwner) {
      throw new Error('Access denied. You can only update your own photos.');
    }

    // Validate custom group if permission type is custom
    if (updateData.permissionType === 'custom' && updateData.customGroupId) {
      const isOwner = await PhotoModel.isCustomGroupOwner(updateData.customGroupId, userId);
      if (!isOwner) {
        throw new Error('Custom permission group not found');
      }
    }

    // Update photo
    const updatedPhoto = await PhotoModel.update(photoId, updateData);

    // Get custom group info if applicable
    let customGroup = null;
    if (updatedPhoto.custom_group_id) {
      const group = await PhotoModel.getCustomGroup(updatedPhoto.custom_group_id);
      if (group) {
        customGroup = {
          id: group.id,
          name: group.group_name,
          description: group.description
        };
      }
    }

    return PhotoModel.formatPhoto(updatedPhoto, customGroup);
  }

  /**
   * Delete photo
   */
  static async deletePhoto(photoId, userId) {
    // Check ownership
    const ownership = await PhotoModel.isOwner(photoId, userId);
    
    if (!ownership.exists) {
      throw new Error('Photo not found');
    }
    
    if (!ownership.isOwner) {
      throw new Error('Access denied. You can only delete your own photos.');
    }

    // Get photo details for file deletion
    const photo = await PhotoModel.findById(photoId);
    
    // Delete from database first
    const deletedPhoto = await PhotoModel.delete(photoId);

    // Delete from local storage
    try {
      await FileUtils.deleteFileFromLocal(photo.file_path);
    } catch (storageError) {
      console.error('Local storage deletion error:', storageError);
      // Continue even if file deletion fails
    }

    return {
      id: deletedPhoto.id,
      fileName: deletedPhoto.file_name
    };
  }

  /**
   * Discover photos from friends
   */
  static async discoverFriendsPhotos(userId, { page = 1, limit = 20 } = {}) {
    const photos = await PhotoModel.findFriendsPhotos(userId, { page, limit });
    const totalCount = await PhotoModel.countFriendsPhotos(userId);
    
    // Process photos and check custom group permissions
    const accessiblePhotos = [];
    
    for (const photo of photos) {
      let hasAccess = true;
      
      // For custom permission type, check if current user is in the custom group
      if (photo.permission_type === 'custom' && photo.custom_group_id) {
        const group = await PhotoModel.getCustomGroup(photo.custom_group_id);
        if (group && group.allowed_user_ids) {
          hasAccess = group.allowed_user_ids.includes(userId);
        } else {
          hasAccess = false;
        }
      }
      
      if (hasAccess) {
        const fileUrl = FileUtils.generateLocalFileUrl(photo.file_path);
        
        // Get custom group info if applicable
        let customGroup = null;
        if (photo.custom_group_id) {
          const group = await PhotoModel.getCustomGroup(photo.custom_group_id);
          if (group) {
            customGroup = {
              id: group.id,
              name: group.group_name,
              description: group.description
            };
          }
        }
        
        accessiblePhotos.push({
          ...PhotoModel.formatPhoto(photo, customGroup),
          fileUrl
        });
      }
    }

    return {
      photos: accessiblePhotos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        accessibleCount: accessiblePhotos.length,
        hasNext: (page - 1) * limit + limit < totalCount,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get photos from a specific friend
   */
  static async getFriendPhotos(friendId, currentUserId, { page = 1, limit = 12 } = {}) {
    // Check if users are friends
    const areFriends = await checkFriendship(currentUserId, friendId);
    
    if (!areFriends) {
      throw new Error('You can only view photos from your friends');
    }

    return this.getUserPhotos(friendId, currentUserId, { page, limit });
  }

  /**
   * Get timeline feed
   */
  static async getTimelineFeed(userId, { page = 1, limit = 10 } = {}) {
    const photos = await PhotoModel.getTimelineFeed(userId, { page, limit });
    
    // Generate URLs for all photos
    const feedPhotos = [];
    
    for (const photo of photos) {
      const fileUrl = FileUtils.generateLocalFileUrl(photo.file_path);
      
      // Get custom group info if applicable
      let customGroup = null;
      if (photo.custom_group_id) {
        const group = await PhotoModel.getCustomGroup(photo.custom_group_id);
        if (group) {
          customGroup = {
            id: group.id,
            name: group.group_name,
            description: group.description
          };
        }
      }
      
      feedPhotos.push({
        ...PhotoModel.formatPhoto(photo, customGroup),
        fileUrl
      });
    }

    return {
      photos: feedPhotos,
      pagination: {
        currentPage: parseInt(page),
        totalCount: feedPhotos.length,
        hasNext: feedPhotos.length === parseInt(limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(userId) {
    // Get user's photo stats from database
    const userStatsRows = await PhotoModel.getUserStats(userId);
    
    // Get overall storage stats
    const storageStats = await getStorageStats();
    
    // Check storage availability
    const storageAvailable = FileUtils.checkLocalStorageAvailable();
    
    return {
      userStats: {
        totalPhotos: userStatsRows.reduce((sum, row) => sum + parseInt(row.total_photos), 0),
        totalSize: userStatsRows.reduce((sum, row) => sum + parseInt(row.total_size), 0),
        permissionBreakdown: userStatsRows.map(row => ({
          permissionType: row.permission_type,
          count: parseInt(row.count_by_permission)
        }))
      },
      systemStats: {
        totalFiles: storageStats.totalFiles,
        totalSize: storageStats.totalSize,
        uploadDir: storageStats.uploadDir,
        photosDir: storageStats.photosDir,
        storageAvailable: storageAvailable
      }
    };
  }

  /**
   * Debug photo visibility for a specific user
   */
  static async debugPhotoVisibility(targetUserId, currentUserId) {
    // Check friendship status
    const areFriends = await checkFriendship(currentUserId, targetUserId);
    
    // Get all photos from the user
    const photos = await PhotoModel.findByUserId(targetUserId, { page: 1, limit: 1000 });
    
    // Check permission for each photo
    const photoPermissions = [];
    for (const photo of photos) {
      const permission = await checkPhotoPermission(
        currentUserId, 
        photo.user_id, 
        photo.permission_type, 
        photo.custom_group_id
      );
      
      photoPermissions.push({
        photoId: photo.id,
        fileName: photo.file_name,
        caption: photo.caption,
        permissionType: photo.permission_type,
        customGroupId: photo.custom_group_id,
        hasPermission: permission.hasPermission,
        reason: permission.reason,
        createdAt: photo.created_at
      });
    }
    
    return {
      currentUserId: currentUserId,
      targetUserId: targetUserId,
      areFriends: areFriends,
      totalPhotos: photos.length,
      photoPermissions: photoPermissions,
      accessiblePhotos: photoPermissions.filter(p => p.hasPermission).length
    };
  }
}

module.exports = PhotoService; 