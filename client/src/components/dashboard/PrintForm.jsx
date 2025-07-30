// Updated PrintForm component - Integrated with dynamic settings
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { printService } from '../../services/print';
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  Settings,
  Eye,
  X,
  AlertCircle,
  ExternalLink,
  Clock
} from 'lucide-react';

const PrintForm = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [localFilePath, setLocalFilePath] = useState(null);
  const [actualServerFileName, setActualServerFileName] = useState(null);
  
  // Dynamic settings state
  const [settings, setSettings] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  // Preview modal states
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  
  const [formData, setFormData] = useState({
    copies: 1,
    pageRange: 'all',
    customPages: '',
    pageSize: 'A4',
    orientation: 'portrait',
    printType: 'black',
    doubleSided: false
  });

  const [costs, setCosts] = useState({
    perPage: 0,
    totalPages: 0,
    totalCost: 0
  });

  // Load settings and service status on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        const [settingsResponse, statusResponse] = await Promise.all([
          printService.getSettings(),
          printService.getServiceStatus()
        ]);
        
        setSettings(settingsResponse.data);
        setServiceStatus(statusResponse.data);
        
        console.log('Loaded settings:', settingsResponse.data);
        console.log('Service status:', statusResponse.data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load print settings. Using default values.');
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Service availability check
  const isServiceAvailable = useMemo(() => {
    if (!serviceStatus) return true; // Default to available if status not loaded
    return serviceStatus.available;
  }, [serviceStatus]);

  // Get dynamic file size limit
  const maxFileSize = useMemo(() => {
    return settings?.fileSettings?.maxFileSize || 50; // Default 50MB
  }, [settings]);

  // Get dynamic supported file types
  const supportedFileTypes = useMemo(() => {
    return settings?.fileSettings?.allowedFileTypes || ['pdf', 'doc', 'docx'];
  }, [settings]);

  // Get dynamic pricing
  const pricing = useMemo(() => {
    return settings?.pricing || { blackPrintCost: 1.0, colorPrintCost: 5.0 };
  }, [settings]);

  // Service unavailable message component
  const ServiceUnavailableMessage = () => {
    if (isServiceAvailable) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Service Currently Unavailable</h3>
            <div className="space-y-1">
              {serviceStatus?.reasons?.map((reason, index) => (
                <p key={index} className="text-red-700 text-sm">• {reason}</p>
              ))}
            </div>
            {serviceStatus?.businessHours && (
              <p className="text-red-600 text-sm mt-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Business Hours: {serviceStatus.businessHours.start} - {serviceStatus.businessHours.end}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // FIXED: Get proper PDF preview URL using actual server file name
  const getPdfPreviewUrl = useCallback(() => {
    if (!uploadResponse || !uploadedFile) return null;
    
    const data = uploadResponse.data || uploadResponse;
    
    // Check if it's a PDF file
    if (uploadedFile.type === 'application/pdf') {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // FIXED: Use the actual server file name from upload response
      const serverFileName = actualServerFileName || 
                          data.actualFileName || 
                          data.serverFileName || 
                          data.savedAs ||
                          data.fileName || 
                          data.documentName || 
                          uploadedFile.name;
      
      const encodedFileName = encodeURIComponent(serverFileName);
      const previewUrl = `${baseUrl}/files/preview/${encodedFileName}`;
      
      console.log('Original file name:', uploadedFile.name);
      console.log('Server file name:', serverFileName);
      console.log('Constructed preview URL:', previewUrl);
      
      return previewUrl;
    }
    
    return null;
  }, [uploadResponse, uploadedFile, actualServerFileName]);

  // Handle document preview with better error handling
  const handlePreviewDocument = useCallback(() => {
    if (!uploadedFile) {
      toast.error('No document available for preview');
      return;
    }
    
    console.log('Opening preview for:', uploadedFile.name);
    console.log('File type:', uploadedFile.type);
    console.log('Actual server file name:', actualServerFileName);
    
    // For PDF files, we can show inline preview
    if (uploadedFile.type === 'application/pdf') {
      const previewUrl = getPdfPreviewUrl();
      
      if (previewUrl) {
        console.log('Preview URL:', previewUrl);
        setShowPreview(true);
        setPreviewError(null);
      } else {
        toast.error('Unable to generate preview URL');
      }
    } else {
      // For non-PDF files, inform user
      toast.info('Preview is only available for PDF files. Word documents will be processed after payment.');
    }
  }, [uploadedFile, getPdfPreviewUrl, actualServerFileName]);

  // Open PDF in new tab with auth headers
  const handleOpenInNewTab = useCallback(async () => {
    const pdfUrl = getPdfPreviewUrl();
    if (pdfUrl) {
      try {
        console.log('Opening PDF in new tab:', pdfUrl);
        
        // Add authorization token to URL as query parameter for new tab
        const urlWithAuth = `${pdfUrl}?token=${token}`;
        
        const link = document.createElement('a');
        link.href = urlWithAuth;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Opened PDF in new tab with auth token');
      } catch (error) {
        console.error('Error opening PDF in new tab:', error);
        toast.error('Unable to open preview in new tab');
      }
    } else {
      toast.error('Unable to open preview in new tab');
    }
  }, [getPdfPreviewUrl, token]);

  // Close preview modal
  const closePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewError(null);
  }, []);

  // Memoize the PreviewModal component
  const PreviewModal = useMemo(() => {
    if (!showPreview) return null;

    return <PreviewModalComponent 
      showPreview={showPreview}
      pdfUrl={getPdfPreviewUrl()}
      uploadedFile={uploadedFile}
      pageCount={pageCount}
      previewError={previewError}
      setPreviewError={setPreviewError}
      closePreview={closePreview}
      onOpenInNewTab={handleOpenInNewTab}
      token={token}
    />;
  }, [showPreview, getPdfPreviewUrl, uploadedFile, pageCount, previewError, closePreview, handleOpenInNewTab, token]);

  // UPDATED: File upload handler with dynamic validation
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Use dynamic validation from settings
    const validation = await printService.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setLoading(true);

    try {
      const response = await printService.uploadDocument(file);

      setUploadedFile(file);
      setUploadResponse(response);
      
      const data = response.data || response;
      
      console.log('Upload response data:', data);
      
      // FIXED: Extract and store the actual server file name
      const serverFileName = data.actualFileName || 
                          data.serverFileName || 
                          data.savedAs ||
                          data.fileName || 
                          data.documentName || 
                          file.name;
      
      console.log('Extracted server file name:', serverFileName);
      
      setActualServerFileName(serverFileName);
      setLocalFilePath(data.localFilePath);
      setPageCount(data.pageCount || 1);
      
      // Calculate cost using dynamic pricing
      await calculateCostWithSettings(data.pageCount || 1, formData);
      
      toast.success('File uploaded successfully to local storage!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  // Calculate printing cost using dynamic settings
  const calculateCostWithSettings = async (pages, config) => {
    try {
      const result = await printService.calculateCost(pages, config);
      setCosts({
        perPage: result.perPage,
        totalPages: result.totalPages,
        totalCost: result.totalCost
      });
    } catch (error) {
      console.error('Error calculating cost:', error);
      // Fallback to manual calculation
      const perPageCost = config.printType === 'color' ? pricing.colorPrintCost : pricing.blackPrintCost;
      let totalPages = pages;
      
      if (config.pageRange === 'custom' && config.customPages) {
        totalPages = parsePageRange(config.customPages, pages);
      }
      
      const finalPages = totalPages * config.copies;
      const totalCost = finalPages * perPageCost;
      
      setCosts({
        perPage: perPageCost,
        totalPages: finalPages,
        totalCost
      });
    }
  };

  // Parse custom page range
  const parsePageRange = (range, maxPages) => {
    try {
      const parts = range.split(',').map(part => part.trim());
      let totalPages = 0;
      
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(num => parseInt(num.trim()));
          if (start <= end && start >= 1 && end <= maxPages) {
            totalPages += (end - start + 1);
          }
        } else {
          const page = parseInt(part);
          if (page >= 1 && page <= maxPages) {
            totalPages += 1;
          }
        }
      }
      
      return totalPages;
    } catch (error) {
      return maxPages;
    }
  };

  // Handle form input changes with dynamic cost calculation
  const handleInputChange = async (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (pageCount > 0) {
      await calculateCostWithSettings(pageCount, newFormData);
    }
  };

  // UPDATED: Remove uploaded file using actual server file name
  const removeFile = async () => {
    if (actualServerFileName) {
      try {
        // Delete using actual server file name
        await printService.deleteUploadedDocument(actualServerFileName);
        console.log('File deleted from local storage:', actualServerFileName);
        toast.success('File removed successfully');
      } catch (error) {
        console.error('Error deleting file from local storage:', error);
        toast.error('Error removing file');
      }
    }

    // Reset all file-related states
    setUploadedFile(null);
    setPageCount(0);
    setUploadResponse(null);
    setLocalFilePath(null);
    setActualServerFileName(null);
    setCosts({ perPage: 0, totalPages: 0, totalCost: 0 });
  };

  // Generate unique ID for print request
  const generateUniqueId = () => {
    return 'PRT-' + Date.now().toString(36).toUpperCase() + 
          '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  // Proceed to payment - updated to use local file path
  const handleProceedToPayment = async () => {
    if (!uploadedFile || !uploadResponse || !localFilePath) {
      toast.error('Please upload a document first');
      return;
    }

    if (formData.pageRange === 'custom' && !formData.customPages) {
      toast.error('Please specify custom page range');
      return;
    }

    // Check service availability before proceeding
    if (!isServiceAvailable) {
      toast.error('Service is currently unavailable. Please try again later.');
      return;
    }

    setLoading(true);

    try {
      const data = uploadResponse.data || uploadResponse;
      
      const printRequestData = {
        uniqueId: generateUniqueId(),
        localFilePath: localFilePath,
        serverFileName: actualServerFileName,
        documentName: data.documentName || uploadedFile.name,
        documentSize: data.documentSize || uploadedFile.size,
        documentPages: data.pageCount || pageCount,
        copies: formData.copies,
        pagesToPrint: formData.pageRange === 'all' ? 'all' : formData.customPages,
        pageSize: formData.pageSize,
        orientation: formData.orientation,
        printType: formData.printType,
        doubleSided: formData.doubleSided,
        deleteAfterPrint: true,
        status: 'pending',
        totalCost: costs.totalCost,
        costPerPage: costs.perPage,
        totalPages: costs.totalPages
      };

      console.log('Sending print request data:', printRequestData);

      const response = await printService.createPrintRequest(printRequestData);
      
      toast.success('Print request created successfully!');
      
      // Navigate to payment
      let requestId = null;
      const responseData = response.data || response;
      
      const possiblePaths = [
        'data.printRequest._id',
        'data.printRequest.id', 
        'printRequest._id',
        'printRequest.id',
        'data._id',
        'data.id',
        '_id',
        'id'
      ];
      
      for (const path of possiblePaths) {
        const parts = path.split('.');
        let current = responseData;
        
        for (const part of parts) {
          if (current && current[part]) {
            current = current[part];
          } else {
            current = null;
            break;
          }
        }
        
        if (current && typeof current === 'string') {
          console.log(`Found ID at path ${path}:`, current);
          requestId = current;
          break;
        }
      }
      
      if (requestId) {
        console.log(`Navigating to: /payment/${requestId}`);
        navigate(`/payment/${requestId}`);
      } else {
        console.error('No ID found in response');
        toast.error('Could not get request ID. Redirecting to dashboard.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Create request error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.keys(validationErrors).map(key => 
          `${key}: ${validationErrors[key].message}`
        );
        toast.error(`Validation Error: ${errorMessages.join(', ')}`);
      } else {
        toast.error(error.message || 'Error creating print request');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while settings are being fetched
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-lg font-medium text-gray-900">Loading Print Settings...</p>
                <p className="text-sm text-gray-600">Getting the latest pricing and configuration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Print Document</h1>
          <p className="text-gray-600 mt-1">Upload and configure your document for printing</p>
          
          {/* Dynamic pricing display */}
          {settings && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-blue-800">
                  <strong>Current Pricing:</strong> B&W ₹{pricing.blackPrintCost}/page • Color ₹{pricing.colorPrintCost}/page
                </span>
                <span className="text-blue-600">
                  Max file size: {maxFileSize}MB
                </span>
                <span className="text-blue-600">
                  Formats: {supportedFileTypes.join(', ').toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Service Status Alert */}
        <ServiceUnavailableMessage />

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Upload Document</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Configure Settings</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Document
              </h2>

              {!uploadedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept={supportedFileTypes.map(type => `.${type}`).join(',')}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={loading || !isServiceAvailable}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer flex flex-col items-center ${
                      !isServiceAvailable ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Choose a document to upload
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {supportedFileTypes.map(type => type.toUpperCase()).join(', ')} files up to {maxFileSize}MB
                    </p>
                    <p className="text-sm text-blue-600 mb-4">
                      📁 Files are stored locally until payment is completed
                    </p>
                    <div className={`px-6 py-2 rounded-lg transition-colors ${
                      isServiceAvailable 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}>
                      {loading ? 'Processing...' : 'Browse Files'}
                    </div>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{uploadedFile.name}</h3>
                        <p className="text-sm text-gray-600">
                          {pageCount} pages • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          📁 Stored as: {actualServerFileName || 'Processing...'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove file from local storage"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Preview Buttons */}
                  {uploadedFile && (
                    <div className="mt-4 flex items-center space-x-3">
                      {uploadedFile.type === 'application/pdf' ? (
                        <>
                          <button 
                            onClick={handlePreviewDocument}
                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm transition-colors bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview in Modal
                          </button>
                          <button 
                            onClick={handleOpenInNewTab}
                            className="flex items-center text-green-600 hover:text-green-800 text-sm transition-colors bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open in New Tab
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Preview available for PDF files only
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {uploadedFile && isServiceAvailable && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Configure Settings
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Print Configuration
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
                >
                  Change Document
                </button>
              </div>

              {/* Document Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile?.name}</p>
                    <p className="text-sm text-gray-600">{pageCount} pages</p>
                    <p className="text-xs text-blue-600">📁 Server file: {actualServerFileName}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Options */}
                <div className="space-y-6">
                  {/* Number of Copies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Copies
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.copies}
                      onChange={(e) => handleInputChange('copies', parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Page Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pages to Print
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="pageRange"
                          value="all"
                          checked={formData.pageRange === 'all'}
                          onChange={(e) => handleInputChange('pageRange', e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2">All Pages (1-{pageCount})</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="pageRange"
                          value="custom"
                          checked={formData.pageRange === 'custom'}
                          onChange={(e) => handleInputChange('pageRange', e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2">Custom Range</span>
                      </label>
                      {formData.pageRange === 'custom' && (
                        <input
                          type="text"
                          placeholder="e.g., 1-5, 8, 10-12"
                          value={formData.customPages}
                          onChange={(e) => handleInputChange('customPages', e.target.value)}
                          className="w-full ml-6 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Page Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Size
                    </label>
                    <select
                      value={formData.pageSize}
                      onChange={(e) => handleInputChange('pageSize', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orientation
                    </label>
                    <select
                      value={formData.orientation}
                      onChange={(e) => handleInputChange('orientation', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  {/* Print Type with Dynamic Pricing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Print Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="printType"
                          value="black"
                          checked={formData.printType === 'black'}
                          onChange={(e) => handleInputChange('printType', e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <p className="font-medium">Black & White</p>
                          <p className="text-sm text-gray-600">₹{pricing.blackPrintCost} per page</p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="printType"
                          value="color"
                          checked={formData.printType === 'color'}
                          onChange={(e) => handleInputChange('printType', e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <p className="font-medium">Color</p>
                          <p className="text-sm text-gray-600">₹{pricing.colorPrintCost} per page</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Double Sided */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.doubleSided}
                        onChange={(e) => handleInputChange('doubleSided', e.target.checked)}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Double-sided printing
                      </span>
                    </label>
                  </div>
                </div>

                {/* Cost Summary */}
                <div>
                  <div className="bg-blue-50 rounded-lg p-6 sticky top-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Cost Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Print Type:</span>
                        <span className="font-medium capitalize">{formData.printType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost per page:</span>
                        <span className="font-medium">₹{costs.perPage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total pages:</span>
                        <span className="font-medium">{costs.totalPages}</span>
                      </div>
                      <hr className="my-3" />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Cost:</span>
                        <span className="text-blue-600">₹{costs.totalCost}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        onClick={handleProceedToPayment}
                        disabled={loading || !isServiceAvailable}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            Proceed to Payment
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setStep(1)}
                        className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back to Upload
                      </button>
                    </div>

                    {/* Dynamic Settings Info */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-yellow-800 mb-1">
                            📁 Your document is stored locally and will be uploaded to our secure cloud storage after payment confirmation.
                          </p>
                          <p className="text-xs text-yellow-800">
                            ⏱️ Processing begins within 15-30 minutes after payment.
                          </p>
                          {serviceStatus?.businessHours && (
                            <p className="text-xs text-yellow-800 mt-1">
                              🕐 Business Hours: {serviceStatus.businessHours.start} - {serviceStatus.businessHours.end}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {PreviewModal}
    </div>
  );
};

// UPDATED: PreviewModal component with better auth handling
const PreviewModalComponent = ({ 
  showPreview, 
  pdfUrl, 
  uploadedFile, 
  pageCount, 
  previewError, 
  setPreviewError, 
  closePreview,
  onOpenInNewTab,
  token
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Reset states when modal opens
  React.useEffect(() => {
    if (showPreview) {
      setIsLoading(true);
      setLoadError(false);
      setPreviewError(null);
    }
  }, [showPreview, setPreviewError]);

  // Handle iframe load with auth consideration
  const handleIframeLoad = useCallback(() => {
    console.log('PDF preview loaded successfully');
    setIsLoading(false);
    setLoadError(false);
    setPreviewError(null);
  }, [setPreviewError]);

  // Handle iframe load error
  const handleIframeError = useCallback(() => {
    console.log('PDF preview failed to load - possibly auth issue');
    setIsLoading(false);
    setLoadError(true);
    setPreviewError('Unable to load PDF preview. This might be due to authentication. Try opening in a new tab.');
  }, [setPreviewError]);

  // Set loading timeout
  React.useEffect(() => {
    if (isLoading && showPreview) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.log('PDF preview timeout');
          setIsLoading(false);
          setLoadError(true);
          setPreviewError('PDF preview is taking too long to load. Try opening in a new tab or check your connection.');
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, showPreview, setPreviewError]);

  if (!showPreview) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
              <p className="text-sm text-gray-600">{uploadedFile?.name} • {pageCount} pages</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenInNewTab}
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              New Tab
            </button>
            <button
              onClick={closePreview}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 relative overflow-hidden">
          {previewError || loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertCircle className="h-16 w-16 text-orange-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Preview Unavailable</h4>
              <p className="text-gray-600 mb-6 max-w-md">
                {previewError || 'The PDF preview could not be loaded. This might be due to authentication requirements or network issues.'}
              </p>
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={onOpenInNewTab}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Try Opening in New Tab
                </button>
                <button
                  onClick={closePreview}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close Preview
                </button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>📁 Your document is secure and ready for processing</p>
                <p>🔒 Preview may require authentication cookies</p>
                <p>💡 New tab should work better for authenticated content</p>
              </div>
            </div>
          ) : (
            <>
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-900 mb-1">Loading PDF Preview...</p>
                    <p className="text-sm text-gray-600">Authenticating and loading content...</p>
                  </div>
                </div>
              )}
              
              {/* PDF iframe with auth-friendly settings */}
              {pdfUrl && (
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  allow="same-origin"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  style={{ 
                    display: isLoading ? 'none' : 'block',
                    minHeight: '600px'
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>📄 <strong>{pageCount}</strong> pages</span>
                <span>📁 Stored locally until payment</span>
                <span>🔒 Secure processing after payment</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onOpenInNewTab}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open Full Screen
              </button>
              <button
                onClick={closePreview}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintForm;