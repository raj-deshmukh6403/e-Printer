// services/cleanupService.js
const fs = require('fs');
const path = require('path');
const { deleteFromCloudinary } = require('./cloudinaryService');
const { uploadsDir } = require('../middleware/upload');
const PrintRequest = require('../models/PrintRequest');

// Clean up old local files (run daily)
const cleanupOldLocalFiles = async () => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old local file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old local files:', error);
  }
};

// Clean up Cloudinary files for completed/cancelled requests
const cleanupCloudinaryFiles = async () => {
  try {
    const completedRequests = await PrintRequest.find({
      status: { $in: ['completed', 'cancelled'] },
      deleteAfterPrint: true,
      publicId: { $exists: true, $ne: null },
      cloudinaryDeleted: { $ne: true }
    });

    for (const request of completedRequests) {
      try {
        await deleteFromCloudinary(request.publicId);
        
        // Mark as deleted in database
        request.cloudinaryDeleted = true;
        await request.save();
        
        console.log(`Cleaned up Cloudinary file: ${request.publicId}`);
      } catch (deleteError) {
        console.error(`Error deleting Cloudinary file ${request.publicId}:`, deleteError);
      }
    }
  } catch (error) {
    console.error('Error cleaning up Cloudinary files:', error);
  }
};

// Schedule cleanup jobs (call this in your app.js)
const scheduleCleanupJobs = () => {
  // Clean up local files every hour
  setInterval(cleanupOldLocalFiles, 60 * 60 * 1000);
  
  // Clean up Cloudinary files every 6 hours
  setInterval(cleanupCloudinaryFiles, 6 * 60 * 60 * 1000);
  
  console.log('Cleanup jobs scheduled');
};

module.exports = {
  cleanupOldLocalFiles,
  cleanupCloudinaryFiles,
  scheduleCleanupJobs
};