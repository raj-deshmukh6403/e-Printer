// admin/src/pages/PrintRequests.jsx
import { useState} from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter,
  Eye,
  Clock,
  CheckCircle,
  FileText,
  User,
  X,
  AlertCircle,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import PrintPreview from '../components/dashboard/PrintPreview';
import { getAllRequests } from '../services/adminApi';

const PrintRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: requestsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['print-requests', statusFilter, categoryFilter, searchTerm],
    queryFn: () => getAllRequests({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchTerm || undefined
    }),
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 3,
    retryDelay: 1000,
  });

  // Extract requests array from response
  const requests = requestsResponse?.data || [];

  console.log('Requests response:', requestsResponse);
  console.log('Requests array:', requests);

  const handleStatusUpdate = (requestId, newStatus) => {
    console.log('Status updated for request:', requestId, 'New status:', newStatus);
    refetch();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'payment_pending':
        return <CreditCard className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_queue':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <FileText className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-gray-700 bg-gray-100';
      case 'payment_pending':
        return 'text-orange-700 bg-orange-100';
      case 'paid':
        return 'text-blue-700 bg-blue-100';
      case 'in_queue':
        return 'text-purple-700 bg-purple-100';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'cancelled':
        return 'text-red-700 bg-red-100';
      case 'failed':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'student':
        return 'text-blue-700 bg-blue-100';
      case 'staff':
        return 'text-green-700 bg-green-100';
      case 'professor':
        return 'text-purple-700 bg-purple-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Requests</h3>
              <p className="text-red-600 mb-4">{error.message}</p>
              <button 
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow h-20"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by file name, ID, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="paid">Paid</option>
                <option value="in_queue">In Queue</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="student">Students</option>
                <option value="staff">Staff</option>
                <option value="professor">Professors</option>
              </select>

              {/* Results Count and Refresh */}
              <div className="flex items-center justify-between text-gray-600">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>{requests.length} results</span>
                </div>
                <button
                  onClick={() => refetch()}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white rounded-lg shadow flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold">Print Requests</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {requests.length > 0 ? (
                <div className="divide-y">
                  {requests.map((request, index) => (
                    <div
                      key={request._id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Queue Number */}
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-blue-600">
                              #{request.queueNumber || (index + 1)}
                            </span>
                          </div>

                          {/* Request Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {request.documentName || 'Unknown File'}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${getStatusColor(request.status)}`}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(request.status)}
                                  <span className="capitalize">
                                    {request.status?.replace('_', ' ') || 'pending'}
                                  </span>
                                </div>
                              </span>
                              {request.paymentStatus === 'completed' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex-shrink-0">
                                  <CreditCard className="w-3 h-3 inline mr-1" />
                                  Paid
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{request.user?.username || 'Unknown User'}</span>
                                <span className={`ml-2 px-2 py-1 text-xs rounded-full flex-shrink-0 ${getCategoryColor(request.user?.category)}`}>
                                  {request.user?.category || 'unknown'}
                                </span>
                              </div>
                              <span className="hidden sm:inline">•</span>
                              <span>{request.documentPages || 0} pages</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{request.copies || 1} copies</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="capitalize">{request.printType || 'black'}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="font-semibold">₹{request.totalCost || 0}</span>
                            </div>
                            
                            {/* Additional info for mobile */}
                            <div className="mt-2 text-xs text-gray-500">
                              Created: {new Date(request.createdAt).toLocaleDateString()} {new Date(request.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {/* Unique ID */}
                          <div className="text-right hidden md:block">
                            <p className="text-sm text-gray-600">Unique ID</p>
                            <p className="font-mono font-semibold text-xs">
                              {request.uniqueId || 'N/A'}
                            </p>
                          </div>

                          {/* View Button */}
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowPreview(true);
                            }}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">View & </span>Print
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No print requests have been submitted yet'}
                  </p>
                  <button 
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPreview && selectedRequest && (
        <PrintPreview
          request={selectedRequest}
          onClose={() => {
            setShowPreview(false);
            setSelectedRequest(null);
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default PrintRequests;