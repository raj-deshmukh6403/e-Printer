// admin/src/components/dashboard/RequestList.jsx
import React, { useState } from 'react';
import { Eye, Download, CheckCircle, Clock, AlertCircle, Users, FileText, CreditCard } from 'lucide-react';

const RequestList = ({ requests, onStatusUpdate, onViewRequest }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_process':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'in_queue':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_process':
        return 'In Process';
      case 'in_queue':
        return 'In Queue';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getCategoryIcon = (category) => {
    return <Users className="h-4 w-4" />;
  };

  const filteredRequests = selectedCategory === 'all' 
    ? requests 
    : requests.filter(req => req.userId?.category === selectedCategory);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Print Requests</h2>
          
          {/* Category Filter */}
          <div className="flex space-x-2">
            {['all', 'student', 'staff', 'professor'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Request List */}
      <div className="divide-y divide-gray-200">
        {filteredRequests.map((request) => (
          <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              {/* Left side - Request info */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {/* Queue Number */}
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    #{request.queuePosition || 'N/A'}
                  </div>

                  {/* Unique ID */}
                  <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-sm font-mono">
                    {request.uniqueId}
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <span className="text-sm font-medium text-gray-700">
                      {getStatusText(request.status)}
                    </span>
                  </div>

                  {/* Payment Status */}
                  {request.paymentStatus === 'completed' && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">Paid</span>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {/* Document name */}
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{request.documentName}</span>
                    </div>

                    {/* User info */}
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(request.userId?.category)}
                      <span>{request.userId?.username}</span>
                      <span className="text-gray-400">({request.userId?.category})</span>
                    </div>

                    {/* Print details */}
                    <span>
                      {request.copies} copies • {request.printType} • ₹{request.totalCost}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onViewRequest(request)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View & Print</span>
                </button>

                {request.status === 'in_queue' && (
                  <button
                    onClick={() => onStatusUpdate(request._id, 'in_process')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Start Processing
                  </button>
                )}

                {request.status === 'in_process' && (
                  <button
                    onClick={() => onStatusUpdate(request._id, 'completed')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No print requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestList;