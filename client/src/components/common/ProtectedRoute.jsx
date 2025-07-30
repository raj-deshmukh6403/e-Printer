import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FullPageLoading } from './Loading';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, isAuthenticated, isLoading } = useAuth(); // ✅ Changed from 'loading' to 'isLoading'
  const location = useLocation();

  if (isLoading) { // ✅ Changed from 'loading' to 'isLoading'
    return <FullPageLoading text="Verifying authentication..." />;
  }

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route is for non-authenticated users (like login/register) and user is authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;