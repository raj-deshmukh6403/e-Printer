import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import PrintForm from '../components/dashboard/PrintForm';
import PaymentPage from '../components/dashboard/PaymentPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

const PrintPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [printData, setPrintData] = useState(null);
  const navigate = useNavigate();

  const handlePrintFormSubmit = (data) => {
    setPrintData(data);
    
    setCurrentStep(2);
  };

  const handlePaymentSuccess = (paymentData) => {
    // Handle successful payment
    console.log('Payment successful:', paymentData);
    navigate('/dashboard', { 
      state: { 
        message: 'Print request submitted successfully!',
        type: 'success' 
      }
    });
  };

  const handleGoBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`w-16 h-1 ${
                    currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex space-x-16">
                  <span className={`text-sm ${currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    Print Configuration
                  </span>
                  <span className={`text-sm ${currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    Payment
                  </span>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={handleGoBack}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                {currentStep === 1 ? 'Back to Dashboard' : 'Back to Configuration'}
              </button>
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <PrintForm onSubmit={handlePrintFormSubmit} />
            )}
            
            {currentStep === 2 && printData && (
              <PaymentPage 
                printData={printData} 
                onPaymentSuccess={handlePaymentSuccess}
                onGoBack={handleGoBack}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};


export default PrintPage;
