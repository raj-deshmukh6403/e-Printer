// services/paymentService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create payment order
exports.createPaymentOrder = async (options) => {
  try {
    const { amount, currency = 'INR', receipt } = options;

    // Amount should be in paise (multiply by 100)
    const orderOptions = {
      amount: amount * 100,
      currency,
      receipt,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(orderOptions);
    console.log('Payment order created:', order.id);
    return order;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// @desc    Verify payment signature
exports.verifyPaymentSignature = (paymentData) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    // Create expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;
    
    console.log('Payment signature verification:', isAuthentic ? 'SUCCESS' : 'FAILED');
    return isAuthentic;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

// @desc    Get payment details
exports.getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

// @desc    Capture payment
exports.capturePayment = async (paymentId, amount) => {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount * 100);
    console.log('Payment captured:', payment.id);
    return payment;
  } catch (error) {
    console.error('Error capturing payment:', error);
    throw error;
  }
};

// @desc    Create refund
exports.createRefund = async (paymentId, amount = null) => {
  try {
    const refundOptions = {
      payment_id: paymentId
    };

    if (amount) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    console.log('Refund created:', refund.id);
    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
};

// @desc    Get refund details
exports.getRefundDetails = async (paymentId, refundId) => {
  try {
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
    return refund;
  } catch (error) {
    console.error('Error fetching refund details:', error);
    throw error;
  }
};