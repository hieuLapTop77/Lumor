const { pool } = require('../config/database.config');

/**
 * User model for database operations
 */

class UserModel {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const { username, email, passwordHash, displayName } = userData;
    
    const query = `
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, display_name, created_at, updated_at
    `;
    
    const result = await pool.query(query, [username, email, passwordHash, displayName || username]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  static async findById(id) {
    const query = `
      SELECT id, username, email, display_name, bio, avatar_url, 
             auto_sync_enabled, auto_sync_permission_type, last_sync_at, sync_status,
             auto_share_all, default_sharing_enabled, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, display_name, bio, avatar_url,
             auto_sync_enabled, auto_sync_permission_type, last_sync_at, sync_status,
             auto_share_all, default_sharing_enabled, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User or null
   */
  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, display_name, bio, avatar_url,
             auto_sync_enabled, auto_sync_permission_type, last_sync_at, sync_status,
             auto_share_all, default_sharing_enabled, created_at, updated_at
      FROM users
      WHERE username = $1
    `;
    
    const result = await pool.query(query, [username]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  static async updateProfile(id, updateData) {
    const allowedFields = ['display_name', 'bio', 'avatar_url'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, username, email, display_name, bio, avatar_url, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update sync settings
   * @param {number} id - User ID
   * @param {Object} syncData - Sync settings data
   * @returns {Promise<Object>} Updated user
   */
  static async updateSyncSettings(id, syncData) {
    const allowedFields = ['auto_sync_enabled', 'auto_sync_permission_type', 'last_sync_at', 'sync_status'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(syncData).forEach(key => {
      if (allowedFields.includes(key) && syncData[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(syncData[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid sync fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, auto_sync_enabled, auto_sync_permission_type, last_sync_at, sync_status, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update sharing settings
   * @param {number} id - User ID
   * @param {Object} sharingData - Sharing settings data
   * @returns {Promise<Object>} Updated user
   */
  static async updateSharingSettings(id, sharingData) {
    const allowedFields = ['auto_share_all', 'default_sharing_enabled'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(sharingData).forEach(key => {
      if (allowedFields.includes(key) && sharingData[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(sharingData[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid sharing fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, auto_share_all, default_sharing_enabled, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Search users by username or display name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @param {number} excludeUserId - User ID to exclude from results
   * @returns {Promise<Array>} Array of users
   */
  static async search(searchTerm, limit = 20, offset = 0, excludeUserId = null) {
    let query = `
      SELECT id, username, display_name, bio, avatar_url, created_at,
             CASE 
               WHEN username ILIKE $1 THEN 1
               WHEN display_name ILIKE $1 THEN 2
               WHEN username ILIKE $2 THEN 3
               WHEN display_name ILIKE $2 THEN 4
               ELSE 5
             END as relevance
      FROM users
      WHERE (username ILIKE $2 OR display_name ILIKE $2)
    `;
    
    const values = [`${searchTerm}`, `%${searchTerm}%`];
    let paramIndex = 3;

    if (excludeUserId) {
      query += ` AND id != $${paramIndex}`;
      values.push(excludeUserId);
      paramIndex++;
    }

    query += ` ORDER BY relevance, username LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get user statistics
   * @param {number} id - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getStatistics(id) {
    const queries = [
      // Photo count
      `SELECT COUNT(*) as photo_count FROM photos WHERE user_id = $1`,
      
      // Album count
      `SELECT COUNT(*) as album_count FROM albums WHERE user_id = $1`,
      
      // Friend count
      `SELECT COUNT(*) as friend_count FROM friendships 
       WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`,
       
      // Shares given count
      `SELECT COUNT(*) as shares_given FROM photo_shares WHERE shared_by = $1 AND is_active = TRUE`,
      
      // Shares received count
      `SELECT COUNT(*) as shares_received FROM photo_shares WHERE shared_with = $1 AND is_active = TRUE`
    ];

    const results = await Promise.all(
      queries.map(query => pool.query(query, [id]))
    );

    return {
      photoCount: parseInt(results[0].rows[0].photo_count),
      albumCount: parseInt(results[1].rows[0].album_count),
      friendCount: parseInt(results[2].rows[0].friend_count),
      sharesGiven: parseInt(results[3].rows[0].shares_given),
      sharesReceived: parseInt(results[4].rows[0].shares_received)
    };
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {number} excludeId - User ID to exclude (for updates)
   * @returns {Promise<boolean>} True if email exists
   */
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT 1 FROM users WHERE email = $1';
    const values = [email];

    if (excludeId) {
      query += ' AND id != $2';
      values.push(excludeId);
    }

    const result = await pool.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {number} excludeId - User ID to exclude (for updates)
   * @returns {Promise<boolean>} True if username exists
   */
  static async usernameExists(username, excludeId = null) {
    let query = 'SELECT 1 FROM users WHERE username = $1';
    const values = [username];

    if (excludeId) {
      query += ' AND id != $2';
      values.push(excludeId);
    }

    const result = await pool.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * Find users not in the given list of IDs
   * @param {Array<number>} excludeIds - Array of user IDs to exclude
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of users
   */
  static async findUsersNotInList(excludeIds, { limit = 10 } = {}) {
    if (excludeIds.length === 0) {
      const query = `
        SELECT id, username, display_name, avatar_url, bio, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1
      `;
      const result = await pool.query(query, [limit]);
      return result.rows;
    }

    const placeholders = excludeIds.map((_, index) => `$${index + 2}`).join(',');
    const query = `
      SELECT id, username, display_name, avatar_url, bio, created_at
      FROM users
      WHERE id NOT IN (${placeholders})
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit, ...excludeIds]);
    return result.rows;
  }

  /**
   * Search users by query
   * @param {string} searchQuery - Search query
   * @param {number} limit - Results limit
   * @param {number} offset - Results offset
   * @returns {Promise<Object>} Search results with pagination
   */
  static async search(searchQuery, limit = 20, offset = 0) {
    const query = `
      SELECT id, username, email, display_name, bio, avatar_url, created_at
      FROM users
      WHERE 
        username ILIKE $1 OR 
        display_name ILIKE $1 OR 
        email ILIKE $1
      ORDER BY 
        CASE 
          WHEN username ILIKE $1 THEN 1
          WHEN display_name ILIKE $1 THEN 2
          ELSE 3
        END,
        username
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE 
        username ILIKE $1 OR 
        display_name ILIKE $1 OR 
        email ILIKE $1
    `;

    const searchPattern = `%${searchQuery}%`;
    
    const [result, countResult] = await Promise.all([
      pool.query(query, [searchPattern, limit, offset]),
      pool.query(countQuery, [searchPattern])
    ]);

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Get user activity for a given period
   * @param {number} userId - User ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Activity data
   */
  static async getActivity(userId, days = 30) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as photos_uploaded
      FROM photos
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const friendsQuery = `
      SELECT COUNT(*) as friends_count
      FROM friendships
      WHERE (requester_id = $1 OR addressee_id = $1)
        AND status = 'accepted'
    `;

    const sharesQuery = `
      SELECT COUNT(*) as shares_count
      FROM photo_shares
      WHERE shared_by_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;

    const [activityResult, friendsResult, sharesResult] = await Promise.all([
      pool.query(query, [userId]),
      pool.query(friendsQuery, [userId]),
      pool.query(sharesQuery, [userId])
    ]);

    return {
      photoActivity: activityResult.rows,
      friendsCount: parseInt(friendsResult.rows[0].friends_count),
      sharesCount: parseInt(sharesResult.rows[0].shares_count),
      period: `${days} days`
    };
  }

  /**
   * Delete user (soft delete by deactivating)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    // Note: In a real app, you might want to implement soft delete
    // For now, this is a placeholder
    const query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = UserModel; 