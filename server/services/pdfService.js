// services/pdfService.js
const pdf = require('pdf-parse');

// @desc    Get PDF page count
exports.getPDFPageCount = async (buffer) => {
  try {
    const data = await pdf(buffer);
    console.log('PDF parsed successfully, pages:', data.numpages);
    return data.numpages;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Unable to parse PDF file');
  }
};

// @desc    Extract text from PDF
exports.extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdf(buffer);
    console.log('Text extracted from PDF, length:', data.text.length);
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Unable to extract text from PDF file');
  }
};

// @desc    Get PDF information
exports.getPDFInfo = async (buffer) => {
  try {
    const data = await pdf(buffer);
    
    return {
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
      textLength: data.text.length
    };
  } catch (error) {
    console.error('Error getting PDF info:', error);
    throw new Error('Unable to get PDF information');
  }
};

// @desc    Validate PDF file
exports.validatePDF = async (buffer) => {
  try {
    await pdf(buffer);
    return { valid: true, message: 'PDF is valid' };
  } catch (error) {
    console.error('PDF validation failed:', error);
    return { 
      valid: false, 
      message: 'Invalid PDF file or corrupted'
    };
  }
};

// @desc    Check if PDF is password protected
exports.isPDFPasswordProtected = async (buffer) => {
  try {
    await pdf(buffer);
    return false; // If we can parse it, it's not password protected
  } catch (error) {
    if (error.message && error.message.includes('password')) {
      return true;
    }
    // If it's another error, re-throw it
    throw error;
  }
};