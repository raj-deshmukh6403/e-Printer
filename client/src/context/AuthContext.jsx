// client/src/context/AuthContext.jsx - FIXED initialization and logout issues
import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { authService } from '../services/auth';

// Initial state - Start with loading true to prevent flash
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Keep true initially
  error: null,
};

// Action types 
const AUTH_ACTION_TYPES = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_PROFILE_START: 'UPDATE_PROFILE_START',
  UPDATE_PROFILE_SUCCESS: 'UPDATE_PROFILE_SUCCESS',
  UPDATE_PROFILE_FAILURE: 'UPDATE_PROFILE_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTION_TYPES.LOGIN_START:
    case AUTH_ACTION_TYPES.REGISTER_START:
    case AUTH_ACTION_TYPES.UPDATE_PROFILE_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTION_TYPES.LOAD_USER_START:
      return {
        ...state,
        // Don't set loading true here if we already have a user
        isLoading: state.user ? false : true,
        error: null,
      };

    case AUTH_ACTION_TYPES.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTION_TYPES.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTION_TYPES.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token || state.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTION_TYPES.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTION_TYPES.LOGIN_FAILURE:
    case AUTH_ACTION_TYPES.REGISTER_FAILURE:
    case AUTH_ACTION_TYPES.UPDATE_PROFILE_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTION_TYPES.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false, // Set loading to false immediately
        error: action.payload.error,
      };

    case AUTH_ACTION_TYPES.LOGOUT:
      return {
        ...initialState,
        isLoading: false, // Set loading false immediately on logout
      };

    case AUTH_ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  const hasInitialized = useRef(false);
  const isLoadingUser = useRef(false);
  const loadUserTimeoutRef = useRef(null);
  const isLoggedOut = useRef(false); // Track logout state

  const loadUser = useCallback(async () => {
    // Don't load user if we just logged out
    if (isLoggedOut.current || isLoadingUser.current) {
      console.log('loadUser skipped - logged out or already loading');
      return;
    }

    try {
      isLoadingUser.current = true;
      dispatch({ type: AUTH_ACTION_TYPES.LOAD_USER_START });

      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, user not authenticated');
        dispatch({
          type: AUTH_ACTION_TYPES.LOAD_USER_FAILURE,
          payload: { error: 'No token found' },
        });
        return;
      }

      console.log('Loading user profile...');
      const response = await authService.getProfile();
      
      if (response.success && response.user) {
        // Reset logout flag if user loaded successfully
        isLoggedOut.current = false;
        
        dispatch({
          type: AUTH_ACTION_TYPES.LOAD_USER_SUCCESS,
          payload: { 
            user: response.user,
            token: token
          },
        });
        console.log('User loaded successfully');
      } else {
        throw new Error('Invalid profile response');
      }
    } catch (error) {
      console.error('Load user error:', error);
      
      if (error.response?.status === 429) {
        console.log('Rate limited - will retry later');
        
        if (loadUserTimeoutRef.current) {
          clearTimeout(loadUserTimeoutRef.current);
        }
        
        loadUserTimeoutRef.current = setTimeout(() => {
          if (localStorage.getItem('token') && !isLoggedOut.current) {
            console.log('Retrying user load after rate limit...');
            loadUser();
          }
        }, 60000);
        
        dispatch({
          type: AUTH_ACTION_TYPES.LOAD_USER_FAILURE,
          payload: { error: 'Rate limited - please wait' },
        });
        return;
      }
      
      if (error.response?.status === 401) {
        console.log('Token invalid, clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      dispatch({
        type: AUTH_ACTION_TYPES.LOAD_USER_FAILURE,
        payload: { 
          error: error.response?.data?.message || 'Failed to load user' 
        },
      });
    } finally {
      isLoadingUser.current = false;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('AuthProvider initializing...');
      
      const token = localStorage.getItem('token');
      if (token && !isLoggedOut.current) {
        loadUser();
      } else {
        // No token found - set loading to false immediately
        dispatch({
          type: AUTH_ACTION_TYPES.LOAD_USER_FAILURE,
          payload: { error: 'No token found' },
        });
      }
    }
  }, [loadUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadUserTimeoutRef.current) {
        clearTimeout(loadUserTimeoutRef.current);
      }
    };
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTION_TYPES.LOGIN_START });

      console.log('Attempting login...');
      const response = await authService.login(credentials);
      
      if (response.success && response.user && response.token) {
        console.log('Login successful');
        isLoggedOut.current = false;
        dispatch({
          type: AUTH_ACTION_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token,
          },
        });

        return { success: true, user: response.user, token: response.token };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message ||
                          'Login failed';
      
      dispatch({
        type: AUTH_ACTION_TYPES.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      
      return { success: false, message: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTION_TYPES.REGISTER_START });

      const response = await authService.register(userData);

      if (response.success) {
        dispatch({ type: AUTH_ACTION_TYPES.REGISTER_SUCCESS });
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Register error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message ||
                          'Registration failed';
      
      dispatch({
        type: AUTH_ACTION_TYPES.REGISTER_FAILURE,
        payload: { error: errorMessage },
      });
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Set logout flag immediately to prevent loadUser calls
      isLoggedOut.current = true;
      hasInitialized.current = false;
      isLoadingUser.current = false;
      
      // Clear any pending timeouts
      if (loadUserTimeoutRef.current) {
        clearTimeout(loadUserTimeoutRef.current);
        loadUserTimeoutRef.current = null;
      }
      
      // Clear localStorage immediately
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch logout action
      dispatch({ type: AUTH_ACTION_TYPES.LOGOUT });
      
      // Call server logout (but don't wait for it)
      authService.logout().catch(error => {
        console.error('Server logout error (ignored):', error);
      });
      
      console.log('Logout completed');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: AUTH_ACTION_TYPES.LOGOUT });
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTION_TYPES.UPDATE_PROFILE_START });

      const response = await authService.updateProfile(profileData);
      
      if (response.success && response.user) {
        dispatch({
          type: AUTH_ACTION_TYPES.UPDATE_PROFILE_SUCCESS,
          payload: { user: response.user },
        });

        return response;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message ||
                          'Profile update failed';
      
      dispatch({
        type: AUTH_ACTION_TYPES.UPDATE_PROFILE_FAILURE,
        payload: { error: errorMessage },
      });
      
      throw error;
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // ===========================================
  // REGISTRATION EMAIL VERIFICATION FUNCTIONS
  // ===========================================
  const sendOTP = async (email, type = 'verification') => {
    try {
      const response = await authService.sendOTP(email, type);
      return response;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const verifyOTP = async (email, otp, type = 'verification') => {
    try {
      const response = await authService.verifyOTP(email, otp, type);
      
      if (response.success && response.user && response.token) {
        dispatch({
          type: AUTH_ACTION_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token,
          },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  };

  const resendOTP = async (email, type = 'verification') => {
    try {
      const response = await authService.resendOTP(email, type);
      return response;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  // ===========================================
  // FORGOT PASSWORD FUNCTIONS (SEPARATE)
  // ===========================================
  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const verifyForgotPasswordOTP = async (email, otp) => {
    try {
      const response = await authService.verifyForgotPasswordOTP(email, otp);
      return response;
    } catch (error) {
      console.error('Verify forgot password OTP error:', error);
      throw error;
    }
  };

  const resetPasswordWithOTP = async (email, otp, newPassword) => {
    try {
      const response = await authService.resetPasswordWithOTP(email, otp, newPassword);
      return response;
    } catch (error) {
      console.error('Reset password with OTP error:', error);
      throw error;
    }
  };

  const resendForgotPasswordOTP = async (email) => {
    try {
      const response = await authService.resendForgotPasswordOTP(email);
      return response;
    } catch (error) {
      console.error('Resend forgot password OTP error:', error);
      throw error;
    }
  };

  // ===========================================
  // LEGACY FUNCTIONS (Keep for compatibility)
  // ===========================================
  const resetPassword = async (resetData) => {
    try {
      const response = await authService.resetPassword(resetData);
      
      if (response.success && response.user && response.token) {
        dispatch({
          type: AUTH_ACTION_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token,
          },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail(token);
      return response;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const response = await authService.resendVerificationEmail(email || state.user?.email);
      return response;
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTION_TYPES.CLEAR_ERROR });
  };

  // Utility functions
 const hasRole = useCallback((role) => {
  return state.user?.category === role;
}, [state.user]);

  const hasPermission = useCallback((permission) => {
  return state.user?.permissions?.includes(permission);
}, [state.user]);

  const isVerified = useCallback(() => {
  return state.user?.isEmailVerified === true;
}, [state.user]);

  const getUserCategory = useCallback(() => {
  return state.user?.category;
}, [state.user]);

  const getUserDepartment = useCallback(() => {
  return state.user?.department;
}, [state.user]);

  const getUserFullName = useCallback(() => {
  if (!state.user) return '';
  if (state.user.firstName && state.user.lastName) {
    return `${state.user.firstName} ${state.user.lastName}`;
  }
  return state.user.username || state.user.email || '';
}, [state.user]);

  const getUserInitials = useCallback(() => {
  if (!state.user) return '';
  
  if (state.user.firstName && state.user.lastName) {
    return `${state.user.firstName.charAt(0)}${state.user.lastName.charAt(0)}`.toUpperCase();
  }
  
  if (state.user.username) {
    return state.user.username.charAt(0).toUpperCase();
  }
  
  if (state.user.email) {
    return state.user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
}, [state.user]);


  const contextValue = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    login,
    register,
    logout,
    loadUser,
    updateProfile,
    changePassword,
    clearError,

    sendOTP,
    verifyOTP,
    resendOTP,

    forgotPassword,
    verifyForgotPasswordOTP,
    resetPasswordWithOTP,
    resendForgotPasswordOTP,

    resetPassword,
    verifyEmail,
    resendVerificationEmail,

    hasRole,
    hasPermission,
    isVerified,
    getUserCategory,
    getUserDepartment,
    getUserFullName,
    getUserInitials,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for protected routes
export const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>;
    }
    
    if (!isAuthenticated) {
      return <div className="text-center py-8">
        <p className="text-gray-600">Please log in to access this page.</p>
      </div>;
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default AuthContext;