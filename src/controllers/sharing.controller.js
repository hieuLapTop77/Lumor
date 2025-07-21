const SharingService = require('../services/sharing.service');
const { validationResult } = require('express-validator');
const ResponseUtils = require('../utils/response.utils');

/**
 * Sharing Controller - Handles HTTP requests for sharing operations
 */

class SharingController {
  /**
   * Create a new album
   */
  static async createAlbum(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { name, description, isPublic } = req.body;
      const userId = req.user.id;

      const album = await SharingService.createAlbum(userId, {
        name,
        description,
        isPublic
      });

      return ResponseUtils.created(res, 'Album created successfully', { album });
    } catch (error) {
      console.error('Create album error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get albums for the current user
   */
  static async getUserAlbums(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await SharingService.getUserAlbums(userId, {
        limit,
        offset
      });

      return ResponseUtils.success(res, 'Albums retrieved successfully', result);
    } catch (error) {
      console.error('Get user albums error:', error);
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get album details with photos
   */
  static async getAlbumDetails(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { albumId } = req.params;
      const currentUserId = req.user.id;

      const result = await SharingService.getAlbumDetails(parseInt(albumId), currentUserId);

      return ResponseUtils.success(res, 'Album details retrieved successfully', result);
    } catch (error) {
      console.error('Get album details error:', error);
      
      if (error.message === 'Album not found') {
        return ResponseUtils.notFound(res, 'Album not found');
      }
      
      if (error.message.startsWith('Access denied')) {
        return ResponseUtils.forbidden(res, error.message);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Update album details
   */
  static async updateAlbum(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { albumId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const updatedAlbum = await SharingService.updateAlbum(parseInt(albumId), userId, updateData);

      return ResponseUtils.success(res, 'Album updated successfully', { album: updatedAlbum });
    } catch (error) {
      console.error('Update album error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('Cannot rename default album')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      
      if (error.message === 'No fields to update') {
        return ResponseUtils.error(res, 'No fields to update', 400);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Delete an album
   */
  static async deleteAlbum(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { albumId } = req.params;
      const userId = req.user.id;

      const result = await SharingService.deleteAlbum(parseInt(albumId), userId);

      return ResponseUtils.success(res, 'Album deleted successfully', { deletedAlbum: result });
    } catch (error) {
      console.error('Delete album error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('Cannot delete default album')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Add photos to an album
   */
  static async addPhotosToAlbum(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { albumId } = req.params;
      const { photoId, photoIds } = req.body;
      const userId = req.user.id;

      // Convert single photoId to array for consistent processing
      const photoIdsArray = photoIds || [photoId];

      const result = await SharingService.addPhotosToAlbum(
        parseInt(albumId),
        photoIdsArray,
        userId
      );

      return ResponseUtils.success(res, 'Photos added to album successfully', result);
    } catch (error) {
      console.error('Add photos to album error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Remove photos from an album
   */
  static async removePhotosFromAlbum(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { albumId } = req.params;
      const { photoId, photoIds } = req.body;
      const userId = req.user.id;

      // Convert single photoId to array for consistent processing
      const photoIdsArray = photoIds || [photoId];

      const result = await SharingService.removePhotosFromAlbum(
        parseInt(albumId),
        photoIdsArray,
        userId
      );

      return ResponseUtils.success(res, 'Photos removed from album successfully', result);
    } catch (error) {
      console.error('Remove photos from album error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Create a new share
   */
  static async createShare(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const shareData = req.body;
      const userId = req.user.id;

      const share = await SharingService.createShare(userId, shareData);

      return ResponseUtils.created(res, 'Content shared successfully', { share });
    } catch (error) {
      console.error('Create share error:', error);
      
      if (error.message.includes('Can only share with friends')) {
        return ResponseUtils.forbidden(res, error.message);
      }
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('Invalid share type')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get shares by user (given or received)
   */
  static async getSharesByUser(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { type } = req.params; // 'given' or 'received'
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await SharingService.getSharesByUser(userId, type, {
        limit,
        offset
      });

      const message = type === 'given' ? 'Shared content retrieved successfully' : 'Received shares retrieved successfully';
      return ResponseUtils.success(res, message, result);
    } catch (error) {
      console.error('Get shares by user error:', error);
      
      if (error.message.includes('Type must be')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get share details
   */
  static async getShareDetails(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { shareId } = req.params;
      const userId = req.user.id;

      const share = await SharingService.getShareDetails(parseInt(shareId), userId);

      return ResponseUtils.success(res, 'Share details retrieved successfully', { share });
    } catch (error) {
      console.error('Get share details error:', error);
      
      if (error.message === 'Share not found') {
        return ResponseUtils.notFound(res, 'Share not found');
      }
      
      if (error.message.includes('Access denied')) {
        return ResponseUtils.forbidden(res, error.message);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Revoke a share
   */
  static async revokeShare(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { shareId } = req.params;
      const userId = req.user.id;

      const share = await SharingService.revokeShare(parseInt(shareId), userId);

      return ResponseUtils.success(res, 'Share revoked successfully', { share });
    } catch (error) {
      console.error('Revoke share error:', error);
      
      if (error.message === 'Share not found') {
        return ResponseUtils.notFound(res, 'Share not found');
      }
      
      if (error.message.includes('Only the sharer')) {
        return ResponseUtils.forbidden(res, error.message);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Reactivate a share
   */
  static async reactivateShare(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { shareId } = req.params;
      const userId = req.user.id;

      const share = await SharingService.reactivateShare(parseInt(shareId), userId);

      return ResponseUtils.success(res, 'Share reactivated successfully', { share });
    } catch (error) {
      console.error('Reactivate share error:', error);
      
      if (error.message === 'Share not found') {
        return ResponseUtils.notFound(res, 'Share not found');
      }
      
      if (error.message.includes('Only the sharer')) {
        return ResponseUtils.forbidden(res, error.message);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Delete a share completely
   */
  static async deleteShare(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { shareId } = req.params;
      const userId = req.user.id;

      const result = await SharingService.deleteShare(parseInt(shareId), userId);

      return ResponseUtils.success(res, result.message, { deletedShare: { id: result.id } });
    } catch (error) {
      console.error('Delete share error:', error);
      
      if (error.message === 'Share not found') {
        return ResponseUtils.notFound(res, 'Share not found');
      }
      
      if (error.message.includes('Only the sharer')) {
        return ResponseUtils.forbidden(res, error.message);
      }
      
      return ResponseUtils.serverError(res, error.message);
    }
  }

  /**
   * Get content shared with the current user
   */
  static async getSharedWithMe(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const userId = req.user.id;
      const { type, limit = 20, offset = 0 } = req.query;

      const result = await SharingService.getSharedWithMeContent(userId, {
        shareType: type,
        limit,
        page: Math.floor(offset / limit) + 1
      });

      return ResponseUtils.success(res, 'Shared content retrieved successfully', result);
    } catch (error) {
      console.error('Get shared with me content error:', error);
      return ResponseUtils.error(res, 'Failed to retrieve shared content', 500);
    }
  }
}

module.exports = SharingController; 