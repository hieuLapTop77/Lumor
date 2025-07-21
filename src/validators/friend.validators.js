const { body, param, query } = require('express-validator');

/**
 * Validation schemas for friend operations
 */

const friendRequestValidation = [
  body('addresseeId')
    .isInt({ min: 1 })
    .withMessage('Addressee ID must be a positive integer')
];

const respondRequestValidation = [
  body('requestId')
    .isInt({ min: 1 })
    .withMessage('Request ID must be a positive integer'),
  
  body('action')
    .isIn(['accept', 'decline'])
    .withMessage('Action must be either "accept" or "decline"')
];

const friendIdValidation = [
  param('friendId')
    .isInt({ min: 1 })
    .withMessage('Friend ID must be a positive integer')
];

const requestsQueryValidation = [
  query('type')
    .optional()
    .isIn(['received', 'sent'])
    .withMessage('Type must be either "received" or "sent"')
];

const friendsListValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

module.exports = {
  friendRequestValidation,
  respondRequestValidation,
  friendIdValidation,
  requestsQueryValidation,
  friendsListValidation
}; 