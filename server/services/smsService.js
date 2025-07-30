// services/smsService.js
const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// @desc    Send SMS
exports.sendSMS = async (options) => {
  try {
    const { to, message, from = process.env.TWILIO_PHONE_NUMBER } = options;

    // Format phone number (ensure it starts with country code)
    let formattedTo = to;
    if (!formattedTo.startsWith('+')) {
      // Assuming Indian numbers, add +91
      formattedTo = '+91' + formattedTo.replace(/^\+?91/, '');
    }

    const messageResponse = await client.messages.create({
      body: message,
      from: from,
      to: formattedTo
    });

    console.log('SMS sent successfully:', messageResponse.sid);
    return messageResponse;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// @desc    Send WhatsApp message
exports.sendWhatsApp = async (options) => {
  try {
    const { to, message, from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}` } = options;

    // Format WhatsApp number
    let formattedTo = to;
    if (!formattedTo.startsWith('whatsapp:')) {
      if (!formattedTo.startsWith('+')) {
        formattedTo = '+91' + formattedTo.replace(/^\+?91/, '');
      }
      formattedTo = `whatsapp:${formattedTo}`;
    }

    const messageResponse = await client.messages.create({
      body: message,
      from: from,
      to: formattedTo
    });

    console.log('WhatsApp message sent successfully:', messageResponse.sid);
    return messageResponse;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// @desc    Send bulk SMS
exports.sendBulkSMS = async (numbers, message) => {
  try {
    const promises = numbers.map(number => 
      exports.sendSMS({ to: number, message })
    );

    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(result => result.status === 'fulfilled');
    const failed = results.filter(result => result.status === 'rejected');

    console.log(`Bulk SMS: ${successful.length} sent, ${failed.length} failed`);
    
    return {
      successful: successful.length,
      failed: failed.length,
      results
    };
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
};

// @desc    Get message status
exports.getMessageStatus = async (messageSid) => {
  try {
    const message = await client.messages(messageSid).fetch();
    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  } catch (error) {
    console.error('Error getting message status:', error);
    throw error;
  }
};

// @desc    Format phone number for SMS
exports.formatPhoneNumber = (phoneNumber, countryCode = '+91') => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Remove country code if already present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  // Add country code
  return `${countryCode}${cleaned}`;
};