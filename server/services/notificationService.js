// services/notificationService.js
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');
const { sendSMS } = require('./smsService');

// @desc    Create notification
// exports.createNotification = async (options) => {
//   try {
//     const {
//       userId,
//       printRequestId,
//       type,
//       title,
//       message,
//       data = {}
//     } = options;

//     const notification = await Notification.create({
//       userId,
//       printRequestId,
//       type,
//       title,
//       message,
//       data
//     });

//     console.log('Notification created:', notification._id);
//     return notification;
//   } catch (error) {
//     console.error('Error creating notification:', error);
//     throw error;
//   }
// };
// Create a new notification

exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    console.log('Notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// @desc    Send notification (email, SMS, push)
exports.sendNotification = async (options) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      email,
      phone,
      channels = ['database'] // database, email, sms, push
    } = options;

    const results = {};

    // Save to database
    if (channels.includes('database')) {
      const notification = await exports.createNotification({
        userId,
        type,
        title,
        message
      });
      results.database = notification;
    }

    // Send email
    if (channels.includes('email') && email) {
      try {
        const emailResult = await sendEmail({
          email,
          subject: title,
          message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${title}</h2>
              <p style="color: #666; line-height: 1.6;">${message}</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message from E-Printer. Please do not reply to this email.
              </p>
            </div>
          `
        });
        results.email = emailResult;
      } catch (error) {
        console.error('Error sending email notification:', error);
        results.email = { error: error.message };
      }
    }

    // Send SMS
    if (channels.includes('sms') && phone) {
      try {
        const smsResult = await sendSMS({
          to: phone,
          message: `${title}\n\n${message}\n\n- E-Printer`
        });
        results.sms = smsResult;
      } catch (error) {
        console.error('Error sending SMS notification:', error);
        results.sms = { error: error.message };
      }
    }

    // TODO: Implement push notifications if needed
    if (channels.includes('push')) {
      // Implement push notification logic here
      results.push = { message: 'Push notifications not implemented yet' };
    }

    return results;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// @desc    Get user notifications
// exports.getUserNotifications = async (userId, options = {}) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       unreadOnly = false,
//       type = null
//     } = options;

//     const skip = (page - 1) * limit;
//     const query = { userId };

//     if (unreadOnly) {
//       query.read = false;
//     }

//     if (type) {
//       query.type = type;
//     }

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate('printRequestId', 'documentName queueNumber status');

//     const total = await Notification.countDocuments(query);
//     const unreadCount = await Notification.countDocuments({ 
//       userId, 
//       read: false 
//     });

//     return {
//       notifications,
//       total,
//       unreadCount,
//       pagination: {
//         page,
//         pages: Math.ceil(total / limit),
//         hasNext: page < Math.ceil(total / limit),
//         hasPrev: page > 1
//       }
//     };
//   } catch (error) {
//     console.error('Error getting user notifications:', error);
//     throw error;
//   }
// };

exports.getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      isRead = null
    } = options;

    const skip = (page - 1) * limit;
    const query = { userId };
    
    if (isRead !== null) {
      query.isRead = isRead;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('printRequestId', 'documentName queueNumber status');

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// @desc    Mark notification as read
// exports.markAsRead = async (notificationId, userId) => {
//   try {
//     const notification = await Notification.findOneAndUpdate(
//       { _id: notificationId, userId },
//       { read: true, readAt: new Date() },
//       { new: true }
//     );

//     if (!notification) {
//       throw new Error('Notification not found');
//     }

//     return notification;
//   } catch (error) {
//     console.error('Error marking notification as read:', error);
//     throw error;
//   }
// };

exports.markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// @desc    Mark all notifications as read
// exports.markAllAsRead = async (userId) => {
//   try {
//     const result = await Notification.updateMany(
//       { userId, read: false },
//       { read: true, readAt: new Date() }
//     );

//     return result;
//   } catch (error) {
//     console.error('Error marking all notifications as read:', error);
//     throw error;
//   }
// };

exports.markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// @desc    Delete notification
exports.deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Notification templates
exports.templates = {
  ORDER_RECEIVED: (orderNumber, documentName,userId) => ({
    title: 'Print Order Received',
    message: `${userId}'s print order #${orderNumber} for "${documentName}" has been received and is in queue for processing.`
  }),

  ORDER_IN_PROGRESS: (orderNumber, documentName,userId) => ({
    title: 'Print Order In Progress',
    message: `${userId}'s print order #${orderNumber} for "${documentName}" is now being processed.`
  }),

  ORDER_COMPLETED: (orderNumber, documentName,userId) => ({
    title: 'Print Order Completed',
    message: `${userId}'s print order #${orderNumber} for "${documentName}" has been completed and is ready for pickup/delivery.`
  }),

  PAYMENT_RECEIVED: (orderNumber, amount,userId) => ({
    title: 'Payment Received',
    message: `${userId}'s payment of ₹${amount} for order #${orderNumber} has been received successfully.`
  }),

  ORDER_CANCELLED: (orderNumber, documentName,userId) => ({
    title: 'Print Order Cancelled',
    message: `${userId}'s print order #${orderNumber} for "${documentName}" has been cancelled.`
  })
};