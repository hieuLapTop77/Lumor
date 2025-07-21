const { pool } = require('../config/database.config');

/**
 * Photo Model - Handles all photo-related database operations
 */
class PhotoModel {
  /**
   * Create a new photo record
   */
  static async create({
    ownerId,
    s3Key,
    fileName,
    originalName,
    fileSize,
    mimeType,
    caption,
    permissionType,
    customGroupId
  }) {
    const query = `
      INSERT INTO photos (user_id, file_path, filename, original_name, file_size, mime_type, caption, permission_type, custom_group_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, user_id, file_path, filename, original_name, file_size, mime_type, caption, permission_type, custom_group_id, uploaded_at
    `;
    
    const values = [
      ownerId,
      s3Key,
      fileName,
      originalName,
      fileSize,
      mimeType,
      caption || null,
      permissionType,
      customGroupId || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find photo by ID
   */
  static async findById(photoId) {
    const query = `
      SELECT p.id, p.user_id, p.file_path, p.filename, p.original_name, p.file_size, 
             p.mime_type, p.caption, p.permission_type, p.custom_group_id, p.uploaded_at,
             u.username, u.display_name, u.avatar_url
      FROM photos p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.is_deleted = false
    `;
    
    const result = await pool.query(query, [photoId]);
    return result.rows[0];
  }

  /**
   * Find photos by user ID with pagination
   */
  static async findByUserId(userId, { page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT p.id, p.user_id, p.file_path, p.filename, p.original_name, p.file_size, 
             p.mime_type, p.caption, p.permission_type, p.custom_group_id, p.uploaded_at,
             u.username, u.display_name, u.avatar_url
      FROM photos p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 AND p.is_deleted = false
      ORDER BY p.uploaded_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get count of photos by user ID
   */
  static async countByUserId(userId) {
    const query = 'SELECT COUNT(*) FROM photos WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Update photo
   */
  static async update(photoId, updateData) {
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const dbField = this.mapFieldToDb(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    // Remove updated_at since photos table doesn't have this column
    updateValues.push(photoId);

    const query = `
      UPDATE photos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, file_path, filename, original_name, file_size, mime_type, caption, permission_type, custom_group_id, uploaded_at
    `;
    
    const result = await pool.query(query, updateValues);
    return result.rows[0];
  }

  /**
   * Delete photo
   */
  static async delete(photoId) {
    const query = 'DELETE FROM photos WHERE id = $1 RETURNING id, user_id, file_path, filename';
    const result = await pool.query(query, [photoId]);
    return result.rows[0];
  }

  /**
   * Get friends' photos with pagination
   */
  static async findFriendsPhotos(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT p.id, p.user_id, p.file_path, p.filename, p.original_name, p.file_size, 
             p.mime_type, p.caption, p.permission_type, p.custom_group_id, p.uploaded_at,
             u.username, u.display_name, u.avatar_url
      FROM photos p
      JOIN users u ON p.user_id = u.id
      JOIN friendships f ON ((f.requester_id = $1 AND f.addressee_id = p.user_id) OR (f.requester_id = p.user_id AND f.addressee_id = $1))
      WHERE f.status = 'accepted' 
      AND p.user_id != $1
      AND (
        p.permission_type = 'friends' OR 
        p.permission_type = 'close_friends' OR
        p.permission_type = 'public'
      )
      ORDER BY p.uploaded_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get count of friends' photos
   */
  static async countFriendsPhotos(userId) {
    const query = `
      SELECT COUNT(*) 
      FROM photos p
      JOIN friendships f ON ((f.requester_id = $1 AND f.addressee_id = p.user_id) OR (f.requester_id = p.user_id AND f.addressee_id = $1))
      WHERE f.status = 'accepted' 
      AND p.user_id != $1
      AND (
        p.permission_type = 'friends' OR 
        p.permission_type = 'close_friends' OR
        p.permission_type = 'public'
      )
    `;
    
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get timeline feed photos
   */
  static async getTimelineFeed(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT p.id, p.user_id, p.file_path, p.filename, p.original_name, p.file_size, 
             p.mime_type, p.caption, p.permission_type, p.custom_group_id, p.uploaded_at,
             u.username, u.display_name, u.avatar_url
      FROM photos p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN friendships f ON ((f.requester_id = $1 AND f.addressee_id = p.user_id) OR (f.requester_id = p.user_id AND f.addressee_id = $1))
      WHERE (
        p.permission_type = 'public' OR
        (p.permission_type = 'friends' AND f.status = 'accepted') OR
        (p.permission_type = 'close_friends' AND f.status = 'accepted') OR
        p.user_id = $1
      )
      ORDER BY p.uploaded_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get user storage statistics
   */
  static async getUserStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_photos,
        COALESCE(SUM(file_size), 0) as total_size,
        permission_type,
        COUNT(*) as count_by_permission
      FROM photos 
      WHERE user_id = $1
      GROUP BY permission_type
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Check if user owns photo
   */
  static async isOwner(photoId, userId) {
    const query = 'SELECT user_id FROM photos WHERE id = $1';
    const result = await pool.query(query, [photoId]);
    
    if (result.rows.length === 0) {
      return { exists: false, isOwner: false };
    }
    
    return {
      exists: true,
      isOwner: result.rows[0].user_id === userId
    };
  }

  /**
   * Get custom group information
   */
  static async getCustomGroup(groupId) {
    const query = `
      SELECT id, group_name, description, allowed_user_ids, user_id
      FROM access_permissions
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [groupId]);
    return result.rows[0] || null;
  }

  /**
   * Check if custom group exists and belongs to user
   */
  static async isCustomGroupOwner(groupId, userId) {
    const query = 'SELECT id FROM access_permissions WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [groupId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Map field names to database columns
   */
  static mapFieldToDb(field) {
    const fieldMap = {
      caption: 'caption',
      permissionType: 'permission_type',
      customGroupId: 'custom_group_id'
    };
    
    return fieldMap[field] || field;
  }

  /**
   * Format photo object for API response
   */
  static formatPhoto(photo, customGroup = null) {
    return {
      id: photo.id,
      ownerId: photo.user_id,
      fileName: photo.filename,
      originalName: photo.original_name,
      fileSize: photo.file_size,
      mimeType: photo.mime_type,
      caption: photo.caption,
      permissionType: photo.permission_type,
      customGroup: customGroup,
      createdAt: photo.uploaded_at,
      updatedAt: photo.uploaded_at,
      owner: photo.username ? {
        id: photo.user_id,
        username: photo.username,
        displayName: photo.display_name,
        avatarUrl: photo.avatar_url
      } : undefined
    };
  }
}

module.exports = PhotoModel; 