import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Dashboard from '../components/dashboard/Dashboard';
import ProtectedRoute from '../components/common/ProtectedRoute';

const DashboardPage = () => {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Dashboard />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;