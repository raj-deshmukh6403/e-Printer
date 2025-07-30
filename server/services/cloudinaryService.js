// services/cloudinaryService.js - FIXED VERSION
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Additional debug
console.log('=== Cloudinary Service Debug ===');
console.log('Cloudinary imported:', !!cloudinary);
console.log('Cloudinary type:', typeof cloudinary);
console.log('Uploader available:', !!cloudinary?.uploader);
console.log('Upload method type:', typeof cloudinary?.uploader?.upload);

// Upload file from local path to Cloudinary
const uploadToCloudinary = async (localFilePath, options = {}) => {
  try {
    console.log('Starting Cloudinary upload...');
    console.log('File path:', localFilePath);
    
    // Check if cloudinary is properly loaded
    if (!cloudinary) {
      throw new Error('Cloudinary not imported properly');
    }
    
    if (!cloudinary.uploader) {
      throw new Error('Cloudinary uploader not available');
    }
    
    if (typeof cloudinary.uploader.upload !== 'function') {
      throw new Error('Cloudinary upload method not available');
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }

    const uploadOptions = {
      resource_type: 'auto', // Changed from 'raw' to 'auto' to match your working code
      folder: 'print-requests', // Changed from 'eprinter-documents' to match your working code
      ...options
    };

    console.log('Upload options:', uploadOptions);

    // Use the upload method
    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);
    
    console.log('Cloudinary upload successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      bytes: result.bytes
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes
    };
    
  } catch (error) {
    console.error('Cloudinary upload error details:', {
      message: error.message,
      stack: error.stack,
      localFilePath,
      cloudinaryAvailable: !!cloudinary,
      uploaderAvailable: !!cloudinary?.uploader,
      uploadMethodType: typeof cloudinary?.uploader?.upload
    });
    throw error;
  }
};

// Alternative upload using your existing helper (fallback)
const uploadToCloudinaryUsingHelper = async (localFilePath, options = {}) => {
  try {
    // If your existing cloudinary config file exports helpers, we can use them
    const fileBuffer = fs.readFileSync(localFilePath);
    const filename = path.basename(localFilePath);
    const userId = options.public_id?.split('_')[0] || 'user';
    
    // Try to use your cloudinaryHelpers if available
    const { cloudinaryHelpers } = require('../config/cloudinary');
    if (cloudinaryHelpers && cloudinaryHelpers.uploadPDF) {
      return await cloudinaryHelpers.uploadPDF(fileBuffer, filename, userId);
    }
    
    throw new Error('No suitable upload method available');
  } catch (error) {
    console.error('Helper upload failed:', error);
    throw error;
  }
};

// Upload buffer to Cloudinary (your existing pattern)
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!cloudinary || !cloudinary.uploader) {
      reject(new Error('Cloudinary not properly configured'));
      return;
    }

    const uploadOptions = {
      resource_type: 'auto', // Changed from 'raw' to 'auto'
      folder: 'print-requests', // Changed from 'eprinter-documents' to 'print-requests'
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload_stream error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload_stream successful:', result.public_id);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes
          });
        }
      }
    );
    
    uploadStream.end(buffer);
  });
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!cloudinary || !cloudinary.uploader) {
      throw new Error('Cloudinary not properly configured');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto' // Changed from 'raw' to 'auto'
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Get file info from Cloudinary
const getCloudinaryFileInfo = async (publicId) => {
  try {
    if (!cloudinary || !cloudinary.api) {
      throw new Error('Cloudinary not properly configured');
    }

    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'auto' // Changed from 'raw' to 'auto'
    });
    return result;
  } catch (error) {
    console.error('Cloudinary file info error:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  uploadToCloudinaryUsingHelper, // Fallback method
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getCloudinaryFileInfo
};