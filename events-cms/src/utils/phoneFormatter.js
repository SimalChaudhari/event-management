/**
 * Phone Number Formatting Utility
 * Formats phone numbers to Singapore format for display
 */

/**
 * Format phone number to Singapore display format: +65-XXXX-XXXX
 * @param {string} phone - Phone number in any format (including database format +6589532476)
 * @returns {string} Formatted phone number for display or "-" if empty
 */
export const formatPhoneDisplay = (phone) => {
    if (!phone) return '-';
    
    // Clean the phone number
    const cleaned = phone.replace(/\D/g, '');
    let phoneDigits = cleaned;
    
    // Remove country code if present
    if (cleaned.startsWith('65')) {
        phoneDigits = cleaned.substring(2);
    }
    
    // Validate that it's 8 digits and starts with 8 or 9
    if (phoneDigits.length === 8 && (phoneDigits.startsWith('8') || phoneDigits.startsWith('9'))) {
        return `+65-${phoneDigits.substring(0, 4)}-${phoneDigits.substring(4, 8)}`;
    }
    
    // Return original if not valid Singapore mobile
    return phone;
};

/**
 * Format phone number for display in tables (shortened)
 * @param {string} phone - Phone number in any format
 * @returns {string} Formatted phone number
 */
export const formatPhoneTableDisplay = (phone) => {
    return formatPhoneDisplay(phone);
};

/**
 * Get phone number for tel: link
 * @param {string} phone - Phone number in any format
 * @returns {string} Clean phone number for tel link
 */
export const getPhoneTelLink = (phone) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('65')) {
        return `+${cleaned}`;
    }
    
    return `+65${cleaned}`;
};

export default {
    formatPhoneDisplay,
    formatPhoneTableDisplay,
    getPhoneTelLink
};

