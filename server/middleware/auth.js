// middleware/auth.js - Enhanced with debugging
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Headers authorization:', req.headers.authorization);
    console.log('Cookies token:', req.cookies.token ? 'Present' : 'Missing');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    let token;

    // Check for token in cookie first, then in Authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
      console.log('Token found in cookies');
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header');
    }

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully. User ID:', decoded.id);
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('User found:', user._id, user.email);
      req.user = user;
      console.log('=== AUTH MIDDLEWARE SUCCESS ===');
      
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      } else if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token verification failed'
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional middleware for routes that don't require auth but can use it
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
        console.log('Optional auth - token invalid but continuing:', error.message);
      }
    }

    next();
  } catch (error) {
    // Don't block request for optional auth errors
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = { auth, optionalAuth };