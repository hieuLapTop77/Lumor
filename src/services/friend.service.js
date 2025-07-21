const FriendModel = require('../models/friend.model');
const UserModel = require('../models/user.model');

/**
 * Friend Service - Handles friendship business logic
 */
class FriendService {
  /**
   * Send a friend request
   */
  static async sendFriendRequest(requesterId, targetUserId) {
    // Check if trying to send request to self
    if (requesterId === targetUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if target user exists
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if friendship already exists
    const existingFriendship = await FriendModel.checkFriendshipExists(requesterId, targetUserId);
    
    if (existingFriendship) {
      let message = '';
      switch (existingFriendship.status) {
        case 'pending':
          message = 'Friend request already sent or received';
          break;
        case 'accepted':
          message = 'You are already friends';
          break;
        case 'declined':
          message = 'Friend request was previously declined';
          break;
        default:
          message = 'Friendship relationship already exists';
      }
      throw new Error(message);
    }

    // Create friend request
    const friendRequest = await FriendModel.sendFriendRequest(requesterId, targetUserId);

    return {
      request: FriendModel.formatFriendship(friendRequest),
      targetUser: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.display_name
      }
    };
  }

  /**
   * Get pending friend requests
   */
  static async getPendingRequests(userId, type = 'received') {
    if (!['received', 'sent'].includes(type)) {
      throw new Error('Invalid type parameter. Must be "received" or "sent"');
    }

    const requests = await FriendModel.getPendingRequests(userId, type);
    
    const formattedRequests = requests.map(request => 
      FriendModel.formatFriendRequest(request, type)
    );

    return {
      requests: formattedRequests,
      count: formattedRequests.length,
      type: type
    };
  }

  /**
   * Respond to friend request (by request ID)
   */
  static async respondToFriendRequest(userId, requestId, action) {
    if (!['accept', 'decline'].includes(action)) {
      throw new Error('Action must be either "accept" or "decline"');
    }

    // Check if request exists and user is the addressee
    const friendRequest = await FriendModel.getFriendRequestById(requestId, userId);
    
    if (!friendRequest) {
      throw new Error('Friend request not found or you are not authorized to respond');
    }

    if (friendRequest.status !== 'pending') {
      throw new Error('Friend request has already been responded to');
    }

    // Update friendship status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const updatedFriendship = await FriendModel.updateFriendshipStatus(requestId, newStatus);

    return {
      friendship: FriendModel.formatFriendship(updatedFriendship),
      requester: {
        id: friendRequest.requester_id,
        username: friendRequest.username,
        displayName: friendRequest.display_name
      },
      action: action
    };
  }

  /**
   * Respond to friend request (by user ID) - NEW METHOD
   */
  static async respondToFriendRequestByUserId(userId, friendId, action) {
    if (!['accept', 'decline'].includes(action)) {
      throw new Error('Action must be either "accept" or "decline"');
    }

    // Find pending friend request between users
    const friendRequest = await FriendModel.findPendingRequestBetweenUsers(friendId, userId);
    
    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    // Update friendship status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const updatedFriendship = await FriendModel.updateFriendshipStatus(friendRequest.id, newStatus);

    return {
      friendship: FriendModel.formatFriendship(updatedFriendship),
      requester: {
        id: friendRequest.requester_id,
        username: friendRequest.username,
        displayName: friendRequest.display_name
      },
      action: action
    };
  }

  /**
   * Get friends list with pagination
   */
  static async getFriendsList(userId, { limit = 50, offset = 0 } = {}) {
    // Validate pagination parameters
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    const parsedOffset = Math.max(parseInt(offset), 0);

    const friends = await FriendModel.getFriendsList(userId, { 
      limit: parsedLimit, 
      offset: parsedOffset 
    });
    
    const totalCount = await FriendModel.getFriendsCount(userId);

    const formattedFriends = friends.map(friend => 
      FriendModel.formatFriend(friend)
    );

    return {
      friends: formattedFriends,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasNext: (parsedOffset + parsedLimit) < totalCount,
        hasPrev: parsedOffset > 0
      }
    };
  }

  /**
   * Remove a friend
   */
  static async removeFriend(userId, friendId) {
    // Validate friendId
    const parsedFriendId = parseInt(friendId);
    if (isNaN(parsedFriendId)) {
      throw new Error('Invalid friend ID');
    }

    // Check if friendship exists
    const friendship = await FriendModel.getFriendshipByUsers(userId, parsedFriendId);
    
    if (!friendship) {
      throw new Error('Friendship not found');
    }

    // Delete friendship
    await FriendModel.deleteFriendship(friendship.id);

    return {
      removedFriend: {
        id: parsedFriendId,
        username: friendship.username,
        displayName: friendship.display_name
      }
    };
  }

  /**
   * Check if two users are friends
   */
  static async checkFriendship(userId1, userId2) {
    return await FriendModel.areFriends(userId1, userId2);
  }

  /**
   * Get friendship status between two users
   */
  static async getFriendshipStatus(userId1, userId2) {
    const friendship = await FriendModel.checkFriendshipExists(userId1, userId2);
    
    if (!friendship) {
      return {
        status: 'none',
        canSendRequest: true
      };
    }

    return {
      status: friendship.status,
      canSendRequest: false,
      friendship: FriendModel.formatFriendship(friendship)
    };
  }

  /**
   * Get mutual friends between two users
   */
  static async getMutualFriends(userId1, userId2) {
    // This would require a more complex query
    // For now, we'll implement a basic version
    const user1Friends = await FriendModel.getFriendsList(userId1, { limit: 1000 });
    const user2Friends = await FriendModel.getFriendsList(userId2, { limit: 1000 });

    const user1FriendIds = new Set(user1Friends.map(f => f.friend_id));
    const mutualFriends = user2Friends.filter(friend => 
      user1FriendIds.has(friend.friend_id)
    );

    return {
      mutualFriends: mutualFriends.map(friend => FriendModel.formatFriend(friend)),
      count: mutualFriends.length
    };
  }

  /**
   * Get friend suggestions (users who are not friends yet)
   */
  static async getFriendSuggestions(userId, { limit = 10 } = {}) {
    // This is a simplified implementation
    // In a real app, you might use more sophisticated algorithms
    // based on mutual friends, interests, etc.
    
    const existingFriendships = await FriendModel.getFriendsList(userId, { limit: 1000 });
    const friendIds = existingFriendships.map(f => f.friend_id);
    friendIds.push(userId); // Exclude self

    // Get users who are not friends
    const suggestions = await UserModel.findUsersNotInList(friendIds, { limit });

    return {
      suggestions: suggestions.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio
      })),
      count: suggestions.length
    };
  }
}

module.exports = FriendService; 