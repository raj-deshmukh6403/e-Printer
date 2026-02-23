// src/components/dashboard/PaymentPage.jsx - RAZORPAY INTEGRATION - FIXED
import { useState, useEffect,useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  ArrowLeft, 
  Lock,
  Check,
  X,
  FileText,
  Clock,
  Copy,
} from 'lucide-react';
import axios from 'axios';

const PaymentPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [printRequest, setPrintRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [paymentStep, setPaymentStep] = useState('select');
  const [uniqueId, setUniqueId] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Map frontend payment methods to backend enum values
  const paymentMethodMapping = {
    'upi': 'upi',
    'card': 'credit_card', // Changed from 'card' to 'credit_card'
    'netbanking': 'internet_banking' // Changed from 'netbanking' to 'internet_banking'
  };

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  const fetchPrintRequest = useCallback(async () => {
    try {
      console.log('=== PAYMENT PAGE DEBUG ===');
      console.log('User:', user);
      console.log('Token:', token);
      console.log('Request ID:', id);

      const config = {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };

      if (token && token !== 'cookie') {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('Making request with config:', config);
      
      const response = await axios.get(
        `https://e-printer-rouge.vercel.app/api/print/request/${id}`, 
        config
      );
      
      console.log('Response received:', response.data);
      setPrintRequest(response.data.data);
    } catch (error) {
      console.error('=== FETCH PRINT REQUEST ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      toast.error('Print request not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, token, user, navigate]);

   useEffect(() => {
    fetchPrintRequest();
  }, [fetchPrintRequest]);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setPaymentLoading(true);
    setPaymentStep('processing');

    try {
      // Step 1: Create Razorpay order
      const config = {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };

      if (token && token !== 'cookie') {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('Creating Razorpay order...');
      const orderResponse = await axios.post(
        'https://e-printer-rouge.vercel.app/api/payment/create-order',
        { printRequestId: id },
        config
      );

      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order');
      }

      const { orderId, amount, currency, keyId } = orderResponse.data.data;
      console.log('Order created:', { orderId, amount, currency });

      // Step 2: Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'E-Printer',
        description: `Print: ${printRequest.documentName}`,
        order_id: orderId,
        handler: async function (response) {
          console.log('Payment successful:', response);
          await verifyPayment(response);
        },
        prefill: {
          name: user?.username || user?.name || '',
          email: user?.email || '',
          contact: user?.whatsappNumber || user?.phone || ''
        },
        notes: {
          print_request_id: id,
          document_name: printRequest.documentName
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setPaymentLoading(false);
            setPaymentStep('select');
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentStep('failed');
      setPaymentLoading(false);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const verifyPayment = async (razorpayResponse) => {
    try {
      console.log('Verifying payment...', razorpayResponse);
      
      const config = {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };

      if (token && token !== 'cookie') {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Map the selected payment method to the backend enum value
      const mappedPaymentMethod = paymentMethodMapping[selectedMethod];
      console.log('Selected method:', selectedMethod, 'Mapped to:', mappedPaymentMethod);

      const verificationData = {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        printRequestId: id,
        paymentMethod: mappedPaymentMethod // Use mapped value instead of selectedMethod
      };

      const response = await axios.post(
        'https://e-printer-rouge.vercel.app/api/payment/verify',
        verificationData,
        config
      );

      if (response.data.success) {
        console.log('Payment verified successfully');
        setUniqueId(response.data.data.uniqueId);
        setPaymentStep('success');
        setPaymentLoading(false);
        toast.success('Payment successful! Your print request has been queued.');
      } else {
        throw new Error('Payment verification failed');
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStep('failed');
      setPaymentLoading(false);
      toast.error(error.response?.data?.message || 'Payment verification failed');
    }
  };

  const copyUniqueId = () => {
    navigator.clipboard.writeText(uniqueId);
    toast.success('Unique ID copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!printRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600 mb-4">The print request you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600 mt-1">Complete your payment to process the print request</p>
        </div>

        {paymentStep === 'success' ? (
          /* Success State */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-8">
                Your print request has been submitted and queued for processing.
              </p>

              {/* Unique ID Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Unique Print ID
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  <code className="text-2xl font-mono bg-white px-4 py-2 rounded border text-blue-600">
                    {uniqueId}
                  </code>
                  <button
                    onClick={copyUniqueId}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Present this ID when collecting your printed documents
                </p>
              </div>

              {/* Print Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h4 className="font-semibold text-gray-900 mb-4">Print Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document:</span>
                    <span className="font-medium">{printRequest.documentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages:</span>
                    <span className="font-medium">{printRequest.documentPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Copies:</span>
                    <span className="font-medium">{printRequest.copies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Print Type:</span>
                    <span className="font-medium capitalize">{printRequest.printType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Page Size:</span>
                    <span className="font-medium">{printRequest.pageSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold text-blue-600">₹{printRequest.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-yellow-800 mb-1">What's Next?</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Your document will be processed within 15-30 minutes</li>
                      <li>• You'll receive email and SMS notifications when ready</li>
                      <li>• Visit the print center with your unique ID to collect</li>
                      <li>• Check your dashboard for real-time status updates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/history')}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Print History
                </button>
              </div>
            </div>
          </div>
        ) : paymentStep === 'failed' ? (
          /* Failed State */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Payment Failed
              </h2>
              <p className="text-gray-600 mb-8">
                We couldn't process your payment. Please try again or use a different payment method.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setPaymentStep('select')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel and Go Back
                </button>
              </div>
            </div>
          </div>
        ) : paymentStep === 'processing' ? (
          /* Processing State */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {!razorpayLoaded ? 'Loading Payment System...' : 'Processing Payment...'}
              </h2>
              <p className="text-gray-600">
                {!razorpayLoaded 
                  ? 'Please wait while we load the payment system.'
                  : 'Please complete the payment in the popup window. Do not refresh this page.'
                }
              </p>
            </div>
          </div>
        ) : (
          /* Payment Selection State */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Choose Payment Method
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Secure payment powered by Razorpay
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* UPI Payment */}
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setSelectedMethod('upi')}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={selectedMethod === 'upi'}
                        onChange={() => setSelectedMethod('upi')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center">
                        <Smartphone className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">UPI Payment</p>
                          <p className="text-sm text-gray-600">Pay using any UPI app (GPay, PhonePe, Paytm)</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Credit/Debit Card */}
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setSelectedMethod('card')}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={selectedMethod === 'card'}
                        onChange={() => setSelectedMethod('card')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center">
                        <CreditCard className="h-6 w-6 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Credit/Debit Card</p>
                          <p className="text-sm text-gray-600">Visa, Mastercard, RuPay accepted</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Net Banking */}
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === 'netbanking' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setSelectedMethod('netbanking')}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="netbanking"
                        checked={selectedMethod === 'netbanking'}
                        onChange={() => setSelectedMethod('netbanking')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center">
                        <Building className="h-6 w-6 text-purple-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Net Banking</p>
                          <p className="text-sm text-gray-600">All major banks supported</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200">
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading || !razorpayLoaded}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {paymentLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : !razorpayLoaded ? (
                      'Loading Payment System...'
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Pay ₹{printRequest.totalCost}
                      </>
                    )}
                  </button>
                  {!razorpayLoaded && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Connecting to secure payment gateway...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow-lg sticky top-4">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Document Info */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {printRequest.documentName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {printRequest.documentPages} pages
                      </p>
                    </div>
                  </div>

                  {/* Print Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Copies:</span>
                      <span className="font-medium">{printRequest.copies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Print Type:</span>
                      <span className="font-medium capitalize">{printRequest.printType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Page Size:</span>
                      <span className="font-medium">{printRequest.pageSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orientation:</span>
                      <span className="font-medium capitalize">{printRequest.orientation}</span>
                    </div>
                  </div>

                  <hr />

                  {/* Cost Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total pages to print:</span>
                      <span className="font-medium">{printRequest.documentPages * printRequest.copies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per page:</span>
                      <span className="font-medium">₹{printRequest.printType === 'color' ? '5' : '1'}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-blue-600">₹{printRequest.totalCost}</span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-6">
                    <div className="flex items-start">
                      <Lock className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-xs text-green-800">
                        Your payment is secured with industry-standard encryption. We don't store your payment information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;