// models/PrintRequest.js - Updated to support local storage first approach
const mongoose = require('mongoose');

const printRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  queueNumber: {
    type: Number,
    required: true,
    unique: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Document details
  documentName: {
    type: String,
    required: true
  },
  documentUrl: {
    type: String,
    required: false, // Not required initially, set after payment
    default: null
  },
  localFilePath: {
    type: String,
    required: true // Required initially for local storage
  },
  serverFileName: {
    type: String,
    required: false // The actual filename on disk
  },
  documentPages: {
    type: Number,
    required: true,
    min: 1
  },
  documentSize: {
    type: Number,
    required: true
  },
  publicId: {
    type: String,
    required: false, // Set after Cloudinary upload
    default: null
  },
  
  // Print settings
  copies: {
    type: Number,
    required: true,
    min: 1,
    max: 50,
    default: 1
  },
  pagesToPrint: {
    type: String,
    required: true,
    default: 'all'
  },
  pageSize: {
    type: String,
    required: true,
    enum: ['A4', 'A3', 'Letter', 'Legal'],
    default: 'A4'
  },
  orientation: {
    type: String,
    required: true,
    enum: ['portrait', 'landscape'],
    default: 'portrait'
  },
  printType: {
    type: String,
    required: true,
    enum: ['black', 'color'],
    default: 'black'
  },
  doubleSided: {
    type: Boolean,
    default: false
  },
  
  // Cost details
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  costPerPage: {
    type: Number,
    required: false
  },
  totalPages: {
    type: Number,
    required: false
  },
  
  // Status and processing
  status: {
    type: String,
    required: true,
    enum: ['pending', 'payment_pending', 'paid', 'in_queue', 'in_process', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  
  // Payment details
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  
  // Processing details
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin/staff who processes the request
  },
  
  // File management
  deleteAfterPrint: {
    type: Boolean,
    default: true
  },
  
  // Upload status tracking
  uploadedToCloudinary: {
    type: Boolean,
    default: false
  },
  deletedFromLocal: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  paymentCompletedAt: {
    type: Date
  },
  processingStartedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  
  // Additional metadata
  estimatedCompletionTime: {
    type: Date
  },
  actualCompletionTime: {
    type: Date
  },
  processingNotes: {
    type: String
  },
  customerNotes: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
printRequestSchema.index({ userId: 1, createdAt: -1 });
printRequestSchema.index({ status: 1, createdAt: -1 });
printRequestSchema.index({ queueNumber: 1 });
printRequestSchema.index({ uniqueId: 1 });
printRequestSchema.index({ paymentStatus: 1 });
printRequestSchema.index({ razorpayOrderId: 1 });

// Virtual for formatted status
printRequestSchema.virtual('formattedStatus').get(function() {
  const statusMap = {
    'pending': 'Pending',
    'payment_pending': 'Payment Pending',
    'paid': 'Paid',
    'in_queue': 'In Queue',
    'processing': 'Processing',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'failed': 'Failed'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for estimated completion time based on queue position
printRequestSchema.virtual('estimatedWaitTime').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return 0;
  }
  
  // Rough estimate: 5 minutes per request ahead in queue
  return this.queueNumber * 5;
});

// Pre-save middleware to update timestamps
printRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set specific timestamps based on status changes
  if (this.isModified('status')) {
    switch (this.status) {
      case 'paid':
        if (!this.paymentCompletedAt) {
          this.paymentCompletedAt = new Date();
        }
        break;
      case 'in_queue':
        if (!this.paymentCompletedAt) {
          this.paymentCompletedAt = new Date();
        }
        break;
      case 'processing':
        if (!this.processingStartedAt) {
          this.processingStartedAt = new Date();
        }
        break;
      case 'completed':
        if (!this.completedAt) {
          this.completedAt = new Date();
          this.actualCompletionTime = new Date();
        }
        break;
      case 'cancelled':
        if (!this.cancelledAt) {
          this.cancelledAt = new Date();
        }
        break;
    }
  }
  
  if (this.isModified('paymentStatus') && this.paymentStatus === 'completed') {
    if (!this.paymentCompletedAt) {
      this.paymentCompletedAt = new Date();
    }
    // Auto-update status to paid if payment is completed
    if (this.status === 'pending' || this.status === 'payment_pending') {
      this.status = 'paid';
    }
  }
  
  next();
});

// Static method to get next queue number
printRequestSchema.statics.getNextQueueNumber = async function() {
  const lastRequest = await this.findOne().sort({ queueNumber: -1 });
  return lastRequest ? lastRequest.queueNumber + 1 : 1;
};

// Static method to get queue statistics
printRequestSchema.statics.getQueueStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCost: { $sum: '$totalCost' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalCost: stat.totalCost
    };
    return acc;
  }, {});
};

// Instance method to mark as uploaded to Cloudinary
printRequestSchema.methods.markUploadedToCloudinary = function(cloudinaryUrl, publicId) {
  this.documentUrl = cloudinaryUrl;
  this.publicId = publicId;
  this.uploadedToCloudinary = true;
  this.status = 'in_queue'; // Move to queue after successful upload
  return this.save();
};

// Instance method to mark local file as deleted
printRequestSchema.methods.markLocalFileDeleted = function() {
  this.deletedFromLocal = true;
  return this.save();
};

// Instance method to calculate processing time
printRequestSchema.methods.getProcessingTime = function() {
  if (this.processingStartedAt && this.completedAt) {
    return this.completedAt - this.processingStartedAt;
  }
  return null;
};

// Instance method to calculate total time from creation to completion
printRequestSchema.methods.getTotalTime = function() {
  if (this.completedAt) {
    return this.completedAt - this.createdAt;
  }
  return null;
};

module.exports = mongoose.model('PrintRequest', printRequestSchema);