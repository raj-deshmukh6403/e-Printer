// routes/files.js - Enhanced file finding logic
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth'); // Your auth middleware

// CORS middleware specifically for file routes
const fileCorsMiddleware = (req, res, next) => {
  // Set CORS headers for file serving
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

// Apply CORS middleware to all routes in this router
router.use(fileCorsMiddleware);

// ENHANCED: Advanced file finding function
const findFileInUploads = (requestedFilename, uploadsDir) => {
  console.log('=== ENHANCED FILE SEARCH ===');
  console.log('Requested filename:', requestedFilename);
  console.log('Search directory:', uploadsDir);
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('Uploads directory does not exist');
    return null;
  }
  
  try {
    const allFiles = fs.readdirSync(uploadsDir);
    console.log('All files in uploads:', allFiles);
    
    // STRATEGY 1: Exact match
    const exactMatch = allFiles.find(file => file === requestedFilename);
    if (exactMatch) {
      console.log('FOUND - Exact match:', exactMatch);
      return path.join(uploadsDir, exactMatch);
    }
    
    // STRATEGY 2: Case-insensitive exact match
    const caseInsensitiveMatch = allFiles.find(file => 
      file.toLowerCase() === requestedFilename.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      console.log('FOUND - Case insensitive match:', caseInsensitiveMatch);
      return path.join(uploadsDir, caseInsensitiveMatch);
    }
    
    // STRATEGY 3: Files that END with the requested filename
    const endsWithMatch = allFiles.find(file => 
      file.endsWith(requestedFilename)
    );
    if (endsWithMatch) {
      console.log('FOUND - Ends with match:', endsWithMatch);
      return path.join(uploadsDir, endsWithMatch);
    }
    
    // STRATEGY 4: Remove user prefix and timestamp from server files and match
    // Server format: 688299004c8e88cc286bf36c_1753531441891-109456343_invoice_688407aa7762ddef95cf353c.pdf
    // Client sends: invoice-688407aa7762ddef95cf353c.pdf
    const cleanRequestedName = requestedFilename.replace(/^[^_]*_\d+-\d+_/, '');
    console.log('Cleaned requested name:', cleanRequestedName);
    
    const prefixMatch = allFiles.find(file => {
      // Remove the user prefix and timestamp from server file
      const cleanServerName = file.replace(/^[^_]+_\d+-\d+_/, '');
      console.log(`Comparing: "${cleanServerName}" with "${cleanRequestedName}"`);
      return cleanServerName === cleanRequestedName;
    });
    
    if (prefixMatch) {
      console.log('FOUND - Prefix cleaned match:', prefixMatch);
      return path.join(uploadsDir, prefixMatch);
    }
    
    // STRATEGY 5: Fuzzy matching - contains the core filename
    // Extract the core name without extensions and prefixes
    const extractCoreName = (filename) => {
      return filename
        .replace(/^[^_]*_\d+(-\d+)?_/, '') // Remove user_timestamp prefix
        .replace(/\.[^.]+$/, '') // Remove extension
        .replace(/[-_]/g, '') // Remove separators for fuzzy matching
        .toLowerCase();
    };
    
    const requestedCore = extractCoreName(requestedFilename);
    console.log('Requested core name:', requestedCore);
    
    const fuzzyMatch = allFiles.find(file => {
      const serverCore = extractCoreName(file);
      console.log(`Fuzzy comparing: "${serverCore}" with "${requestedCore}"`);
      return serverCore.includes(requestedCore) || requestedCore.includes(serverCore);
    });
    
    if (fuzzyMatch) {
      console.log('FOUND - Fuzzy match:', fuzzyMatch);
      return path.join(uploadsDir, fuzzyMatch);
    }
    
    // STRATEGY 6: Check if requested filename is contained in any server file
    const containsMatch = allFiles.find(file => {
      const baseRequested = requestedFilename.replace(/\.[^.]+$/, ''); // Remove extension
      const baseServer = file.replace(/\.[^.]+$/, ''); // Remove extension
      return baseServer.includes(baseRequested) || baseRequested.includes(baseServer);
    });
    
    if (containsMatch) {
      console.log('FOUND - Contains match:', containsMatch);
      return path.join(uploadsDir, containsMatch);
    }
    
    console.log('NO MATCH FOUND for:', requestedFilename);
    return null;
    
  } catch (error) {
    console.error('Error during file search:', error);
    return null;
  }
};

// UPDATED: Serve PDF files for preview with enhanced file finding
router.get('/preview/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    
    console.log('=== PDF PREVIEW REQUEST ===');
    console.log('Filename:', filename);
    console.log('User ID:', userId);
    console.log('Request Origin:', req.headers.origin);
    console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Security: Only allow PDF files
    if (!filename.toLowerCase().endsWith('.pdf')) {
      console.log('REJECTED - Not a PDF file');
      return res.status(400).json({ 
        success: false, 
        message: 'Only PDF files can be previewed' 
      });
    }
    
    // Construct uploads directory path
    const uploadsDir = path.join(__dirname, '../uploads');
    console.log('Uploads directory:', uploadsDir);
    
    // Use enhanced file finding
    const filePath = findFileInUploads(filename, uploadsDir);
    
    if (!filePath) {
      console.log('FILE NOT FOUND:', filename);
      console.log('Available files:', fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : 'Directory not found');
      
      return res.status(404).json({ 
        success: false, 
        message: 'File not found',
        details: `The requested PDF file "${filename}" could not be located on the server`,
        availableFiles: process.env.NODE_ENV === 'production' 
          ? (fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [])
          : undefined
      });
    }
    
    console.log('FILE FOUND - Serving from:', filePath);
    
    // Verify file exists and get stats
    if (!fs.existsSync(filePath)) {
      console.log('FILE PATH INVALID:', filePath);
      return res.status(404).json({ 
        success: false, 
        message: 'File path invalid',
        details: 'Found file reference but file does not exist on disk'
      });
    }
    
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File modified:', stats.mtime);
    
    // Set comprehensive headers for PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
    
    // Cache control headers - allow some caching for performance
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes cache
    res.setHeader('Expires', new Date(Date.now() + 300000).toUTCString());
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'same-origin');
    
    // Enhanced CORS headers
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
    
    // Create read stream with proper error handling
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('ERROR - File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error reading file',
          details: error.message
        });
      }
    });
    
    fileStream.on('open', () => {
      console.log('SUCCESS - File stream opened for:', path.basename(filePath));
    });
    
    fileStream.on('end', () => {
      console.log('SUCCESS - File stream completed for:', path.basename(filePath));
    });
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected, destroying stream');
      fileStream.destroy();
    });
    
    // Pipe the file to response
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('ERROR - PDF preview exception:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'production' ? error.message : 'An error occurred while processing your request'
    });
  }
});

// UPDATED: Alternative endpoint with token-based auth for new tab access
router.get('/preview-with-token/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { token } = req.query;
    
    console.log('=== PDF PREVIEW WITH TOKEN ===');
    console.log('Filename:', filename);
    console.log('Token present:', !!token);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }
    
    // Verify token (implement your token verification logic)
    // This is a placeholder - implement according to your auth system
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id }; // Simulate auth middleware
      console.log('Token verified for user:', decoded.id);
    } catch (tokenError) {
      console.log('Token verification failed:', tokenError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid access token' 
      });
    }
    
    // Use the same logic as the main preview endpoint
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only PDF files can be previewed' 
      });
    }
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = findFileInUploads(filename, uploadsDir);
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }
    
    const stats = fs.statSync(filePath);
    
    // Set headers for PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY'); // Prevent framing in new tab
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).send('Error reading file');
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Preview with token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Enhanced download endpoint
router.get('/download/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    
    console.log('=== FILE DOWNLOAD REQUEST ===');
    console.log('Filename:', filename);
    console.log('User ID:', userId);
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = findFileInUploads(filename, uploadsDir);
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }
    
    console.log('Downloading file from:', filePath);
    
    const stats = fs.statSync(filePath);
    
    // Set headers for download
    res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(filePath) + '"');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming download:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error reading file' 
        });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Health check for file service
router.get('/health', (req, res) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  try {
    const uploadsExists = fs.existsSync(uploadsDir);
    let fileCount = 0;
    let totalSize = 0;
    
    if (uploadsExists) {
      const files = fs.readdirSync(uploadsDir);
      fileCount = files.length;
      
      // Calculate total size
      files.forEach(file => {
        try {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        } catch (e) {
          // Skip files that can't be read
        }
      });
    }
    
    res.json({
      success: true,
      message: 'File service is healthy',
      uploadsDirectory: uploadsDir,
      uploadsExists,
      fileCount,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'File service health check failed',
      error: error.message
    });
  }
});

// Enhanced debug endpoint (development only)
if (process.env.NODE_ENV === 'production') {
  router.get('/debug/list', auth, (req, res) => {
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        return res.json({
          success: true,
          message: 'Uploads directory does not exist',
          files: []
        });
      }
      
      const files = fs.readdirSync(uploadsDir).map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          size: stats.size,
          sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
          created: stats.birthtime,
          modified: stats.mtime,
          isPDF: filename.toLowerCase().endsWith('.pdf'),
          extension: path.extname(filename).toLowerCase(),
          // Extract potential original name
          possibleOriginalName: filename.replace(/^[^_]+_\d+(-\d+)?_/, '')
        };
      });
      
      res.json({
        success: true,
        uploadsDirectory: uploadsDir,
        files: files.sort((a, b) => new Date(b.modified) - new Date(a.modified)), // Sort by most recent
        count: files.length,
        totalSizeMB: Math.round(files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024) * 100) / 100
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error listing files',
        error: error.message
      });
    }
  });
  
  // Test file finding endpoint
  router.get('/debug/find/:filename', auth, (req, res) => {
    try {
      const { filename } = req.params;
      const uploadsDir = path.join(__dirname, '../uploads');
      
      console.log('=== DEBUG FILE SEARCH ===');
      const foundPath = findFileInUploads(filename, uploadsDir);
      
      res.json({
        success: true,
        requestedFilename: filename,
        foundPath: foundPath,
        exists: foundPath ? fs.existsSync(foundPath) : false,
        uploadsDir,
        availableFiles: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = router;