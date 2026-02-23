// Updated Dashboard.jsx without the debug button
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Printer, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Plus,
  Bell,
  History
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user} = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    inQueue: 0,
    inProcess: 0,
    completed: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Configure axios with auth token if available
      const config = {
        withCredentials: true, // This is crucial for cookie-based auth
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('=== DASHBOARD API CALLS DEBUG ===');
      console.log('Auth config:', config);

      // Try multiple endpoint variations to find what works
      let requestsData = [];
      let notificationsData = [];

      // Try print requests with different endpoints
      try {
        console.log('Trying /api/print/requests...');
        const requestsRes = await axios.get('https://e-printer-rouge.vercel.app/api/print/requests', config);
        console.log('Success with /api/print/requests:', requestsRes.data);
        requestsData = requestsRes.data.data || requestsRes.data.printRequests || requestsRes.data || [];
      } catch (error) {
        console.log('Failed /api/print/requests:', error.response?.status);
        
        try {
          console.log('Trying /api/print/request...');
          const requestsRes = await axios.get('https://e-printer-rouge.vercel.app/api/print/request', config);
          console.log('Success with /api/print/request:', requestsRes.data);
          requestsData = requestsRes.data.data || requestsRes.data.printRequests || requestsRes.data || [];
        } catch (error2) {
          console.log('Failed /api/print/request:', error2.response?.status);
          console.log('Print requests error details:', error2.response?.data);
        }
      }

      // Try notifications
      try {
        console.log('Trying /api/notifications...');
        const notificationsRes = await axios.get('https://e-printer-rouge.vercel.app/api/notifications/getall', config);
        console.log('Success with /api/notifications:', notificationsRes.data);
        notificationsData = notificationsRes.data.data || notificationsRes.data || [];
      } catch (error) {
        console.log('Notifications error:', error.response?.status);
        console.log('Notifications error details:', error.response?.data);
        // Create some dummy notifications for testing
        notificationsData = [];
      }

      console.log('=== FINAL DATA ===');
      console.log('Requests data:', requestsData);
      console.log('Notifications data:', notificationsData);

      // Ensure requests is an array
      if (!Array.isArray(requestsData)) {
        console.warn('Requests data is not an array:', requestsData);
        requestsData = [];
      }

      setRecentRequests(requestsData);

      // Calculate stats from the requests
      const calculatedStats = requestsData.reduce((acc, req) => {
        acc.totalRequests++;
        switch (req.status) {
          case 'pending':
          case 'in_queue':
            acc.inQueue++;
            break;
          case 'in_process':
            acc.inProcess++;
            break;
          case 'completed':
            acc.completed++;
            break;
          default:
            break;
        }
        return acc;
      }, { totalRequests: 0, inQueue: 0, inProcess: 0, completed: 0 });

      console.log('Calculated stats:', calculatedStats);
      setStats(calculatedStats);

      // Handle notifications
      if (!Array.isArray(notificationsData)) {
        console.warn('Notifications data is not an array:', notificationsData);
        notificationsData = [];
      }
      setNotifications(notificationsData);

    } catch (error) {
      console.error('=== DASHBOARD FETCH ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const refreshData = () => {
    setLoading(true);
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'in_queue':
        return 'text-yellow-600 bg-yellow-100';
      case 'in_process':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'in_queue':
        return <Clock className="h-4 w-4" />;
      case 'in_process':
        return <Printer className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.username || user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your print requests and track their progress
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Queue</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inQueue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Printer className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Process</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inProcess}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/print"
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">New Print Request</p>
                      <p className="text-sm text-gray-600">Upload and print documents</p>
                    </div>
                  </Link>

                  <Link
                    to="/history"
                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                  >
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <History className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">View History</p>
                      <p className="text-sm text-gray-600">See all print requests</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-lg shadow mt-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
                  <Link
                    to="/history"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentRequests.length > 0 ? (
                  recentRequests.map((request, index) => (
                    <div key={request._id || request.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {request.documentName || 'Unknown Document'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {request.queueNumber ? `Queue #${request.queueNumber}` : 'No Queue Number'} • 
                              ₹{request.totalCost || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(request.createdAt || request.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">
                              {(request.status || 'unknown').replace('_', ' ')}
                            </span>
                          </span>
                          {request.status === 'completed' && request.uniqueId && (
                            <span className="text-sm font-medium text-green-600">
                              ID: {request.uniqueId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No print requests yet</p>
                    <Link
                      to="/print"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Create your first request
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div key={notification._id || notification.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                    <p className="font-medium text-gray-900 text-sm">
                      {notification.title || 'Notification'}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.message || notification.content || 'No message'}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      {formatDate(notification.createdAt || notification.timestamp)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
