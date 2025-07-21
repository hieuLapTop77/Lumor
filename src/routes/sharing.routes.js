const express = require('express');
const SharingController = require('../controllers/sharing.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  albumValidation,
  updateAlbumValidation,
  albumIdValidation,
  addPhotosToAlbumValidation,
  shareValidation,
  shareIdValidation,
  paginationValidation,
  shareQueryValidation
} = require('../validators/sharing.validators');

const router = express.Router();

/**
 * Sharing Routes - Clean route definitions with middleware and validation
 */

// Album Management Routes

/**
 * @swagger
 * /api/v2/sharing/albums:
 *   post:
 *     summary: Create album
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Vacation Photos'
 *               description:
 *                 type: string
 *                 example: 'Photos from our summer vacation'
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Album created successfully
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
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         isPublic:
 *                           type: boolean
 */
// Create album
router.post('/albums', 
  authenticateToken, 
  albumValidation, 
  SharingController.createAlbum
);

/**
 * @swagger
 * /api/v2/sharing/albums:
 *   get:
 *     summary: Get user's albums
 *     tags: [Sharing]
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
 *     responses:
 *       200:
 *         description: User albums retrieved
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
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           photoCount:
 *                             type: integer
 */
// Get user's albums
router.get('/albums', 
  authenticateToken, 
  paginationValidation, 
  SharingController.getUserAlbums
);

/**
 * @swagger
 * /api/v2/sharing/albums/{albumId}:
 *   get:
 *     summary: Get album details with photos
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album details retrieved
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
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         photos:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Photo'
 */
// Get album details with photos
router.get('/albums/:albumId', 
  authenticateToken, 
  albumIdValidation, 
  SharingController.getAlbumDetails
);

/**
 * @swagger
 * /api/v2/sharing/albums/{albumId}:
 *   put:
 *     summary: Update album
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Updated Album Name'
 *               description:
 *                 type: string
 *                 example: 'Updated description'
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Album updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Update album
router.put('/albums/:albumId', 
  authenticateToken, 
  updateAlbumValidation, 
  SharingController.updateAlbum
);

/**
 * @swagger
 * /api/v2/sharing/albums/{albumId}:
 *   delete:
 *     summary: Delete album
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Album not found
 *       403:
 *         description: Not authorized to delete this album
 */
// Delete album
router.delete('/albums/:albumId', 
  authenticateToken, 
  albumIdValidation, 
  SharingController.deleteAlbum
);

/**
 * @swagger
 * /api/v2/sharing/albums/{albumId}/photos:
 *   post:
 *     summary: Add photos to album
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoIds
 *             properties:
 *               photoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Photos added to album
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Add photos to album
router.post('/albums/:albumId/photos', 
  authenticateToken, 
  addPhotosToAlbumValidation, 
  SharingController.addPhotosToAlbum
);

/**
 * @swagger
 * /api/v2/sharing/albums/{albumId}/photos:
 *   delete:
 *     summary: Remove photos from album
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoIds
 *             properties:
 *               photoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Photos removed from album
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Remove photos from album
router.delete('/albums/:albumId/photos', 
  authenticateToken, 
  addPhotosToAlbumValidation, 
  SharingController.removePhotosFromAlbum
);

// Photo Sharing Routes

/**
 * @swagger
 * /api/v2/sharing/photo:
 *   post:
 *     summary: Share photo with friends
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photo_id
 *               - friend_ids
 *             properties:
 *               photo_id:
 *                 type: integer
 *                 example: 123
 *               friend_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3, 4]
 *               permission_level:
 *                 type: string
 *                 enum: [view, download]
 *                 default: view
 *               message:
 *                 type: string
 *                 example: 'Check out this photo!'
 *     responses:
 *       200:
 *         description: Photo shared successfully
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
 *                         $ref: '#/components/schemas/PhotoShare'
 */
// Share photo (alias for createShare) - NEW ROUTE
router.post('/photo', 
  authenticateToken, 
  shareValidation, 
  SharingController.createShare
);

/**
 * @swagger
 * /api/v2/sharing/share:
 *   post:
 *     summary: Create share (share content with friends)
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photo_id
 *               - friend_ids
 *             properties:
 *               photo_id:
 *                 type: integer
 *                 example: 123
 *               album_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 456
 *               friend_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3, 4]
 *               permission_level:
 *                 type: string
 *                 enum: [view, download]
 *                 default: view
 *               message:
 *                 type: string
 *                 example: 'Sharing some memories!'
 *     responses:
 *       200:
 *         description: Content shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// Create share (share content with friends)
router.post('/share', 
  authenticateToken, 
  shareValidation, 
  SharingController.createShare
);

// Get shares by user (given or received)
router.get('/shares', 
  authenticateToken, 
  paginationValidation.concat(shareQueryValidation), 
  SharingController.getSharesByUser
);

// Get share details by ID
router.get('/shares/:shareId', 
  authenticateToken, 
  shareIdValidation, 
  SharingController.getShareDetails
);

// Revoke share
router.patch('/shares/:shareId/revoke', 
  authenticateToken, 
  shareIdValidation, 
  SharingController.revokeShare
);

// Reactivate share
router.patch('/shares/:shareId/reactivate', 
  authenticateToken, 
  shareIdValidation, 
  SharingController.reactivateShare
);

// Delete share
router.delete('/shares/:shareId', 
  authenticateToken, 
  shareIdValidation, 
  SharingController.deleteShare
);

// Get content shared with current user
router.get('/shared-with-me', 
  authenticateToken, 
  paginationValidation.concat(shareQueryValidation), 
  SharingController.getSharedWithMe
);

module.exports = router; 