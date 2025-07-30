// client/src/utils/helpers.js

// Format currency to Indian Rupees
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date to readable format
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Validate password strength
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Calculate print cost
export const calculatePrintCost = (pages, copies, printType) => {
  const blackWhiteCost = 1; // ₹1 per page
  const colorCost = 5; // ₹5 per page
  
  const costPerPage = printType === 'color' ? colorCost : blackWhiteCost;
  return pages * copies * costPerPage;
};

// Generate random unique ID
export const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Check if file is PDF
export const isPDFFile = (file) => {
  const allowedTypes = ['application/pdf'];
  const allowedExtensions = ['pdf'];
  
  return allowedTypes.includes(file.type) || 
         allowedExtensions.includes(getFileExtension(file.name));
};

// Format print status for display
export const formatPrintStatus = (status) => {
  const statusMap = {
    'pending': 'In Queue',
    'processing': 'In Process',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'failed': 'Failed'
  };
  
  return statusMap[status] || status;
};

// Get status color
export const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'text-yellow-600 bg-yellow-50',
    'processing': 'text-blue-600 bg-blue-50',
    'completed': 'text-green-600 bg-green-50',
    'cancelled': 'text-red-600 bg-red-50',
    'failed': 'text-red-600 bg-red-50'
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

// Storage utility for localStorage operations
export const storage = {
  // Get item from localStorage
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      
      // Try to parse JSON, return as string if parsing fails
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error);
      return null;
    }
  },

  // Set item in localStorage
  set: (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Error setting item in localStorage:`, error);
      return false;
    }
  },

  // Remove item from localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage:`, error);
      return false;
    }
  },

  // Clear all localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
      return false;
    }
  },

  // Check if key exists
  exists: (key) => {
    return localStorage.getItem(key) !== null;
  },

  // Get all keys
  keys: () => {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error(`Error getting localStorage keys:`, error);
      return [];
    }
  },
};


// Format utilities
export const formatUtils = {
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format currency (Indian Rupees)
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Format date
  formatDate: (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    const formatOptions = { ...defaultOptions, ...options };
    
    return new Intl.DateTimeFormat('en-IN', formatOptions).format(new Date(date));
  },

  // Format date and time
  formatDateTime: (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime: (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  },

  // Format phone number
  formatPhoneNumber: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  },

  // Truncate text
  truncateText: (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Format page range
  formatPageRange: (pageRange, totalPages) => {
    if (!pageRange || pageRange.toLowerCase() === 'all') {
      return `All pages (1-${totalPages})`;
    }
    return `Pages: ${pageRange}`;
  },
};

export const validationUtils = {
  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number (Indian)
  isValidPhone: (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  // Validate password
  isValidPassword: (password) => {
    // At least 6 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  },

  // Validate username
  isValidUsername: (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  // Validate page range
  isValidPageRange: (pageRange, totalPages) => {
    if (!pageRange || pageRange.toLowerCase() === 'all') {
      return true;
    }

    try {
      const parts = pageRange.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(num => parseInt(num.trim()));
          if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > totalPages) {
            return false;
          }
        } else {
          const pageNum = parseInt(trimmed);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  // Validate file type
  isValidFileType: (file, allowedTypes = ['pdf', 'doc', 'docx']) => {
    if (!file || !file.name) return false;
    const extension = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
  },

  // Validate file size
  isValidFileSize: (file, maxSizeInMB = 10) => {
    if (!file) return false;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  },
};


// URL utilities
export const urlUtils = {
  // Build query string from object
  buildQueryString: (params) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return queryParams.toString();
  },

  // Parse query string to object
  parseQueryString: (queryString) => {
    const params = new URLSearchParams(queryString);
    const result = {};
    
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    
    return result;
  },

  // Get current URL without query parameters
  getCurrentUrl: () => {
    return window.location.origin + window.location.pathname;
  },

  // Check if URL is external
  isExternalUrl: (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.origin !== window.location.origin;
    } catch {
      return false;
    }
  },
};

// DOM utilities
export const domUtils = {
  // Scroll to top
  scrollToTop: (smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  },

  // Scroll to element
  scrollToElement: (elementId, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  },

  // Copy text to clipboard
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  // Download file from blob
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// Utility functions
export const utils = {
  // Generate unique ID
  generateId: (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return prefix + timestamp + random;
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Deep clone object
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => utils.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = utils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  // Check if object is empty
  isEmpty: (obj) => {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  },

  // Wait for specified time
  wait: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Get device type
  getDeviceType: () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  },

  // Check if user is online
  isOnline: () => {
    return navigator.onLine;
  },
};



// Toast notification helper
export const showToast = (message, type = 'info') => {
  // This would integrate with your toast library
  console.log(`${type.toUpperCase()}: ${message}`);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showToast('Failed to copy to clipboard', 'error');
    return false;
  }
};

// Download file
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Convert pages string to array
export const parsePages = (pagesString, totalPages) => {
  if (!pagesString || pagesString.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const pages = [];
  const parts = pagesString.split(',');
  
  parts.forEach(part => {
    part = part.trim();
    
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(num => parseInt(num.trim()));
      if (start && end && start <= end && start <= totalPages && end <= totalPages) {
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
    } else {
      const pageNum = parseInt(part);
      if (pageNum && pageNum <= totalPages) {
        pages.push(pageNum);
      }
    }
  });
  
  return [...new Set(pages)].sort((a, b) => a - b);
};

// Validate pages string
export const validatePages = (pagesString, totalPages) => {
  if (!pagesString || pagesString.toLowerCase() === 'all') {
    return { isValid: true };
  }
  
  try {
    const pages = parsePages(pagesString, totalPages);
    if (pages.length === 0) {
      return { isValid: false, error: 'No valid pages found' };
    }
    
    const invalidPages = pages.filter(page => page < 1 || page > totalPages);
    if (invalidPages.length > 0) {
      return { 
        isValid: false, 
        error: `Invalid pages: ${invalidPages.join(', ')}. Pages must be between 1 and ${totalPages}` 
      };
    }
    
    return { isValid: true, pages };
  } catch (error) {
    return { isValid: false, error: 'Invalid page format' };
  }
};


const helperFunctions = {
  storage,
  formatUtils,
  validationUtils,
  urlUtils,
  domUtils,
  utils,
};

export default helperFunctions;