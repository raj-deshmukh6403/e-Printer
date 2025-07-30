// routes/settings.js
const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getSettingByKey,
  getServiceStatus,
  getPricingInfo
} = require('../controllers/settingsController');

// Public routes (no authentication required)
router.get('/', getPublicSettings);
router.get('/service-status', getServiceStatus);
router.get('/pricing', getPricingInfo);
router.get('/:key', getSettingByKey);

module.exports = router;