// client/src/utils/constants.js

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    REFRESH_TOKEN: '/auth/refresh-token',
    PROFILE: '/auth/profile'
  },
  PRINT: {
    UPLOAD: '/print/upload',
    REQUEST: '/print/request',
    HISTORY: '/print/history',
    STATS: '/print/stats',
    CANCEL: '/print/request/:id/cancel',
    DETAILS: '/print/request/:id'
  },
  PAYMENT: {
    CREATE_ORDER: '/payment/create-order',
    VERIFY: '/payment/verify',
    HISTORY: '/payment/history'
  },
  NOTIFICATIONS: {
    GET: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/mark-all-read'
  }
};

// Print Settings
export const PRINT_SETTINGS = {
  PAGE_SIZES: [
    { value: 'A4', label: 'A4 (210 × 297 mm)' },
    { value: 'A3', label: 'A3 (297 × 420 mm)' },
    { value: 'A5', label: 'A5 (148 × 210 mm)' },
    { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
    { value: 'Legal', label: 'Legal (8.5 × 14 in)' }
  ],
  
  ORIENTATIONS: [
    { value: 'auto', label: 'Auto' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' }
  ],
  
  PRINT_TYPES: [
    { value: 'black', label: 'Black & White', cost: 1 },
    { value: 'color', label: 'Color', cost: 5 }
  ],
  
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: ['application/pdf'],
  MAX_COPIES: 100,
  MAX_PAGES_PER_REQUEST: 500
};

// User Categories
export const USER_CATEGORIES = [
  { value: 'student', label: 'Student' },
  { value: 'staff', label: 'Staff' },
  { value: 'professor', label: 'Professor' }
];

// Print Status
export const PRINT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

// Print Status Display
export const PRINT_STATUS_LABELS = {
  [PRINT_STATUS.PENDING]: 'In Queue',
  [PRINT_STATUS.PROCESSING]: 'In Process',
  [PRINT_STATUS.COMPLETED]: 'Completed',
  [PRINT_STATUS.CANCELLED]: 'Cancelled',
  [PRINT_STATUS.FAILED]: 'Failed'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  UPI: 'upi',
  NET_BANKING: 'netbanking',
  WALLET: 'wallet'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  PRINT_COMPLETED: 'print_completed',
  PRINT_FAILED: 'print_failed',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  SYSTEM: 'system'
};

// Routes
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PRINT: '/print',
  HISTORY: '/history',
  PROFILE: '/profile'
};

// Form Validation
export const VALIDATION = {
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address'
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    MIN_LENGTH: 'Password must be at least 8 characters long',
    UPPERCASE: 'Password must contain at least one uppercase letter',
    LOWERCASE: 'Password must contain at least one lowercase letter',
    NUMBER: 'Password must contain at least one number',
    SPECIAL_CHAR: 'Password must contain at least one special character'
  },
  PHONE: {
    REQUIRED: 'Phone number is required',
    INVALID: 'Please enter a valid 10-digit phone number'
  },
  NAME: {
    REQUIRED: 'Name is required',
    MIN_LENGTH: 'Name must be at least 2 characters long'
  },
  COPIES: {
    REQUIRED: 'Number of copies is required',
    MIN: 'Minimum 1 copy required',
    MAX: `Maximum ${PRINT_SETTINGS.MAX_COPIES} copies allowed`
  },
  PAGES: {
    REQUIRED: 'Pages selection is required',
    INVALID: 'Invalid page format. Use format like: 1,3,5-10'
  }
};

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  ACADEMIC: {
    BLUE: '#1e40af',
    NAVY: '#1e3a8a',
    GOLD: '#f59e0b',
    GREEN: '#059669'
  }
};

// Animation Durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
};

// File Upload
export const FILE_UPLOAD = {
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  PRINT_PREFERENCES: 'print_preferences'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FILE_TOO_LARGE: `File size exceeds ${PRINT_SETTINGS.MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
  INVALID_FILE_TYPE: 'Please upload a valid PDF file.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  UPLOAD_FAILED: 'File upload failed. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful! Please verify your email.',
  PRINT_REQUEST_SUCCESS: 'Print request submitted successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully!',
  PASSWORD_RESET_SUCCESS: 'Password reset link sent to your email.'
};

// Academic Theme
export const ACADEMIC_THEME = {
  COLORS: {
    PRIMARY: '#1e40af', // Academic blue
    SECONDARY: '#f59e0b', // Gold
    SUCCESS: '#059669', // Green
    WARNING: '#d97706', // Orange
    ERROR: '#dc2626', // Red
    INFO: '#0891b2' // Cyan
  },
  FONTS: {
    HEADING: 'Inter, system-ui, sans-serif',
    BODY: 'Inter, system-ui, sans-serif',
    MONO: 'Fira Code, monospace'
  }
};

// Dashboard Stats
export const DASHBOARD_STATS = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  CHART_COLORS: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
};

// Print Queue
export const PRINT_QUEUE = {
  AUTO_REFRESH_INTERVAL: 5000, // 5 seconds
  MAX_QUEUE_SIZE: 100
};

// Contact Information
export const CONTACT_INFO = {
  EMAIL: 'support@eprinter.edu',
  PHONE: '+91-XXXXXXXXXX',
  ADDRESS: 'Your College Address',
  SUPPORT_HOURS: 'Mon-Fri: 9:00 AM - 6:00 PM'
};

// Social Media Links
export const SOCIAL_LINKS = {
  FACEBOOK: '#',
  TWITTER: '#',
  INSTAGRAM: '#',
  LINKEDIN: '#'
};

// Feature Flags
export const FEATURES = {
  EMAIL_VERIFICATION: true,
  SMS_NOTIFICATIONS: true,
  AUTO_DELETE_FILES: true,
  PAYMENT_GATEWAY: true,
  PRINT_PREVIEW: true
};