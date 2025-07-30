// controllers/paymentController.js - Updated to upload to Cloudinary after payment
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PrintRequest = require('../models/PrintRequest');
const Payment = require('../models/Payment');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const { createNotification } = require('../services/notificationService');
const { uploadToCloudinary } = require('../services/cloudinaryService'); // Add this import
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create payment order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    console.log('=== CREATE ORDER DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);
    
    const { printRequestId } = req.body;

    const printRequest = await PrintRequest.findOne({
      _id: printRequestId,
      userId: req.user.id
    });

    console.log('Print request found:', printRequest ? 'Yes' : 'No');
    console.log('Print request details:', {
      id: printRequest?._id,
      totalCost: printRequest?.totalCost,
      status: printRequest?.status
    });

    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    const options = {
      amount: printRequest.totalCost * 100, // Convert to paise
      currency: 'INR',
      receipt: `print_${printRequest._id}`,
      payment_capture: 1
    };

    console.log('Razorpay order options:', options);

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);

    // Update print request with order ID
    printRequest.razorpayOrderId = order.id;
    await printRequest.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('=== CREATE ORDER ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    console.log('=== VERIFY PAYMENT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user?.id);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      printRequestId,
      paymentMethod
    } = req.body;

    // Check if all required fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing required payment fields');
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('SIGNATURE VERIFICATION FAILED');
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed'
      });
    }

    console.log('Signature verification successful');

    // Find print request
    const printRequest = await PrintRequest.findOne({
      _id: printRequestId,
      userId: req.user.id
    }).populate('userId', 'username email whatsappNumber');

    if (!printRequest) {
      console.error('PRINT REQUEST NOT FOUND');
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    console.log('Print request found:', {
      id: printRequest._id,
      documentName: printRequest.documentName,
      localFilePath: printRequest.localFilePath,
      uploadedToCloudinary: printRequest.uploadedToCloudinary
    });

    // Update print request payment details first
    printRequest.paymentStatus = 'completed';
    printRequest.paymentMethod = paymentMethod;
    printRequest.paymentId = razorpay_payment_id;
    printRequest.status = 'paid'; // Set to paid first
    await printRequest.save();

    console.log('Print request payment details updated');

    // Create payment record
    const paymentRecord = await Payment.create({
      printRequestId: printRequest._id,
      userId: req.user.id,
      amount: printRequest.totalCost,
      paymentMethod,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'completed'
    });

    console.log('Payment record created:', paymentRecord._id);

    // **CRITICAL SECTION: Upload to Cloudinary after successful payment**
    if (!printRequest.uploadedToCloudinary && printRequest.localFilePath) {
      try {
        console.log('=== UPLOADING TO CLOUDINARY AFTER PAYMENT ===');
        console.log('Local file path:', printRequest.localFilePath);
        
        const localFilePath = printRequest.localFilePath;
        console.log('Full local path:', localFilePath);

        // Check if local file exists using fs.existsSync (synchronous check)
        if (!fs.existsSync(localFilePath)) {
          console.log('Local file not found:', localFilePath);
          throw new Error('Local file not found for Cloudinary upload');
        }

        console.log('Local file exists, proceeding with Cloudinary upload');
        console.log('Starting Cloudinary upload...');
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(localFilePath, {
          resource_type: 'raw', // Let Cloudinary auto-detect
          folder: 'print-requests',
          public_id: `print_${printRequest._id}_${Date.now()}`,
          invalidate: true, // Clear CDN cache
          overwrite: true   // Allow overwriting if same public_id
        });

        console.log('=== CLOUDINARY UPLOAD RESULT ===');
        console.log('Full upload result:', uploadResult);
        console.log('Public ID:', uploadResult.publicId);
        console.log('Secure URL:', uploadResult.url);
        console.log("Resource Type:", uploadResult.resource_type);
        console.log('Format:', uploadResult.format);
        console.log('Bytes:', uploadResult.bytes);

        // CRITICAL FIX: Extract the correct values from uploadResult
        const documentUrl = uploadResult.url;
        const publicId = uploadResult.publicId;

        console.log('=== EXTRACTED VALUES ===');
        console.log('Document URL to save:', documentUrl);
        console.log('Public ID to save:', publicId);

        if (!documentUrl || !publicId) {
          console.error('Missing Cloudinary URL or Public ID');
          console.error('Upload result:', uploadResult);
          throw new Error('Cloudinary upload failed - missing URL or public ID');
        }

        // CRITICAL FIX: Update the database with correct field names and values
        console.log('=== UPDATING DATABASE ===');
        console.log('Print request ID:', printRequest._id);
        
        const updateResult = await PrintRequest.findByIdAndUpdate(
          printRequest._id,
          {
            $set: {
              documentUrl: documentUrl,        // Make sure this field is set
              publicId: publicId,              // Make sure this field is set
              uploadedToCloudinary: true,
              status: 'in_queue',
              updatedAt: new Date()
            }
          },
          { 
            new: true,           // Return updated document
            runValidators: true  // Run schema validators
          }
        );

        console.log('=== DATABASE UPDATE RESULT ===');
        if (updateResult) {
          console.log('Database updated successfully');
          console.log('Updated documentUrl:', updateResult.documentUrl);
          console.log('Updated publicId:', updateResult.publicId);
          console.log('Updated uploadedToCloudinary:', updateResult.uploadedToCloudinary);
          console.log('Updated status:', updateResult.status);
        } else {
          console.error('Database update failed - no result returned');
          throw new Error('Failed to update print request in database');
        }

        // Verify the update worked by fetching the record again
        const verifyUpdate = await PrintRequest.findById(printRequest._id);
        console.log('=== VERIFICATION CHECK ===');
        console.log('Verified documentUrl:', verifyUpdate.documentUrl);
        console.log('Verified publicId:', verifyUpdate.publicId);
        console.log('Verified uploadedToCloudinary:', verifyUpdate.uploadedToCloudinary);

        if (!verifyUpdate.documentUrl || !verifyUpdate.publicId) {
          console.error('DATABASE UPDATE FAILED - Fields still missing');
          console.error('Current record:', {
            documentUrl: verifyUpdate.documentUrl,
            publicId: verifyUpdate.publicId,
            uploadedToCloudinary: verifyUpdate.uploadedToCloudinary
          });
          throw new Error('Database update verification failed');
        }

        // Delete local file after successful Cloudinary upload and DB update
        console.log('=== DELETING LOCAL FILE ===');
        try {
          await fsPromises.unlink(localFilePath);
          await PrintRequest.findByIdAndUpdate(
            printRequest._id,
            { $set: { deletedFromLocal: true } }
          );
          console.log(`Local file deleted after Cloudinary upload: ${localFilePath}`);
        } catch (deleteError) {
          console.log(`Failed to delete local file: ${localFilePath}`, deleteError);
          // Don't fail the entire process for file deletion error
        }

        console.log('Cloudinary upload and database update completed successfully');

      } catch (cloudinaryError) {
        console.error('=== CLOUDINARY UPLOAD ERROR ===');
        console.error('Error:', cloudinaryError);
        console.error('Error message:', cloudinaryError.message);
        
        // Don't fail the payment, but log the error and keep status as 'paid'
        console.log('Payment successful but Cloudinary upload failed. Document remains in local storage.');
        
        // Create a notification for failed upload
        try {
          await createNotification({
            userId: req.user.id,
            printRequestId: printRequest._id,
            type: 'upload_failed',
            title: 'Document Upload Pending',
            message: `Payment successful but document upload to cloud storage failed. Your request is still valid and will be processed.`
          });
        } catch (notificationError) {
          console.error('Failed to create upload failure notification:', notificationError);
        }
      }
    } else {
      console.log('Document already uploaded to Cloudinary or no local file path');
      // If already uploaded or no local path, just move to queue
      printRequest.status = 'in_queue';
      await printRequest.save();
    }

    // Send notifications (wrap in try-catch to prevent errors from stopping the flow)
    try {
      console.log('Sending email notification...');
      const emailTemplate = generatePaymentConfirmationEmail(printRequest);
      await sendEmail({
        email: printRequest.userId.email,
        subject: 'Payment Successful - E-Printer',
        html: emailTemplate
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    try {
      console.log('Sending SMS notification...');
      const smsMessage = `Payment successful! Your E-Printer request (ID: ${printRequest.uniqueId}) for "${printRequest.documentName}" has been confirmed. Total: ₹${printRequest.totalCost}`;
      await sendSMS({
        to: printRequest.userId.whatsappNumber,
        message: smsMessage
      });
      console.log('SMS sent successfully');
    } catch (smsError) {
      console.error('SMS sending failed:', smsError.message);
    }

    try {
      console.log('Creating notification...');
      await createNotification({
        userId: req.user.id,
        printRequestId: printRequest._id,
        type: 'payment_successful',
        title: 'Payment Successful',
        message: `Payment completed for "${printRequest.documentName}". Your request is now in queue.`
      });
      console.log('Notification created successfully');
    } catch (notificationError) {
      console.error('Notification creation failed:', notificationError.message);
    }

    console.log('=== PAYMENT VERIFICATION COMPLETED SUCCESSFULLY ===');
    
    // Get the final updated print request for response
    const finalPrintRequest = await PrintRequest.findById(printRequest._id);

    res.status(200).json({
      success: true,
      message: 'Payment verified and processed successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        printRequestId: printRequest._id,
        uniqueId: printRequest.uniqueId,
        status: finalPrintRequest.status,
        documentUrl: finalPrintRequest.documentUrl,    // Include in response
        publicId: finalPrintRequest.publicId           // Include in response
      }
    });

  } catch (error) {
    console.error('=== VERIFY PAYMENT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Update print request status to failed on error
    if (printRequest) {
      try {
        await PrintRequest.findByIdAndUpdate(
          printRequest._id,
          {
            $set: {
              status: 'failed',
              processingNotes: `Payment verification failed: ${error.message}`,
              updatedAt: new Date()
            }
          }
        );
      } catch (updateError) {
        console.error('Failed to update print request status to failed:', updateError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Rest of your existing methods remain the same...
exports.getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await PrintRequest.find({
      userId: req.user.id,
      paymentStatus: 'completed'
    })
      .select('documentName totalCost paidAt razorpayPaymentId status')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PrintRequest.countDocuments({
      userId: req.user.id,
      paymentStatus: 'completed'
    });

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: payments
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const { printRequestId, reason } = req.body;

    const printRequest = await PrintRequest.findOne({
      _id: printRequestId,
      userId: req.user.id
    });

    if (!printRequest) {
      return res.status(404).json({
        success: false,
        message: 'Print request not found'
      });
    }

    if (printRequest.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'No payment found to refund'
      });
    }

    if (printRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund completed print request'
      });
    }

    printRequest.paymentStatus = 'refunded';
    printRequest.status = 'cancelled';
    printRequest.refundReason = reason;
    printRequest.refundedAt = new Date();
    await printRequest.save();

    await createNotification({
      userId: req.user.id,
      printRequestId: printRequest._id,
      type: 'refund_processed',
      title: 'Refund Processed',
      message: `Refund has been processed for "${printRequest.documentName}".`
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: printRequest
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// Helper function to generate payment confirmation email
function generatePaymentConfirmationEmail(printRequest) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .payment-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .amount { font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Payment Confirmation</h1>
            </div>
            <div class="content">
                <p>Dear ${printRequest.userId.username},</p>
                <p>Your payment has been successfully processed!</p>
                
                <div class="payment-details">
                    <h3>Payment Details:</h3>
                    <p><strong>Document:</strong> ${printRequest.documentName}</p>
                    <p><strong>Unique ID:</strong> ${printRequest.uniqueId}</p>
                    <p><strong>Payment ID:</strong> ${printRequest.paymentId}</p>
                    <div class="amount">Amount Paid: ₹${printRequest.totalCost}</div>
                </div>
                
                <p>Your print request is now in the queue and will be processed shortly. You'll receive another notification when it's ready for collection.</p>
                
                <p>Thank you for using E-Printer!</p>
            </div>
        </div>
    </body>
    </html>
  `;
}