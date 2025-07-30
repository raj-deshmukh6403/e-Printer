// shared/constants.js
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_TOKEN: '/auth/verify-token',
  
  // User endpoints
  PROFILE: '/auth/profile',
  UPDATE_PROFILE: '/auth/update-profile',
  
  // Print endpoints
  UPLOAD_FILE: '/print/upload',
  CREATE_REQUEST: '/print/create',
  GET_REQUESTS: '/print/requests',
  GET_REQUEST: '/print/request',
  UPDATE_REQUEST: '/print/update',
  DELETE_REQUEST: '/print/delete',
  
  // Payment endpoints
  CREATE_PAYMENT: '/payment/create',
  VERIFY_PAYMENT: '/payment/verify',
  GET_PAYMENTS: '/payment/history',
  
  // Admin endpoints
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_REQUESTS: '/admin/requests',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_UPDATE_STATUS: '/admin/update-status',
  ADMIN_USERS: '/admin/users',
  
  // Notification endpoints
  GET_NOTIFICATIONS: '/notifications',
  MARK_READ: '/notifications/mark-read',
  MARK_ALL_READ: '/notifications/mark-all-read',
};

export const USER_CATEGORIES = {
  STUDENT: 'student',
  STAFF: 'staff',
  PROFESSOR: 'professor',
};

export const PRINT_STATUS = {
  PENDING: 'pending',
  PRINTING: 'printing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PRINT_TYPES = {
  BLACK: 'black',
  COLOR: 'color',
};

export const PAGE_SIZES = {
  A4: 'A4',
  A3: 'A3',
  LETTER: 'Letter',
  LEGAL: 'Legal',
};

export const ORIENTATIONS = {
  AUTO: 'auto',
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

export const PRICING = {
  BLACK_PER_PAGE: 1, // ₹1 per page for black printing
  COLOR_PER_PAGE: 5, // ₹5 per page for color printing
};

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
};

export const NOTIFICATION_TYPES = {
  PRINT_CREATED: 'print_created',
  PRINT_PRINTING: 'print_printing',
  PRINT_COMPLETED: 'print_completed',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
};

export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  FORGOT_PASSWORD: 'forgot_password',
  PRINT_CONFIRMATION: 'print_confirmation',
  PRINT_READY: 'print_ready',
  PAYMENT_SUCCESS: 'payment_success',
};

export const SMS_TEMPLATES = {
  PRINT_CONFIRMATION: 'print_confirmation',
  PRINT_READY: 'print_ready',
  OTP: 'otp',
};

export const RAZORPAY_OPTIONS = {
  currency: 'INR',
  receipt_prefix: 'EPRINT',
};

export const VALIDATION_RULES = {
  USERNAME: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    minLength: 6,
    maxLength: 50,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/,
  },
  PHONE: {
    pattern: /^[6-9]\d{9}$/,
  },
};

export const UI_CONSTANTS = {
  NAVBAR_HEIGHT: '64px',
  SIDEBAR_WIDTH: '256px',
  FOOTER_HEIGHT: '80px',
  BREAKPOINTS: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export const TOAST_CONFIG = {
  position: 'top-right',
  duration: 4000,
  style: {
    background: '#363636',
    color: '#fff',
  },
  success: {
    duration: 3000,
    iconTheme: {
      primary: '#10B981',
      secondary: '#FFFFFF',
    },
  },
  error: {
    duration: 5000,
    iconTheme: {
      primary: '#EF4444',
      secondary: '#FFFFFF',
    },
  },
};

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PRINT_STATUS_UPDATE: 'print_status_update',
  NEW_NOTIFICATION: 'new_notification',
  ADMIN_NEW_REQUEST: 'admin_new_request',
};

export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  PRINT_REQUESTS: 'print_requests',
  NOTIFICATIONS: 'notifications',
  ADMIN_ANALYTICS: 'admin_analytics',
  ADMIN_REQUESTS: 'admin_requests',
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  ADMIN_TOKEN: 'adminToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};