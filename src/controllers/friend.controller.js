const FriendService = require('../services/friend.service');
const { validationResult } = require('express-validator');
const ResponseUtils = require('../utils/response.utils');

/**
 * Friend Controller - Handles HTTP requests for friend operations
 */
class FriendController {
  /**
   * Send a friend request
   */
  static async sendFriendRequest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { addresseeId } = req.body;
      const requesterId = req.user.id;

      const result = await FriendService.sendFriendRequest(requesterId, parseInt(addresseeId));

      return ResponseUtils.success(res, 'Friend request sent successfully', result, 201);
    } catch (error) {
      console.error('Send friend request error:', error);
      
      if (error.message.includes('Cannot send friend request to yourself') ||
          error.message.includes('already sent') ||
          error.message.includes('already friends') ||
          error.message.includes('previously declined')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      
      if (error.message === 'User not found') {
        return ResponseUtils.error(res, 'User not found', 404);
      }
      
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Get pending friend requests
   */
  static async getPendingRequests(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { type = 'received' } = req.query;
      const userId = req.user.id;

      const result = await FriendService.getPendingRequests(userId, type);

      return ResponseUtils.success(res, 
        `${type === 'received' ? 'Received' : 'Sent'} friend requests retrieved successfully`, 
        result
      );
    } catch (error) {
      console.error('Get friend requests error:', error);
      
      if (error.message.includes('Invalid type parameter')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Accept or decline a friend request
   */
  static async respondToFriendRequest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { requestId, action } = req.body;
      const userId = req.user.id;

      const result = await FriendService.respondToFriendRequest(
        userId, 
        parseInt(requestId), 
        action
      );

      return ResponseUtils.success(res, `Friend request ${action}ed successfully`, result);
    } catch (error) {
      console.error('Respond to friend request error:', error);
      
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return ResponseUtils.error(res, error.message, 404);
      }
      
      if (error.message.includes('already been responded') ||
          error.message.includes('Action must be')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Get friends list
   */
  static async getFriendsList(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user.id;

      const result = await FriendService.getFriendsList(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return ResponseUtils.success(res, 'Friends list retrieved successfully', result);
    } catch (error) {
      console.error('Get friends list error:', error);
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Remove a friend
   */
  static async removeFriend(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { friendId } = req.params;
      const userId = req.user.id;

      const result = await FriendService.removeFriend(userId, parseInt(friendId));

      return ResponseUtils.success(res, 'Friend removed successfully', result);
    } catch (error) {
      console.error('Remove friend error:', error);
      
      if (error.message === 'Friendship not found') {
        return ResponseUtils.error(res, 'Friendship not found', 404);
      }
      
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Accept friend request by friend ID
   */
  static async acceptFriendRequestById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { friendId } = req.params;
      const userId = req.user.id;

      const result = await FriendService.respondToFriendRequestByUserId(userId, parseInt(friendId), 'accept');

      return ResponseUtils.success(res, 'Friend request accepted successfully', result);
    } catch (error) {
      console.error('Accept friend request error:', error);
      
      if (error.message === 'Friend request not found') {
        return ResponseUtils.error(res, 'Friend request not found', 404);
      }
      
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Decline friend request by friend ID
   */
  static async declineFriendRequestById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { friendId } = req.params;
      const userId = req.user.id;

      const result = await FriendService.respondToFriendRequestByUserId(userId, parseInt(friendId), 'decline');

      return ResponseUtils.success(res, 'Friend request declined successfully', result);
    } catch (error) {
      console.error('Decline friend request error:', error);
      
      if (error.message === 'Friend request not found') {
        return ResponseUtils.error(res, 'Friend request not found', 404);
      }
      
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Block a friend
   */
  static async blockFriend(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { friendId } = req.params;
      const userId = req.user.id;

      const result = await FriendService.blockFriend(userId, parseInt(friendId));

      return ResponseUtils.success(res, 'Friend blocked successfully', result);
    } catch (error) {
      console.error('Block friend error:', error);
      
      if (error.message === 'User not found') {
        return ResponseUtils.error(res, 'User not found', 404);
      }
      
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Get friendship status between current user and another user
   */
  static async getFriendshipStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { userId } = req.params;
      const currentUserId = req.user.id;

      const result = await FriendService.getFriendshipStatus(
        currentUserId, 
        parseInt(userId)
      );

      return ResponseUtils.success(res, 'Friendship status retrieved successfully', result);
    } catch (error) {
      console.error('Get friendship status error:', error);
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Get mutual friends between current user and another user
   */
  static async getMutualFriends(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { userId } = req.params;
      const currentUserId = req.user.id;

      const result = await FriendService.getMutualFriends(
        currentUserId, 
        parseInt(userId)
      );

      return ResponseUtils.success(res, 'Mutual friends retrieved successfully', result);
    } catch (error) {
      console.error('Get mutual friends error:', error);
      return ResponseUtils.error(res, error.message, 500);
    }
  }

  /**
   * Get friend suggestions
   */
  static async getFriendSuggestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const { limit = 10 } = req.query;
      const userId = req.user.id;

      const result = await FriendService.getFriendSuggestions(userId, {
        limit: parseInt(limit)
      });

      return ResponseUtils.success(res, 'Friend suggestions retrieved successfully', result);
    } catch (error) {
      console.error('Get friend suggestions error:', error);
      return ResponseUtils.error(res, error.message, 500);
    }
  }
}

module.exports = FriendController; 