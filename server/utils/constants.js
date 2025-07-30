// User categories
const USER_CATEGORIES = {
  STUDENT: 'student',
  STAFF: 'staff',
  PROFESSOR: 'professor'
};

// Print request statuses
const PRINT_STATUS = {
  PENDING: 'pending',
  IN_QUEUE: 'in_queue',
  IN_PROCESS: 'in_process',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment methods
const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  UPI: 'upi',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet'
};

// Print specifications
const PRINT_SPECS = {
  PAGE_SIZES: ['A4', 'A3', 'A5', 'Letter', 'Legal'],
  ORIENTATIONS: ['portrait', 'landscape', 'auto'],
  PRINT_TYPES: ['black', 'color'],
  PAGES_OPTIONS: ['all', 'custom']
};

// File constraints
const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FORMATS: ['application/pdf'],
  MAX_PAGES: 500,
  MIN_PAGES: 1
};

// Pricing
const PRICING = {
  BLACK_PER_PAGE: 1, // ₹1 per page for black and white
  COLOR_PER_PAGE: 5, // ₹5 per page for color
  MAX_COPIES: 100,
  MIN_COPIES: 1
};

// Email templates
const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  STATUS_UPDATE: 'status_update',
  FORGOT_PASSWORD: 'forgot_password',
  WELCOME: 'welcome'
};

// SMS templates
const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: 'Your print order #{uniqueId} has been confirmed. Cost: ₹{cost}. Queue position: {position}',
  STATUS_UPDATE: 'Your print order #{uniqueId} status updated to: {status}',
  OTP_VERIFICATION: 'Your OTP for E-Printer verification is: {otp}. Valid for 10 minutes.'
};

// Notification types
const NOTIFICATION_TYPES = {
  ORDER_PLACED: 'order_placed',
  ORDER_PROCESSING: 'order_processing',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed'
};

// Admin roles
const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator'
};

// Queue priorities
const QUEUE_PRIORITIES = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
};

// API response codes
const RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error messages
const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PHONE_ALREADY_EXISTS: 'Phone number already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  ACCESS_DENIED: 'Access denied',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_FORMAT: 'Invalid file format. Only PDF files are allowed',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  ORDER_NOT_FOUND: 'Print order not found',
  PAYMENT_FAILED: 'Payment processing failed',
  SERVER_ERROR: 'Internal server error'
};

// Success messages
const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  ORDER_PLACED: 'Print order placed successfully',
  PAYMENT_SUCCESS: 'Payment processed successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  STATUS_UPDATED: 'Order status updated successfully',
  NOTIFICATION_SENT: 'Notification sent successfully'
};

// Database collections
const COLLECTIONS = {
  USERS: 'users',
  PRINT_REQUESTS: 'print_requests',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
  ADMINS: 'admins',
  SETTINGS: 'settings'
};

// JWT token expiry times
const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '7d',
  RESET_PASSWORD_TOKEN: '15m',
  EMAIL_VERIFICATION_TOKEN: '24h'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// File upload paths
const UPLOAD_PATHS = {
  PDF_UPLOADS: 'uploads/pdfs/',
  TEMP_FILES: 'uploads/temp/',
  PROCESSED_FILES: 'uploads/processed/'
};

// Queue settings
const QUEUE_SETTINGS = {
  MAX_CONCURRENT_JOBS: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  JOB_TIMEOUT: 300000 // 5 minutes
};

// Rate limiting
const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX: 5,
    WINDOW: 15 * 60 * 1000 // 15 minutes
  },
  API_REQUESTS: {
    MAX: 100,
    WINDOW: 15 * 60 * 1000 // 15 minutes
  },
  FILE_UPLOADS: {
    MAX: 10,
    WINDOW: 60 * 60 * 1000 // 1 hour
  }
};

// Email settings
const EMAIL_SETTINGS = {
  FROM_ADDRESS: 'noreply@eprinter.com',
  FROM_NAME: 'E-Printer Service',
  REPLY_TO: 'support@eprinter.com'
};

// SMS settings
const SMS_SETTINGS = {
  SENDER_ID: 'EPRINT',
  COUNTRY_CODE: '+91'
};

// College-specific settings
const COLLEGE_SETTINGS = {
  WORKING_HOURS: {
    START: '09:00',
    END: '18:00'
  },
  WORKING_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  HOLIDAYS: [], // Can be populated with holiday dates
  EMERGENCY_CONTACT: '+91-XXXXXXXXXX'
};

// Cloudinary settings
const CLOUDINARY_SETTINGS = {
  FOLDER: 'eprinter',
  PDF_FOLDER: 'eprinter/pdfs',
  TEMP_FOLDER: 'eprinter/temp'
};

// Razorpay settings
const RAZORPAY_SETTINGS = {
  CURRENCY: 'INR',
  RECEIPT_PREFIX: 'EPR_',
  CALLBACK_URL: process.env.FRONTEND_URL + '/payment/callback'
};

// Admin dashboard analytics periods
const ANALYTICS_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
};

// Maintenance mode
const MAINTENANCE_MODE = {
  ENABLED: false,
  MESSAGE: 'System is under maintenance. Please try again later.'
};

module.exports = {
  USER_CATEGORIES,
  PRINT_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PRINT_SPECS,
  FILE_CONSTRAINTS,
  PRICING,
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
  NOTIFICATION_TYPES,
  ADMIN_ROLES,
  QUEUE_PRIORITIES,
  RESPONSE_CODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLLECTIONS,
  TOKEN_EXPIRY,
  PAGINATION,
  UPLOAD_PATHS,
  QUEUE_SETTINGS,
  RATE_LIMITS,
  EMAIL_SETTINGS,
  SMS_SETTINGS,
  COLLEGE_SETTINGS,
  CLOUDINARY_SETTINGS,
  RAZORPAY_SETTINGS,
  ANALYTICS_PERIODS,
  MAINTENANCE_MODE
};