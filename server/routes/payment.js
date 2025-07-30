// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Create payment order
router.post('/create-order', auth, paymentController.createOrder);

// Verify payment
router.post('/verify', auth, paymentController.verifyPayment);

// Get payment history
router.get('/history', auth, paymentController.getPaymentHistory);

// Refund payment
router.post('/refund', auth, paymentController.refundPayment);

module.exports = router;