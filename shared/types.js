// shared/types.js
// User Types
export const UserType = {
  id: 'string',
  username: 'string',
  email: 'string',
  whatsappNumber: 'string',
  category: 'string', // student, staff, professor
  isVerified: 'boolean',
  createdAt: 'date',
  updatedAt: 'date',
};

// Print Request Types
export const PrintRequestType = {
  id: 'string',
  user: 'ObjectId', // Reference to User
  fileName: 'string',
  fileUrl: 'string',
  fileSize: 'number',
  totalPages: 'number',
  copies: 'number',
  pageRange: 'string', // "all" or "1-5,7,9-12"
  pageSize: 'string', // A4, A3, etc.
  orientation: 'string', // auto, portrait, landscape
  printType: 'string', // black, color
  totalAmount: 'number',
  uniqueId: 'string',
  status: 'string', // pending, printing, completed, cancelled
  paymentStatus: 'string', // pending, completed, failed
  paymentId: 'string',
  queueNumber: 'number',
  createdAt: 'date',
  updatedAt: 'date',
  completedAt: 'date',
};

// Payment Types
export const PaymentType = {
  id: 'string',
  user: 'ObjectId',
  printRequest: 'ObjectId',
  amount: 'number',
  currency: 'string',
  paymentMethod: 'string', // card, upi, netbanking
  razorpayPaymentId: 'string',
  razorpayOrderId: 'string',
  razorpaySignature: 'string',
  status: 'string', // pending, completed, failed, refunded
  createdAt: 'date',
  updatedAt: 'date',
};

// Notification Types
export const NotificationType = {
  id: 'string',
  user: 'ObjectId',
  title: 'string',
  message: 'string',
  type: 'string', // print_created, print_printing, print_completed, payment_success, etc.
  data: 'object', // Additional data related to notification
  isRead: 'boolean',
  createdAt: 'date',
};

// Admin Types
export const AdminType = {
  id: 'string',
  username: 'string',
  email: 'string',
  password: 'string',
  role: 'string', // admin, super_admin
  lastLogin: 'date',
  createdAt: 'date',
  updatedAt: 'date',
};

// Analytics Types
export const AnalyticsType = {
  totalRequests: 'number',
  pendingRequests: 'number',
  printingRequests: 'number',
  completedRequests: 'number',
  totalUsers: 'number',
  totalRevenue: 'number',
  categoryStats: {
    student: 'number',
    staff: 'number',
    professor: 'number',
  },
  dailyStats: [{
    date: 'string',
    requests: 'number',
    revenue: 'number',
  }],
  recentRequests: 'array', // Array of recent print requests
};

// API Response Types
export const ApiResponseType = {
  success: 'boolean',
  message: 'string',
  data: 'any',
  error: 'string',
  statusCode: 'number',
};

// Form Types
export const LoginFormType = {
  email: 'string',
  password: 'string',
};

export const RegisterFormType = {
  username: 'string',
  email: 'string',
  whatsappNumber: 'string',
  password: 'string',
  confirmPassword: 'string',
  category: 'string',
};

export const PrintFormType = {
  file: 'File',
  copies: 'number',
  pageRange: 'string',
  pageSize: 'string',
  orientation: 'string',
  printType: 'string',
};

export const PaymentFormType = {
  paymentMethod: 'string',
  amount: 'number',
  printRequestId: 'string',
};

// Utility Types
export const FileUploadType = {
  file: 'File',
  progress: 'number',
  status: 'string', // uploading, completed, error
  error: 'string',
};

export const PaginationType = {
  page: 'number',
  limit: 'number',
  total: 'number',
  totalPages: 'number',
  hasNext: 'boolean',
  hasPrev: 'boolean',
};

export const FilterType = {
  status: 'string',
  category: 'string',
  dateRange: {
    start: 'date',
    end: 'date',
  },
  search: 'string',
};

// Socket Types
export const SocketDataType = {
  eventName: 'string',
  data: 'any',
  userId: 'string',
  adminId: 'string',
  room: 'string',
};

// Error Types
export const ErrorType = {
  message: 'string',
  code: 'string',
  status: 'number',
  details: 'object',
};

// Queue Types
export const QueueJobType = {
  id: 'string',
  type: 'string', // email, sms, notification
  data: 'object',
  priority: 'number',
  attempts: 'number',
  maxAttempts: 'number',
  delay: 'number',
  createdAt: 'date',
  processedAt: 'date',
  failedAt: 'date',
  status: 'string', // waiting, active, completed, failed
};