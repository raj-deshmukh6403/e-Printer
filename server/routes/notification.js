// // routes/notification.js
// const express = require('express');
// const router = express.Router();
// const notificationController = require('../controllers/notificationController');
// const { auth } = require('../middleware/auth');

// // Get user notifications
// router.get('/', auth, notificationController.getUserNotifications);

// // Get notification statistics
// router.get('/stats', auth, notificationController.getNotificationStats);

// // Mark notification as read
// router.patch('/:id/read', auth, notificationController.markAsRead);

// // Mark all notifications as read
// router.patch('/read-all', auth, notificationController.markAllAsRead);

// // Delete notification
// router.delete('/:id', auth, notificationController.deleteNotification);

// // Delete all read notifications
// router.delete('/read', auth, notificationController.deleteReadNotifications);

// module.exports = router;


//for test
// routes/notifications.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Import your notification model (create if doesn't exist)
const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
};

// Routes
router.get('/getall', auth, getUserNotifications);
router.put('/:id/read', auth, markNotificationAsRead);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Notifications routes are working!' });
});

module.exports = router;