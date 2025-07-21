const { pool } = require('../config/database.config');

/**
 * Friend Model - Handles all friendship-related database operations
 */
class FriendModel {
  /**
   * Check if friendship exists between two users
   */
  static async checkFriendshipExists(userId1, userId2) {
    const query = `
      SELECT id, status, requester_id, addressee_id 
      FROM friendships 
      WHERE (requester_id = $1 AND addressee_id = $2) 
      OR (requester_id = $2 AND addressee_id = $1)
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows[0] || null;
  }

  /**
   * Find pending friend request between two users
   */
  static async findPendingRequestBetweenUsers(requesterId, addresseeId) {
    const query = `
      SELECT f.id, f.requester_id, f.addressee_id, f.status, f.created_at,
             u.username, u.display_name
      FROM friendships f
      JOIN users u ON f.requester_id = u.id
      WHERE f.requester_id = $1 AND f.addressee_id = $2 AND f.status = 'pending'
    `;
    const result = await pool.query(query, [requesterId, addresseeId]);
    return result.rows[0] || null;
  }

  /**
   * Check if two users are friends (accepted status)
   */
  static async areFriends(userId1, userId2) {
    const friendship = await this.checkFriendshipExists(userId1, userId2);
    return friendship && friendship.status === 'accepted';
  }

  /**
   * Send a friend request
   */
  static async sendFriendRequest(requesterId, addresseeId) {
    const query = `
      INSERT INTO friendships (requester_id, addressee_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING id, requester_id, addressee_id, status, created_at
    `;
    const result = await pool.query(query, [requesterId, addresseeId]);
    return result.rows[0];
  }

  /**
   * Get pending friend requests (received or sent)
   */
  static async getPendingRequests(userId, type = 'received') {
    let query = '';
    
    if (type === 'received') {
      query = `
        SELECT f.id, f.requester_id, f.status, f.created_at,
               u.username, u.display_name, u.avatar_url
        FROM friendships f
        JOIN users u ON f.requester_id = u.id
        WHERE f.addressee_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC
      `;
    } else {
      query = `
        SELECT f.id, f.addressee_id, f.status, f.created_at,
               u.username, u.display_name, u.avatar_url
        FROM friendships f
        JOIN users u ON f.addressee_id = u.id
        WHERE f.requester_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC
      `;
    }

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get friend request by ID
   */
  static async getFriendRequestById(requestId, addresseeId) {
    const query = `
      SELECT f.id, f.requester_id, f.addressee_id, f.status,
             u.username, u.display_name
      FROM friendships f
      JOIN users u ON f.requester_id = u.id
      WHERE f.id = $1 AND f.addressee_id = $2
    `;
    const result = await pool.query(query, [requestId, addresseeId]);
    return result.rows[0] || null;
  }

  /**
   * Update friendship status (accept/decline)
   */
  static async updateFriendshipStatus(requestId, status) {
    const query = `
      UPDATE friendships 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, requester_id, addressee_id, status, updated_at
    `;
    const result = await pool.query(query, [status, requestId]);
    return result.rows[0];
  }

  /**
   * Get friends list with pagination
   */
  static async getFriendsList(userId, { limit = 50, offset = 0 } = {}) {
    const query = `
      SELECT 
        CASE 
          WHEN f.requester_id = $1 THEN f.addressee_id
          ELSE f.requester_id
        END as friend_id,
        u.username, u.display_name, u.avatar_url, u.bio,
        f.updated_at as friendship_date
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.requester_id = $1 THEN f.addressee_id
          ELSE f.requester_id
        END = u.id
      )
      WHERE (f.requester_id = $1 OR f.addressee_id = $1)
      AND f.status = 'accepted'
      ORDER BY f.updated_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get total friends count
   */
  static async getFriendsCount(userId) {
    const query = `
      SELECT COUNT(*) as total
      FROM friendships f
      WHERE (f.requester_id = $1 OR f.addressee_id = $1)
      AND f.status = 'accepted'
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].total);
  }

  /**
   * Get friendship details by user IDs
   */
  static async getFriendshipByUsers(userId, friendId) {
    const query = `
      SELECT f.id, f.requester_id, f.addressee_id, f.status,
             u.username, u.display_name
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.requester_id = $1 THEN f.addressee_id
          ELSE f.requester_id
        END = u.id
      )
      WHERE (f.requester_id = $1 OR f.addressee_id = $1)
      AND (f.requester_id = $2 OR f.addressee_id = $2)
      AND f.status = 'accepted'
    `;
    const result = await pool.query(query, [userId, friendId]);
    return result.rows[0] || null;
  }

  /**
   * Delete friendship
   */
  static async deleteFriendship(friendshipId) {
    const query = 'DELETE FROM friendships WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [friendshipId]);
    return result.rows[0];
  }

  /**
   * Get user basic info
   */
  static async getUserBasicInfo(userId) {
    const query = 'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Format friend request for API response
   */
  static formatFriendRequest(request, type = 'received') {
    return {
      id: request.id,
      userId: type === 'received' ? request.requester_id : request.addressee_id,
      username: request.username,
      displayName: request.display_name,
      avatarUrl: request.avatar_url,
      status: request.status,
      createdAt: request.created_at
    };
  }

  /**
   * Format friend for API response
   */
  static formatFriend(friend) {
    return {
      id: friend.friend_id,
      username: friend.username,
      displayName: friend.display_name,
      avatarUrl: friend.avatar_url,
      bio: friend.bio,
      friendshipDate: friend.friendship_date
    };
  }

  /**
   * Format friendship for API response
   */
  static formatFriendship(friendship, additionalData = {}) {
    return {
      id: friendship.id,
      requesterId: friendship.requester_id,
      addresseeId: friendship.addressee_id,
      status: friendship.status,
      updatedAt: friendship.updated_at || friendship.created_at,
      ...additionalData
    };
  }
}

module.exports = FriendModel; 