const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

/**
 * Generate a unique print request ID
 * @returns {string} Unique ID for print request
 */
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `EPR-${timestamp}-${randomStr}`;
};

/**
 * Generate OTP for verification
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate printing cost based on specifications
 * @param {Object} specs - Print specifications
 * @returns {number} Total cost
 */
const calculatePrintingCost = (specs) => {
  const { pages, copies, printType } = specs;
  const costPerPage = printType === 'color' ? 5 : 1;
  return pages * copies * costPerPage;
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Hash password using crypto
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verify password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {boolean} Password match result
 */
const verifyPassword = (password, hashedPassword) => {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Validation result
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize filename for safe file operations
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

/**
 * Generate PDF file path
 * @param {string} userId - User ID
 * @param {string} filename - Original filename
 * @returns {string} Generated file path
 */
const generateFilePath = (userId, filename) => {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);
  return `uploads/${userId}/${timestamp}_${sanitized}`;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    message,
    statusCode,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format success response
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted success response
 */
const formatSuccessResponse = (message, data = null, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Parse pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} Pagination config
 */
const parsePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Generate random filename with extension
 * @param {string} extension - File extension
 * @returns {string} Random filename
 */
const generateRandomFilename = (extension) => {
  const randomString = crypto.randomBytes(16).toString('hex');
  return `${randomString}.${extension}`;
};

/**
 * Check if file is PDF
 * @param {string} mimetype - File mimetype
 * @returns {boolean} Is PDF check result
 */
const isPDF = (mimetype) => {
  return mimetype === 'application/pdf';
};

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Human readable size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalizeWords = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Generate queue position
 * @param {number} totalRequests - Total pending requests
 * @returns {number} Queue position
 */
const generateQueuePosition = (totalRequests) => {
  return totalRequests + 1;
};

/**
 * Validate print specifications
 * @param {Object} specs - Print specifications
 * @returns {Object} Validation result
 */
const validatePrintSpecs = (specs) => {
  const errors = [];
  
  if (!specs.copies || specs.copies < 1 || specs.copies > 100) {
    errors.push('Copies must be between 1 and 100');
  }
  
  if (!specs.pageSize || !['A4', 'A3', 'A5'].includes(specs.pageSize)) {
    errors.push('Invalid page size');
  }
  
  if (!specs.orientation || !['portrait', 'landscape', 'auto'].includes(specs.orientation)) {
    errors.push('Invalid orientation');
  }
  
  if (!specs.printType || !['black', 'color'].includes(specs.printType)) {
    errors.push('Invalid print type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate email template for order confirmation
 * @param {Object} data - Order data
 * @returns {string} HTML email template
 */
const generateOrderEmailTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: white; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; color: #666; padding: 20px; }
        .unique-id { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>E-Printer Service</h1>
          <p>Print Order Confirmation</p>
        </div>
        <div class="content">
          <h2>Hello ${data.userName},</h2>
          <p>Your print request has been successfully submitted!</p>
          
          <div class="unique-id">${data.uniqueId}</div>
          <p style="text-align: center; color: #666;">Show this ID when collecting your prints</p>
          
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Document:</strong> ${data.fileName}</li>
            <li><strong>Pages:</strong> ${data.pages}</li>
            <li><strong>Copies:</strong> ${data.copies}</li>
            <li><strong>Print Type:</strong> ${capitalizeWords(data.printType)}</li>
            <li><strong>Page Size:</strong> ${data.pageSize}</li>
            <li><strong>Orientation:</strong> ${capitalizeWords(data.orientation)}</li>
            <li><strong>Total Cost:</strong> ₹${data.totalCost}</li>
          </ul>
          
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Queue Position:</strong> ${data.queuePosition}</p>
        </div>
        <div class="footer">
          <p>Thank you for using E-Printer Service!</p>
          <p>For support, contact us at support@eprinter.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateUniqueId,
  generateOTP,
  calculatePrintingCost,
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  formatDate,
  isValidEmail,
  isValidPhone,
  sanitizeFilename,
  generateFilePath,
  formatErrorResponse,
  formatSuccessResponse,
  parsePagination,
  generateRandomFilename,
  isPDF,
  formatFileSize,
  capitalizeWords,
  generateQueuePosition,
  validatePrintSpecs,
  generateOrderEmailTemplate
};