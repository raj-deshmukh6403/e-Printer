import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Printer, CheckCircle, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [isVisible, setIsVisible] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // FIXED: Use separate forgot password functions
  const { 
    forgotPassword, 
    verifyForgotPasswordOTP, 
    resetPasswordWithOTP, 
    resendForgotPasswordOTP 
  } = useAuth();
  const navigate = useNavigate();

  // Auto-slide for background animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [step]);

  // Step 1: Send OTP to email for password reset
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIXED: Use forgotPassword function specifically for password reset
      const response = await forgotPassword(email);
      if (response.success) {
        toast.success('Password reset OTP sent to your email!');
        setStep(2);
        setCountdown(60); // 60 seconds countdown
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send forgot password OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    }
    
    setLoading(false);
  };

  // Step 2: Verify OTP for password reset
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIXED: Use verifyForgotPasswordOTP specifically for password reset
      const response = await verifyForgotPasswordOTP(email, otp);
      if (response.success) {
        toast.success('OTP verified successfully!');
        setStep(3); // Move to password reset step
      } else {
        toast.error(response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify forgot password OTP error:', error);
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    }
    
    setLoading(false);
  };

  // Step 3: Reset password with verified OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // FIXED: Use resetPasswordWithOTP function
      const response = await resetPasswordWithOTP(email, otp, newPassword);
      
      if (response.success) {
        setStep(4);
        toast.success('Password reset successful!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
    
    setLoading(false);
  };

  // Resend OTP for password reset
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    try {
      // FIXED: Use resendForgotPasswordOTP specifically for password reset
      const response = await resendForgotPasswordOTP(email);
      if (response.success) {
        toast.success('OTP resent successfully!');
        setCountdown(60);
      } else {
        toast.error('Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
    setResendLoading(false);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Forgot Password?';
      case 2: return 'Verify OTP';
      case 3: return 'Reset Password';
      case 4: return 'Success!';
      default: return 'Forgot Password?';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Enter your email to receive OTP';
      case 2: return 'Enter the OTP sent to your email';
      case 3: return 'Create your new password';
      case 4: return 'Password reset successfully!';
      default: return 'Enter your email to receive OTP';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-1000 ${
            currentSlide === 0 ? 'from-blue-50 via-indigo-50 to-purple-50' :
            currentSlide === 1 ? 'from-purple-50 via-pink-50 to-red-50' :
            'from-green-50 via-teal-50 to-blue-50'
          }`} />
          
          {/* Floating Elements */}
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 z-10">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div id="forgot-header" data-animate className={`text-center mb-8 transition-all duration-1000 ${
              isVisible['forgot-header'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                  {step === 4 ? <CheckCircle className="h-10 w-10 text-white" /> : <Printer className="h-10 w-10 text-white" />}
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {getStepTitle().split(' ')[0]}{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {getStepTitle().split(' ').slice(1).join(' ')}
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                {getStepDescription()}
              </p>
              
              {/* Step indicator */}
              <div className="flex justify-center mt-4 space-x-2">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      stepNum === step 
                        ? 'bg-blue-600 scale-125' 
                        : stepNum < step 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div id="forgot-content" data-animate className={`transition-all duration-1000 delay-200 ${
              isVisible['forgot-content'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              
              {/* Step 1: Email */}
              {step === 1 && (
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="group">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:border-blue-300 bg-white/50"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Sending OTP...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Send OTP
                          <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {step === 2 && (
                <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="text-center text-sm text-gray-600 mb-4">
                      OTP sent to <span className="font-semibold text-blue-600">{email}</span>
                    </div>
                    
                    <div className="group">
                      <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter OTP
                      </label>
                      <div className="relative">
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          required
                          maxLength="6"
                          className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 group-hover:border-purple-300 bg-white/50 text-center text-2xl font-mono tracking-widest"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Verifying...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Verify OTP
                          <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={countdown > 0 || resendLoading}
                        className="inline-flex items-center text-sm text-purple-600 hover:text-pink-600 transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${resendLoading ? 'animate-spin' : ''}`} />
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="group">
                      <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          required
                          minLength="6"
                          className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white/50"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          minLength="6"
                          className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white/50"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Resetting...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Reset Password
                          <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-2xl p-8 text-center backdrop-blur-sm border border-white/20">
                  <div className="mb-6">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-2xl transform hover:scale-110 transition-all duration-300">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Password Reset Successfully!
                  </h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Your password has been reset successfully. You can now login with your new password.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Go to Login
                    <span className="inline-block ml-2">→</span>
                  </button>
                </div>
              )}

              {/* Back to Login Link */}
              {step < 4 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-purple-600 transition-colors duration-300 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

//hi

export default ForgotPassword;