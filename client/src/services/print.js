// client/src/services/print.js - FIXED VERSION with missing functions added
import api from './api';

// Settings cache to avoid repeated API calls
let settingsCache = null;
let settingsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const printService = {  

    // Submit contact form
    submitContactForm: async (formData) => {
      try {
        const response = await api.post('/contact', {
          name: formData.name,
          email: formData.email,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          data: response.data,
          message: 'Contact form submitted successfully'
        };
      } catch (error) {
        console.error('Contact form submission error:', error);
        return {
          success: false,
          error: error.response?.data?.message || error.message,
          message: 'Failed to submit contact form'
        };
      }
    },

    // Get contact form history (if needed)
    getContactHistory: async () => {
      try {
        const response = await api.get('/contact/history');

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        console.error('Failed to fetch contact history:', error);
        return {
          success: false,
          error: error.response?.data?.message || error.message
        };
      }
    },

  // Get settings with caching
  getSettings: async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Return cached settings if they're still valid and not forcing refresh
      if (!forceRefresh && settingsCache && settingsCacheTime && (now - settingsCacheTime < CACHE_DURATION)) {
        return settingsCache;
      }

      const response = await api.get('/settings');
      settingsCache = response.data;
      settingsCacheTime = now;
      
      return settingsCache;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      
      // Return cached settings if API fails
      if (settingsCache) {
        console.warn('Using cached settings due to API failure');
        return settingsCache;
      }
      
      // Return default values if settings fetch fails and no cache
      return {
        success: true,
        data: {
          pricing: {
            blackPrintCost: 1.0,
            colorPrintCost: 5.0
          },
          fileSettings: {
            maxFileSize: 50,
            supportedFormats: ['pdf', 'doc', 'docx'],
            allowedFileTypes: ['pdf', 'doc', 'docx']
          },
          businessHours: {
            start: '09:00',
            end: '18:00'
          },
          systemSettings: {
            acceptingOrders: true,
            maintenanceMode: false
          }
        }
      };
    }
  },

  // FIXED: Get service status (maintenance mode, business hours, etc.)
  getServiceStatus: async () => {
    try {
      const response = await api.get('/settings/service-status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch service status:', error);
      // Return default available status if API fails
      return {
        success: true,
        data: {
          available: true,
          maintenanceMode: false,
          acceptingOrders: true,
          businessHours: {
            isWithinHours: true,
            start: '09:00',
            end: '18:00'
          },
          reasons: []
        }
      };
    }
  },

  // Get pricing information
  getPricingInfo: async () => {
    try {
      const response = await api.get('/settings/pricing');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pricing info:', error);
      return {
        success: true,
        data: {
          basic: {
            blackAndWhite: 1.0,
            color: 5.0
          },
          delivery: {
            pickup: 0,
            homeDelivery: 20
          }
        }
      };
    }
  },

  // FIXED: Validate file with dynamic settings
  validateFile: async (file) => {
    try {
      const settings = await printService.getSettings();
      const fileSettings = settings.data.fileSettings;
      
      // Check file size
      const maxSizeBytes = fileSettings.maxFileSize * 1024 * 1024; // Convert MB to bytes
      if (file.size > maxSizeBytes) {
        return { 
          valid: false, 
          error: `File size should be less than ${fileSettings.maxFileSize}MB` 
        };
      }
      
      // Check file type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!fileSettings.allowedFileTypes.includes(fileExtension)) {
        return { 
          valid: false, 
          error: `File type '${fileExtension}' is not supported. Allowed types: ${fileSettings.allowedFileTypes.join(', ')}` 
        };
      }
      
      // Additional MIME type check
      const allowedMimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
      };
      
      const expectedMimeType = allowedMimeTypes[fileExtension];
      if (expectedMimeType && file.type !== expectedMimeType) {
        return { 
          valid: false, 
          error: `File type mismatch. Expected ${expectedMimeType} but got ${file.type}` 
        };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },

  // Upload document to LOCAL STORAGE ONLY (not Cloudinary)
  uploadDocument: async (file) => {
    try {
      // Validate file before upload
      const validation = await printService.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const formData = new FormData();
      formData.append('document', file);
      
      const response = await api.post('/print/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  },

  // Delete uploaded document from local storage (when user clicks X)
  deleteUploadedDocument: async (filename) => {
    try {
      const response = await api.delete(`/print/upload/${filename}`);
      return response.data;
    } catch (error) {
      console.error('Document deletion failed:', error);
      throw error;
    }
  },

  // Create print request with local file path (before Cloudinary upload)
  createPrintRequest: async (printData) => {
    try {
      const response = await api.post('/print/request', printData);
      return response.data;
    } catch (error) {
      console.error('Print request submission failed:', error);
      throw error;
    }
  },

  // Upload to Cloudinary after successful payment
  uploadToCloudinaryAfterPayment: async (requestId) => {
    try {
      const response = await api.post(`/print/upload-to-cloudinary/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Cloudinary upload after payment failed:', error);
      throw error;
    }
  },

  // Calculate printing cost using dynamic pricing
  calculateCost: async (pages, config) => {
    try {
      const pricingInfo = await printService.getPricingInfo();
      const pricing = pricingInfo.data.basic;
      
      const perPageCost = config.printType === 'color' ? pricing.color : pricing.blackAndWhite;
      let totalPages = pages;
      
      if (config.pageRange === 'custom' && config.customPages) {
        totalPages = printService.utils.validatePageRange(config.customPages, pages).pages || pages;
      }
      
      const finalPages = totalPages * config.copies;
      const totalCost = finalPages * perPageCost;
      
      return {
        perPage: perPageCost,
        totalPages: finalPages,
        totalCost,
        pricing: pricing
      };
    } catch (error) {
      console.error('Failed to calculate cost:', error);
      // Fallback to default pricing
      const perPageCost = config.printType === 'color' ? 5.0 : 1.0;
      let totalPages = pages;
      
      if (config.pageRange === 'custom' && config.customPages) {
        totalPages = printService.utils.validatePageRange(config.customPages, pages).pages || pages;
      }
      
      const finalPages = totalPages * config.copies;
      const totalCost = finalPages * perPageCost;
      
      return {
        perPage: perPageCost,
        totalPages: finalPages,
        totalCost
      };
    }
  },

  // Check if service is currently available
  checkServiceAvailability: async () => {
    try {
      const serviceStatus = await printService.getServiceStatus();
      return serviceStatus.data;
    } catch (error) {
      console.error('Failed to check service availability:', error);
      return {
        available: true,
        reasons: ['Unable to verify service status']
      };
    }
  },

  // Legacy method names for backward compatibility (FIXED)
  uploadPDF: async (file) => {
    return printService.uploadDocument(file);
  },

  submitPrintRequest: async (printData) => {
    return printService.createPrintRequest(printData);
  },

  // FIXED: Calculate print cost with fallback
  calculatePrintCost: async (printOptions) => {
    try {
      const { pages, copies, printType } = printOptions;
      return await printService.calculateCost(pages, { copies, printType, pageRange: 'all' });
    } catch (error) {
      console.error('Failed to calculate print cost:', error);
      // Fallback calculation
      const { pages, copies, printType } = printOptions;
      const costPerPage = printType === 'color' ? 5 : 1;
      const totalPages = pages * copies;
      const totalCost = totalPages * costPerPage;
      
      return {
        perPage: costPerPage,
        totalPages: totalPages,
        totalCost: totalCost
      };
    }
  },

  // Calculate print cost with settings - UPDATED to use dynamic pricing
  calculatePrintCostLocal: async (printOptions, settings = null) => {
    try {
      if (!settings) {
        const settingsResponse = await printService.getSettings();
        settings = settingsResponse.data;
      }
      
      const { pages, copies, printType, pageRange, customPages } = printOptions;
      
      // Get cost per page from dynamic settings
      const perPageCost = printType === 'color' 
        ? settings.pricing.colorPrintCost
        : settings.pricing.blackPrintCost;
      
      // Calculate total pages
      let totalPages = pages;
      if (pageRange === 'custom' && customPages) {
        totalPages = printService.utils.validatePageRange(customPages, pages).pages || pages;
      }
      
      const finalPages = totalPages * copies;
      const totalCost = finalPages * perPageCost;
      
      return {
        perPage: perPageCost,
        totalPages: finalPages,
        totalCost: totalCost,
        settings: settings
      };
    } catch (error) {
      console.error('Failed to calculate print cost locally:', error);
      // Fallback calculation
      const { pages, copies, printType } = printOptions;
      const costPerPage = printType === 'color' ? 5 : 1;
      const totalPages = pages * copies;
      const totalCost = totalPages * costPerPage;
      
      return {
        perPage: costPerPage,
        totalPages: totalPages,
        totalCost: totalCost
      };
    }
  },

  // Get user's print history with pagination and filters
  getPrintHistory: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (status) queryParams.append('status', status);
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);

      const response = await api.get(`/print/history?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch print history:', error);
      throw error;
    }
  },

  // Get print statistics for dashboard
  getPrintStats: async () => {
    try {
      const response = await api.get('/print/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch print stats:', error);
      throw error;
    }
  },

  

  // Get detailed print request information
  getPrintRequest: async (requestId) => {
    try {
      const response = await api.get(`/print/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch print request details:', error);
      throw error;
    }
  },

  // Cancel print request (if not yet processed)
  cancelPrintRequest: async (requestId) => {
    try {
      const response = await api.patch(`/print/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Failed to cancel print request:', error);
      throw error;
    }
  },

  // Get print preview (for local files, this will be a different approach)
  getPrintPreview: async (filename, options = {}) => {
    try {
      const queryParams = new URLSearchParams(options);
      const response = await api.get(`/print/preview/${filename}?${queryParams}`, {
        responseType: 'blob',
      });
      
      return {
        blob: response.data,
        url: window.URL.createObjectURL(response.data),
      };
    } catch (error) {
      console.error('Failed to get print preview:', error);
      throw error;
    }
  },

  // Download print receipt
  downloadReceipt: async (requestId) => {
    try {
      const response = await api.get(`/print/${requestId}/receipt`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Failed to download receipt:', error);
      throw error;
    }
  },

  // Get print queue status
  getQueueStatus: async () => {
    try {
      const response = await api.get('/print/queue-status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
      throw error;
    }
  },

  // Validate print settings
  validatePrintSettings: async (settings) => {
    try {
      const response = await api.post('/print/validate-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to validate print settings:', error);
      throw error;
    }
  },

  // Get available printers and their capabilities
  getAvailablePrinters: async () => {
    try {
      const response = await api.get('/print/printers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available printers:', error);
      throw error;
    }
  },

  // Reprint a previous request
  reprintRequest: async (requestId) => {
    try {
      const response = await api.post(`/print/${requestId}/reprint`);
      return response.data;
    } catch (error) {
      console.error('Failed to reprint request:', error);
      throw error;
    }
  },

  // Update print request settings (before processing)
  updatePrintRequest: async (requestId, updates) => {
    try {
      const response = await api.put(`/print/${requestId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update print request:', error);
      throw error;
    }
  },

  // Get user's print quota/limits
  getPrintQuota: async () => {
    try {
      const response = await api.get('/print/quota');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch print quota:', error);
      throw error;
    }
  },

  // Check file processing status
  checkFileStatus: async (fileId) => {
    try {
      const response = await api.get(`/print/file/${fileId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to check file status:', error);
      throw error;
    }
  },

  // Get print job details by unique ID
  getPrintJobByUniqueId: async (uniqueId) => {
    try {
      const response = await api.get(`/print/job/${uniqueId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch print job by unique ID:', error);
      throw error;
    }
  },

  // Report print issue
  reportPrintIssue: async (requestId, issueData) => {
    try {
      const response = await api.post(`/print/${requestId}/report-issue`, issueData);
      return response.data;
    } catch (error) {
      console.error('Failed to report print issue:', error);
      throw error;
    }
  },

  // Get print statistics by date range
  getPrintStatsByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/print/stats/daterange`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch print stats by date range:', error);
      throw error;
    }
  },

  // Subscribe to print status updates (WebSocket or Server-Sent Events)
  subscribeToPrintUpdates: (requestId, callback) => {
    try {
      const eventSource = new EventSource(`${api.defaults.baseURL}/print/${requestId}/updates`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);
      };

      eventSource.onerror = (error) => {
        console.error('Print updates subscription error:', error);
        eventSource.close();
      };

      return eventSource;
    } catch (error) {
      console.error('Failed to subscribe to print updates:', error);
      throw error;
    }
  },

  // Batch operations
  batchOperations: {
    // Cancel multiple print requests
    cancelMultiple: async (requestIds) => {
      try {
        const response = await api.put('/print/batch/cancel', { requestIds });
        return response.data;
      } catch (error) {
        console.error('Failed to cancel multiple requests:', error);
        throw error;
      }
    },

    // Download multiple receipts
    downloadMultipleReceipts: async (requestIds) => {
      try {
        const response = await api.post('/print/batch/receipts', 
          { requestIds },
          { responseType: 'blob' }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'receipts.zip');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return true;
      } catch (error) {
        console.error('Failed to download multiple receipts:', error);
        throw error;
      }
    },

    // Get status for multiple requests
    getMultipleStatus: async (requestIds) => {
      try {
        const response = await api.post('/print/batch/status', { requestIds });
        return response.data;
      } catch (error) {
        console.error('Failed to get multiple request statuses:', error);
        throw error;
      }
    },
  },

  // File management
  fileOperations: {
    // Delete uploaded file (local storage version)
    deleteFile: async (filename) => {
      return printService.deleteUploadedDocument(filename);
    },

    // Get file metadata
    getFileMetadata: async (fileId) => {
      try {
        const response = await api.get(`/print/file/${fileId}/metadata`);
        return response.data;
      } catch (error) {
        console.error('Failed to get file metadata:', error);
        throw error;
      }
    },

    // Download original file
    downloadFile: async (fileId, filename) => {
      try {
        const response = await api.get(`/print/file/${fileId}/download`, {
          responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename || 'document.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return true;
      } catch (error) {
        console.error('Failed to download file:', error);
        throw error;
      }
    },
  },

  // Clear settings cache (useful when settings are updated)
  clearSettingsCache: () => {
    settingsCache = null;
    settingsCacheTime = null;
  },

  // Utility functions
  utils: {
    // Format file size
    formatFileSize: (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Calculate total cost with dynamic pricing
    calculateTotalCost: async (pages, copies, printType) => {
      try {
        const result = await printService.calculateCost(pages, { copies, printType, pageRange: 'all' });
        return result.totalCost;
      } catch (error) {
        console.error('Failed to calculate total cost:', error);
        // Fallback calculation
        const costPerPage = printType === 'color' ? 5 : 1;
        return pages * copies * costPerPage;
      }
    },

    // Validate page range
    validatePageRange: (pageRange, totalPages) => {
      if (!pageRange || pageRange.toLowerCase() === 'all') {
        return { valid: true, pages: totalPages };
      }

      try {
        const pages = [];
        const parts = pageRange.split(',');

        for (const part of parts) {
          const trimmed = part.trim();
          
          if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(num => parseInt(num.trim()));
            if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > totalPages) {
              return { valid: false, error: `Invalid range: ${trimmed}` };
            }
            for (let i = start; i <= end; i++) {
              pages.push(i);
            }
          } else {
            const pageNum = parseInt(trimmed);
            if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
              return { valid: false, error: `Invalid page: ${trimmed}` };
            }
            pages.push(pageNum);
          }
        }

        return { 
          valid: true, 
          pages: [...new Set(pages)].sort((a, b) => a - b).length 
        };
      } catch (error) {
        return { valid: false, error: 'Invalid page format' };
      }
    },

    // Generate unique print ID
    generatePrintId: () => {
      return 'PRT-' + Date.now().toString(36).toUpperCase() + 
             '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    },

    // Format print status for display
    formatPrintStatus: (status) => {
      const statusMap = {
        'pending': 'In Queue',
        'processing': 'In Process',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'failed': 'Failed',
        'in_queue': 'In Queue'
      };
      return statusMap[status] || status;
    },

    // Get status color class
    getStatusColorClass: (status) => {
      const colorMap = {
        'pending': 'text-yellow-600 bg-yellow-100',
        'in_queue': 'text-yellow-600 bg-yellow-100',
        'processing': 'text-blue-600 bg-blue-100',
        'completed': 'text-green-600 bg-green-100',
        'cancelled': 'text-red-600 bg-red-100',
        'failed': 'text-red-600 bg-red-100'
      };
      return colorMap[status] || 'text-gray-600 bg-gray-100';
    },

    // Extract filename from local file path
    extractFilenameFromPath: (filePath) => {
      if (!filePath) return null;
      const parts = filePath.split('/');
      return parts[parts.length - 1];
    },

    // Get file size limit in a readable format
    getFileSizeLimit: async () => {
      try {
        const settings = await printService.getSettings();
        return `${settings.data.fileSettings.maxFileSize}MB`;
      } catch (error) {
        return '50MB'; // fallback
      }
    },

    // Get supported file types list
    getSupportedFileTypes: async () => {
      try {
        const settings = await printService.getSettings();
        return settings.data.fileSettings.allowedFileTypes;
      } catch (error) {
        return ['pdf', 'doc', 'docx']; // fallback
      }
    }
  }
};

export default printService;