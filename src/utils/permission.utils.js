const { pool } = require('../config/database.config');

/**
 * Permission utilities for photo and album access control
 */

class PermissionUtils {
  /**
   * Check if two users are friends
   * @param {number} userId1 - First user ID
   * @param {number} userId2 - Second user ID
   * @returns {Promise<boolean>} True if users are friends
   */
  static async areFriends(userId1, userId2) {
    const query = `
      SELECT 1 FROM friendships 
      WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
      AND status = 'accepted'
    `;
    
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows.length > 0;
  }

  /**
   * Check photo permission for a user
   * @param {number} currentUserId - User requesting access
   * @param {number} photoOwnerId - Photo owner ID
   * @param {string} permissionType - Photo permission type
   * @param {number} customGroupId - Custom group ID (if applicable)
   * @returns {Promise<Object>} Permission result with hasPermission and reason
   */
  static async checkPhotoPermission(currentUserId, photoOwnerId, permissionType, customGroupId = null) {
    // Self-access is always allowed
    if (currentUserId === photoOwnerId) {
      return { hasPermission: true, reason: 'Owner access' };
    }

    switch (permissionType) {
      case 'public':
        return { hasPermission: true, reason: 'Public access' };
        
      case 'friends':
      case 'close_friends':
        const isFriend = await this.areFriends(currentUserId, photoOwnerId);
        return { 
          hasPermission: isFriend, 
          reason: isFriend ? 'Friend access' : 'Not friends' 
        };
        
      case 'custom':
        if (!customGroupId) {
          return { hasPermission: false, reason: 'Custom group ID required' };
        }
        
        const customGroupQuery = `
          SELECT allowed_user_ids 
          FROM access_permissions 
          WHERE id = $1 AND user_id = $2
        `;
        const customGroupResult = await pool.query(customGroupQuery, [customGroupId, photoOwnerId]);
        
        if (customGroupResult.rows.length === 0) {
          return { hasPermission: false, reason: 'Custom group not found' };
        }
        
        const allowedUserIds = customGroupResult.rows[0].allowed_user_ids || [];
        const hasAccess = allowedUserIds.includes(currentUserId);
        return { 
          hasPermission: hasAccess, 
          reason: hasAccess ? 'Custom group access' : 'Not in custom group' 
        };
        
      default:
        return { hasPermission: false, reason: 'Invalid permission type' };
    }
  }

  /**
   * Check album access permission
   * @param {number} currentUserId - User requesting access
   * @param {number} albumId - Album ID
   * @returns {Promise<Object>} Permission result with hasPermission, reason, and album info
   */
  static async checkAlbumPermission(currentUserId, albumId) {
    const albumQuery = `
      SELECT a.id, a.user_id, a.privacy_type, u.username, u.display_name
      FROM albums a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `;

    const albumResult = await pool.query(albumQuery, [albumId]);
    
    if (albumResult.rows.length === 0) {
      return { hasPermission: false, reason: 'Album not found', album: null };
    }

    const album = albumResult.rows[0];

    // Owner has full access
    if (album.user_id === currentUserId) {
      return { hasPermission: true, reason: 'Owner access', album };
    }

    // Check if album is shared with current user
    const shareQuery = `
      SELECT 1 FROM photo_shares 
      WHERE sharer_id = $1 AND recipient_id = $2 AND album_id = $3 AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    const shareResult = await pool.query(shareQuery, [album.user_id, currentUserId, albumId]);

    if (shareResult.rows.length > 0) {
      return { hasPermission: true, reason: 'Shared access', album };
    }

    // Check privacy type
    if (album.privacy_type === 'private') {
      return { hasPermission: false, reason: 'Private album', album };
    }

    if (album.privacy_type === 'friends') {
      const isFriend = await this.areFriends(currentUserId, album.user_id);
      return { 
        hasPermission: isFriend, 
        reason: isFriend ? 'Friend access' : 'Not friends',
        album 
      };
    }

    if (album.privacy_type === 'public') {
      return { hasPermission: true, reason: 'Public access', album };
    }

    return { hasPermission: false, reason: 'Access denied', album };
  }

  /**
   * Check if user can share content with another user
   * @param {number} sharerId - User who wants to share
   * @param {number} recipientId - User who will receive the share
   * @returns {Promise<Object>} Permission result
   */
  static async canShareWith(sharerId, recipientId) {
    if (sharerId === recipientId) {
      return { canShare: false, reason: 'Cannot share with yourself' };
    }

    const isFriend = await this.areFriends(sharerId, recipientId);
    return { 
      canShare: isFriend, 
      reason: isFriend ? 'Can share with friend' : 'Can only share with friends' 
    };
  }

  /**
   * Check sharing permission level
   * @param {string} permissionLevel - Permission level (view, download, comment)
   * @returns {Object} Available permissions
   */
  static getPermissionLevel(permissionLevel) {
    switch (permissionLevel) {
      case 'view':
        return { canView: true, canDownload: false, canComment: false };
      case 'download':
        return { canView: true, canDownload: true, canComment: false };
      case 'comment':
        return { canView: true, canDownload: true, canComment: true };
      default:
        return { canView: false, canDownload: false, canComment: false };
    }
  }

  /**
   * Check if user owns a resource
   * @param {number} userId - User ID
   * @param {string} resourceType - Type of resource (photo, album, etc.)
   * @param {number} resourceId - Resource ID
   * @returns {Promise<boolean>} True if user owns the resource
   */
  static async isOwner(userId, resourceType, resourceId) {
    let query;
    
    switch (resourceType) {
      case 'photo':
        query = 'SELECT 1 FROM photos WHERE id = $1 AND owner_id = $2';
        break;
      case 'album':
        query = 'SELECT 1 FROM albums WHERE id = $1 AND user_id = $2';
        break;
      case 'device':
        query = 'SELECT 1 FROM device_sync_status WHERE id = $1 AND user_id = $2';
        break;
      case 'share':
        query = 'SELECT 1 FROM photo_shares WHERE id = $1 AND sharer_id = $2';
        break;
      default:
        return false;
    }

    const result = await pool.query(query, [resourceId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Get user's default album
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Default album or null
   */
  static async getDefaultAlbum(userId) {
    const query = `
      SELECT id, album_name, description, created_at
      FROM albums
      WHERE user_id = $1 AND is_default = TRUE
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Create default album for user if it doesn't exist
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Default album
   */
  static async ensureDefaultAlbum(userId) {
    let defaultAlbum = await this.getDefaultAlbum(userId);
    
    if (!defaultAlbum) {
      const createQuery = `
        INSERT INTO albums (user_id, album_name, description, is_default, privacy_type)
        VALUES ($1, 'My Photos', 'Default album for all photos', TRUE, 'private')
        RETURNING id, album_name, description, created_at
      `;
      
      const result = await pool.query(createQuery, [userId]);
      defaultAlbum = result.rows[0];
    }
    
    return defaultAlbum;
  }
}

// Export individual functions for easier importing
const checkPhotoPermission = PermissionUtils.checkPhotoPermission.bind(PermissionUtils);
const checkFriendship = PermissionUtils.areFriends.bind(PermissionUtils);
const checkAlbumPermission = PermissionUtils.checkAlbumPermission.bind(PermissionUtils);
const isOwner = PermissionUtils.isOwner.bind(PermissionUtils);

module.exports = {
  PermissionUtils,
  checkPhotoPermission,
  checkFriendship,
  checkAlbumPermission,
  isOwner
}; 