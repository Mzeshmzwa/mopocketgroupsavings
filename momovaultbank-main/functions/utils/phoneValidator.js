/**
 * Phone number validation and formatting utilities
 */

/**
 * Validates and formats a phone number for Eswatini (268 country code)
 * @param {string} phoneNumber - Raw phone number input
 * @returns {object} - { isValid: boolean, formatted: string, error?: string }
 */
function validateAndFormatPhone(phoneNumber) {
  if (!phoneNumber) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's empty after cleaning
  if (!cleaned) {
    return { isValid: false, error: "Phone number must contain digits" };
  }

  let formatted;

  // Handle different input formats
  if (cleaned.startsWith('268')) {
    // Already has country code
    if (cleaned.length !== 11) {
      return { isValid: false, error: "Phone number with 268 country code must be 11 digits" };
    }
    formatted = cleaned;
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add country code
    const withoutZero = cleaned.substring(1);
    if (withoutZero.length !== 8) {
      return { isValid: false, error: "Phone number without country code must be 8 digits (excluding leading 0)" };
    }
    formatted = '268' + withoutZero;
  } else {
    // Add country code directly
    if (cleaned.length !== 8) {
      return { isValid: false, error: "Phone number without country code must be 8 digits" };
    }
    formatted = '268' + cleaned;
  }

  // Validate Eswatini mobile number patterns (basic validation)
  // Eswatini mobile numbers typically start with 76, 78, or 79 after country code
  const localPart = formatted.substring(3); // Remove 268
  if (!localPart.match(/^(76|78|79)/)) {
    return { 
      isValid: false, 
      error: "Invalid Eswatini mobile number. Must start with 76, 78, or 79" 
    };
  }

  return { isValid: true, formatted };
}

/**
 * Simple phone number formatter (less strict validation)
 * @param {string} phoneNumber - Raw phone number input
 * @returns {string} - Formatted phone number with 268 prefix
 */
function formatPhoneSimple(phoneNumber) {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('268')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '268' + cleaned.substring(1);
  } else {
    return '268' + cleaned;
  }
}

module.exports = {
  validateAndFormatPhone,
  formatPhoneSimple
};