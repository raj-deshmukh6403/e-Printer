// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    console.log('🚀 Starting admin creation process...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { email: process.env.ADMIN_EMAIL },
        { username: 'admin' }
      ]
    });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists:', {
        username: existingAdmin.username,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin
    console.log('👤 Creating admin with credentials:');
    console.log('   Email:', process.env.ADMIN_EMAIL);
    console.log('   Password:', process.env.ADMIN_PASSWORD);
    
    const admin = await Admin.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'super_admin',
      isActive: true
    });

    console.log('🎉 Admin created successfully!');
    console.log('Admin Details:', {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt
    });

    console.log('\n📝 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Email:', process.env.ADMIN_EMAIL);
    console.log('   Password:', process.env.ADMIN_PASSWORD);
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - Admin with this email/username already exists');
    }
    
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n⚠️  Script interrupted');
  await mongoose.disconnect();
  process.exit(1);
});

console.log('🔧 E-Printer Admin Creation Script');
console.log('==================================');
createAdmin();