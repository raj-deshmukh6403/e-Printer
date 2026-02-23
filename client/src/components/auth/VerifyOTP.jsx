// src/components/auth/VerifyOTP.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail, Shield, ArrowLeft, RefreshCw} from 'lucide-react';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVisible, setIsVisible] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { verifyOTP, sendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  // Get email and verification type from navigation state
  const email = location.state?.email || '';
  //const fromRegistration = location.state?.fromRegistration || false;
  //const fromLogin = location.state?.fromLogin || false;

  // Auto-slide for background animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast.error('Invalid verification request');
      navigate('/login');
    }
  }, [email, navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Move to next input on arrow right
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Move to previous input on arrow left
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(email, otpString, 'verification');
      
      if (result.success) {
        toast.success('Email verified successfully!');
        if (result.token) {
          // User is automatically logged in after verification
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } else {
        toast.error(result.message || 'Invalid OTP');
        if (result.attemptsLeft) {
          toast.error(`${result.attemptsLeft} attempts remaining`);
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    
    try {
      const result = await sendOTP(email, 'verification');
      
      if (result.success) {
        toast.success('New OTP sent to your email');
        setTimeLeft(600); // Reset timer to 10 minutes
        setCanResend(false);
        setOtp(['', '', '', '', '', '']); // Clear current OTP
        inputRefs.current[0]?.focus();
      } else {
        toast.error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleBackToLogin = () => {
    navigate('/login');
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
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={handleBackToLogin}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </button>
            </div>

            {/* Header */}
            <div id="verify-header" data-animate className={`text-center mb-8 transition-all duration-1000 ${
              isVisible['verify-header'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Verify{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Your Email
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-2">Enter the 6-digit code</p>
              <p className="text-sm text-gray-500">
                We sent a verification code to{' '}
                <span className="font-medium text-gray-700">{email}</span>
              </p>
            </div>

            {/* Form */}
            <div id="verify-form" data-animate className={`transition-all duration-1000 delay-200 ${
              isVisible['verify-form'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <form 
                className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/20" 
                onSubmit={handleSubmit}
              >
                {/* OTP Input */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                    Enter Verification Code
                  </label>
                  <div className="flex justify-center space-x-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/50"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600">
                    Code expires in:{' '}
                    <span className={`font-mono font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-blue-600'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="group relative w-full flex justify-center py-4 px-6 mb-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Verify Email
                    </div>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || resendLoading}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      canResend && !resendLoading
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                        : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {resendLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {canResend ? 'Resend Code' : `Resend in ${formatTime(timeLeft)}`}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Help Section */}
            <div id="verify-help" data-animate className={`mt-8 text-center transition-all duration-1000 delay-400 ${
              isVisible['verify-help'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-white/20">
                <div className="flex justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  The verification code was sent to your email address. It may take a few minutes to arrive.
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>• Check your spam/junk folder</p>
                  <p>• Make sure the email address is correct</p>
                  <p>• The code expires in 10 minutes</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <Link 
                  to="/contact" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VerifyOTP;