// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import PrintForm from './components/dashboard/PrintForm';
import PaymentPage from './components/dashboard/PaymentPage';
import PrintHistory from './components/dashboard/PrintHistory';
import Profile from './components/dashboard/Profile';
import About from './components/home/About';
import Contact from './components/home/Contact';
import VerifyOTP from './components/auth/VerifyOTP';
import './styles/globals.css';

// Component to redirect authenticated users away from public routes
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Component to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();

 // Show loading spinner while checking auth status
 if (isLoading) {
   return <div>Loading...</div>; // Or your loading component
 }
 
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Routes for non-authenticated users */}
          {!isAuthenticated ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              {/* Redirect any other route to home for non-authenticated users */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              {/* Routes for authenticated users */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/print" element={<PrintForm />} />
              <Route path="/payment/:id" element={<PaymentPage />} />
              <Route path="/history" element={<PrintHistory />} />
              <Route path="/profile" element={<Profile />} />
              {/* Redirect root and other public routes to dashboard for authenticated users */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/about" element={<Navigate to="/dashboard" replace />} />
              <Route path="/contact" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/register" element={<Navigate to="/dashboard" replace />} />
              {/* Redirect any other route to dashboard for authenticated users */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;