// controllers/authController.js - FIXED with separate password reset functions
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  const cookieExpire = parseInt(process.env.JWT_COOKIE_EXPIRE) || 30;
  
  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      category: user.category,
      department: user.department,
      whatsappNumber: user.whatsappNumber,
      isEmailVerified: user.isEmailVerified
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, whatsappNumber, password, confirmPassword, category, department } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      username,
      email,
      whatsappNumber,
      password,
      category,
      department
    });

    // Generate email verification OTP
    const otp = user.generateOTP('verification');
    await user.save({ validateBeforeSave: false });

    
    // Send verification email
    try {
      const message = `
        Welcome to E-Printer!
        
        Your account has been created successfully. Please verify your email with this code:
        
        Verification Code: ${otp}
        
        This code will expire in 10 minutes.
        
        Account Details:
        Username: ${username}
        Email: ${email}
        Category: ${category}
        Department: ${department}
      `;

      await sendEmail({
        email: user.email,
        subject: 'E-Printer - Verification Code',
        message
      });
      
      console.log('Registration OTP sent successfully');
    } catch (emailError) {
      console.error('Registration OTP sending failed:', emailError.message);
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpType = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your account with the OTP sent to your email.',
      needsOTPVerification: true,
      email: user.email,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        category: user.category,
        department: user.department,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your account with OTP before logging in',
        needsVerification: true,
        email: user.email
      });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = await user.getDashboardStats();

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const stats = await user.getDashboardStats();
    
    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { username, whatsappNumber, department } = req.body;

    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(username && { username }),
        ...(whatsappNumber && { whatsappNumber }),
        ...(department && { department })
      },
      { new: true, runValidators: true }
    ).select('-password');

    const stats = await user.getDashboardStats();

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// ===========================================
// REGISTRATION EMAIL VERIFICATION FUNCTIONS
// ===========================================

// @desc    Send OTP for registration verification
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const { email, type = 'verification' } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (type === 'verification' && user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const otp = user.generateOTP(type);
    await user.save({ validateBeforeSave: false });

    const message = `
      Your E-Printer verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      If you didn't request this code, please ignore this email.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'E-Printer - Verification Code',
        message
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email address',
        otpSent: true
      });
    } catch (emailError) {
      console.error('OTP email sending failed:', emailError);
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpType = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify OTP for registration
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, type = 'verification' } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.verifyOTP(otp, type)) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });

      if (user.otpAttempts >= 5) {
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpType = undefined;
        user.otpAttempts = 0;
        await user.save({ validateBeforeSave: false });

        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        attemptsLeft: 5 - user.otpAttempts
      });
    }

    if (type === 'verification') {
      user.isEmailVerified = true;
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;
    user.otpAttempts = 0;
    await user.save();

    if (type === 'verification') {
      sendTokenResponse(user, 200, res);
    } else {
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Resend OTP for registration
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email, type = 'verification' } = req.body;
    req.body = { email, type };
    await exports.sendOTP(req, res);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// FORGOT PASSWORD FUNCTIONS (SEPARATE)
// ===========================================

// @desc    Send forgot password OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate OTP for password reset
    const otp = user.generateOTP('password-reset');
    await user.save({ validateBeforeSave: false });

    const message = `
      You have requested a password reset for your E-Printer account.
      
      Your password reset verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      If you did not request this, please ignore this email.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'E-Printer Password Reset Code',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent to your email',
        otpSent: true
      });
    } catch (emailError) {
      console.error('Password reset OTP email sending failed:', emailError);
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpType = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify forgot password OTP
// @route   POST /api/auth/verify-forgot-password-otp
// @access  Public
exports.verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.verifyOTP(otp, 'password-reset')) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });

      if (user.otpAttempts >= 5) {
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpType = undefined;
        user.otpAttempts = 0;
        await user.save({ validateBeforeSave: false });

        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        attemptsLeft: 5 - user.otpAttempts
      });
    }

    // Don't clear OTP yet - we need it for password reset
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      verified: true
    });
  } catch (error) {
    console.error('Verify forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reset password with verified OTP
// @route   POST /api/auth/reset-password-with-otp
// @access  Public
exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP one more time
    if (!user.verifyOTP(otp, 'password-reset')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Set new password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password with OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Resend forgot password OTP
// @route   POST /api/auth/resend-forgot-password-otp
// @access  Public
exports.resendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    req.body = { email };
    await exports.forgotPassword(req, res);
  } catch (error) {
    console.error('Resend forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// LEGACY FUNCTIONS (Keep for compatibility)
// ===========================================

exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: error.message
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    const message = `
      Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
    `;

    await sendEmail({
      email: user.email,
      subject: 'E-Printer - Email Verification',
      message
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      username: req.body.username,
      email: req.body.email,
      whatsappNumber: req.body.whatsappNumber,
      department: req.body.department
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }

};
