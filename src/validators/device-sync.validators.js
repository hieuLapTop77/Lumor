const { body, query } = require('express-validator');

/**
 * Device Sync Validators
 * Contains validation rules for device sync operations
 */

const deviceRegistrationValidation = [
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ max: 255 })
    .withMessage('Device ID must not exceed 255 characters'),
  body('deviceName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Device name must not exceed 255 characters'),
  body('deviceType')
    .isIn(['android', 'ios', 'windows', 'mac', 'web'])
    .withMessage('Device type must be one of: android, ios, windows, mac, web')
];

const deviceSyncValidation = [
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required'),
  body('photos')
    .isArray({ min: 1 })
    .withMessage('Photos array is required and must not be empty'),
  body('photos.*.deviceFilePath')
    .notEmpty()
    .withMessage('Device file path is required for each photo'),
  body('photos.*.fileName')
    .notEmpty()
    .withMessage('File name is required for each photo'),
  body('photos.*.fileSize')
    .isInt({ min: 1 })
    .withMessage('File size must be a positive integer'),
  body('photos.*.mimeType')
    .notEmpty()
    .withMessage('MIME type is required for each photo'),
  body('photos.*.capturedAt')
    .optional()
    .isISO8601()
    .withMessage('Captured at must be a valid ISO8601 date')
];

const bulkUploadValidation = [
  body('permissionType')
    .isIn(['public', 'friends', 'close_friends', 'custom'])
    .withMessage('Permission type must be one of: public, friends, close_friends, custom'),
  body('customGroupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Custom group ID must be a positive integer'),
  body('sessionType')
    .optional()
    .isIn(['initial_sync', 'auto_sync', 'manual_sync'])
    .withMessage('Session type must be one of: initial_sync, auto_sync, manual_sync')
];

const syncSettingsValidation = [
  body('autoSyncEnabled')
    .isBoolean()
    .withMessage('Auto sync enabled must be a boolean'),
  body('autoSyncPermissionType')
    .optional()
    .isIn(['public', 'friends', 'close_friends', 'custom'])
    .withMessage('Permission type must be one of: public, friends, close_friends, custom'),
  body('autoSyncCustomGroupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Custom group ID must be a positive integer')
];

const deviceIdValidation = [
  query('deviceId')
    .notEmpty()
    .withMessage('Device ID is required')
];

module.exports = {
  deviceRegistrationValidation,
  deviceSyncValidation,
  bulkUploadValidation,
  syncSettingsValidation,
  deviceIdValidation
}; 