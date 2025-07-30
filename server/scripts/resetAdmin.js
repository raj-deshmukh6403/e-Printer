// scripts/resetAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const resetAdmin = async () => {
  try {
    console.log('🔄 Starting admin reset process...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin
    const deleteResult = await Admin.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin(s)`);

    // Create new admin
    const admin = await Admin.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'super_admin',
      isActive: true
    });

    console.log('🎉 New admin created successfully!');
    console.log('Admin Details:', {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    });

    console.log('\n📝 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Email:', process.env.ADMIN_EMAIL);
    console.log('   Password:', process.env.ADMIN_PASSWORD);
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error resetting admin:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

console.log('🔧 E-Printer Admin Reset Script');
console.log('=================================');
resetAdmin();