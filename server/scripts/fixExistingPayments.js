// scripts/fixExistingPayments.js - Run this to fix existing paid requests
const mongoose = require('mongoose');
const PrintRequest = require('../models/PrintRequest');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { deleteLocalFile } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Import User model to register the schema
const User = require('../models/User'); // Add this line

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eprinter');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Function to fix existing paid requests
async function fixExistingPaidRequests() {
  try {
    console.log('🔍 Finding problematic requests...');

    // Find all requests that are paid but missing Cloudinary details
    const problematicRequests = await PrintRequest.find({
      paymentStatus: 'completed',
      $or: [
        { documentUrl: { $exists: false } },
        { documentUrl: null },
        { documentUrl: '' },
        { publicId: { $exists: false } },
        { publicId: null },
        { publicId: '' }
      ]
    }).populate('userId', 'username email');

    console.log(`📊 Found ${problematicRequests.length} requests that need fixing`);

    if (problematicRequests.length === 0) {
      console.log('✅ No problematic requests found. All good!');
      return;
    }

    const results = {
      fixed: 0,
      failed: 0,
      noLocalFile: 0,
      skipped: 0
    };

    for (let i = 0; i < problematicRequests.length; i++) {
      const request = problematicRequests[i];
      
      console.log(`\n--- Processing ${i + 1}/${problematicRequests.length} ---`);
      console.log(`📄 Request ID: ${request._id}`);
      console.log(`📁 Document: ${request.documentName}`);
      console.log(`👤 User: ${request.userId?.username || 'Unknown'}`);
      console.log(`📍 Status: ${request.status}`);
      console.log(`💳 Payment: ${request.paymentStatus}`);
      console.log(`📂 Local Path: ${request.localFilePath}`);

      try {
        // Check if local file exists
        if (!request.localFilePath || !fs.existsSync(request.localFilePath)) {
          console.log('❌ Local file not found, cannot upload to Cloudinary');
          results.noLocalFile++;
          
          // Update the record to reflect missing local file
          await PrintRequest.findByIdAndUpdate(request._id, {
            $set: {
              deletedFromLocal: true,
              processingNotes: 'Local file missing - could not upload to Cloudinary',
              updatedAt: new Date()
            }
          });
          continue;
        }

        // Check if already has both URL and publicId
        if (request.documentUrl && request.publicId) {
          console.log('✅ Already has both documentUrl and publicId, skipping');
          results.skipped++;
          continue;
        }

        console.log('☁️ Uploading to Cloudinary...');

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(request.localFilePath, {
          folder: 'eprinter-documents',
          resource_type: 'raw',
          public_id: `${request.userId._id}_${Date.now()}_${path.parse(request.documentName).name}`,
          tags: ['print-request', request._id.toString(), 'fixed-upload']
        });

        console.log('✅ Cloudinary upload successful');
        console.log(`🔗 URL: ${uploadResult.secure_url}`);
        console.log(`🆔 Public ID: ${uploadResult.public_id}`);

        // Update database
        const updateResult = await PrintRequest.findByIdAndUpdate(
          request._id,
          {
            $set: {
              documentUrl: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              uploadedToCloudinary: true,
              status: 'in_queue', // Ensure proper status
              processingNotes: 'Fixed via script - uploaded to Cloudinary',
              updatedAt: new Date()
            }
          },
          { new: true }
        );

        if (updateResult) {
          console.log('✅ Database updated successfully');
          results.fixed++;

          // Delete local file
          const deleteSuccess = deleteLocalFile(request.localFilePath);
          if (deleteSuccess) {
            await PrintRequest.findByIdAndUpdate(request._id, {
              $set: { deletedFromLocal: true }
            });
            console.log('🗑️ Local file deleted');
          } else {
            console.log('⚠️ Failed to delete local file');
          }
        } else {
          console.log('❌ Database update failed');
          results.failed++;
        }

      } catch (error) {
        console.error(`❌ Error processing request ${request._id}:`, error.message);
        results.failed++;

        // Mark as failed in database
        try {
          await PrintRequest.findByIdAndUpdate(request._id, {
            $set: {
              status: 'failed',
              processingNotes: `Script fix failed: ${error.message}`,
              updatedAt: new Date()
            }
          });
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
        }
      }

      // Add a small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 === SUMMARY ===');
    console.log(`📊 Total processed: ${problematicRequests.length}`);
    console.log(`✅ Successfully fixed: ${results.fixed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📂 No local file: ${results.noLocalFile}`);
    console.log(`⏭️ Skipped (already fixed): ${results.skipped}`);

    return results;

  } catch (error) {
    console.error('❌ Script execution error:', error);
    throw error;
  }
}

// Function to verify all requests have consistent data
async function verifyAllRequests() {
  try {
    console.log('\n🔍 === VERIFICATION PHASE ===');

    const allPaidRequests = await PrintRequest.find({
      paymentStatus: 'completed'
    });

    console.log(`📊 Checking ${allPaidRequests.length} paid requests...`);

    const issues = {
      missingUrl: 0,
      missingPublicId: 0,
      inconsistentFlags: 0,
      allGood: 0
    };

    for (const request of allPaidRequests) {
      let hasIssues = false;

      if (!request.documentUrl) {
        issues.missingUrl++;
        hasIssues = true;
      }

      if (!request.publicId) {
        issues.missingPublicId++;
        hasIssues = true;
      }

      if (request.documentUrl && request.publicId && !request.uploadedToCloudinary) {
        issues.inconsistentFlags++;
        hasIssues = true;
      }

      if (!hasIssues) {
        issues.allGood++;
      }
    }

    console.log('\n📋 === VERIFICATION RESULTS ===');
    console.log(`✅ All good: ${issues.allGood}`);
    console.log(`❌ Missing URL: ${issues.missingUrl}`);
    console.log(`❌ Missing Public ID: ${issues.missingPublicId}`);
    console.log(`⚠️ Inconsistent flags: ${issues.inconsistentFlags}`);

    return issues;

  } catch (error) {
    console.error('❌ Verification error:', error);
    throw error;
  }
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting fix script for existing payment records...\n');

    // Connect to database
    await connectDB();

    // Phase 1: Fix problematic requests
    const fixResults = await fixExistingPaidRequests();

    // Phase 2: Verify all requests
    const verifyResults = await verifyAllRequests();

    console.log('\n🎉 Script completed successfully!');
    console.log('Fix results:', fixResults);
    console.log('Verification results:', verifyResults);

    process.exit(0);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fixExistingPaidRequests,
  verifyAllRequests,
  main
};