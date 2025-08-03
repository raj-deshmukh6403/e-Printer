// controllers/contactController.js
const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendEmail } = require('../services/emailService');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, category, subject, message } = req.body;

    // Create contact submission
    const contactSubmission = await Contact.create({
      name,
      email,
      category,
      subject,
      message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Subject mapping for emails
    const subjectMap = {
      'technical-support': 'Technical Support',
      'payment-issue': 'Payment Issue',
      'document-problem': 'Document Problem',
      'feature-request': 'Feature Request',
      'general-inquiry': 'General Inquiry',
      'other': 'Other'
    };

    const emailSubject = `E-Printer Contact Form: ${subjectMap[subject]} - #${contactSubmission._id}`;
    
    // Email to admin/support team
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Contact ID:</strong> #${contactSubmission._id}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Subject:</strong> ${subjectMap[subject]}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #374151; margin-top: 0;">Message:</h3>
          <p style="line-height: 1.6; color: #4b5563;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Note:</strong> Please respond within 24 hours during business hours.
          </p>
        </div>
      </div>
    `;

    // Confirmation email to user
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Thank you for contacting E-Printer Support</h2>
        
        <p>Hi ${name},</p>
        
        <p>We've received your message and will respond as soon as possible. Here's a copy of your submission:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Reference ID:</strong> #${contactSubmission._id}</p>
          <p><strong>Subject:</strong> ${subjectMap[subject]}</p>
          <p><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <p>Our support team typically responds within 24 hours during business hours (Mon-Fri, 8:00 AM - 8:00 PM).</p>
        
        <div style="margin-top: 30px; padding: 20px; background: #dbeafe; border-radius: 8px;">
          <h3 style="color: #1e40af; margin-top: 0;">Need immediate help?</h3>
          <p style="margin-bottom: 0;">For urgent issues, you can:</p>
          <ul>
            <li>Call our emergency line: ${process.env.EMERGENCY_PHONE || '+919876543210'}</li>
            <li>Email: ${process.env.EMERGENCY_EMAIL || 'support@eprinter.com'}</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          E-Printer Support Team
        </p>
      </div>
    `;

    // Send emails
    try {
      // Send user's message FROM user's email TO admin/support email
      // This requires updating the emailService to accept custom 'from' address
      await sendEmail({
        from: email, // User's email as sender
        email: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER, // Your email as recipient
        subject: emailSubject,
        html: adminEmailHtml,
        replyTo: email // So you can reply directly to user
      });

      // Send confirmation to user FROM your support email
      await sendEmail({
        email: email,
        subject: `E-Printer Support: We received your message (#${contactSubmission._id})`,
        html: userEmailHtml
      });

      console.log(`Contact form submitted and emails sent for ID: ${contactSubmission._id}`);
    } catch (emailError) {
      console.error('Failed to send emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        contactId: contactSubmission._id,
        timestamp: contactSubmission.createdAt
      }
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
};
// @desc    Get single contact submission
// @route   GET /api/contact/:id
// @access  Private/Admin
exports.getSingleContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Failed to fetch contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submission'
    });
  }
};

// @desc    Update contact status
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
exports.updateContactStatus = async (req, res) => {
  try {
    const { status, priority, adminNotes } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Update fields
    if (status) contact.status = status;
    if (priority) contact.priority = priority;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;

    // Set resolved date if status is resolved
    if (status === 'resolved' && !contact.resolvedAt) {
      contact.resolvedAt = new Date();
    }

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });
  } catch (error) {
    console.error('Failed to update contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status'
    });
  }
};

// @desc    Get contact form history for authenticated user
// @route   GET /api/contact/history
// @access  Private
exports.getContactHistory = async (req, res) => {
  try {
    // Get all contact submissions (for admin)
    // You can add pagination if needed
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get contacts with sorting (newest first)
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-userAgent -ipAddress'); // Exclude sensitive fields

    // Get total count for pagination
    const total = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch contact history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact history'
    });
  }
};