const express = require('express');
const UserController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  updateProfileValidation,
  userSearchValidation,
  userIdValidation,
  syncSettingsValidation
} = require('../validators/user.validators');

const router = express.Router();

/**
 * User Routes - Clean route definitions with middleware and validation
 */

/**
 * @swagger
 * /api/v2/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 */
// Get current user profile
router.get('/me', 
  authenticateToken, 
  UserController.getCurrentUserProfile
);

/**
 * @swagger
 * /api/v2/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: 'john_doe_updated'
 *               full_name:
 *                 type: string
 *                 example: 'John Doe Updated'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john.updated@example.com'
 *               bio:
 *                 type: string
 *                 example: 'Updated bio'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 */
// Update current user profile
router.put('/me', 
  authenticateToken, 
  updateProfileValidation, 
  UserController.updateCurrentUserProfile
);

/**
 * @swagger
 * /api/v2/users/me/statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
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
 *                         totalPhotos:
 *                           type: integer
 *                         totalFriends:
 *                           type: integer
 *                         totalShares:
 *                           type: integer
 *                         storageUsed:
 *                           type: string
 *                         joinDate:
 *                           type: string
 *                           format: date-time
 */
// Get user statistics
router.get('/me/statistics', 
  authenticateToken, 
  UserController.getUserStatistics
);

/**
 * @swagger
 * /api/v2/users/me/activity:
 *   get:
 *     summary: Get user activity
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User activity log
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           action:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           details:
 *                             type: object
 */
// Get user activity
router.get('/me/activity', 
  authenticateToken, 
  UserController.getUserActivity
);

/**
 * @swagger
 * /api/v2/users/me:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot delete account
 */
// Delete user account
router.delete('/me', 
  authenticateToken, 
  UserController.deleteUserAccount
);

/**
 * @swagger
 * /api/v2/users/sync-settings:
 *   get:
 *     summary: Get sync settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync settings retrieved
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
 *                         autoSync:
 *                           type: boolean
 *                         syncFrequency:
 *                           type: string
 *                         syncQuality:
 *                           type: string
 *                         wifiOnly:
 *                           type: boolean
 */
// Sync settings routes
router.get('/sync-settings', 
  authenticateToken, 
  UserController.getSyncSettings
);

/**
 * @swagger
 * /api/v2/users/sync-settings:
 *   put:
 *     summary: Update sync settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoSync:
 *                 type: boolean
 *                 example: true
 *               syncFrequency:
 *                 type: string
 *                 enum: [immediate, hourly, daily]
 *                 example: hourly
 *               syncQuality:
 *                 type: string
 *                 enum: [original, high, medium]
 *                 example: high
 *               wifiOnly:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Sync settings updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/sync-settings', 
  authenticateToken, 
  syncSettingsValidation, 
  UserController.setupSyncSettings
);

/**
 * @swagger
 * /api/v2/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (username, email, or name)
 *         example: john
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
 *     responses:
 *       200:
 *         description: Users found
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
// Search users
router.get('/search', 
  authenticateToken, 
  userSearchValidation, 
  UserController.searchUsers
);

/**
 * @swagger
 * /api/v2/users/{userId}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
// Get user profile by ID
router.get('/:userId', 
  authenticateToken, 
  UserController.getUserProfileById
);

module.exports = router; 