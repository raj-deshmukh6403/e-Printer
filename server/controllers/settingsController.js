// controllers/settingsController.js
const Settings = require('../models/Settings');

// Get public settings for client-side use
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Only send settings that clients need - filter out sensitive data
    const publicSettings = {
      pricing: {
        blackPrintCost: settings.blackPrintCost,
        colorPrintCost: settings.colorPrintCost,
        pricingTiers: settings.pricingTiers
      },
      fileSettings: {
        maxFileSize: settings.maxFileSize,
        supportedFormats: settings.supportedFormats,
        allowedFileTypes: settings.allowedFileTypes
      },
      businessHours: {
        start: settings.businessHours.start,
        end: settings.businessHours.end
      },
      deliveryOptions: {
        pickup: {
          enabled: settings.deliveryOptions.pickup.enabled,
          fee: settings.deliveryOptions.pickup.fee
        },
        homeDelivery: {
          enabled: settings.deliveryOptions.homeDelivery.enabled,
          fee: settings.deliveryOptions.homeDelivery.fee
        }
      },
      systemSettings: {
        maintenanceMode: settings.systemSettings.maintenanceMode,
        acceptingOrders: settings.systemSettings.acceptingOrders,
        maxOrdersPerDay: settings.systemSettings.maxOrdersPerDay
      },
      contactInfo: {
        address: settings.contactInfo.address,
        phone: settings.contactInfo.phone,
        email: settings.contactInfo.email
      }
    };

    res.json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// Get specific setting by key (for targeted requests)
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const settings = await Settings.getSettings();
    
    // Define allowed public keys to prevent sensitive data exposure
    const allowedKeys = [
      'blackPrintCost',
      'colorPrintCost',
      'maxFileSize',
      'supportedFormats',
      'allowedFileTypes',
      'businessHours',
      'deliveryOptions',
      'systemSettings.maintenanceMode',
      'systemSettings.acceptingOrders',
      'contactInfo.phone',
      'contactInfo.email',
      'contactInfo.address'
    ];

    if (!allowedKeys.includes(key)) {
      return res.status(403).json({
        success: false,
        message: 'Access to this setting is not allowed'
      });
    }

    // Handle nested keys (e.g., 'systemSettings.maintenanceMode')
    const value = key.split('.').reduce((obj, k) => obj && obj[k], settings);

    if (value === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: {
        key,
        value
      }
    });
  } catch (error) {
    console.error('Error fetching setting by key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
};

// FIXED: Check service availability with proper time comparison
const getServiceStatus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Get current time in IST (Indian timezone)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    const currentTime = istTime.toTimeString().slice(0, 5); // HH:MM format for display
    
    // Convert time to decimal for proper comparison
    const timeToDecimal = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + (minutes / 60);
    };
    
    const currentTimeDecimal = currentHour + (currentMinute / 60);
    const startTimeDecimal = timeToDecimal(settings.businessHours.start);
    const endTimeDecimal = timeToDecimal(settings.businessHours.end);
    
    // ✅ FIXED: Proper time comparison using decimal values
    const isWithinBusinessHours = currentTimeDecimal >= startTimeDecimal && currentTimeDecimal <= endTimeDecimal;
    
    // Check if service is available
    const isServiceAvailable = !settings.systemSettings.maintenanceMode && 
                              settings.systemSettings.acceptingOrders && 
                              isWithinBusinessHours;

    const serviceStatus = {
      available: isServiceAvailable,
      maintenanceMode: settings.systemSettings.maintenanceMode,
      acceptingOrders: settings.systemSettings.acceptingOrders,
      businessHours: {
        start: settings.businessHours.start,
        end: settings.businessHours.end,
        isWithinHours: isWithinBusinessHours,
        currentTime: currentTime,
        timezone: 'Asia/Kolkata'
      },
      reasons: [],
      // Debug info (remove in production)
      debug: {
        currentTimeDecimal: currentTimeDecimal.toFixed(2),
        startTimeDecimal: startTimeDecimal.toFixed(2),
        endTimeDecimal: endTimeDecimal.toFixed(2),
        currentHour,
        currentMinute,
        istTime: istTime.toISOString(),
        utcTime: now.toISOString()
      }
    };

    // Add reasons why service might not be available
    if (settings.systemSettings.maintenanceMode) {
      serviceStatus.reasons.push('System is under maintenance');
    }
    if (!settings.systemSettings.acceptingOrders) {
      serviceStatus.reasons.push('Not accepting new orders currently');
    }
    if (!isWithinBusinessHours) {
      serviceStatus.reasons.push(`Service available only during business hours (${settings.businessHours.start} - ${settings.businessHours.end})`);
    }

    console.log('Service Status Debug:', {
      currentTime,
      currentTimeDecimal: currentTimeDecimal.toFixed(2),
      businessStart: settings.businessHours.start,
      businessEnd: settings.businessHours.end,
      startTimeDecimal: startTimeDecimal.toFixed(2),
      endTimeDecimal: endTimeDecimal.toFixed(2),
      isWithinHours: isWithinBusinessHours,
      available: isServiceAvailable
    });

    res.json({
      success: true,
      data: serviceStatus
    });
  } catch (error) {
    console.error('Error checking service status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check service status',
      error: error.message
    });
  }
};

// Get pricing information (for cost calculations)
const getPricingInfo = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    const pricingInfo = {
      basic: {
        blackAndWhite: settings.blackPrintCost,
        color: settings.colorPrintCost
      },
      tiers: settings.pricingTiers,
      delivery: {
        pickup: settings.deliveryOptions.pickup.fee,
        homeDelivery: settings.deliveryOptions.homeDelivery.fee
      }
    };

    res.json({
      success: true,
      data: pricingInfo
    });
  } catch (error) {
    console.error('Error fetching pricing info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing information',
      error: error.message
    });
  }
};

module.exports = {
  getPublicSettings,
  getSettingByKey,
  getServiceStatus,
  getPricingInfo
};