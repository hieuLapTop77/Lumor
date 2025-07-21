const { body, query } = require('express-validator');

/**
 * User Validators
 * Contains validation rules for user operations
 */

const updateProfileValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL')
];

const userSearchValidation = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt()
];

const userIdValidation = [
  query('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt()
];

const syncSettingsValidation = [
  body('autoSyncEnabled')
    .isBoolean()
    .withMessage('Auto sync enabled phải là boolean'),
  body('autoSyncPermissionType')
    .isIn(['public', 'friends', 'close_friends', 'custom'])
    .withMessage('Loại quyền phải là: public, friends, close_friends, hoặc custom'),
  body('autoSyncCustomGroupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID nhóm tùy chỉnh phải là số nguyên dương')
    .toInt()
];

module.exports = {
  updateProfileValidation,
  userSearchValidation,
  userIdValidation,
  syncSettingsValidation
}; 