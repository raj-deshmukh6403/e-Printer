// routes/contact.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const contactController = require('../controllers/contactController');
// const { protect, authorize } = require('../middleware/auth'); // Uncomment if you have auth middleware

// Rate limiting for contact form (5 submissions per hour per IP)
const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later.'
  }
});

// Contact form validation
const validateContactForm = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('category')
    .isIn(['student', 'staff', 'professor'])
    .withMessage('Please select a valid category'),
  body('subject')
    .isIn(['technical-support', 'payment-issue', 'document-problem', 'feature-request', 'general-inquiry', 'other'])
    .withMessage('Please select a valid subject'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
];

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', contactRateLimit, validateContactForm, contactController.submitContactForm);

// @route   GET /api/contact/history
// @desc    Get all contact submissions (for admin)
// @access  Private/Admin
// router.get('/history', protect, authorize('admin'), contactController.getContactHistory);
router.get('/history', contactController.getContactHistory); // Remove auth for now

// @route   GET /api/contact/:id
// @desc    Get single contact submission
// @access  Private/Admin
router.get('/:id', contactController.getSingleContact);

// @route   PUT /api/contact/:id/status
// @desc    Update contact status
// @access  Private/Admin
router.put('/:id/status', contactController.updateContactStatus);

module.exports = router;