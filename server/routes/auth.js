// routes/auth.js - FIXED with separate password reset routes
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// Test route to check if auth routes are accessible
router.get('/test', (req, res) => {
  res.json({
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Register user
router.post('/register', validateRegistration, authController.register);

// Login user
router.post('/login', validateLogin, authController.login);

// Logout user
router.post('/logout', auth, authController.logout);

// ===========================================
// REGISTRATION EMAIL VERIFICATION ROUTES
// ===========================================
// These are for email verification during registration
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Legacy email verification (token-based)
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);

// ===========================================
// FORGOT PASSWORD ROUTES (SEPARATE)
// ===========================================
// These are specifically for forgot password flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-forgot-password-otp', authController.verifyForgotPasswordOTP);
router.post('/reset-password-with-otp', authController.resetPasswordWithOTP);
router.post('/resend-forgot-password-otp', authController.resendForgotPasswordOTP);

// Legacy password reset (token-based)
router.put('/reset-password/:resettoken', authController.resetPassword);

// ===========================================
// PROFILE & SETTINGS ROUTES
// ===========================================
// Get current user profile with stats
router.get('/profile', auth, authController.getProfile);

// Update user profile
router.put('/profile', auth, authController.updateProfile);

// Get current user (alternative endpoint)
router.get('/me', auth, authController.getMe);

// Change password (for logged-in users)
router.put('/change-password', auth, authController.changePassword);

// Legacy endpoints (keep for compatibility)
router.put('/update-details', auth, authController.updateDetails);
router.put('/update-password', auth, authController.updatePassword);

module.exports = router;