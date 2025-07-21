const { body, param, query } = require('express-validator');

/**
 * Validation schemas for sharing operations
 */

const albumValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Album name must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

const updateAlbumValidation = [
  param('albumId')
    .isInt({ min: 1 })
    .withMessage('Album ID must be a positive integer'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Album name must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

const albumIdValidation = [
  param('albumId')
    .isInt({ min: 1 })
    .withMessage('Album ID must be a positive integer')
];

const addPhotosToAlbumValidation = [
  param('albumId')
    .isInt({ min: 1 })
    .withMessage('Album ID must be a positive integer'),
  
  body('photoId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Photo ID must be a positive integer'),
  
  body('photoIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Photo IDs must be a non-empty array'),
  
  body('photoIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each photo ID must be a positive integer'),

  // Custom validation to ensure either photoId or photoIds is provided
  body().custom((value, { req }) => {
    const { photoId, photoIds } = req.body;
    if (!photoId && !photoIds) {
      throw new Error('Either photoId or photoIds must be provided');
    }
    if (photoId && photoIds) {
      throw new Error('Provide either photoId or photoIds, not both');
    }
    return true;
  })
];

const shareValidation = [
  body('recipientId')
    .isInt({ min: 1 })
    .withMessage('Recipient ID must be a positive integer'),
  
  body('shareType')
    .isIn(['all_photos', 'album', 'individual_photo'])
    .withMessage('Share type must be one of: all_photos, album, individual_photo'),
  
  body('albumId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Album ID must be a positive integer'),
  
  body('photoId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Photo ID must be a positive integer'),
  
  body('permissionLevel')
    .optional()
    .isIn(['view', 'download', 'comment'])
    .withMessage('Permission level must be one of: view, download, comment'),
  
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid ISO8601 date')
];

const shareIdValidation = [
  param('shareId')
    .isInt({ min: 1 })
    .withMessage('Share ID must be a positive integer')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const shareQueryValidation = [
  query('status')
    .optional()
    .isIn(['active', 'expired', 'all'])
    .withMessage('Status must be one of: active, expired, all'),
  
  query('shareType')
    .optional()
    .isIn(['all_photos', 'album', 'individual_photo'])
    .withMessage('Share type must be one of: all_photos, album, individual_photo')
];

module.exports = {
  albumValidation,
  updateAlbumValidation,
  albumIdValidation,
  addPhotosToAlbumValidation,
  shareValidation,
  shareIdValidation,
  paginationValidation,
  shareQueryValidation
}; 