// services/api.js - Fixed version
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://e-printer-rouge.vercel.app/api',
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add token from localStorage if available (for JWT auth)
    const token = localStorage.getItem('token');
    if (token && token !== 'cookie') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'production') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and retries
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'production') {
      console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: originalRequest?.url,
      method: originalRequest?.method
    });

    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('401 Unauthorized - clearing auth data');
      
      // Clear stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Don't redirect if we're already on login page or this is a login request
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      const isProfileRequest = originalRequest.url?.includes('/auth/profile');
      const currentPath = window.location.pathname;
      
      if (!isLoginRequest && !isProfileRequest && currentPath !== '/login') {
        // Redirect to login for other requests
        window.location.href = '/login';
      }
    } else if (error.response?.status === 429) {
      // Rate limited - don't redirect, let the component handle it
      console.warn('Rate limited:', error.response.data);
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    } else if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);


// Print Services
export const printService = {
  // Create new print request
  createPrintRequest: async (formData) => {
    const response = await api.post('/print/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user's print history
  getUserPrintHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/print/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get specific print request details
  getPrintRequest: async (requestId) => {
    const response = await api.get(`/print/${requestId}`);
    return response.data;
  },

  // Cancel print request
  cancelPrintRequest: async (requestId) => {
    const response = await api.patch(`/print/${requestId}/cancel`);
    return response.data;
  },

  // Get print request status
  getRequestStatus: async (requestId) => {
    const response = await api.get(`/print/${requestId}/status`);
    return response.data;
  },

  // Update print request
  updatePrintRequest: async (requestId, updateData) => {
    const response = await api.patch(`/print/${requestId}`, updateData);
    return response.data;
  }
};

// NEW: Settings Services
export const settingsService = {
  // Get current settings (pricing, business hours, etc.)
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Get specific setting by key
  getSetting: async (key) => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },

  // Check service availability
  checkServiceStatus: async () => {
    const response = await api.get('/settings/service-status');
    return response.data;
  }
};


// Payment Services
export const paymentService = {
  // Create payment order
  createPaymentOrder: async (printRequestId, paymentData) => {
    const response = await api.post('/payment/create-order', {
      printRequestId,
      ...paymentData
    });
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    const response = await api.post('/payment/verify', paymentData);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/payment/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    const response = await api.get(`/payment/${paymentId}`);
    return response.data;
  },

  // Request refund
  requestRefund: async (paymentId, reason) => {
    const response = await api.post(`/payment/${paymentId}/refund`, { reason });
    return response.data;
  }
};

// Notification Services
export const notificationService = {
  // Get user notifications
  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Clear all notifications
  clearAll: async () => {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }
};

// User Services
export const userService = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.patch('/user/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.patch('/user/change-password', passwordData);
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences) => {
    const response = await api.patch('/user/preferences', preferences);
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await api.get('/user/stats');
    return response.data;
  },

  // Delete account
  deleteAccount: async (password) => {
    const response = await api.delete('/user/account', {
      data: { password }
    });
    return response.data;
  }
};

// File Services
export const fileService = {
  // Upload file
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Get file info
  getFileInfo: async (fileId) => {
    const response = await api.get(`/files/${fileId}/info`);
    return response.data;
  },

  // Download file
  downloadFile: async (fileId) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  }
};

// Contact Services
export const contactService = {
  // Send contact message
  sendMessage: async (messageData) => {
    const response = await api.post('/contact/send', messageData);
    return response.data;
  },

  // Get contact history (for user's previous messages)
  getContactHistory: async () => {
    const response = await api.get('/contact/history');
    return response.data;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API is not available');
  }
};

export default api;