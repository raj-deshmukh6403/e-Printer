// admin/src/components/dashboard/PrintPreview.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Download,
  FileText,
  User,
  Calendar,
  CreditCard,
  Settings,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePrintStatus, getPrintRequest } from '../../services/adminApi';

const PrintPreview = ({ request, onClose, onStatusUpdate }) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(request);
  const [currentLoadingToast, setCurrentLoadingToast] = useState(null);
  const queryClient = useQueryClient();

  // Update local state when request prop changes
  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  // Update status mutation with better toast management
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }) => {
      console.log('Updating status:', { requestId: currentRequest._id, status, notes });
      return updatePrintStatus(currentRequest._id, status, notes);
    },
    onSuccess: (data) => {
      console.log('Status update successful:', data);
      const newStatus = data.data?.status || data.status;
      
      // Dismiss any loading toast
      if (currentLoadingToast) {
        toast.dismiss(currentLoadingToast);
        setCurrentLoadingToast(null);
      }
      
      // Only show success toast if it's not from the print function
      if (newStatus !== 'in_process') {
        toast.success(`Status updated to ${newStatus?.replace('_', ' ')} successfully!`);
      }
      
      // Update local state immediately
      setCurrentRequest(prev => ({
        ...prev,
        status: newStatus,
        adminNotes: adminNotes.trim() || prev.adminNotes
      }));
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['print-requests']);
      
      if (onStatusUpdate) {
        onStatusUpdate(currentRequest._id, newStatus);
      }
      
      setIsUpdating(false);
    },
    onError: (error) => {
      console.error('Status update error:', error);
      
      // Dismiss any loading toast
      if (currentLoadingToast) {
        toast.dismiss(currentLoadingToast);
        setCurrentLoadingToast(null);
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to update status';
      toast.error(`Failed to update status: ${errorMessage}`);
      setIsUpdating(false);
    }
  });

  const handleStatusUpdate = async (newStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      console.log('Attempting to update status to:', newStatus);
      await updateStatusMutation.mutateAsync({
        status: newStatus,
        notes: adminNotes.trim() || undefined
      });
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error);
      setIsUpdating(false);
    }
  };

  // Test if document URL is accessible
  const testDocumentUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log('Document URL test:', {
        url,
        status: response.status,
        ok: response.ok
      });
      return response.ok;
    } catch (error) {
      console.error('Document URL test failed:', error);
      return false;
    }
  };

  const handlePrint = async () => {
    if (!currentRequest.documentUrl) {
      toast.error('Document URL not available');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Create loading toast and store its ID
      const loadingToastId = toast.loading('Updating status to processing...');
      setCurrentLoadingToast(loadingToastId);
      
      // Update status to in_process
      await updateStatusMutation.mutateAsync({
        status: 'in_process',
        notes: adminNotes.trim() || 'Started printing document'
      });

      // Test if document URL is accessible
      console.log('Testing document URL:', currentRequest.documentUrl);
      const isAccessible = await testDocumentUrl(currentRequest.documentUrl);
      
      if (!isAccessible) {
        toast.error('Document is not accessible. Please check the file or try again.');
        return;
      }

      // Try multiple methods to open/print the document
      let printSuccess = false;

      // Method 1: Try window.open with better error handling
      try {
        const printWindow = window.open(currentRequest.documentUrl, '_blank', 'noopener,noreferrer');
        
        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
              toast.success('Document opened for printing');
              printSuccess = true;
            } catch (printError) {
              console.error('Print command failed:', printError);
              toast.success('Document opened - please use Ctrl+P to print');
            }
          };
          
          printWindow.onerror = () => {
            console.error('Error loading document in new window');
            if (!printSuccess) {
              // Fallback to direct download
              fallbackDownload();
            }
          };
          
          // Set a timeout to check if window opened successfully
          setTimeout(() => {
            if (printWindow.closed) {
              console.log('Print window was closed or blocked');
              if (!printSuccess) {
                fallbackDownload();
              }
            }
          }, 500);
          
        } else {
          // Window.open failed (likely popup blocked)
          console.error('Failed to open print window - popup likely blocked');
          fallbackDownload();
        }
      } catch (windowError) {
        console.error('Window.open failed:', windowError);
        fallbackDownload();
      }

      // Fallback method: Direct download link
      function fallbackDownload() {
        try {
          // Create a temporary link element
          const link = document.createElement('a');
          link.href = currentRequest.documentUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = currentRequest.documentName || 'document.pdf';
          
          // Temporarily add to DOM and click
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Document download started - please open and print');
          
          // Also show a custom toast with the direct link
          toast((t) => (
            <div className="max-w-md">
              <p className="font-medium">Direct link to document:</p>
              <a 
                href={currentRequest.documentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm break-all hover:text-blue-800"
                onClick={() => toast.dismiss(t.id)}
              >
                Open Document
              </a>
              <p className="text-xs text-gray-600 mt-1">Click to open in new tab</p>
            </div>
          ), { 
            duration: 10000,
            icon: '📄'
          });
          
        } catch (linkError) {
          console.error('Fallback download failed:', linkError);
          toast.error('Unable to open document. Please contact support.');
        }
      }

    } catch (error) {
      console.error('Error in handlePrint:', error);
      
      // Dismiss loading toast if still active
      if (currentLoadingToast) {
        toast.dismiss(currentLoadingToast);
        setCurrentLoadingToast(null);
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start printing process';
      toast.error(`Print failed: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
      
      // Clean up loading toast reference
      if (currentLoadingToast) {
        setCurrentLoadingToast(null);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
      case 'in_process':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'in_queue':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'in_process':
        return 'bg-blue-100 text-blue-800';
      case 'in_queue':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Use currentRequest for display
  const displayRequest = currentRequest;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Print Request Details
              </h2>
              <p className="text-sm text-gray-600">
                Queue #{displayRequest.queueNumber} • {displayRequest.uniqueId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Request Info */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Document Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">File Name:</span>
                  <span className="font-medium">{displayRequest.documentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages:</span>
                  <span className="font-medium">{displayRequest.documentPages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">
                    {displayRequest.documentSize ? (displayRequest.documentSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">PDF</span>
                </div>
                {/* Debug: Show document URL for testing */}
                {displayRequest.documentUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document:</span>
                    <a 
                      href={displayRequest.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View PDF
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{displayRequest.user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{displayRequest.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    displayRequest.user?.category === 'student' ? 'bg-blue-100 text-blue-800' :
                    displayRequest.user?.category === 'staff' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {displayRequest.user?.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WhatsApp:</span>
                  <span className="font-medium">{displayRequest.user?.whatsappNumber}</span>
                </div>
              </div>
            </div>

            {/* Print Settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Print Settings
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Copies:</span>
                  <span className="font-medium">{displayRequest.copies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages to Print:</span>
                  <span className="font-medium capitalize">{displayRequest.pagesToPrint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Page Size:</span>
                  <span className="font-medium">{displayRequest.pageSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Orientation:</span>
                  <span className="font-medium capitalize">{displayRequest.orientation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Print Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    displayRequest.printType === 'color' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {displayRequest.printType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Double Sided:</span>
                  <span className="font-medium">{displayRequest.doubleSided ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Status & Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${getStatusColor(displayRequest.status)}`}>
                    {getStatusIcon(displayRequest.status)}
                    <span className="capitalize">{displayRequest.status?.replace('_', ' ')}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(displayRequest.createdAt).toLocaleString()}
                  </span>
                </div>
                {displayRequest.paymentCompletedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-medium">
                      {new Date(displayRequest.paymentCompletedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {displayRequest.processingStartedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Started:</span>
                    <span className="font-medium">
                      {new Date(displayRequest.processingStartedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {displayRequest.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">
                      {new Date(displayRequest.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-bold text-lg">₹{displayRequest.totalCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    displayRequest.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {displayRequest.paymentStatus}
                  </span>
                </div>
                {displayRequest.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-xs">{displayRequest.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Admin Notes</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this print request..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Print Document Button - Show for in_queue status */}
              {displayRequest.documentUrl && displayRequest.status === 'in_queue' && (
                <button
                  onClick={handlePrint}
                  disabled={isUpdating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="h-5 w-5" />
                  <span>{isUpdating ? 'Starting Print...' : 'Print Document'}</span>
                </button>
              )}

              {/* Status Update Buttons */}
              <div className="grid grid-cols-1 gap-2">
                {/* Mark as Completed - Show if status is processing */}
                {(displayRequest.status === 'processing' || displayRequest.status === 'in_process') && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{isUpdating ? 'Updating...' : 'Mark as Completed'}</span>
                  </button>
                )}

                {/* Mark as Failed - Show for in_queue and processing */}
                {(displayRequest.status === 'in_queue' || displayRequest.status === 'processing' || displayRequest.status === 'in_process') && (
                  <button
                    onClick={() => handleStatusUpdate('failed')}
                    disabled={isUpdating}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{isUpdating ? 'Updating...' : 'Mark as Failed'}</span>
                  </button>
                )}

                {/* Show completion message for completed/failed requests */}
                {(displayRequest.status === 'completed' || displayRequest.status === 'failed') && (
                  <div className={`p-3 rounded-lg text-center ${
                    displayRequest.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className="flex items-center justify-center space-x-2">
                      {displayRequest.status === 'completed' 
                        ? <CheckCircle className="h-5 w-5" />
                        : <AlertCircle className="h-5 w-5" />
                      }
                      <span className="font-medium capitalize">
                        Request {displayRequest.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isUpdating ? 'Processing...' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;