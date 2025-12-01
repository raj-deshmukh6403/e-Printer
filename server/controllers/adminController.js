// controllers/adminController.js
const Admin = require('../models/Admin');
const PrintRequest = require('../models/PrintRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Safe imports with error handling
let createNotification, sendEmail, sendSMS, deleteFromCloudinary;

try {
  const notificationService = require('../services/notificationService');
  createNotification = notificationService.createNotification;
} catch (error) {
  console.warn('Notification service not available:', error.message);
  createNotification = null;
}


try {
  const emailService = require('../services/emailService');
  sendEmail = emailService.sendEmail;
} catch (error) {
  console.warn('Email service not available:', error.message);
  sendEmail = null;
}

try {
  const smsService = require('../services/smsService');
  sendSMS = smsService.sendSMS;
} catch (error) {
  console.warn('SMS service not available:', error.message);
  sendSMS = null;
}

try {
  const cloudinaryService = require('../services/cloudinaryService');
  deleteFromCloudinary = cloudinaryService.deleteFromCloudinary;
} catch (error) {
  console.warn('Cloudinary service not available:', error.message);
  deleteFromCloudinary = null;
}

// Generate JWT Token for admin
const generateAdminToken = (id) => {
  return jwt.sign({ id, isAdmin: true }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateAdminToken(admin._id);

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: error.message
    });
  }
};

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Total requests
    const totalRequests = await PrintRequest.countDocuments();
    
    // Processed requests
    const processedRequests = await PrintRequest.countDocuments({
      status: 'completed'
    });
    
    // Requests in queue
    const queueRequests = await PrintRequest.countDocuments({
      status: 'in_queue'
    });
    
    // Requests in process
    const inProcessRequests = await PrintRequest.countDocuments({
      status: 'in_process'
    });

    const failedRequests = await PrintRequest.countDocuments({
      status: 'failed'
    });

    // Category-wise breakdown
    const categoryStats = await PrintRequest.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: '$user.category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent requests (last 24 hours)
    const recentRequests = await PrintRequest.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Revenue statistics
    const revenueStats = await PrintRequest.aggregate([
      {
        $match: { paymentStatus: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCost' },
          avgOrderValue: { $avg: '$totalCost' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        processedRequests,
        queueRequests,
        inProcessRequests,
        recentRequests,
        categoryStats,
        failedRequests,
        revenue: revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0 }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// @desc    Get all print requests for admin
// @route   GET /api/admin/requests
// @access  Private (Admin)
exports.getAllPrintRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;

    // Build query
    let query = {};
    if (status) query.status = status;

    // Add category filter
    let userQuery = {};
    if (category) userQuery.category = category;

    // Build aggregation pipeline
    let pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ];

    // Add user category filter
    if (category) {
      pipeline.push({
        $match: { 'user.category': category }
      });
    }

    // Add status filter
    if (status) {
      pipeline.push({
        $match: { status: status }
      });
    }

    // Add search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'documentName': { $regex: search, $options: 'i' } },
            { 'user.username': { $regex: search, $options: 'i' } },
            { 'queueNumber': parseInt(search) || 0 }
          ]
        }
      });
    }

    // Add sorting, skip, and limit
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const printRequests = await PrintRequest.aggregate(pipeline);

    // Get total count for pagination
    let countPipeline = pipeline.slice(0, -2); // Remove skip and limit
    countPipeline.push({ $count: "total" });
    const totalResult = await PrintRequest.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: printRequests.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: printRequests
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching print requests',
      error: error.message
    });
  }
};

// @desc    Update print request status
// @route   PUT /api/admin/requests/:id/status
// @access  Private (Admin)
exports.updateRequestStatus = async (req, res) => {
  try {
    console.log('Update request received:', {
      requestId: req.params.id,
      body: req.body,
      adminId: req.admin?.id
    });

    const { status, adminNotes } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status values
    const validStatuses = ['pending', 'payment_pending', 'paid', 'in_queue', 'in_process', 'completed', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find the print request
    const printRequest = await PrintRequest.findById(req.params.id)
      .populate('userId', 'username email whatsappNumber');

    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    console.log('Found print request:', {
      id: printRequest._id,
      currentStatus: printRequest.status,
      newStatus: status
    });

    // Store old status for comparison
    const oldStatus = printRequest.status;
    
    // Update basic fields
    printRequest.status = status;
    
    // Set processedBy if admin context is available
    if (req.admin && req.admin.id) {
      printRequest.processedBy = req.admin.id;
    }
    
    // Update admin notes if provided
    if (adminNotes && adminNotes.trim()) {
      printRequest.adminNotes = adminNotes.trim();
    }

    // Set timestamps based on status changes
    if (status === 'in_process' && oldStatus !== 'in_process') {
      printRequest.processedAt = new Date();
      printRequest.processingStartedAt = new Date();
    }

    if (status === 'completed' && oldStatus !== 'completed') {
      printRequest.completedAt = new Date();
      
      // Handle PDF deletion if requested (with error handling)
      if (printRequest.deleteAfterPrint && !printRequest.pdfDeleted) {
        try {
          // Only try to delete if deleteFromCloudinary service is available
          if (typeof deleteFromCloudinary === 'function') {
            const publicId = extractPublicIdFromUrl(printRequest.documentUrl);
            if (publicId) {
              await deleteFromCloudinary(publicId);
              printRequest.pdfDeleted = true;
              printRequest.pdfDeletedAt = new Date();
            }
          }
        } catch (error) {
          console.error('Error deleting PDF (non-critical):', error);
          // Don't fail the entire request if PDF deletion fails
        }
      }
    }

    // Save the updated request
    await printRequest.save();

    console.log('Print request updated successfully:', {
      id: printRequest._id,
      newStatus: printRequest.status,
      completedAt: printRequest.completedAt
    });

    // Send notifications (with error handling)
    try {
      await sendNotifications(printRequest, status, oldStatus);
    } catch (notificationError) {
      console.error('Error sending notifications (non-critical):', notificationError);
      // Don't fail the entire request if notifications fail
    }

    // Return success response
    res.status(200).json({
      success: true,
      data: printRequest,
      message: `Status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('Error in updateRequestStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating request status',
      error: error.message
    });
  }
};

// @desc    Get single print request for admin
// @route   GET /api/admin/requests/:id
// @access  Private (Admin)
exports.getAdminPrintRequest = async (req, res) => {
  try {
    const printRequest = await PrintRequest.findById(req.params.id)
      .populate('userId', 'username email category whatsappNumber')
      .populate('processedBy', 'username');

    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: printRequest
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching print request',
      error: error.message
    });
  }
};

// @desc    Get all users with aggregated statistics
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    // Build match query for aggregation
    let matchQuery = {};
    if (category) matchQuery.category = category;

    // Add search functionality
    if (search) {
      matchQuery.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { whatsappNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Use aggregation to include print request statistics
    const usersAggregation = [
      { $match: matchQuery },
      
      // Lookup print requests for each user
      {
        $lookup: {
          from: "printrequests", // Make sure this matches your actual collection name
          localField: "_id",
          foreignField: "userId",
          as: "printRequests"
        }
      },
      
      // Add computed fields
      {
        $addFields: {
          printRequestsCount: { $size: "$printRequests" },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$printRequests",
                    cond: { 
                      $or: [
                        { $eq: ["$$this.status", "completed"] },
                        { $eq: ["$$this.paymentStatus", "completed"] }
                      ]
                    }
                  }
                },
                as: "request",
                in: "$$request.totalCost"
              }
            }
          }
        }
      },
      
      // Remove password and printRequests array
      {
        $project: {
          password: 0,
          printRequests: 0,
          resetPasswordToken: 0,
          resetPasswordExpires: 0
        }
      },
      
      // Sort by creation date (newest first)
      { $sort: { createdAt: -1 } }
    ];

    // Get users with statistics
    const allUsersWithStats = await User.aggregate(usersAggregation);
    
    // Apply pagination to the results
    const users = allUsersWithStats.slice(skip, skip + limit);
    const total = allUsersWithStats.length;

    // Get user statistics by category (existing code)
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      stats,
      data: users
    });

  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};
// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's print requests count
    const printRequestsCount = await PrintRequest.countDocuments({ userId: user._id });
    const totalSpent = await PrintRequest.aggregate([
      { $match: { userId: user._id, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        printRequestsCount,
        totalSpent: totalSpent[0]?.total || 0
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['username', 'email', 'whatsappNumber', 'category', 'isVerified'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active print requests
    const activePrintRequests = await PrintRequest.countDocuments({
      userId: user._id,
      status: { $in: ['pending', 'payment_pending', 'paid', 'in_queue', 'processing'] }
    });

    if (activePrintRequests > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active print requests'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();

    res.status(200).json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.updateSettings(req.body);

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
};

// Helper function to send notifications (with error handling)
async function sendNotifications(printRequest, status, oldStatus) {
  try {
    // Only send notifications for significant status changes
    if (status === 'in_process' || status === 'completed') {
      // Create notification data
      const notificationData = {
        userId: printRequest.userId._id,
        printRequestId: printRequest._id,
        type: status === 'in_process' ? 'in_progress' : 'completed',
        title: status === 'in_process' ? 'Print In Process' : 'Print Completed',
        message: status === 'in_process' 
          ? `Your print request for "${printRequest.documentName}" is now being processed.`
          : `Your print request for "${printRequest.documentName}" has been completed. You can collect it using Queue #${printRequest.queueNumber}`
      };

      // Try to create notification if service is available
      if (typeof createNotification === 'function') {
        await createNotification(notificationData);
      }

      // Try to send email if service is available
      if (typeof sendEmail === 'function') {
        const emailSubject = status === 'in_process' ? 'Print Request In Process' : 'Print Request Completed';
        const emailMessage = generateStatusUpdateEmail(printRequest, status);
        
        await sendEmail({
          email: printRequest.userId.email,
          subject: emailSubject,
          html: emailMessage
        });
      }

      // Try to send SMS if service is available
      if (typeof sendSMS === 'function') {
        const smsMessage = status === 'in_process'
          ? `Your E-Printer request (Queue #${printRequest.queueNumber}) is now being processed.`
          : `Your E-Printer request (Queue #${printRequest.queueNumber}) is ready for collection!`;
        
        await sendSMS(printRequest.userId.whatsappNumber, smsMessage);
      }
    }
  } catch (error) {
    console.error('Error in sendNotifications:', error);
    throw error; // Re-throw to be caught by caller
  }
}

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  try {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

// @desc    Get recent notifications for admin dashboard
// @route   GET /api/admin/notifications
// @access  Private (Admin)
exports.getNotificationsForAdmin = async (req, res) => {
  try {
    const { types, limit = 10 } = req.query;

    let query = {};

    if (types) {
      const requestedTypes = types.split(',');

      // Map frontend types to backend schema enums
      const typeMapping = {
        'request_created': 'request_received',
        'processing': 'in_progress',
        'completed': 'completed'
      };

      const dbTypes = requestedTypes.map(t => typeMapping[t] || t);
      query.type = { $in: dbTypes };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });

  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Helper function to generate status update email
function generateStatusUpdateEmail(printRequest, status) {
  const isCompleted = status === 'completed';
  const title = isCompleted ? 'Print Request Completed!' : 'Print Request In Process';
  const message = isCompleted 
    ? 'Your print request has been completed and is ready for collection.'
    : 'Your print request is currently being processed.';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isCompleted ? '#4CAF50' : '#FF9800'}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .queue-number { font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; padding: 10px; background: #e8f5e8; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
            </div>
            <div class="content">
                <p>Dear ${printRequest.userId.username},</p>
                <p>${message}</p>
                
                ${isCompleted ? `<div class="queue-number">Queue Number: ${printRequest.queueNumber}</div>` : ''}
                
                <div class="order-details">
                    <h3>Order Details:</h3>
                    <p><strong>Document:</strong> ${printRequest.documentName}</p>
                    <p><strong>Queue Number:</strong> ${printRequest.queueNumber}</p>
                    <p><strong>Status:</strong> ${status.replace('_', ' ').toUpperCase()}</p>
                    ${printRequest.adminNotes ? `<p><strong>Notes:</strong> ${printRequest.adminNotes}</p>` : ''}
                </div>
                
                ${isCompleted ? '<p><strong>Please bring your Queue Number when collecting your documents.</strong></p>' : ''}
            </div>
        </div>
    </body>
    </html>
  `;

}
