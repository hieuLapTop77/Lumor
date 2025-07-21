const PhotoService = require('../services/photo.service');
const { validationResult } = require('express-validator');
const ResponseUtils = require('../utils/response.utils');

/**
 * Photo Controller - Handles HTTP requests for photo operations
 */
class PhotoController {
  /**
   * Upload a new photo
   */
  static async uploadPhoto(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      if (!req.file) {
        return ResponseUtils.error(res, 'No file uploaded', 400);
      }

      const { caption, permissionType, customGroupId } = req.body;
      const userId = req.user.id;

      const result = await PhotoService.uploadPhoto(userId, req.file, {
        caption,
        permissionType,
        customGroupId
      });

      return ResponseUtils.created(res, 'Photo uploaded successfully', {
        photo: {
          ...result.photo,
          fileUrl: result.fileUrl
        }
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get photos of a specific user
   */
  static async getUserPhotos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { userId } = req.params;
      const currentUserId = req.user.id;
      const { page = 1, limit = 12 } = req.query;

      const result = await PhotoService.getUserPhotos(
        parseInt(userId), 
        currentUserId, 
        { 
          page: parseInt(page), 
          limit: parseInt(limit) 
        }
      );

      return ResponseUtils.success(res, 'Photos retrieved successfully', result);
    } catch (error) {
      console.error('Get photos error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get single photo details
   */
  static async getPhotoById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { photoId } = req.params;
      const currentUserId = req.user.id;

      const result = await PhotoService.getPhotoById(parseInt(photoId), currentUserId);

      return ResponseUtils.success(res, 'Photo retrieved successfully', {
        photo: {
          ...result.photo,
          fileUrl: result.fileUrl
        }
      });
    } catch (error) {
      console.error('Get single photo error:', error);
      
      if (error.message === 'Photo not found') {
        return ResponseUtils.error(res, 'Photo not found', 404);
      }
      
      if (error.message.startsWith('Access denied')) {
        return ResponseUtils.error(res, error.message, 403);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Update photo details
   */
  static async updatePhoto(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      console.log('Update photo request body:', req.body); // Debug log

      const { photoId } = req.params;
      const { caption, permissionType, customGroupId } = req.body;
      const userId = req.user.id;

      // Build update data object
      const updateData = {};
      if (caption !== undefined) updateData.caption = caption;
      if (permissionType !== undefined) updateData.permissionType = permissionType;
      if (customGroupId !== undefined) updateData.customGroupId = customGroupId;

      console.log('Update data object:', updateData); // Debug log

      const updatedPhoto = await PhotoService.updatePhoto(parseInt(photoId), userId, updateData);

      return ResponseUtils.success(res, 'Photo updated successfully', {
        photo: updatedPhoto
      });
    } catch (error) {
      console.error('Update photo error:', error);
      
      if (error.message === 'Photo not found') {
        return ResponseUtils.error(res, 'Photo not found', 404);
      }
      
      if (error.message.includes('Access denied') || error.message.includes('Custom permission group not found')) {
        return ResponseUtils.error(res, error.message, 403);
      }
      
      if (error.message === 'No fields to update') {
        return ResponseUtils.error(res, 'No fields to update', 400);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Delete photo
   */
  static async deletePhoto(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { photoId } = req.params;
      const userId = req.user.id;

      const deletedPhoto = await PhotoService.deletePhoto(parseInt(photoId), userId);

      return ResponseUtils.success(res, 'Photo deleted successfully', {
        deletedPhoto
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      
      if (error.message === 'Photo not found') {
        return ResponseUtils.error(res, 'Photo not found', 404);
      }
      
      if (error.message.includes('Access denied')) {
        return ResponseUtils.error(res, error.message, 403);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Discover photos from friends
   */
  static async discoverFriendsPhotos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await PhotoService.discoverFriendsPhotos(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return ResponseUtils.success(res, 'Friends photos retrieved successfully', result);
    } catch (error) {
      console.error('Get friends photos error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get photos from a specific friend
   */
  static async getFriendPhotos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { friendId } = req.params;
      const currentUserId = req.user.id;
      const { page = 1, limit = 12 } = req.query;

      const result = await PhotoService.getFriendPhotos(
        parseInt(friendId), 
        currentUserId, 
        { 
          page: parseInt(page), 
          limit: parseInt(limit) 
        }
      );

      return ResponseUtils.success(res, 'Friend photos retrieved successfully', result);
    } catch (error) {
      console.error('Get friend photos error:', error);
      
      if (error.message.includes('friends')) {
        return ResponseUtils.error(res, error.message, 403);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get timeline feed of photos
   */
  static async getTimelineFeed(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await PhotoService.getTimelineFeed(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return ResponseUtils.success(res, 'Timeline feed retrieved successfully', result);
    } catch (error) {
      console.error('Get timeline feed error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await PhotoService.getStorageStats(userId);

      return ResponseUtils.success(res, 'Storage statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get storage stats error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Debug photo visibility for a specific user
   */
  static async debugPhotoVisibility(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { userId } = req.params;
      const currentUserId = req.user.id;

      const debugInfo = await PhotoService.debugPhotoVisibility(
        parseInt(userId), 
        currentUserId
      );

      return ResponseUtils.success(res, 'Debug information retrieved', debugInfo);
    } catch (error) {
      console.error('Debug photos error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }
}

module.exports = PhotoController; 