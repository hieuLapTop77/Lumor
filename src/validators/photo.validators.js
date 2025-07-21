const { body, param, query } = require('express-validator');

/**
 * Validation schemas for photo operations
 */

const uploadValidation = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Caption must not exceed 1000 characters'),
  
  body('permissionType')
    .isIn(['public', 'friends', 'close_friends', 'custom'])
    .withMessage('Permission type must be one of: public, friends, close_friends, custom'),
  
  body('customGroupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Custom group ID must be a positive integer')
];

const updateValidation = [
  param('photoId')
    .isInt({ min: 1 })
    .withMessage('Photo ID must be a positive integer'),
  
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Caption must not exceed 1000 characters'),
  
  body('permissionType')
    .optional()
    .isIn(['public', 'friends', 'close_friends', 'custom'])
    .withMessage('Permission type must be one of: public, friends, close_friends, custom'),
  
  body('customGroupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Custom group ID must be a positive integer')
];

const photoIdValidation = [
  param('photoId')
    .isInt({ min: 1 })
    .withMessage('Photo ID must be a positive integer')
];

const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const friendIdValidation = [
  param('friendId')
    .isInt({ min: 1 })
    .withMessage('Friend ID must be a positive integer')
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

const timelineFeedValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
];

module.exports = {
  uploadValidation,
  updateValidation,
  photoIdValidation,
  userIdValidation,
  friendIdValidation,
  paginationValidation,
  timelineFeedValidation
}; 