// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/adminAuth');

// Admin login
router.post('/login', adminController.adminLogin);

// Protected admin routes
router.use(adminAuth);

// Dashboard analytics (using the correct function name)
router.get('/analytics', adminController.getDashboardAnalytics);

// Get all print requests (using the correct function name)
router.get('/requests', adminController.getAllPrintRequests);

// Get single print request by ID (using the correct function name)
router.get('/requests/:id', adminController.getAdminPrintRequest);

// Update request status (using the correct function name)
router.put('/requests/:id/status', adminController.updateRequestStatus);

// Get all users
router.get('/users', adminController.getAllUsers);

// Get user by ID
router.get('/users/:id', adminController.getUserById);

// Update user
router.put('/users/:id', adminController.updateUser);

// Delete user
router.delete('/users/:id', adminController.deleteUser);

// Get settings
router.get('/settings', adminController.getSettings);

// Update settings
router.put('/settings', adminController.updateSettings);

// Get recent notifications for dashboard
router.get('/notifications', adminController.getNotificationsForAdmin);

module.exports = router;