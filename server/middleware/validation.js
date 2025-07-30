// middleware/validation.js
const { body, validationResult } = require('express-validator');
const { USER_CATEGORIES } = require('../utils/constants');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('whatsappNumber')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('category')
    .isIn(Object.values(USER_CATEGORIES))
    .withMessage('Invalid user category'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Print request validation
const validatePrintRequest = [
  body('copies')
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of copies must be between 1 and 100'),
  
  body('pageSize')
    .isIn(['A4', 'A3', 'Letter', 'Legal'])
    .withMessage('Invalid page size'),
  
  body('orientation')
    .isIn(['auto', 'portrait', 'landscape'])
    .withMessage('Invalid orientation'),
  
  body('printType')
    .isIn(['black', 'color'])
    .withMessage('Print type must be either black or color'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validatePrintRequest,
  handleValidationErrors
};
