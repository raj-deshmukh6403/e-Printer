// admin/src/pages/AdminDashboard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileText,
  Clock,
  CheckCircle,
  Users,
  Printer,
  DollarSign,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { getAnalytics,getNotifications } from '../services/adminApi';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

// Helper function to format time difference
const timeSince = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const AdminDashboard = () => {
  const { data: analyticsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],  
    queryFn: getAnalytics,
    refetchInterval: 30000,
    retry: 3,
  });

  // NEW: Query for notifications data
  const { data: notificationsResponse, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ 
      types: ['request_created', 'processing', 'completed'],
      limit: 10 // Fetch the last 10 relevant notifications
    }),
    refetchInterval: 15000, // Refetch notifications more frequently
  });

  const analytics = analyticsResponse?.data || {};
  const notifications = notificationsResponse?.data || [];

  // Enhanced stats with better organization
  const primaryStats = [
    {
      title: 'Total Requests',
      value: analytics?.totalRequests || 0,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'All time requests'
    },
    {
      title: 'Completed Today',
      value: analytics?.completedToday || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      description: 'Orders finished today'
    },
    {
      title: 'In Progress',
      value: (analytics?.queueRequests || 0) + (analytics?.inProcessRequests || 0),
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      description: 'Currently processing'
    },
    {
      title: 'Total Revenue',
      value: `₹${analytics?.revenue?.totalRevenue?.toFixed(0) || 0}`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Total earnings'
    }
  ];

  // Transform data for charts
  const statusData = [
    { name: 'Pending', value: analytics?.pendingRequests || 0, color: '#F59E0B' },
    { name: 'In Queue', value: analytics?.queueRequests || 0, color: '#3B82F6' },
    { name: 'Processing', value: analytics?.inProcessRequests || 0, color: '#8B5CF6' },
    { name: 'Completed', value: analytics?.processedRequests || 0, color: '#10B981' },
    { name: 'Failed', value: analytics?.failedRequests || 0, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const categoryData = analytics?.categoryStats ? 
    analytics.categoryStats.map((stat, index) => ({
      name: stat._id.charAt(0).toUpperCase() + stat._id.slice(1),
      value: stat.count,
      color: COLORS[index % COLORS.length]
    })) : [];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header showNotifications={false} />
          <div className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm h-32"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm h-80"></div>
                <div className="bg-white p-6 rounded-xl shadow-sm h-80"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header showNotifications={false} />
          <div className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
                  <p className="text-red-600 mt-1">{error.message}</p>
                  <button 
                    onClick={() => refetch()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
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
        <Header showNotifications={false} />
        
        {/* Main Content with Scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-1">Monitor your print service performance</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Activity className="h-4 w-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Primary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {primaryStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.description}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </div>
                    <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Request Status Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Request Status</h3>
                  <div className="text-sm text-gray-500">
                    Total: {statusData.reduce((sum, item) => sum + item.value, 0)}
                  </div>
                </div>
                
                {statusData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) => 
                            percent > 5 ? `${name}: ${value}` : ''
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No request data available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Categories */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">User Categories</h3>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                
                {categoryData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No user data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Activity - NOW DYNAMIC */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <p className="text-gray-500">Loading activities...</p>
                    ) : notifications.length > 0 ? (
                      notifications.map((activity) => (
                        <div key={activity._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            activity.type === 'request_created' ? 'bg-blue-100' :
                            activity.type === 'completed' ? 'bg-green-100' :
                            activity.type === 'processing' ? 'bg-orange-100' : 'bg-gray-100'
                          }`}>
                            {activity.type === 'request_created' && <FileText className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {activity.type === 'processing' && <Printer className="h-4 w-4 text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{timeSince(activity.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No recent activities found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Average Order Value */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{analytics?.revenue?.avgOrderValue?.toFixed(0) || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Average Order Value</p>
                  </div>

                  {/* Completion Rate */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.totalRequests > 0 
                        ? Math.round((analytics.processedRequests / analytics.totalRequests) * 100)
                        : 0}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
                  </div>

                  {/* Total Users */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {categoryData.reduce((sum, cat) => sum + cat.value, 0)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Total Users</p>
                  </div>

                  {/* System Status */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">System Status</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;