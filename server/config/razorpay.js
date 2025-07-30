const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Razorpay helper functions
const razorpayHelpers = {
  /**
   * Create a new payment order
   * @param {Object} orderData - Order details
   * @returns {Object} Razorpay order
   */
  createOrder: async (orderData) => {
    try {
      const options = {
        amount: orderData.amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `EPR_${Date.now()}_${orderData.userId}`,
        notes: {
          userId: orderData.userId,
          printRequestId: orderData.printRequestId,
          description: orderData.description || 'E-Printer Service Payment'
        }
      };

      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  },

  /**
   * Verify payment signature
   * @param {Object} paymentData - Payment verification data
   * @returns {boolean} Verification result
   */
  verifyPaymentSignature: (paymentData) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  },

  /**
   * Capture payment
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to capture in paise
   * @returns {Object} Capture response
   */
  capturePayment: async (paymentId, amount) => {
    try {
      const captureResponse = await razorpay.payments.capture(paymentId, amount * 100);
      return captureResponse;
    } catch (error) {
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  },

  /**
   * Get payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Object} Payment details
   */
  getPaymentDetails: async (paymentId) => {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  },

  /**
   * Get order details
   * @param {string} orderId - Razorpay order ID
   * @returns {Object} Order details
   */
  getOrderDetails: async (orderId) => {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      throw new Error(`Failed to fetch order details: ${error.message}`);
    }
  },

  /**
   * Create refund
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Refund amount (optional, full refund if not specified)
   * @param {Object} notes - Additional notes for refund
   * @returns {Object} Refund details
   */
  createRefund: async (paymentId, amount = null, notes = {}) => {
    try {
      const refundOptions = {
        notes: {
          reason: 'Print job cancelled',
          refund_date: new Date().toISOString(),
          ...notes
        }
      };

      if (amount) {
        refundOptions.amount = amount * 100; // Convert to paise
      }

      const refund = await razorpay.payments.refund(paymentId, refundOptions);
      return refund;
    } catch (error) {
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  },

  /**
   * Get refund details
   * @param {string} refundId - Razorpay refund ID
   * @returns {Object} Refund details
   */
  getRefundDetails: async (refundId) => {
    try {
      const refund = await razorpay.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      throw new Error(`Failed to fetch refund details: ${error.message}`);
    }
  },

  /**
   * Get all payments for an order
   * @param {string} orderId - Razorpay order ID
   * @returns {Array} List of payments
   */
  getOrderPayments: async (orderId) => {
    try {
      const payments = await razorpay.orders.fetchPayments(orderId);
      return payments.items;
    } catch (error) {
      throw new Error(`Failed to fetch order payments: ${error.message}`);
    }
  },

  /**
   * Verify webhook signature
   * @param {string} body - Webhook body
   * @param {string} signature - Razorpay signature from header
   * @returns {boolean} Verification result
   */
  verifyWebhookSignature: (body, signature) => {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  },

  /**
   * Generate payment link
   * @param {Object} linkData - Payment link details
   * @returns {Object} Payment link
   */
  createPaymentLink: async (linkData) => {
    try {
      const options = {
        amount: linkData.amount * 100,
        currency: 'INR',
        accept_partial: false,
        description: linkData.description || 'E-Printer Service Payment',
        customer: {
          name: linkData.customerName,
          email: linkData.customerEmail,
          contact: linkData.customerPhone
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        notes: {
          userId: linkData.userId,
          printRequestId: linkData.printRequestId
        },
        callback_url: `${process.env.FRONTEND_URL}/payment/success`,
        callback_method: 'get'
      };

      const paymentLink = await razorpay.paymentLink.create(options);
      return paymentLink;
    } catch (error) {
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  },

  /**
   * Get payment link details
   * @param {string} linkId - Payment link ID
   * @returns {Object} Payment link details
   */
  getPaymentLinkDetails: async (linkId) => {
    try {
      const paymentLink = await razorpay.paymentLink.fetch(linkId);
      return paymentLink;
    } catch (error) {
      throw new Error(`Failed to fetch payment link details: ${error.message}`);
    }
  },

  /**
   * Cancel payment link
   * @param {string} linkId - Payment link ID
   * @returns {Object} Cancellation response
   */
  cancelPaymentLink: async (linkId) => {
    try {
      const response = await razorpay.paymentLink.cancel(linkId);
      return response;
    } catch (error) {
      throw new Error(`Failed to cancel payment link: ${error.message}`);
    }
  },

  /**
   * Get settlement details
   * @param {Object} options - Query options
   * @returns {Object} Settlement details
   */
  getSettlements: async (options = {}) => {
    try {
      const settlements = await razorpay.settlements.all(options);
      return settlements;
    } catch (error) {
      throw new Error(`Failed to fetch settlements: ${error.message}`);
    }
  },

  /**
   * Format amount for display (convert paise to rupees)
   * @param {number} amountInPaise - Amount in paise
   * @returns {string} Formatted amount
   */
  formatAmount: (amountInPaise) => {
    const rupees = amountInPaise / 100;
    return `₹${rupees.toFixed(2)}`;
  },

  /**
   * Convert rupees to paise
   * @param {number} rupees - Amount in rupees
   * @returns {number} Amount in paise
   */
  convertToPaise: (rupees) => {
    return Math.round(rupees * 100);
  },

  /**
   * Convert paise to rupees
   * @param {number} paise - Amount in paise
   * @returns {number} Amount in rupees
   */
  convertToRupees: (paise) => {
    return paise / 100;
  }
};

// Test Razorpay connection
const testRazorpayConnection = async () => {
  try {
    // Try to fetch a non-existent order to test API connection
    await razorpay.orders.fetch('order_test_connection');
  } catch (error) {
    if (error.statusCode === 400 && error.error.code === 'BAD_REQUEST_ERROR') {
      // This is expected for a non-existent order ID
      console.log('Razorpay connection successful');
      return true;
    } else {
      console.error('Razorpay connection failed:', error.message);
      return false;
    }
  }
};

module.exports = {
  razorpay,
  razorpayHelpers,
  testRazorpayConnection
};