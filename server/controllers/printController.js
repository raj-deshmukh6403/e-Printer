// controllers/printController.js - FIXED to return actual server filename
const PrintRequest = require('../models/PrintRequest');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { getPDFPageCount } = require('../services/pdfService');
const { createPaymentOrder } = require('../services/paymentService');
const { createNotification } = require('../services/notificationService');
const { deleteLocalFile } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// @desc    Upload document to LOCAL STORAGE ONLY
// @route   POST /api/print/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
  let localFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a document'
      });
    }

    localFilePath = req.file.path;
    
    // IMPORTANT: Get the actual server filename from multer
    const serverFilename = req.file.filename; // This is the actual filename on disk
    const originalFilename = req.file.originalname;
    
    console.log('=== UPLOAD SUCCESS ===');
    console.log('Original filename:', originalFilename);
    console.log('Server filename:', serverFilename);
    console.log('Local file path:', localFilePath);
    console.log('File size:', req.file.size);

    // Get settings for validation
    const settings = await Settings.findOne() || {
      maxFileSize: 50,
      supportedFormats: ['pdf', 'doc', 'docx']
    };

    // Check file size (convert to MB)
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (fileSizeMB > settings.maxFileSize) {
      // Clean up local file
      deleteLocalFile(localFilePath);
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum allowed: ${settings.maxFileSize}MB`
      });
    }

    // Check file format
    const fileExtension = originalFilename.split('.').pop().toLowerCase();
    if (!settings.supportedFormats.includes(fileExtension)) {
      // Clean up local file
      deleteLocalFile(localFilePath);
      return res.status(400).json({
        success: false,
        message: `Unsupported file format. Supported formats: ${settings.supportedFormats.join(', ')}`
      });
    }

    // Get page count (only for PDF files for now)
    let pageCount = 1;
    if (fileExtension === 'pdf') {
      try {
        // Read file from local storage for page count
        const fileBuffer = fs.readFileSync(localFilePath);
        pageCount = await getPDFPageCount(fileBuffer);
        console.log('PDF page count:', pageCount);
      } catch (error) {
        console.error('Error getting PDF page count:', error);
        // Default to 1 if we can't determine page count
      }
    }

    // FIXED: Return response with ACTUAL server filename for preview
    const responseData = {
      success: true,
      data: {
        // Essential: Include the actual server filename for preview URLs
        actualFileName: serverFilename,        // NEW: The real filename on disk
        serverFileName: serverFilename,        // NEW: Alternative name for same thing
        savedAs: serverFilename,              // NEW: Another alternative name
        
        // Keep existing fields
        localFilePath: localFilePath,         // For internal processing
        fileName: originalFilename,           // Display name
        documentName: originalFilename,       // Display name (alternative)
        documentSize: req.file.size,
        pageCount,
        fileExtension,
        
        // Preview URL using the actual server filename
        previewUrl: `/api/files/preview/${encodeURIComponent(serverFilename)}`,
        
        // Metadata
        uploadedAt: new Date().toISOString(),
        userId: req.user.id
      },
      message: 'Document uploaded to local storage successfully'
    };

    console.log('=== UPLOAD RESPONSE ===');
    console.log('Response data:', JSON.stringify(responseData.data, null, 2));

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up local file in case of error
    if (localFilePath) {
      deleteLocalFile(localFilePath);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

// @desc    Delete uploaded document from local storage
// @route   DELETE /api/print/upload/:filename
// @access  Private
exports.deleteUploadedDocument = async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, '../uploads');
    
    console.log('=== DELETE REQUEST ===');
    console.log('Requested filename:', filename);
    console.log('User ID:', req.user.id);
    
    // ENHANCED: Better file finding for deletion
    let filePath = null;
    
    // Strategy 1: Direct path
    const directPath = path.join(uploadsDir, filename);
    if (fs.existsSync(directPath)) {
      filePath = directPath;
      console.log('Found file directly:', filePath);
    } else {
      // Strategy 2: Search for file with user prefix
      try {
        const files = fs.readdirSync(uploadsDir);
        const userFiles = files.filter(file => file.startsWith(`${req.user.id}_`));
        
        console.log('User files found:', userFiles);
        
        const matchingFile = userFiles.find(file => {
          return file === filename || 
                 file.endsWith(filename) || 
                 file.includes(filename) ||
                 filename.includes(file.replace(/^\w+_\d+(-\d+)?_/, ''));
        });
        
        if (matchingFile) {
          filePath = path.join(uploadsDir, matchingFile);
          console.log('Found matching file:', filePath);
        }
      } catch (dirError) {
        console.error('Error reading directory:', dirError);
      }
    }

    if (!filePath) {
      console.log('File not found for deletion:', filename);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Additional security check: ensure the file belongs to the current user
    const actualFilename = path.basename(filePath);
    if (!actualFilename.startsWith(`${req.user.id}_`)) {
      console.log('Unauthorized delete attempt:', actualFilename, 'by user:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this file'
      });
    }

    // Delete the file
    deleteLocalFile(filePath);
    console.log('File deleted successfully:', filePath);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      deletedFile: actualFilename
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// @desc    Preview uploaded document (serve file)
// @route   GET /api/print/preview/:filename
// @access  Private  
exports.previewDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    
    console.log('=== DOCUMENT PREVIEW REQUEST ===');
    console.log('Requested filename:', filename);
    console.log('User ID:', userId);
    
    // Security: Only allow PDF files for preview
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files can be previewed'
      });
    }
    
    const uploadsDir = path.join(__dirname, '../uploads');
    let filePath = null;
    
    // Enhanced file finding logic (same as in files.js)
    const findFile = () => {
      // Strategy 1: Direct filename match
      const directPath = path.join(uploadsDir, filename);
      if (fs.existsSync(directPath)) {
        console.log('Found direct match:', directPath);
        return directPath;
      }
      
      // Strategy 2: Search in directory
      try {
        const files = fs.readdirSync(uploadsDir);
        console.log('Available files:', files);
        
        // Look for files that contain the requested filename
        const matchingFile = files.find(file => {
          const matches = 
            file === filename ||
            file.endsWith(filename) ||
            file.includes(filename) ||
            filename.includes(file.replace(/^\w+_\d+(-\d+)?_/, ''));
          
          if (matches) {
            console.log(`Match found: ${file} matches ${filename}`);
            // Additional security: ensure it belongs to the requesting user
            if (file.startsWith(`${userId}_`)) {
              return true;
            } else {
              console.log('File found but belongs to different user');
              return false;
            }
          }
          
          return false;
        });
        
        if (matchingFile) {
          const foundPath = path.join(uploadsDir, matchingFile);
          console.log('Found matching file:', foundPath);
          return foundPath;
        }
      } catch (dirError) {
        console.error('Error reading uploads directory:', dirError);
      }
      
      return null;
    };
    
    filePath = findFile();
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('File not found for preview:', filename);
      return res.status(404).json({
        success: false,
        message: 'File not found',
        details: 'The requested PDF file could not be located'
      });
    }
    
    console.log('Serving preview from:', filePath);
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set headers for PDF preview
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
    res.setHeader('Cache-Control', 'private, no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming preview:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error reading file'
        });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file preview',
      error: error.message
    });
  }
};

// @desc    Create print request (without uploading to Cloudinary yet)
// @route   POST /api/print/request
// @access  Private
exports.createPrintRequest = async (req, res) => {
  try {
    const {
      localFilePath,
      serverFileName, // This is the actual filename on disk
      documentName,
      documentSize,
      documentPages,
      copies = 1,
      pagesToPrint = 'all',
      pageSize = 'A4',
      orientation = 'auto',
      printType = 'black',
      deleteAfterPrint = true,
      uniqueId // Add this field
    } = req.body;

    console.log('=== CREATE PRINT REQUEST DEBUG ===');
    console.log('localFilePath:', localFilePath);
    console.log('serverFileName:', serverFileName);
    console.log('documentName:', documentName);

    // Validation
    if (!localFilePath || !documentName || !documentPages) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: localFilePath, documentName, documentPages'
      });
    }

    // Verify the local file exists and belongs to user
    if (!fs.existsSync(localFilePath)) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file not found. Please upload again.'
      });
    }

    const filename = path.basename(localFilePath);
    if (!filename.startsWith(`${req.user.id}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to file'
      });
    }

    // Get settings for pricing
    const settings = await Settings.findOne() || {
      blackPrintCost: 1,
      colorPrintCost: 5
    };

    // Calculate total pages to print
    let totalPages = documentPages;
    if (pagesToPrint !== 'all' && pagesToPrint) {
      totalPages = calculatePagesFromRange(pagesToPrint, documentPages);
    }

    if (totalPages <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page range specified'
      });
    }

    // Calculate total cost
    const costPerPage = printType === 'color' ? settings.colorPrintCost : settings.blackPrintCost;
    const totalCost = totalPages * copies * costPerPage;

    // Get next queue number
    const lastRequest = await PrintRequest.findOne().sort({ queueNumber: -1 });
    const queueNumber = lastRequest ? lastRequest.queueNumber + 1 : 1;

    // FIXED: Create print request with proper field mapping
    const printRequest = await PrintRequest.create({
      userId: req.user.id,
      queueNumber,
      uniqueId: uniqueId || `PRT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      documentName,
      localFilePath,
      
      // IMPORTANT FIX: Set documentUrl to null initially (will be set after payment)
      documentUrl: null, // This will be set after Cloudinary upload
      
      documentPages,
      documentSize,
      copies,
      pagesToPrint,
      pageSize,
      orientation,
      printType,
      totalCost,
      costPerPage,
      totalPages,
      deleteAfterPrint,
      publicId: null, // Will be set after Cloudinary upload
      status: 'payment_pending', // Start with payment pending
      uploadedToCloudinary: false, // Initially false
      deletedFromLocal: false // Initially false
    });

    console.log('=== PRINT REQUEST CREATED ===');
    console.log('Print request ID:', printRequest._id);
    console.log('Document URL (should be null):', printRequest.documentUrl);
    console.log('Local file path:', printRequest.localFilePath);

    // Create payment order
    let paymentOrder = null;
    try {
      paymentOrder = await createPaymentOrder({
        amount: totalCost * 100,
        currency: 'INR',
        receipt: `print_${printRequest._id}`,
        notes: {
          printRequestId: printRequest._id.toString(),
          userId: req.user.id.toString()
        }
      });

      printRequest.razorpayOrderId = paymentOrder.id;
      await printRequest.save();
    } catch (paymentError) {
      console.error('Payment order creation failed:', paymentError);
    }

    // Create notification
    try {
      await createNotification({
        userId: req.user.id,
        printRequestId: printRequest._id,
        type: 'request_received',
        title: 'Print Request Created',
        message: `Your print request for "${documentName}" has been created. Please complete the payment.`
      });
    } catch (notificationError) {
      console.error('Notification creation failed:', notificationError);
    }

    console.log('=== BACKEND RESPONSE DEBUG ===');
    console.log('Created print request ID:', printRequest._id);
    
    const responseData = {
      success: true,
      data: {
        printRequest: {
          _id: printRequest._id.toString(),
          id: printRequest._id.toString(),
          uniqueId: printRequest.uniqueId,
          queueNumber: printRequest.queueNumber,
          documentName: printRequest.documentName,
          status: printRequest.status,
          totalCost: printRequest.totalCost,
          createdAt: printRequest.createdAt,
          documentUrl: printRequest.documentUrl, // Should be null initially
          localFilePath: printRequest.localFilePath
        },
        order: paymentOrder ? {
          id: paymentOrder.id,
          receipt: paymentOrder.receipt,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency
        } : null
      },
      _id: printRequest._id.toString(),
      id: printRequest._id.toString(),
      message: 'Print request created successfully'
    };
    
    console.log('=== RESPONSE DOCUMENTURL CHECK ===');
    console.log('Response documentUrl:', responseData.data.printRequest.documentUrl);
    
    res.status(201).json(responseData);

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating print request',
      error: error.message
    });
  }
};

// @desc    Upload to Cloudinary after successful payment - FIXED VERSION
// @route   POST /api/print/upload-to-cloudinary/:requestId
// @access  Private (called by payment webhook or after payment confirmation)
exports.uploadToCloudinaryAfterPayment = async (req, res) => {
  try {
    const { requestId } = req.params;

    console.log('=== CLOUDINARY UPLOAD AFTER PAYMENT ===');
    console.log('Request ID:', requestId);
    console.log('User ID:', req.user.id);

    // Find the print request
    const printRequest = await PrintRequest.findOne({
      _id: requestId,
      userId: req.user.id
    });

    if (!printRequest) {
      console.log('Print request not found');
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    console.log('Print request found:', {
      id: printRequest._id,
      status: printRequest.status,
      paymentStatus: printRequest.paymentStatus,
      uploadedToCloudinary: printRequest.uploadedToCloudinary,
      documentUrl: printRequest.documentUrl,
      publicId: printRequest.publicId
    });

    // Check if payment is completed
    if (printRequest.paymentStatus !== 'completed') {
      console.log('Payment not completed, status:', printRequest.paymentStatus);
      return res.status(400).json({
        success: false,
        message: 'Payment not completed. Cannot upload to Cloudinary.',
        paymentStatus: printRequest.paymentStatus
      });
    }

    // Check if already uploaded to Cloudinary
    if (printRequest.uploadedToCloudinary && printRequest.documentUrl && printRequest.publicId) {
      console.log('File already uploaded to Cloudinary');
      return res.status(200).json({
        success: true,
        message: 'File already uploaded to Cloudinary',
        data: {
          documentUrl: printRequest.documentUrl,
          publicId: printRequest.publicId,
          uploadedToCloudinary: printRequest.uploadedToCloudinary
        }
      });
    }

    const localFilePath = printRequest.localFilePath;
    console.log('Local file path:', localFilePath);

    // Verify local file exists
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.log('Local file not found:', localFilePath);
      return res.status(400).json({
        success: false,
        message: 'Local file not found. Cannot upload to Cloudinary.',
        localFilePath: localFilePath
      });
    }

    console.log('Starting Cloudinary upload...');
    
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(localFilePath, {
      folder: 'print-requests',
      resource_type: 'raw',
      public_id: `${req.user.id}_${Date.now()}_${path.parse(printRequest.documentName).name}`
    });

    console.log('Cloudinary upload successful:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      bytes: uploadResult.bytes
    });

    // FIXED: Properly update the print request with Cloudinary details
    const updateResult = await PrintRequest.findByIdAndUpdate(
      printRequest._id,
      {
        $set: {
          documentUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          uploadedToCloudinary: true,
          status: 'in_queue', // Move to queue after successful upload
          updatedAt: new Date()
        }
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    if (!updateResult) {
      console.error('Failed to update print request in database');
      return res.status(500).json({
        success: false,
        message: 'Failed to update print request with Cloudinary details'
      });
    }

    console.log('Database updated successfully:', {
      id: updateResult._id,
      documentUrl: updateResult.documentUrl,
      publicId: updateResult.publicId,
      uploadedToCloudinary: updateResult.uploadedToCloudinary,
      status: updateResult.status
    });

    // Delete local file after successful Cloudinary upload and DB update
    const deleteSuccess = deleteLocalFile(localFilePath);
    if (deleteSuccess) {
      // Update the deletedFromLocal flag
      await PrintRequest.findByIdAndUpdate(
        printRequest._id,
        { $set: { deletedFromLocal: true } }
      );
      console.log(`Deleted local file after Cloudinary upload: ${localFilePath}`);
    } else {
      console.log(`Failed to delete local file: ${localFilePath}`);
    }

    // Create success notification
    try {
      await createNotification({
        userId: req.user.id,
        printRequestId: printRequest._id,
        type: 'in_queue',
        title: 'Print Request In Queue',
        message: `Your print request for "${printRequest.documentName}" has been added to the printing queue.`
      });
    } catch (notificationError) {
      console.error('Notification creation failed:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: {
        documentUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploadedToCloudinary: true,
        deletedFromLocal: deleteSuccess,
        status: 'in_queue'
      },
      message: 'File uploaded to Cloudinary successfully and database updated'
    });

  } catch (error) {
    console.error('Cloudinary upload after payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading to Cloudinary',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? error.stack : undefined
    });
  }
};


// @desc    Alternative method to trigger Cloudinary upload (can be called by payment webhook)
// @route   POST /api/print/process-after-payment
// @access  Private
exports.processAfterPayment = async (req, res) => {
  try {
    const { requestId, paymentId, razorpayOrderId, razorpaySignature } = req.body;

    console.log('=== PROCESS AFTER PAYMENT WEBHOOK ===');
    console.log('Request ID:', requestId);
    console.log('Payment ID:', paymentId);

    // Find and update the print request with payment details
    const printRequest = await PrintRequest.findById(requestId);
    
    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    // Update payment details
    printRequest.paymentStatus = 'completed';
    printRequest.paymentId = paymentId;
    printRequest.razorpayPaymentId = paymentId;
    printRequest.razorpaySignature = razorpaySignature;
    printRequest.paymentCompletedAt = new Date();
    printRequest.status = 'paid';
    
    await printRequest.save();

    console.log('Payment details updated, starting Cloudinary upload...');

    // Now upload to Cloudinary
    const localFilePath = printRequest.localFilePath;

    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.log('Local file not found for Cloudinary upload');
      return res.status(400).json({
        success: false,
        message: 'Local file not found for Cloudinary upload'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(localFilePath, {
      folder: 'print-requests',
      resource_type: 'raw',
      public_id: `${printRequest.userId}_${Date.now()}_${path.parse(printRequest.documentName).name}`
    });

    // Update with Cloudinary details
    await PrintRequest.findByIdAndUpdate(
      printRequest._id,
      {
        $set: {
          documentUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          uploadedToCloudinary: true,
          status: 'in_queue',
          updatedAt: new Date()
        }
      }
    );

    // Delete local file
    const deleteSuccess = deleteLocalFile(localFilePath);
    if (deleteSuccess) {
      await PrintRequest.findByIdAndUpdate(
        printRequest._id,
        { $set: { deletedFromLocal: true } }
      );
    }

    console.log('Payment processing and Cloudinary upload completed successfully');

    res.status(200).json({
      success: true,
      message: 'Payment processed and file uploaded to Cloudinary successfully',
      data: {
        printRequestId: printRequest._id,
        documentUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        status: 'in_queue'
      }
    });

  } catch (error) {
    console.error('Process after payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment and uploading to Cloudinary',
      error: error.message
    });
  }
};  


// @desc    Serve local file preview (temporary)
// @route   GET /api/print/preview/:filename
// @access  Private
exports.serveLocalFilePreview = async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);

    // Security check: ensure the file belongs to the current user
    if (!filename.startsWith(`${req.user.id}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this file'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (ext === '.doc') {
      res.setHeader('Content-Type', 'application/msword');
    } else if (ext === '.docx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Serve file preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file preview',
      error: error.message
    });
  }
};

// @desc    Get user's print requests
// @route   GET /api/print/requests
// @access  Private
exports.getUserPrintRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const printRequests = await PrintRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email category');

    const total = await PrintRequest.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      count: printRequests.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: printRequests,
      printRequests: printRequests
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching print requests',
      error: error.message
    });
  }
};

// @desc    Get single print request
// @route   GET /api/print/requests/:id
// @access  Private
exports.getPrintRequest = async (req, res) => {
  try {
    const printRequest = await PrintRequest.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('userId', 'username email category whatsappNumber');

    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: printRequest
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching print request',
      error: error.message
    });
  }
};

// @desc    Cancel print request
// @route   PUT /api/print/requests/:id/cancel
// @access  Private
exports.cancelPrintRequest = async (req, res) => {
  try {
    const printRequest = await PrintRequest.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    // Can only cancel if in queue or pending
    if (!['pending', 'in_queue'].includes(printRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel request that is already being processed'
      });
    }

    printRequest.status = 'cancelled';
    printRequest.cancelledAt = new Date();
    await printRequest.save();

    // Delete from Cloudinary if uploaded
    if (printRequest.publicId && printRequest.deleteAfterPrint) {
      try {
        await deleteFromCloudinary(printRequest.publicId);
        console.log(`Deleted Cloudinary file: ${printRequest.publicId}`);
      } catch (deleteError) {
        console.error('Error deleting from Cloudinary:', deleteError);
      }
    }

    // Delete local file if still exists
    if (printRequest.localFilePath && fs.existsSync(printRequest.localFilePath)) {
      deleteLocalFile(printRequest.localFilePath);
      console.log(`Deleted local file: ${printRequest.localFilePath}`);
    }

    // Create notification
    try {
      await createNotification({
        userId: req.user.id,
        printRequestId: printRequest._id,
        type: 'cancelled',
        title: 'Print Request Cancelled',
        message: `Your print request for "${printRequest.documentName}" has been cancelled.`
      });
    } catch (notificationError) {
      console.error('Notification creation failed:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: printRequest,
      message: 'Print request cancelled successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling print request',
      error: error.message
    });
  }
};

// Helper function to calculate pages from range
function calculatePagesFromRange(pageRange, totalPages) {
  let count = 0;
  const ranges = pageRange.split(',');
  
  ranges.forEach(range => {
    range = range.trim();
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(num => parseInt(num.trim()));
      if (start <= totalPages && end <= totalPages && start <= end && start > 0) {
        count += (end - start + 1);
      }
    } else {
      const page = parseInt(range);
      if (page <= totalPages && page > 0) {
        count += 1;
      }
    }
  });
  
  return count;
}

// @desc    Generate and download invoice for print request
// @route   GET /api/print/invoice/:id
// @access  Private
exports.downloadInvoice = async (req, res) => {
  try {
    const printRequest = await PrintRequest.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('userId', 'username email category');

    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${printRequest.uniqueId}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('E-PRINTER INVOICE', 50, 50, { align: 'center' });
    doc.fontSize(12).text('Digital Printing Service', 50, 80, { align: 'center' });
    
    // Divider line
    doc.moveTo(50, 110).lineTo(550, 110).stroke();
    
    // Invoice details
    doc.fontSize(14).text('Invoice Details', 50, 130);
    doc.fontSize(11);
    doc.text(`Invoice ID: ${printRequest.uniqueId}`, 50, 155);
    doc.text(`Queue Number: #${printRequest.queueNumber}`, 50, 175);
    doc.text(`Date: ${new Date(printRequest.createdAt).toLocaleDateString('en-IN')}`, 50, 195);
    doc.text(`Status: ${printRequest.status.charAt(0).toUpperCase() + printRequest.status.slice(1)}`, 50, 215);
    
    // Customer details
    doc.fontSize(14).text('Customer Details', 300, 130);
    doc.fontSize(11);
    doc.text(`Name: ${printRequest.userId.username}`, 300, 155);
    doc.text(`Email: ${printRequest.userId.email}`, 300, 175);
    doc.text(`Category: ${printRequest.userId.category}`, 300, 195);
    
    // Document details section
    doc.fontSize(14).text('Document Details', 50, 250);
    doc.fontSize(11);
    doc.text(`Document: ${printRequest.documentName}`, 50, 275);
    doc.text(`Pages: ${printRequest.documentPages}`, 50, 295);
    doc.text(`Copies: ${printRequest.copies}`, 50, 315);
    doc.text(`Page Size: ${printRequest.pageSize}`, 50, 335);
    doc.text(`Orientation: ${printRequest.orientation}`, 50, 355);
    doc.text(`Print Type: ${printRequest.printType}`, 50, 375);
    doc.text(`Pages to Print: ${printRequest.pagesToPrint}`, 50, 395);
    
    // Cost breakdown table
    doc.fontSize(14).text('Cost Breakdown', 50, 430);
    
    // Table header
    const tableTop = 460;
    doc.fontSize(11);
    doc.text('Description', 50, tableTop, { width: 200 });
    doc.text('Quantity', 280, tableTop, { width: 80, align: 'center' });
    doc.text('Rate', 380, tableTop, { width: 80, align: 'center' });
    doc.text('Amount', 480, tableTop, { width: 80, align: 'right' });
    
    // Table line
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
    
    // Calculate values
    const totalPages = printRequest.pagesToPrint === 'all' ? 
      printRequest.documentPages : 
      calculatePagesFromRange(printRequest.pagesToPrint, printRequest.documentPages);
    
    const totalItems = totalPages * printRequest.copies;
    const ratePerPage = printRequest.totalCost / totalItems;
    
    // Table content
    const itemY = tableTop + 35;
    doc.text(`${printRequest.printType} printing`, 50, itemY, { width: 200 });
    doc.text(totalItems.toString(), 280, itemY, { width: 80, align: 'center' });
    doc.text(`₹${ratePerPage.toFixed(2)}`, 380, itemY, { width: 80, align: 'center' });
    doc.text(`₹${printRequest.totalCost.toFixed(2)}`, 480, itemY, { width: 80, align: 'right' });
    
    // Total line
    doc.moveTo(50, itemY + 25).lineTo(550, itemY + 25).stroke();
    
    // Total
    doc.fontSize(12).text('Total Amount:', 380, itemY + 40, { width: 100, align: 'right' });
    doc.fontSize(14).text(`₹${printRequest.totalCost.toFixed(2)}`, 480, itemY + 40, { width: 80, align: 'right' });
    
    // Payment status
    doc.fontSize(11);
    const paymentStatusY = itemY + 70;
    doc.text('Payment Status:', 50, paymentStatusY);
    const paymentStatusColor = printRequest.paymentStatus === 'completed' ? 'green' : 'red';
    doc.fillColor(paymentStatusColor)
       .text(printRequest.paymentStatus.toUpperCase(), 150, paymentStatusY)
       .fillColor('black');
    
    if (printRequest.paymentId) {
      doc.text(`Payment ID: ${printRequest.paymentId}`, 50, paymentStatusY + 20);
    }
    
    if (printRequest.razorpayOrderId) {
      doc.text(`Order ID: ${printRequest.razorpayOrderId}`, 50, paymentStatusY + 40);
    }
    
    // Footer
    doc.fontSize(10);
    const footerY = 700;
    doc.text('Thank you for using E-Printer!', 50, footerY, { align: 'center' });
    doc.text('For support, contact us at support@eprinter.com', 50, footerY + 15, { align: 'center' });
    
    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
};

module.exports = exports;