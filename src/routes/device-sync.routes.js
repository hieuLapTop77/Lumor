const express = require('express');
const DeviceSyncController = require('../controllers/device-sync.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { deviceSyncMultipleUpload, handleDeviceSyncUploadErrors } = require('../middleware/device-sync-upload.middleware');
const {
  deviceRegistrationValidation,
  bulkUploadValidation,
  syncSettingsValidation,
  deviceIdValidation
} = require('../validators/device-sync.validators');

const router = express.Router();

/**
 * Device Sync Routes - Clean route definitions with middleware and validation
 */

// Register a device for sync
router.post('/register', 
  authenticateToken, 
  deviceRegistrationValidation, 
  DeviceSyncController.registerDevice
);

// Get device sync status
router.get('/status', 
  authenticateToken, 
  deviceIdValidation, 
  DeviceSyncController.getDeviceStatus
);

// Get all user devices
router.get('/devices', 
  authenticateToken, 
  DeviceSyncController.getUserDevices
);

// Update device sync settings
router.put('/settings', 
  authenticateToken, 
  syncSettingsValidation, 
  DeviceSyncController.updateSyncSettings
);

// Process bulk photo upload from device
router.post('/bulk-upload', 
  authenticateToken,
  deviceSyncMultipleUpload,
  handleDeviceSyncUploadErrors,
  bulkUploadValidation, 
  DeviceSyncController.processBulkUpload
);

// Get device file mappings
router.get('/mappings', 
  authenticateToken, 
  deviceIdValidation, 
  DeviceSyncController.getDeviceFileMappings
);

// Get sync history for device
router.get('/history', 
  authenticateToken, 
  deviceIdValidation, 
  DeviceSyncController.getSyncHistory
);

// Delete device and all related data
router.delete('/device', 
  authenticateToken, 
  deviceIdValidation, 
  DeviceSyncController.deleteDevice
);

module.exports = router; 