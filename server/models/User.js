// models/User.js - Updated with department field
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  whatsappNumber: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid WhatsApp number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['student', 'staff', 'professor']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['CSE', 'IT', 'ENTC', 'Admin', 'ECE', 'AIDS'],
    default: 'CSE'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // ADD these OTP fields:
otp: String,
otpExpires: Date,
otpType: {
  type: String,
  enum: ['verification', 'password-reset'],
  default: 'verification'
},
otpAttempts: {
  type: Number,
  default: 0
},
  
  // User statistics (for dashboard)
  totalPrintRequests: {
    type: Number,
    default: 0
  },
  totalAmountSpent: {
    type: Number,
    default: 0
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ADD this new method:
// Generate OTP
userSchema.methods.generateOTP = function(type = 'verification') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  this.otp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.otpType = type;
  this.otpAttempts = 0;
  
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(candidateOTP, type = 'verification') {
  const hashedOTP = crypto
    .createHash('sha256')
    .update(candidateOTP)
    .digest('hex');
  
  return this.otp === hashedOTP && 
         this.otpExpires > Date.now() && 
         this.otpType === type &&
         this.otpAttempts < 5;
};

// Virtual for current month print requests
userSchema.virtual('currentMonthRequests', {
  ref: 'PrintRequest',
  localField: '_id',
  foreignField: 'userId',
  match: {
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  },
  count: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Token expires in 24 hours
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Generate password reset token
userSchema.methods.generateResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 10 minutes
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Update user statistics (call this when print request is completed)
userSchema.methods.updatePrintStats = async function(cost) {
  this.totalPrintRequests += 1;
  this.totalAmountSpent += cost;
  return this.save();
};

// Get user statistics for dashboard
userSchema.methods.getDashboardStats = async function() {
  const PrintRequest = mongoose.model('PrintRequest');
  
  // Get current month start date
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  
  // Aggregate user's print requests
  const stats = await PrintRequest.aggregate([
    { $match: { userId: this._id } },
    {
      $facet: {
        total: [
          { $group: { _id: null, count: { $sum: 1 }, totalCost: { $sum: '$totalCost' } } }
        ],
        currentMonth: [
          { $match: { createdAt: { $gte: currentMonthStart } } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]
      }
    }
  ]);
  
  const totalStats = stats[0].total[0] || { count: 0, totalCost: 0 };
  const monthStats = stats[0].currentMonth[0] || { count: 0 };
  
  return {
    totalRequests: totalStats.count,
    totalSpent: totalStats.totalCost,
    currentMonthRequests: monthStats.count
  };
};

module.exports = mongoose.model('User', userSchema);