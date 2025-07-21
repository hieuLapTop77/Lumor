const { body, query } = require('express-validator');

/**
 * Permission Validators
 * Contains validation rules for permission operations
 */

const createPermissionGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Permission group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('userIds')
    .isArray()
    .withMessage('User IDs must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('All user IDs must be positive integers')
];

const updatePermissionGroupValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Permission group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('userIds')
    .optional()
    .isArray()
    .withMessage('User IDs must be an array')
    .custom((value) => {
      if (value === undefined) return true;
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('All user IDs must be positive integers')
];

const setDefaultPermissionValidation = [
  body('permissionType')
    .isIn(['public', 'friends', 'close_friends', 'custom'])
    .withMessage('Permission type must be one of: public, friends, close_friends, custom'),
  body('customGroupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Custom group ID must be a positive integer')
];

const addUsersToGroupValidation = [
  body('groupId')
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer'),
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be a non-empty array')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('All user IDs must be positive integers')
];

const removeUsersFromGroupValidation = [
  body('groupId')
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer'),
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be a non-empty array')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('All user IDs must be positive integers')
];

const groupIdValidation = [
  query('groupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Group ID must be a positive integer')
    .toInt()
];

module.exports = {
  createPermissionGroupValidation,
  updatePermissionGroupValidation,
  setDefaultPermissionValidation,
  addUsersToGroupValidation,
  removeUsersFromGroupValidation,
  groupIdValidation
}; 