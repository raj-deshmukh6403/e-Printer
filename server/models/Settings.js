// models/Settings.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Pricing settings
  blackPrintCost: {
    type: Number,
    default: 1.0, // per page
    required: true
  },

  colorPrintCost: {
    type: Number,
    default: 5.0, // per page
    required: true
  },

  pricingTiers: {
    basic: {
      blackAndWhite: {
        type: Number,
        default: 1.0, // per page
        required: true
      },
      color: {
        type: Number,
        default: 3.0, // per page
        required: true
      }
    },
    premium: {
      blackAndWhite: {
        type: Number,
        default: 0.8, // per page
        required: true
      },
      color: {
        type: Number,
        default: 2.5, // per page
        required: true
      }
    }
  },

  // Service settings
  maxFileSize: {
    type: Number,
    default: 50, // MB
    required: true
  },

  supportedFormats: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    required: true
  },

  allowedFileTypes: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    required: true
  },

  // Business hours
  businessHours: {
    start: {
      type: String,
      default: '09:00',
      required: true
    },
    end: {
      type: String,
      default: '18:00',
      required: true
    }
  },

  // Delivery settings
  deliveryOptions: {
    pickup: {
      enabled: {
        type: Boolean,
        default: true
      },
      fee: {
        type: Number,
        default: 0
      }
    },
    homeDelivery: {
      enabled: {
        type: Boolean,
        default: true
      },
      fee: {
        type: Number,
        default: 20
      }
    }
  },

  // Email settings
  emailSettings: {
    adminEmail: {
      type: String,
      required: true,
      default: 'admin@eprinter.com'
    },
    notificationEmails: {
      newOrder: {
        type: Boolean,
        default: true
      },
      orderComplete: {
        type: Boolean,
        default: true
      },
      paymentReceived: {
        type: Boolean,
        default: true
      }
    }
  },

  // WhatsApp settings
  whatsappSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    businessNumber: {
      type: String,
      required: true,
      default: '+919876543210'
    },
    notificationTemplates: {
      orderReceived: {
        type: String,
        default: 'Hi {customerName}! Your print order #{orderNumber} has been received. We\'ll process it shortly.'
      },
      orderReady: {
        type: String,
        default: 'Hi {customerName}! Your print order #{orderNumber} is ready for {deliveryMethod}.'
      }
    }
  },

  // System settings
  systemSettings: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    acceptingOrders: {
      type: Boolean,
      default: true
    },
    maxOrdersPerDay: {
      type: Number,
      default: 100
    }
  },

  // Contact information
  contactInfo: {
    address: {
      type: String,
      required: true,
      default: '123 Print Street, City, State 12345'
    },
    phone: {
      type: String,
      required: true,
      default: '+919876543210'
    },
    email: {
      type: String,
      required: true,
      default: 'contact@eprinter.com'
    }
  }
}, {
  timestamps: true
});

// Static method to get settings (returns single document)
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({});
  }
  return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updates) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);