const express = require('express');
const PermissionController = require('../controllers/permission.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  createPermissionGroupValidation,
  updatePermissionGroupValidation,
  setDefaultPermissionValidation,
  addUsersToGroupValidation,
  removeUsersFromGroupValidation,
  groupIdValidation
} = require('../validators/permission.validators');

const router = express.Router();

/**
 * Permission Routes - Clean route definitions with middleware and validation
 */

// Create a new permission group
router.post('/groups', 
  authenticateToken, 
  createPermissionGroupValidation, 
  PermissionController.createPermissionGroup
);

// Get user's permission groups
router.get('/groups', 
  authenticateToken, 
  groupIdValidation,
  PermissionController.getUserPermissionGroups
);

// Get permission group by ID
router.get('/groups/:groupId', 
  authenticateToken, 
  PermissionController.getPermissionGroupById
);

// Update permission group
router.put('/groups/:groupId', 
  authenticateToken, 
  updatePermissionGroupValidation, 
  PermissionController.updatePermissionGroup
);

// Delete permission group
router.delete('/groups/:groupId', 
  authenticateToken, 
  PermissionController.deletePermissionGroup
);

// Add users to permission group
router.post('/groups/add-users', 
  authenticateToken, 
  addUsersToGroupValidation, 
  PermissionController.addUsersToGroup
);

// Remove users from permission group
router.post('/groups/remove-users', 
  authenticateToken, 
  removeUsersFromGroupValidation, 
  PermissionController.removeUsersFromGroup
);

// Get user's default permission settings
router.get('/defaults', 
  authenticateToken, 
  PermissionController.getUserDefaultPermissions
);

// Update user's default permission settings
router.put('/defaults', 
  authenticateToken, 
  setDefaultPermissionValidation, 
  PermissionController.updateUserDefaultPermissions
);

module.exports = router; 