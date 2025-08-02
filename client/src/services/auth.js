// services/auth.js - FIXED with separate password reset functions
import api from './api';

export const authService = {
  // User login
  login: async (credentials) => {
    try {
      console.log('AuthService: Attempting login for:', credentials.email);

      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      
       console.error('AuthService: Login error:', error);
      // Clear any existing auth data on login failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  // User registration
  register: async (userData) => {
    try {
      console.log('AuthService: Attempting registration for:', userData.email);
      const response = await api.post('/auth/register', userData);
      console.log('AuthService: Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Registration error:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      console.log('AuthService: Getting user profile...');
      const response = await api.get('/auth/profile');
      
     if (response.data.success && response.data.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('AuthService: Profile retrieved successfully');
        return {
        success: response.data.success,
        user: response.data.data,
        data: response.data.data
      };
      } else {
        throw new Error(response.data.message || 'Failed to get profile');
      }
    } catch (error) {
      console.error('AuthService: Profile error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      console.log('AuthService: Logging out...');
      // Try to call server logout endpoint
      try {
        const response = await api.post('/auth/logout');
        return response.data;
      } catch (error) {
        // Ignore server logout errors
        console.warn('AuthService: Server logout failed (ignored):', error.message);
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('AuthService: Logout completed');
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      console.log('AuthService: Updating profile...');
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success && response.data.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('AuthService: Profile updated successfully');
        return {
        success: response.data.success,
        user: response.data.data,
        data: response.data.data
      };
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('AuthService: Profile update error:', error);
      throw error;
    }
  },

  // Change password (for authenticated users)
  changePassword: async (passwordData) => {
    try {
      console.log('AuthService: Changing password...');
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===========================================
  // REGISTRATION EMAIL VERIFICATION FUNCTIONS
  // ===========================================
  // These are for email verification during registration
  sendOTP: async (email, type = 'verification') => {
    try {
      const response = await api.post('/auth/send-otp', { email, type });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyOTP: async (email, otp, type = 'verification') => {
    try {
      const payload = { email, otp, type };
      const response = await api.post('/auth/verify-otp', payload);
      
      // Store token if login is successful after verification
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resendOTP: async (email, type = 'verification') => {
    try {
      const response = await api.post('/auth/resend-otp', { email, type });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===========================================
  // FORGOT PASSWORD FUNCTIONS (SEPARATE)
  // ===========================================
  // These are specifically for forgot password flow
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyForgotPasswordOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-forgot-password-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPasswordWithOTP: async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password-with-otp', { 
        email, 
        otp, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resendForgotPasswordOTP: async (email) => {
    try {
      const response = await api.post('/auth/resend-forgot-password-otp', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===========================================
  // LEGACY FUNCTIONS (Keep for compatibility)
  // ===========================================
  verifyToken: async (token) => {
    try {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return {
        success: response.data.success,
        user: response.data.user,
        data: response.data.user
      };
    } catch (error) {
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (resetData) => {
    try {
      const response = await api.put(`/auth/reset-password/${resetData.token}`, {
        password: resetData.password
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resendVerificationEmail: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/update-password', passwordData);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkEmailExists: async (email) => {
    try {
      const response = await api.post('/auth/check-email', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateDetails: async (userData) => {
    try {
      const response = await api.put('/auth/update-details', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Utility functions for auth
export const authUtils = {
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        authUtils.clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      authUtils.clearAuthData();
      return false;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  getUser: () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser: () => {
    localStorage.removeItem('user');
  },

  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isTokenExpired: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  },

  getUserRole: () => {
    const user = authUtils.getUser();
    return user?.category || null;
  },

  hasRole: (role) => {
    const userRole = authUtils.getUserRole();
    return userRole === role;
  },

  getDisplayName: (user) => {
    if (!user) return 'User';
    return user.username || user.email || 'User';
  }
};

export default authService;