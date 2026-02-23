// src/components/dashboard/PrintHistory.jsx - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  History,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  Download,
  Copy,
  Calendar,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import api from "../../services/api"

const PrintHistory = () => {
  //const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [statusFilter] = useState('all');
  const [dateFilter] = useState('all');
  const [sortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Initialize stats with default values to prevent undefined errors
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProcess: 0,
    inQueue: 0,
    cancelled: 0
  });

  const fetchPrintHistory = useCallback(async () => {
  setLoading(true);

  try {
    const params = {
      page: currentPage,
      limit: 10,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
      sort: sortBy,
      dateFilter: dateFilter !== 'all' ? dateFilter : undefined
    };

    console.log('=== FETCHING PRINT HISTORY ===');
    console.log('API request params:', params);

    const response = await api.get('/print/requests', { params });
    
    console.log('=== PRINT HISTORY RESPONSE ===');
    console.log('Full response:', response);
    console.log('Response data:', response.data);

    // Handle the specific API response structure
    let fetchedRequests = [];
    let pages = 1;
    let fetchedStats = {
      total: 0,
      completed: 0,
      inProcess: 0,
      inQueue: 0,
      cancelled: 0
    };

    if (response.data && response.data.success) {
      // Your API returns: { success: true, count: 10, total: 13, pagination: {...}, data: [...] }
      fetchedRequests = response.data.data || [];
      pages = response.data.pagination?.pages || 1;
      
      // Calculate stats from the fetched requests
      fetchedStats.total = response.data.total || fetchedRequests.length;
      
      // Count different statuses from the actual data
      fetchedRequests.forEach(req => {
        const status = req.status?.toLowerCase();
        if (status === 'completed' || status === 'ready') {
          fetchedStats.completed++;
        } else if (status === 'in_process' || status === 'processing') {
          fetchedStats.inProcess++;
        } else if (status === 'in_queue' || status === 'pending') {
          fetchedStats.inQueue++;
        } else if (status === 'cancelled' || status === 'failed') {
          fetchedStats.cancelled++;
        }
      });
    } else {
      // Fallback for other response structures
      console.warn('Unexpected response structure:', response.data);
      fetchedRequests = [];
    }

    console.log('=== PROCESSED DATA ===');
    console.log('Requests:', fetchedRequests);
    console.log('Total pages:', pages);
    console.log('Stats:', fetchedStats);
    
    setRequests(fetchedRequests || []);
    setTotalPages(pages);
    setStats(fetchedStats);

  } catch (error) {
    console.error('=== FETCH PRINT HISTORY ERROR ===');
    console.error('Error:', error);
    console.error('Error response:', error.response);

    // Reset to empty state on error
    setRequests([]);
    setTotalPages(1);
    setStats({
      total: 0,
      completed: 0,
      inProcess: 0,
      inQueue: 0,
      cancelled: 0
    });

    toast.error(
      error.response?.data?.message || 
      'Error fetching print history'
    );
  } finally {
    setLoading(false);
  }
 }, [currentPage, statusFilter, dateFilter, sortBy, searchTerm]);

 useEffect(() => {
    fetchPrintHistory();
  }, [fetchPrintHistory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_queue':
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'in_process':
      case 'processing':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'completed':
      case 'ready':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'cancelled':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_queue':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_process':
      case 'processing':
        return <Printer className="h-4 w-4" />;
      case 'completed':
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const copyUniqueId = (uniqueId) => {
    navigator.clipboard.writeText(uniqueId);
    toast.success('Unique ID copied to clipboard!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadInvoice = async (requestId) => {
    try {
      const response = await api.get(`/print/invoice/${requestId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading invoice');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <History className="h-8 w-8 mr-3" />
                Print History
              </h1>
              <p className="text-gray-600 mt-1">Track all your print requests and their status</p>
            </div>
            <button
              onClick={fetchPrintHistory}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.completed || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Printer className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Process</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.inProcess || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Queue</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.inQueue || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.cancelled || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Requests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Print Requests ({stats.total || 0})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading print history...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Print Requests Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No requests match your current filters.'
                  : 'You haven\'t made any print requests yet.'}
              </p>
              {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
                <Link
                  to="/print"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Print Request
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request._id || request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-xs">
                                {request.documentName || 'Unknown Document'}
                              </div>
                              <div className="text-sm text-gray-600">
                                Queue #{request.queueNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">
                              {request.status ? request.status.replace('_', ' ') : 'Unknown'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {request.createdAt ? formatDate(request.createdAt) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>
                            <div>{request.totalPages || 0} pages • {request.copies || 0} copies</div>
                            <div className="text-xs text-gray-500">
                              {request.printType || 'N/A'} • {request.pageSize || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ₹{request.totalCost || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {request.status === 'completed' && request.uniqueId && (
                              <div className="flex items-center space-x-1">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                  {request.uniqueId}
                                </code>
                                <button
                                  onClick={() => copyUniqueId(request.uniqueId)}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy Unique ID"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => downloadInvoice(request._id || request.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-200">
                {requests.map((request) => (
                  <div key={request._id || request.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 truncate">
                            {request.documentName || 'Unknown Document'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Queue #{request.queueNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">
                          {request.status ? request.status.replace('_', ' ') : 'Unknown'}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <div className="font-medium">
                          {request.createdAt ? formatDate(request.createdAt) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cost:</span>
                        <div className="font-medium">₹{request.totalCost || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Pages:</span>
                        <div className="font-medium">{request.totalPages || 0} pages</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Copies:</span>
                        <div className="font-medium">{request.copies || 0}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {request.status === 'completed' && request.uniqueId && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">ID:</span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {request.uniqueId}
                          </code>
                          <button
                            onClick={() => copyUniqueId(request.uniqueId)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => downloadInvoice(request._id || request.id)}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm transition-colors"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 text-sm rounded transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        {!loading && requests.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/print"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <FileText className="h-5 w-5 mr-2" />
              Create New Print Request
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintHistory;