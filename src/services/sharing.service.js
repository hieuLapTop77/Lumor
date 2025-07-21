const SharingModel = require('../models/sharing.model');
const PhotoModel = require('../models/photo.model');
const FriendModel = require('../models/friend.model');
const { checkAlbumPermission, isOwner } = require('../utils/permission.utils');
const { getFileUrl } = require('../config/storage.config');

/**
 * Sharing Service - Handles sharing and album business logic
 */
class SharingService {
  /**
   * Album Management
   */

  /**
   * Create a new album
   */
  static async createAlbum(userId, { name, description, isPublic = false }) {
    // Convert isPublic to privacyType for database
    const privacyType = isPublic ? 'public' : 'private';
    
    const album = await SharingModel.createAlbum({
      userId,
      albumName: name,
      description,
      privacyType
    });

    return SharingModel.formatAlbum(album);
  }

  /**
   * Get user's albums
   */
  static async getUserAlbums(userId, { page = 1, limit = 20 } = {}) {
    const albums = await SharingModel.getUserAlbums(userId, { page, limit });
    const totalCount = await SharingModel.getUserAlbumsCount(userId);

    const formattedAlbums = albums.map(album => {
      const formatted = SharingModel.formatAlbum(album);
      if (formatted.coverPhotoUrl) {
        formatted.coverPhotoUrl = getFileUrl(album.cover_photo_url);
      }
      return formatted;
    });

    return {
      albums: formattedAlbums,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        hasNext: (page - 1) * limit + limit < totalCount,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get album details with photos
   */
  static async getAlbumDetails(albumId, currentUserId) {
    // Check if album exists and user has permission
    const album = await SharingModel.getAlbumById(albumId);
    if (!album) {
      throw new Error('Album not found');
    }

    // Check permission
    const permission = await checkAlbumPermission(currentUserId, albumId);
    if (!permission.hasPermission) {
      throw new Error(`Access denied: ${permission.reason}`);
    }

    // Get photos in album
    const photos = await SharingModel.getAlbumPhotos(albumId, { page: 1, limit: 50 });
    const photoCount = await SharingModel.getAlbumPhotosCount(albumId);

    // Format photos with URLs
    const formattedPhotos = photos.map(photo => {
      const fileUrl = photo.file_path ? getFileUrl(photo.file_path) : null;
      return {
        id: photo.id,
        ownerId: photo.owner_id,
        fileName: photo.file_name,
        originalName: photo.original_name,
        fileSize: photo.file_size,
        mimeType: photo.mime_type,
        caption: photo.caption,
        fileUrl: fileUrl,
        addedAt: photo.added_at,
        owner: {
          id: photo.owner_id,
          username: photo.username,
          displayName: photo.display_name,
          avatarUrl: photo.avatar_url
        }
      };
    });

    return {
      album: SharingModel.formatAlbum(album),
      photos: formattedPhotos,
      photoCount: photoCount
    };
  }

  /**
   * Update album
   */
  static async updateAlbum(albumId, userId, updateData) {
    // Check ownership
    const album = await SharingModel.getAlbumById(albumId, userId);
    if (!album) {
      throw new Error('Album not found or access denied');
    }

    if (album.is_default && updateData.albumName) {
      throw new Error('Cannot rename default album');
    }

    const updatedAlbum = await SharingModel.updateAlbum(albumId, updateData);
    return SharingModel.formatAlbum(updatedAlbum);
  }

  /**
   * Delete album
   */
  static async deleteAlbum(albumId, userId) {
    // Check ownership
    const album = await SharingModel.getAlbumById(albumId, userId);
    if (!album) {
      throw new Error('Album not found or access denied');
    }

    if (album.is_default) {
      throw new Error('Cannot delete default album');
    }

    const deletedAlbum = await SharingModel.deleteAlbum(albumId);
    return {
      id: deletedAlbum.id,
      albumName: deletedAlbum.album_name
    };
  }

  /**
   * Add photos to album
   */
  static async addPhotosToAlbum(albumId, photoIds, userId) {
    // Check album ownership
    const album = await SharingModel.getAlbumById(albumId, userId);
    if (!album) {
      throw new Error('Album not found or access denied');
    }

    // Check if all photos belong to the user
    const photoChecks = await Promise.all(
      photoIds.map(photoId => PhotoModel.isOwner(photoId, userId))
    );

    const invalidPhotos = photoChecks
      .map((check, index) => ({ check, photoId: photoIds[index] }))
      .filter(({ check }) => !check.exists || !check.isOwner)
      .map(({ photoId }) => photoId);

    if (invalidPhotos.length > 0) {
      throw new Error(`Photos not found or access denied: ${invalidPhotos.join(', ')}`);
    }

    // Add photos to album
    const addedPhotos = await SharingModel.addPhotosToAlbum(albumId, photoIds);

    return {
      albumId: albumId,
      addedPhotos: addedPhotos.length,
      photoIds: addedPhotos.map(p => p.photo_id)
    };
  }

  /**
   * Remove photos from album
   */
  static async removePhotosFromAlbum(albumId, photoIds, userId) {
    // Check album ownership
    const album = await SharingModel.getAlbumById(albumId, userId);
    if (!album) {
      throw new Error('Album not found or access denied');
    }

    // Check if all photos belong to the user (for security)
    const photoChecks = await Promise.all(
      photoIds.map(photoId => PhotoModel.isOwner(photoId, userId))
    );

    const invalidPhotos = photoChecks
      .map((check, index) => ({ check, photoId: photoIds[index] }))
      .filter(({ check }) => !check.exists || !check.isOwner)
      .map(({ photoId }) => photoId);

    if (invalidPhotos.length > 0) {
      throw new Error(`Photos not found or access denied: ${invalidPhotos.join(', ')}`);
    }

    // Remove photos from album
    const removedPhotos = await SharingModel.removePhotosFromAlbum(albumId, photoIds);

    return {
      albumId: albumId,
      removedPhotos: removedPhotos.length,
      photoIds: removedPhotos.map(p => p.photo_id)
    };
  }

  /**
   * Photo Sharing
   */

  /**
   * Create a new share
   */
  static async createShare(userId, shareData) {
    const { recipientId, shareType, albumId, photoId, permissionLevel = 'view', expiresAt } = shareData;

    // Check if recipient exists and is a friend
    const areFriends = await FriendModel.areFriends(userId, recipientId);
    if (!areFriends) {
      throw new Error('Can only share with friends');
    }

    // Validate share type and resource ownership
    if (shareType === 'album' && albumId) {
      const album = await SharingModel.getAlbumById(albumId, userId);
      if (!album) {
        throw new Error('Album not found or access denied');
      }
    } else if (shareType === 'individual_photo' && photoId) {
      const photoOwnership = await PhotoModel.isOwner(photoId, userId);
      if (!photoOwnership.exists || !photoOwnership.isOwner) {
        throw new Error('Photo not found or access denied');
      }
    } else if (shareType !== 'all_photos') {
      throw new Error('Invalid share type or missing resource ID');
    }

    // Create the share
    const share = await SharingModel.createShare({
      sharerId: userId,
      recipientId,
      shareType,
      albumId,
      photoId,
      permissionLevel,
      expiresAt
    });

    return SharingModel.formatShare(share, 'given');
  }

  /**
   * Get shares by user (given or received)
   */
  static async getSharesByUser(userId, type = 'given', options = {}) {
    const { page = 1, limit = 20, status = 'active', shareType = null } = options;

    if (!['given', 'received'].includes(type)) {
      throw new Error('Type must be either "given" or "received"');
    }

    const shares = await SharingModel.getSharesByUser(userId, type, {
      page,
      limit,
      status,
      shareType
    });

    const formattedShares = shares.map(share => SharingModel.formatShare(share, type));

    return {
      shares: formattedShares,
      pagination: {
        currentPage: parseInt(page),
        totalCount: formattedShares.length,
        hasNext: formattedShares.length === parseInt(limit),
        hasPrev: page > 1
      },
      type: type,
      status: status
    };
  }

  /**
   * Get share details by ID
   */
  static async getShareDetails(shareId, userId) {
    const share = await SharingModel.getShareById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    // Check if user is involved in this share
    if (share.sharer_id !== userId && share.recipient_id !== userId) {
      throw new Error('Access denied to this share');
    }

    const type = share.sharer_id === userId ? 'given' : 'received';
    return SharingModel.formatShare(share, type);
  }

  /**
   * Update share (revoke/reactivate)
   */
  static async updateShare(shareId, userId, updateData) {
    const share = await SharingModel.getShareById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    // Only sharer can modify the share
    if (share.sharer_id !== userId) {
      throw new Error('Only the sharer can modify this share');
    }

    const updatedShare = await SharingModel.updateShare(shareId, updateData);
    return SharingModel.formatShare(updatedShare, 'given');
  }

  /**
   * Revoke share
   */
  static async revokeShare(shareId, userId) {
    return this.updateShare(shareId, userId, { isActive: false });
  }

  /**
   * Reactivate share
   */
  static async reactivateShare(shareId, userId) {
    return this.updateShare(shareId, userId, { isActive: true });
  }

  /**
   * Delete share
   */
  static async deleteShare(shareId, userId) {
    const share = await SharingModel.getShareById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    // Only sharer can delete the share
    if (share.sharer_id !== userId) {
      throw new Error('Only the sharer can delete this share');
    }

    const deletedShare = await SharingModel.deleteShare(shareId);
    return {
      id: deletedShare.id,
      message: 'Share deleted successfully'
    };
  }

  /**
   * Get shared content accessible to user
   */
  static async getSharedWithMeContent(userId, { page = 1, limit = 20, shareType = null } = {}) {
    const shares = await SharingModel.getSharesByUser(userId, 'received', {
      page,
      limit,
      status: 'active',
      shareType
    });

    const contentItems = [];

    for (const share of shares) {
      let content = null;

      if (share.share_type === 'album' && share.album_id) {
        // Get album details
        const album = await SharingModel.getAlbumById(share.album_id);
        if (album) {
          content = {
            type: 'album',
            album: SharingModel.formatAlbum(album),
            shareInfo: SharingModel.formatShare(share, 'received')
          };
        }
      } else if (share.share_type === 'individual_photo' && share.photo_id) {
        // Get photo details
        const photo = await PhotoModel.findById(share.photo_id);
        if (photo) {
          const fileUrl = photo.file_path ? getFileUrl(photo.file_path) : null;
          content = {
            type: 'photo',
            photo: {
              ...PhotoModel.formatPhoto(photo),
              fileUrl
            },
            shareInfo: SharingModel.formatShare(share, 'received')
          };
        }
      } else if (share.share_type === 'all_photos') {
        content = {
          type: 'all_photos',
          shareInfo: SharingModel.formatShare(share, 'received')
        };
      }

      if (content) {
        contentItems.push(content);
      }
    }

    return {
      content: contentItems,
      pagination: {
        currentPage: parseInt(page),
        totalCount: contentItems.length,
        hasNext: contentItems.length === parseInt(limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = SharingService; 