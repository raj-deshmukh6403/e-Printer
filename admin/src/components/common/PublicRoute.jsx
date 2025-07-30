// admin/src/components/common/PublicRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PublicRoute component that redirects authenticated users away from public pages
 * Used for login page to prevent authenticated users from accessing it
 */
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  
  // If user is already authenticated, redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not authenticated, allow access to public route
  return children;
};

export default PublicRoute;