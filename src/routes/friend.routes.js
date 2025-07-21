const express = require('express');
const FriendController = require('../controllers/friend.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  friendRequestValidation,
  respondRequestValidation,
  friendIdValidation,
  requestsQueryValidation,
  friendsListValidation
} = require('../validators/friend.validators');

const router = express.Router();

/**
 * Friend Routes - Clean route definitions with middleware and validation
 */

/**
 * @swagger
 * /api/v2/friends/request:
 *   post:
 *     summary: Send friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friend_id
 *             properties:
 *               friend_id:
 *                 type: integer
 *                 example: 2
 *                 description: User ID to send friend request to
 *     responses:
 *       200:
 *         description: Friend request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot send request (already friends, request exists, etc.)
 *       404:
 *         description: User not found
 */
// Send friend request
router.post('/request', 
  authenticateToken, 
  friendRequestValidation, 
  FriendController.sendFriendRequest
);

/**
 * @swagger
 * /api/v2/friends/requests:
 *   get:
 *     summary: Get pending friend requests
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [received, sent, all]
 *           default: received
 *         description: Type of requests to retrieve
 *     responses:
 *       200:
 *         description: Friend requests retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Friend'
 */
// Get pending friend requests (received or sent)
router.get('/requests', 
  authenticateToken, 
  requestsQueryValidation, 
  FriendController.getPendingRequests
);

/**
 * @swagger
 * /api/v2/friends/respond:
 *   post:
 *     summary: Respond to friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *               - action
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 123
 *                 description: Friend request ID
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *                 example: accept
 *                 description: Action to take on the request
 *     responses:
 *       200:
 *         description: Friend request responded to successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Friend request not found
 */
// Respond to friend request (accept/decline)
router.post('/respond', 
  authenticateToken, 
  respondRequestValidation, 
  FriendController.respondToFriendRequest
);

/**
 * @swagger
 * /api/v2/friends:
 *   get:
 *     summary: Get friends list
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search friends by name
 *     responses:
 *       200:
 *         description: Friends list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 */
// Get friends list
router.get('/', 
  authenticateToken, 
  friendsListValidation, 
  FriendController.getFriendsList
);

/**
 * @swagger
 * /api/v2/friends/{friendId}:
 *   delete:
 *     summary: Remove friend
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Friend user ID
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Friend not found
 */
// Remove friend
router.delete('/:friendId', 
  authenticateToken, 
  friendIdValidation, 
  FriendController.removeFriend
);

/**
 * @swagger
 * /api/v2/friends/{friendId}/accept:
 *   put:
 *     summary: Accept friend request by user ID
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID who sent the friend request
 *     responses:
 *       200:
 *         description: Friend request accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Friend request not found
 */
// Accept friend request by friendId - NEW ROUTE
router.put('/:friendId/accept', 
  authenticateToken, 
  friendIdValidation, 
  FriendController.acceptFriendRequestById
);

/**
 * @swagger
 * /api/v2/friends/{friendId}/decline:
 *   put:
 *     summary: Decline friend request by user ID
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID who sent the friend request
 *     responses:
 *       200:
 *         description: Friend request declined
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Friend request not found
 */
// Decline friend request by friendId - NEW ROUTE
router.put('/:friendId/decline', 
  authenticateToken, 
  friendIdValidation, 
  FriendController.declineFriendRequestById
);

/**
 * @swagger
 * /api/v2/friends/{friendId}/block:
 *   put:
 *     summary: Block friend
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Friend user ID to block
 *     responses:
 *       200:
 *         description: Friend blocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Friend not found
 */
// Block friend
router.put('/:friendId/block', 
  authenticateToken, 
  friendIdValidation, 
  FriendController.blockFriend
);

/**
 * @swagger
 * /api/v2/friends/status/{userId}:
 *   get:
 *     summary: Get friendship status with another user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to check friendship status with
 *     responses:
 *       200:
 *         description: Friendship status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [friends, pending, blocked, none]
 *                         requestId:
 *                           type: integer
 *                           nullable: true
 */
// Get friendship status with another user
router.get('/status/:userId', 
  authenticateToken, 
  friendIdValidation, 
  FriendController.getFriendshipStatus
);

/**
 * @swagger
 * /api/v2/friends/mutual/{userId}:
 *   get:
 *     summary: Get mutual friends with another user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to find mutual friends with
 *     responses:
 *       200:
 *         description: Mutual friends retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 */
// Get mutual friends with another user
router.get('/mutual/:userId', 
  authenticateToken, 
  friendIdValidation, 
  FriendController.getMutualFriends
);

/**
 * @swagger
 * /api/v2/friends/suggestions:
 *   get:
 *     summary: Get friend suggestions
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friend suggestions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 */
// Get friend suggestions
router.get('/suggestions', 
  authenticateToken, 
  FriendController.getFriendSuggestions
);

module.exports = router; 