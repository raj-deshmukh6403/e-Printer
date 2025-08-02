require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { scheduleCleanupJobs } = require('./services/cleanupService');

// Import configurations
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const printRoutes = require('./routes/print');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notification');
const pdffiles = require('./routes/files');
const settingsRoutes = require('./routes/settings');

// Import queue
const printQueue = require('./utils/queue');

const app = express();

// Connect to database
connectDB();

// ENHANCED CORS CONFIGURATION - Place this BEFORE other middleware
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      "https://e-printer-admin.vercel.app",
      "https://e-printer-client.vercel.app",
      "http://localhost:3000", // for local development
      "http://localhost:5173", // for Vite dev server
    ].filter(Boolean); // Remove undefined values
    
    console.log('Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // For development, allow all origins - change this in production
      callback(null, true);
      // In production, use: callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Content-Disposition'
  ],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: 86400 // 24 hours
};

// Apply CORS globally FIRST
app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Cookie parser (before routes)
app.use(cookieParser());

// Body parsing middleware - MUST come before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// UPDATED: Security middleware with file-serving friendly settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  crossOriginEmbedderPolicy: false, // Disable COEP for PDF embedding
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"], // Allow same-origin frames for PDF preview
      workerSrc: ["'self'", "blob:"], // For PDF.js worker
      frameAncestors: ["'self'"]
    }
  }
}));

// Rate limiting configuration - More lenient for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Allow 30 auth requests per 15 minutes per IP
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for profile checks in development
    return process.env.NODE_ENV === 'development' && req.path === '/profile';
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and file operations
    return req.path.includes('/health') || 
          req.path.includes('/files/preview') || 
          req.path.includes('/files/download');
  }
});

// Apply different rate limiters
app.use('/api/auth', authLimiter); // Specific rate limit for auth routes
app.use('/api/', generalLimiter); // General rate limit for other routes

// Separate rate limiter for file operations (keep existing)
const fileLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 file requests per 5 minutes
  message: {
    error: 'Too many file requests, please try again later.',
    retryAfter: 5 * 60
  },
});

app.use('/api/files/', fileLimiter);

// Compression middleware
app.use(compression());

// Cache control middleware
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    queue: printQueue.getQueueStatus(),
    cors: {
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    }
  });
});

// CORS test route with enhanced debugging
app.get('/api/test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    method: req.method,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    },
    timestamp: new Date().toISOString()
  });
});

// API routes with enhanced logging and error handling
app.use('/api/auth', (req, res, next) => {
  console.log(`Auth route: ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
}, authRoutes);

app.use('/api/print', (req, res, next) => {
  console.log(`Print route: ${req.method} ${req.path}`);
  next();
}, printRoutes);

app.use('/api/admin', (req, res, next) => {
  console.log(`Admin route: ${req.method} ${req.path}`);
  next();
}, adminRoutes);

app.use('/api/payment', (req, res, next) => {
  console.log(`Payment route: ${req.method} ${req.path}`);
  next();
}, paymentRoutes);

app.use('/api/notifications', (req, res, next) => {
  console.log(`Notification route: ${req.method} ${req.path}`);
  next();
}, notificationRoutes);

// Enhanced file routes with debugging
app.use('/api/files', (req, res, next) => {
  console.log(`File route: ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
}, pdffiles);

// Add this route registration after your existing routes
app.use('/api/settings', (req, res, next) => {
  console.log(`Settings route: ${req.method} ${req.path}`);
  next();
}, settingsRoutes);

app.get('/raj', (req, res) => {
  res.json({
    message: 'Hello from /raj route!'
  });
  console.log('Request headers:', req.headers);
});

// Update your API documentation route to include settings endpoints
app.get('/api', (req, res) => {
  res.json({
    message: 'E-Printer API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      print: '/api/print',
      admin: '/api/admin',
      payment: '/api/payment',
      notifications: '/api/notifications',
      files: '/api/files',
      settings: '/api/settings'
    },
    fileEndpoints: {
      preview: '/api/files/preview/:filename',
      download: '/api/files/download/:filename',
      health: '/api/files/health'
    },
    settingsEndpoints: {
      public: '/api/settings',
      serviceStatus: '/api/settings/service-status',
      pricing: '/api/settings/pricing',
      byKey: '/api/settings/:key'
    }
  });
});

// 404 handler with better debugging
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log('Request headers:', req.headers);
  
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      '/api/auth',
      '/api/print',
      '/api/admin',
      '/api/payment',
      '/api/notifications',
      '/api/files',
      '/api/settings'
    ],
    fileRoutes: [
      '/api/files/preview/:filename',
      '/api/files/download/:filename',
      '/api/files/health'
    ]
  });
});

// ENHANCED Global error handler with CORS headers
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Ensure CORS headers are always present in error responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');

  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum 10MB allowed.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + error.message });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  // Default error
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('ADMIN_URL:', process.env.ADMIN_URL);
console.log('All CLOUDINARY vars:');
Object.keys(process.env)
  .filter(key => key.startsWith('CLOUDINARY'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'Set (****)' : 'MISSING'}`);
  });

// Test if dotenv is working
require('dotenv').config();
console.log('After dotenv.config():');
Object.keys(process.env)
  .filter(key => key.startsWith('CLOUDINARY'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'Set (****)' : 'MISSING'}`);
  });

// Start cleanup jobs
scheduleCleanupJobs();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

//test

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🖨️  Print queue initialized with ${printQueue.getQueueStatus().maxConcurrent} max concurrent jobs`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

module.exports = app;