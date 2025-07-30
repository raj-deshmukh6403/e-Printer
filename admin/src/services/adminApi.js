// admin/src/services/adminApi.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Base URL:', API_BASE_URL);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making request to:', config.baseURL + config.url);
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('With headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response interceptor error:', error);
    console.error('API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data
      }
    });
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const adminAuth = {
  login: async (credentials) => {
    try {
      console.log('Attempting admin login...');
      const response = await api.post('/admin/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        return response.data;
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('authToken');
    return Promise.resolve();
  },
};

// Alternative login function for direct use
export const adminLogin = async (credentials) => {
  try {
    const response = await api.post('/admin/login', credentials);
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error during admin login:', error);
    throw error;
  }
};

// Analytics API
export const getAnalytics = async () => {
  try {
    console.log('Fetching analytics...');
    const response = await api.get('/admin/analytics');
    console.log('Analytics response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting analytics:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// Alternative analytics function
export const getDashboardAnalytics = async () => {
  return getAnalytics();
};

// ... after getAnalytics function

// Notifications API
export const getNotifications = async (params = {}) => {
  try {
    console.log('Fetching notifications with params:', params);
    
    // Create query string from params object
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Join array values with a comma for the query string
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, value);
      }
    });

    const response = await api.get(`/admin/notifications?${searchParams.toString()}`);
    console.log('Notifications response:', response.data);

    if (response.data && response.data.success) {
      return response.data; // Return the whole response object
    }

    return { success: false, data: [] }; // Return a consistent shape on failure
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Get all requests with optional filters - Enhanced version
export const getAllRequests = async (params = {}) => {
  try {
    console.log('Fetching requests with params:', params);
    
    // Clean up params - remove undefined values
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // Convert to URLSearchParams for better query string handling
    const searchParams = new URLSearchParams();
    Object.entries(cleanParams).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    
    console.log('Clean params:', cleanParams);
    console.log('Query string:', searchParams.toString());
    
    const response = await api.get(`/admin/requests?${searchParams.toString()}`);
    
    console.log('Full API response:', response);
    console.log('Response data:', response.data);
    console.log('Response success:', response.data?.success);
    console.log('Response data array:', response.data?.data);
    
    // Handle backend response structure: { success: true, count: X, total: Y, pagination: {}, data: [...] }
    if (response.data && response.data.success) {
      return {
        data: response.data.data || [],
        count: response.data.count || 0,
        total: response.data.total || 0,
        pagination: response.data.pagination || {}
      };
    }
    
    // Fallback for direct data response
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        count: response.data.length,
        total: response.data.length,
        pagination: {}
      };
    }
    
    // Final fallback
    console.warn('Unexpected response structure:', response.data);
    return {
      data: [],
      count: 0,
      total: 0,
      pagination: {}
    };
  } catch (error) {
    console.error('Error in getAllRequests:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error;
  }
};

// Get single request
export const getPrintRequest = async (id) => {
  try {
    console.log('Fetching request:', id);
    const response = await api.get(`/admin/requests/${id}`);
    console.log('Single request response:', response.data);
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error getting print request:', error);
    throw error;
  }
};

// Update request status - Enhanced with proper status mapping
export const updatePrintStatus = async (id, status, adminNotes = '') => {
  try {
    console.log('Updating request status:', { id, status, adminNotes });
    
    // Validate inputs
    if (!id) {
      throw new Error('Request ID is required');
    }
    
    if (!status) {
      throw new Error('Status is required');
    }
    
    // Map frontend status to backend expected status
    const statusMapping = {
      'processing': 'in_process', // Backend expects 'in_process'
      'completed': 'completed',
      'failed': 'failed',
      'in_queue': 'in_queue',
      'paid': 'paid',
      'pending': 'pending',
      'payment_pending': 'payment_pending',
      'cancelled': 'cancelled'
    };
    
    const backendStatus = statusMapping[status] || status;
    
    const validStatuses = ['pending', 'payment_pending', 'paid', 'in_queue', 'in_process', 'completed', 'cancelled', 'failed'];
    if (!validStatuses.includes(backendStatus)) {
      throw new Error(`Invalid status: ${backendStatus}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const payload = {
      status: backendStatus,
      adminNotes: adminNotes?.trim() || undefined
    };
    
    console.log('Sending payload:', payload);
    
    const response = await api.put(`/admin/requests/${id}/status`, payload);
    console.log('Status update response:', response.data);
    
    if (response.data && response.data.success) {
      return {
        ...response.data.data,
        status: status // Return original frontend status for consistency
      };
    }
    
    return {
      ...response.data,
      status: status // Return original frontend status
    };
  } catch (error) {
    console.error('Error updating print status:', {
      id,
      status,
      adminNotes,
      error: error.response?.data || error.message,
      statusCode: error.response?.status
    });
    throw error;
  }
};

// Search requests
export const searchRequests = async (query) => {
  try {
    console.log('Searching requests:', query);
    const response = await api.get('/admin/requests', { 
      params: { search: query } 
    });
    
    if (response.data && response.data.success) {
      return response.data.data || [];
    }
    
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error searching requests:', error);
    throw error;
  }
};

// Delete print request
export const deletePrintRequest = async (requestId) => {
  try {
    const response = await api.delete(`/admin/requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};

// Bulk update requests
export const bulkUpdateRequests = async (requestIds, updates) => {
  try {
    const response = await api.put('/admin/requests/bulk-update', {
      requestIds,
      updates
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk updating requests:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get settings
export const getSettings = async () => {
  try {
    const response = await api.get('/admin/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

// Update settings
export const updateSettings = async (settings) => {
  try {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Test API connection
export const testConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await api.get('/test');
    console.log('Connection test response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
};

// Legacy support - keeping existing structure for backward compatibility
export const adminDashboard = {
  getDashboard: () => getAnalytics(),
  getAnalytics: () => getAnalytics(),
};

export const adminRequests = {
  getAllRequests: (params) => getAllRequests(params),
  getRequestsByCategory: (category, params) => getAllRequests({ ...params, category }),
  updateRequestStatus: (id, status) => updatePrintStatus(id, status),
  searchRequests: (query) => searchRequests(query),
};

export const adminUsers = {
  getAllUsers: (filters) => getAllUsers(filters),
  getUserById: (id) => getUserById(id),
  updateUser: (id, data) => updateUser(id, data),
  deleteUser: (id) => deleteUser(id),
};

export default api;