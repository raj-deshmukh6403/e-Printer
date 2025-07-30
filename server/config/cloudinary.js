// config/cloudinary.js - FIXED VERSION
// IMPORTANT: Load environment variables FIRST
require('dotenv').config();

const cloudinary = require('cloudinary').v2;

// Debug environment variables
console.log('=== Cloudinary Configuration Debug ===');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test configuration immediately
const testConfig = async () => {
  try {
    // Test if configuration is working
    const config = cloudinary.config();
    console.log('Cloudinary config loaded:', {
      cloud_name: config.cloud_name ? 'Set' : 'Missing',
      api_key: config.api_key ? 'Set' : 'Missing'
    });
    
    // Test API connection
    await cloudinary.api.ping();
    console.log('✅ Cloudinary API connection successful');
    
    console.log('Cloudinary uploader available:', !!cloudinary.uploader);
    console.log('Cloudinary uploader upload method:', typeof cloudinary.uploader?.upload);
    
  } catch (error) {
    console.error('❌ Cloudinary configuration/connection failed:', error.message);
  }
};

// Run test immediately
testConfig();

module.exports = cloudinary;