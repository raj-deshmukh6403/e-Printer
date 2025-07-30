// middleware/upload.js - Multer configuration with proper filename generation
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    try {
      // Get user ID from auth middleware
      const userId = req.user?.id || 'anonymous';
      
      // Generate timestamp
      const timestamp = Date.now();
      
      // Generate random number for uniqueness
      const randomId = Math.floor(Math.random() * 1000000);
      
      // Get original filename and extension
      const originalName = file.originalname;
      const extension = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, extension);
      
      // Create server filename: userId_timestamp-randomId_originalName
      const serverFilename = `${userId}_${timestamp}-${randomId}_${originalName}`;
      
      console.log('=== MULTER FILENAME GENERATION ===');
      console.log('User ID:', userId);
      console.log('Original filename:', originalName);
      console.log('Generated server filename:', serverFilename);
      
      cb(null, serverFilename);
      
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(error);
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log('=== FILE FILTER CHECK ===');
  console.log('File mimetype:', file.mimetype);
  console.log('File originalname:', file.originalname);
  
  // Allowed file types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  
  // Check file extension as backup
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    console.log('File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('File rejected:', file.originalname, 'Mimetype:', file.mimetype);
    cb(new Error(`Invalid file type. Only PDF and Word documents are allowed. Received: ${file.mimetype}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow 1 file at a time
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error('=== MULTER ERROR ===');
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 50MB.',
          error: error.message
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only 1 file allowed.',
          error: error.message
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: error.message
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
          error: error.message
        });
    }
  }
  
  // Handle custom file filter errors
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Pass other errors to the next error handler
  next(error);
};

// Utility function to delete local files
const deleteLocalFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted local file:', filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting local file:', error);
    return false;
  }
};

// Cleanup function for expired local files (call this periodically)
const cleanupExpiredFiles = (maxAgeHours = 24) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
    
    let deletedCount = 0;
    
    files.forEach(filename => {
      try {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted expired file: ${filename} (age: ${Math.round(fileAge / (60 * 60 * 1000))} hours)`);
        }
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
      }
    });
    
    if (deletedCount > 0) {
      console.log(`Cleanup completed: ${deletedCount} expired files deleted`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error during cleanup:', error);
    return 0;
  }
};

// Export everything
module.exports = {
  upload,
  handleMulterError,
  deleteLocalFile,
  cleanupExpiredFiles,
  uploadsDir
};

// Auto-cleanup: Run cleanup every hour
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    cleanupExpiredFiles(24); // Delete files older than 24 hours
  }, 60 * 60 * 1000); // Run every hour
}