const { pool } = require('../config/database.config');

/**
 * Sharing Model - Handles all sharing and album-related database operations
 */
class SharingModel {
  /**
   * Album Management
   */

  /**
   * Create a new album
   */
  static async createAlbum({ userId, albumName, description, privacyType = 'private' }) {
    // Convert privacyType to is_public boolean
    const isPublic = privacyType === 'public';
    
    const query = `
      INSERT INTO albums (user_id, name, description, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, name, description, is_public, created_at, updated_at
    `;
    
    const result = await pool.query(query, [userId, albumName, description, isPublic]);
    return result.rows[0];
  }

  /**
   * Get user's albums with photo counts
   */
  static async getUserAlbums(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT a.id, a.name, a.description, a.cover_photo_id, a.is_public, 
             a.created_at, a.updated_at,
             COUNT(ap.photo_id) as photo_count,
             p.file_path as cover_photo_url
      FROM albums a
      LEFT JOIN album_photos ap ON a.id = ap.album_id
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      WHERE a.user_id = $1
      GROUP BY a.id, p.file_path
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get total album count for user
   */
  static async getUserAlbumsCount(userId) {
    const query = 'SELECT COUNT(*) FROM albums WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get album by ID with ownership check
   */
  static async getAlbumById(albumId, userId = null) {
    let query = `
      SELECT a.id, a.user_id, a.name, a.description, a.cover_photo_id, 
             a.is_public, a.created_at, a.updated_at,
             u.username, u.display_name
      FROM albums a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `;
    
    const values = [albumId];
    
    if (userId) {
      query += ' AND a.user_id = $2';
      values.push(userId);
    }
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update album
   */
  static async updateAlbum(albumId, updateData) {
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Map frontend fields to database columns
    const fieldMapping = {
      name: 'name',
      description: 'description', 
      isPublic: 'is_public'
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && fieldMapping[key]) {
        const dbField = fieldMapping[key];
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(albumId);

    const query = `
      UPDATE albums 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, name, description, is_public, created_at, updated_at
    `;
    
    const result = await pool.query(query, updateValues);
    return result.rows[0];
  }

  /**
   * Delete album
   */
  static async deleteAlbum(albumId) {
    // Remove all photo associations first
    await pool.query('DELETE FROM album_photos WHERE album_id = $1', [albumId]);
    
    // Delete the album
    const query = 'DELETE FROM albums WHERE id = $1 RETURNING id, name';
    const result = await pool.query(query, [albumId]);
    return result.rows[0];
  }

  /**
   * Get photos in album
   */
  static async getAlbumPhotos(albumId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT p.id, p.owner_id, p.file_path, p.file_name, p.original_name, 
             p.file_size, p.mime_type, p.caption, p.permission_type, 
             p.custom_group_id, p.created_at, p.updated_at,
             u.username, u.display_name, u.avatar_url,
             ap.added_at
      FROM photos p
      JOIN album_photos ap ON p.id = ap.photo_id
      JOIN users u ON p.owner_id = u.id
      WHERE ap.album_id = $1
      ORDER BY ap.added_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [albumId, limit, offset]);
    return result.rows;
  }

  /**
   * Get total photo count in album
   */
  static async getAlbumPhotosCount(albumId) {
    const query = 'SELECT COUNT(*) FROM album_photos WHERE album_id = $1';
    const result = await pool.query(query, [albumId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Add photos to album
   */
  static async addPhotosToAlbum(albumId, photoIds) {
    const values = photoIds.map((photoId, index) => {
      const base = index * 2;
      return `($${base + 1}, $${base + 2})`;
    }).join(',');
    
    const queryValues = photoIds.flatMap(photoId => [albumId, photoId]);
    
    const query = `
      INSERT INTO album_photos (album_id, photo_id)
      VALUES ${values}
      ON CONFLICT (album_id, photo_id) DO NOTHING
      RETURNING album_id, photo_id
    `;
    
    const result = await pool.query(query, queryValues);
    return result.rows;
  }

  /**
   * Remove photos from album
   */
  static async removePhotosFromAlbum(albumId, photoIds) {
    const placeholders = photoIds.map((_, index) => `$${index + 2}`).join(',');
    const query = `
      DELETE FROM album_photos 
      WHERE album_id = $1 AND photo_id IN (${placeholders})
      RETURNING album_id, photo_id
    `;
    
    const result = await pool.query(query, [albumId, ...photoIds]);
    return result.rows;
  }

  /**
   * Photo Sharing
   */

  /**
   * Create a new share
   */
  static async createShare({
    sharerId,
    recipientId,
    shareType,
    albumId = null,
    photoId = null,
    permissionLevel = 'view',
    expiresAt = null
  }) {
    let query, values, result;

    if (shareType === 'album' && albumId) {
      // Use album_shares table for album shares
      query = `
        INSERT INTO album_shares (
          shared_by, shared_with, album_id, 
          permission_level, expires_at, is_active
        )
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING id, shared_by, shared_with, album_id, NULL as photo_id,
                  permission_level, expires_at, is_active, created_at, 
                  'album' as share_type
      `;
      values = [sharerId, recipientId, albumId, permissionLevel, expiresAt];
    } else if (shareType === 'individual_photo' && photoId) {
      // Use photo_shares table for individual photo shares
      query = `
        INSERT INTO photo_shares (
          shared_by, shared_with, photo_id, 
          permission_level, expires_at, is_active
        )
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING id, shared_by, shared_with, NULL as album_id, photo_id,
                  permission_level, expires_at, is_active, created_at,
                  'individual_photo' as share_type
      `;
      values = [sharerId, recipientId, photoId, permissionLevel, expiresAt];
    } else if (shareType === 'all_photos') {
      // Use photo_shares table for all_photos shares (no specific photo or album)
      query = `
        INSERT INTO photo_shares (
          shared_by, shared_with, 
          permission_level, expires_at, is_active
        )
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING id, shared_by, shared_with, NULL as album_id, NULL as photo_id,
                  permission_level, expires_at, is_active, created_at,
                  'all_photos' as share_type
      `;
      values = [sharerId, recipientId, permissionLevel, expiresAt];
    } else {
      throw new Error('Invalid share type or missing resource ID');
    }
    
    result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get shares by user (given or received)
   */
  static async getSharesByUser(userId, type = 'given', { page = 1, limit = 20, status = 'active', shareType = null } = {}) {
    const offset = (page - 1) * limit;
    let photoSharesQuery = '';
    let albumSharesQuery = '';
    
    if (type === 'given') {
      // Get photo shares given by user
      let photoStatusCondition = '';
      if (status === 'active') {
        photoStatusCondition = `ps.is_active = TRUE AND (ps.expires_at IS NULL OR ps.expires_at > CURRENT_TIMESTAMP)`;
      } else if (status === 'expired') {
        photoStatusCondition = `ps.is_active = FALSE OR ps.expires_at <= CURRENT_TIMESTAMP`;
      } else {
        photoStatusCondition = '1=1'; // No filter for 'all' status
      }
      
      photoSharesQuery = `
        SELECT ps.id, ps.shared_by, ps.shared_with, 'individual_photo' as share_type, 
               NULL as album_id, ps.photo_id, ps.permission_level, ps.expires_at, 
               ps.is_active, ps.created_at,
               u.username as shared_with_username, u.display_name as shared_with_display_name,
               NULL as album_name, p.filename as file_name
        FROM photo_shares ps
        JOIN users u ON ps.shared_with = u.id
        LEFT JOIN photos p ON ps.photo_id = p.id
        WHERE ps.shared_by = $1 AND ${photoStatusCondition}
      `;
      
      // Get album shares given by user
      let albumStatusCondition = '';
      if (status === 'active') {
        albumStatusCondition = `als.is_active = TRUE AND (als.expires_at IS NULL OR als.expires_at > CURRENT_TIMESTAMP)`;
      } else if (status === 'expired') {
        albumStatusCondition = `als.is_active = FALSE OR als.expires_at <= CURRENT_TIMESTAMP`;
      } else {
        albumStatusCondition = '1=1'; // No filter for 'all' status
      }
      
      albumSharesQuery = `
        SELECT als.id, als.shared_by, als.shared_with, 'album' as share_type,
               als.album_id, NULL as photo_id, als.permission_level, als.expires_at,
               als.is_active, als.created_at,
               u.username as shared_with_username, u.display_name as shared_with_display_name,
               a.name as album_name, NULL as file_name
        FROM album_shares als
        JOIN users u ON als.shared_with = u.id
        LEFT JOIN albums a ON als.album_id = a.id
        WHERE als.shared_by = $1 AND ${albumStatusCondition}
      `;
    } else {
      // Get photo shares received by user
      let photoStatusCondition = '';
      if (status === 'active') {
        photoStatusCondition = `ps.is_active = TRUE AND (ps.expires_at IS NULL OR ps.expires_at > CURRENT_TIMESTAMP)`;
      } else if (status === 'expired') {
        photoStatusCondition = `ps.is_active = FALSE OR ps.expires_at <= CURRENT_TIMESTAMP`;
      } else {
        photoStatusCondition = '1=1'; // No filter for 'all' status
      }
      
      photoSharesQuery = `
        SELECT ps.id, ps.shared_by, ps.shared_with, 'individual_photo' as share_type,
               NULL as album_id, ps.photo_id, ps.permission_level, ps.expires_at,
               ps.is_active, ps.created_at,
               u.username as shared_by_username, u.display_name as shared_by_display_name,
               NULL as album_name, p.filename as file_name
        FROM photo_shares ps
        JOIN users u ON ps.shared_by = u.id
        LEFT JOIN photos p ON ps.photo_id = p.id
        WHERE ps.shared_with = $1 AND ${photoStatusCondition}
      `;
      
      // Get album shares received by user
      let albumStatusCondition = '';
      if (status === 'active') {
        albumStatusCondition = `als.is_active = TRUE AND (als.expires_at IS NULL OR als.expires_at > CURRENT_TIMESTAMP)`;
      } else if (status === 'expired') {
        albumStatusCondition = `als.is_active = FALSE OR als.expires_at <= CURRENT_TIMESTAMP`;
      } else {
        albumStatusCondition = '1=1'; // No filter for 'all' status
      }
      
      albumSharesQuery = `
        SELECT als.id, als.shared_by, als.shared_with, 'album' as share_type,
               als.album_id, NULL as photo_id, als.permission_level, als.expires_at,
               als.is_active, als.created_at,
               u.username as shared_by_username, u.display_name as shared_by_display_name,
               a.name as album_name, NULL as file_name
        FROM album_shares als
        JOIN users u ON als.shared_by = u.id
        LEFT JOIN albums a ON als.album_id = a.id
        WHERE als.shared_with = $1 AND ${albumStatusCondition}
      `;
    }
    
    // Combine queries with UNION and add share type filter if needed
    let unionQuery = `(${photoSharesQuery}) UNION ALL (${albumSharesQuery})`;
    
    if (shareType) {
      if (shareType === 'individual_photo') {
        unionQuery = photoSharesQuery;
      } else if (shareType === 'album') {
        unionQuery = albumSharesQuery;
      }
      // If shareType is 'all_photos', we still need both queries but will filter later
    }
    
    const finalQuery = `
      SELECT * FROM (${unionQuery}) combined_shares
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const values = [userId, limit, offset];
    const result = await pool.query(finalQuery, values);
    return result.rows;
  }

  /**
   * Get share by ID
   */
  static async getShareById(shareId) {
    // Try to find in photo_shares table first
    const photoShareQuery = `
      SELECT ps.id, ps.shared_by, ps.shared_with, 'individual_photo' as share_type, 
             NULL as album_id, ps.photo_id, ps.permission_level, ps.expires_at, 
             ps.is_active, ps.created_at,
             sharer.username as shared_by_username, sharer.display_name as shared_by_display_name,
             recipient.username as shared_with_username, recipient.display_name as shared_with_display_name,
             NULL as album_name, p.filename as file_name
      FROM photo_shares ps
      JOIN users sharer ON ps.shared_by = sharer.id
      JOIN users recipient ON ps.shared_with = recipient.id
      LEFT JOIN photos p ON ps.photo_id = p.id
      WHERE ps.id = $1
    `;
    
    let result = await pool.query(photoShareQuery, [shareId]);
    if (result.rows[0]) {
      return result.rows[0];
    }
    
    // If not found in photo_shares, try album_shares table
    const albumShareQuery = `
      SELECT als.id, als.shared_by, als.shared_with, 'album' as share_type,
             als.album_id, NULL as photo_id, als.permission_level, als.expires_at,
             als.is_active, als.created_at,
             sharer.username as shared_by_username, sharer.display_name as shared_by_display_name,
             recipient.username as shared_with_username, recipient.display_name as shared_with_display_name,
             a.name as album_name, NULL as file_name
      FROM album_shares als
      JOIN users sharer ON als.shared_by = sharer.id
      JOIN users recipient ON als.shared_with = recipient.id
      LEFT JOIN albums a ON als.album_id = a.id
      WHERE als.id = $1
    `;
    
    result = await pool.query(albumShareQuery, [shareId]);
    return result.rows[0] || null;
  }

  /**
   * Update share (revoke/reactivate)
   */
  static async updateShare(shareId, updateData) {
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const dbField = this.mapShareFieldToDb(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateValues.push(shareId);

    // Try to update in photo_shares table first
    const photoShareQuery = `
      UPDATE photo_shares 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, shared_by, shared_with, 'individual_photo' as share_type, 
                NULL as album_id, photo_id, permission_level, expires_at, 
                is_active, created_at
    `;
    
    let result = await pool.query(photoShareQuery, updateValues);
    if (result.rows[0]) {
      return result.rows[0];
    }

    // If not found in photo_shares, try album_shares table
    const albumShareQuery = `
      UPDATE album_shares 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, shared_by, shared_with, 'album' as share_type,
                album_id, NULL as photo_id, permission_level, expires_at,
                is_active, created_at
    `;
    
    result = await pool.query(albumShareQuery, updateValues);
    return result.rows[0];
  }

  /**
   * Delete share
   */
  static async deleteShare(shareId) {
    // Try to delete from photo_shares table first
    let query = 'DELETE FROM photo_shares WHERE id = $1 RETURNING id';
    let result = await pool.query(query, [shareId]);
    
    if (result.rows[0]) {
      return result.rows[0];
    }
    
    // If not found in photo_shares, try album_shares table
    query = 'DELETE FROM album_shares WHERE id = $1 RETURNING id';
    result = await pool.query(query, [shareId]);
    return result.rows[0];
  }

  /**
   * Helper methods
   */

  /**
   * Map album field names to database columns
   */
  static mapAlbumFieldToDb(field) {
    const fieldMap = {
      albumName: 'name',
      description: 'description',
      privacyType: 'is_public'
    };
    
    return fieldMap[field] || field;
  }

  /**
   * Map share field names to database columns
   */
  static mapShareFieldToDb(field) {
    const fieldMap = {
      isActive: 'is_active',
      permissionLevel: 'permission_level',
      expiresAt: 'expires_at'
    };
    
    return fieldMap[field] || field;
  }

  /**
   * Format album for API response
   */
  static formatAlbum(album) {
    return {
      id: album.id,
      userId: album.user_id,
      name: album.name,
      description: album.description,
      isPublic: album.is_public,
      photoCount: album.photo_count ? parseInt(album.photo_count) : 0,
      coverPhotoUrl: album.cover_photo_url,
      createdAt: album.created_at,
      updatedAt: album.updated_at
    };
  }

  /**
   * Format share for API response
   */
  static formatShare(share, type = 'given') {
    const isGiven = type === 'given';
    
    return {
      id: share.id,
      sharerId: share.shared_by,
      recipientId: share.shared_with,
      shareType: share.share_type,
      albumId: share.album_id,
      photoId: share.photo_id,
      permissionLevel: share.permission_level,
      expiresAt: share.expires_at,
      isActive: share.is_active,
      createdAt: share.created_at,
      updatedAt: share.updated_at,
      [isGiven ? 'recipient' : 'sharer']: {
        username: isGiven ? share.shared_with_username : share.shared_by_username,
        displayName: isGiven ? share.shared_with_display_name : share.shared_by_display_name
      },
      content: {
        albumName: share.album_name,
        fileName: share.file_name
      }
    };
  }
}

module.exports = SharingModel; 