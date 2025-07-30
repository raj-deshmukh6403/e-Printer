// routes/print.js - Updated for local storage first approach
const express = require('express');
const router = express.Router();
const printController = require('../controllers/printController');
const { auth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// Upload document to LOCAL STORAGE ONLY (not Cloudinary)
router.post('/upload', auth, upload.single('document'), handleMulterError, printController.uploadDocument);

// Delete uploaded document from local storage (when user clicks X)
router.delete('/upload/:filename', auth, printController.deleteUploadedDocument);

// Serve local file preview (temporary)
router.get('/preview/:filename', auth, printController.previewDocument);

// Upload to Cloudinary after successful payment
router.post('/upload-to-cloudinary/:requestId', auth, printController.uploadToCloudinaryAfterPayment);

// IMPORTANT: Order matters - specific routes first, then general routes
// Get specific print request by ID (must come before general /request route)
router.get('/request/:id', auth, printController.getPrintRequest);

// Create print request with local file (separate endpoint)
router.post('/request', auth, printController.createPrintRequest);

// Get user's print requests list (for dashboard - singular route)
router.get('/request', auth, printController.getUserPrintRequests);

// Get user's print requests (plural for list - alternative route)
router.get('/requests', auth, printController.getUserPrintRequests);

// Get specific print request (plural version for consistency)
router.get('/requests/:id', auth, printController.getPrintRequest);

// Cancel print request
router.put('/requests/:id/cancel', auth, printController.cancelPrintRequest);

// Download invoice
router.get('/invoice/:id', auth, printController.downloadInvoice);

// Debug route to test if routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Print routes are working!' });
});

module.exports = router;