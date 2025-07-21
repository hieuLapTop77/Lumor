const { validationResult } = require('express-validator');
const DeviceSyncService = require('../services/device-sync.service');

/**
 * Device Sync Controller
 * Handles HTTP requests for device synchronization operations
 */

class DeviceSyncController {
  /**
   * Register a device for sync
   * POST /api/v2/device-sync/register
   */
  static async registerDevice(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const deviceData = req.body;
      
      const result = await DeviceSyncService.registerDevice(userId, deviceData);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Register device error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get device sync status
   * GET /api/v2/device-sync/status
   */
  static async getDeviceStatus(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { deviceId } = req.query;
      
      const result = await DeviceSyncService.getDeviceStatus(userId, deviceId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get device status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all user devices
   * GET /api/v2/device-sync/devices
   */
  static async getUserDevices(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await DeviceSyncService.getUserDevices(userId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get user devices error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update device sync settings
   * PUT /api/v2/device-sync/settings
   */
  static async updateSyncSettings(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { deviceId, ...settings } = req.body;
      
      const result = await DeviceSyncService.updateSyncSettings(userId, deviceId, settings);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Update sync settings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Process bulk photo upload from device
   * POST /api/v2/device-sync/bulk-upload
   */
  static async processBulkUpload(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const files = req.files;
      const uploadData = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided for upload'
        });
      }
      
      const result = await DeviceSyncService.processBulkUpload(userId, files, uploadData);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Process bulk upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get device file mappings
   * GET /api/v2/device-sync/mappings
   */
  static async getDeviceFileMappings(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { deviceId, limit = 100, offset = 0 } = req.query;
      
      const result = await DeviceSyncService.getDeviceFileMappings(
        userId, 
        deviceId, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get device file mappings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get sync history for device
   * GET /api/v2/device-sync/history
   */
  static async getSyncHistory(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { deviceId, limit = 20, offset = 0 } = req.query;
      
      const result = await DeviceSyncService.getSyncHistory(
        userId, 
        deviceId, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Get sync history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete device and all related data
   * DELETE /api/v2/device-sync/device
   */
  static async deleteDevice(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { deviceId } = req.query;
      
      const result = await DeviceSyncService.deleteDevice(userId, deviceId);
      
      return res.status(result.success ? 200 : result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Delete device error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = DeviceSyncController; 