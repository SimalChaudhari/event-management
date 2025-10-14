/**
 * Singapore Phone Number Utility
 * Format: +65-XXXX-XXXX
 * Example: +65-8953-2476
 */

export class SingaporePhoneUtils {
  // Singapore country code
  private static readonly COUNTRY_CODE = '65';
  
  // Valid Singapore mobile number prefixes (8 or 9)
  private static readonly MOBILE_PREFIXES = ['8', '9'];
  
  // Singapore phone number length (without country code and formatting)
  private static readonly PHONE_LENGTH = 8;

  /**
   * Clean phone number by removing all non-digit characters
   * @param phone - Raw phone number string
   * @returns Cleaned phone number with only digits
   */
  static cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }

  /**
   * Format phone number for database storage: +6589532476 (without hyphens)
   * @param phone - Raw phone number string
   * @returns Database format or original if invalid
   */
  static formatPhoneForDatabase(phone: string): string {
    if (!phone) return '';
    
    // Clean the phone number
    const cleaned = this.cleanPhoneNumber(phone);
    
    // Check if it starts with country code
    let phoneDigits = cleaned;
    if (cleaned.startsWith(this.COUNTRY_CODE)) {
      phoneDigits = cleaned.substring(this.COUNTRY_CODE.length);
    }
    
    // Validate length
    if (phoneDigits.length !== this.PHONE_LENGTH) {
      return phone; // Return original if invalid length
    }
    
    // Validate that it starts with 8 or 9
    const firstDigit = phoneDigits.charAt(0);
    if (!this.MOBILE_PREFIXES.includes(firstDigit)) {
      return phone; // Return original if invalid prefix
    }
    
    // Format for database: +6589532476 (without hyphens)
    const formatted = `+${this.COUNTRY_CODE}${phoneDigits}`;
    return formatted;
  }

  /**
   * Format phone number for display: +65-8953-2476 (with hyphens)
   * @param phone - Phone number in any format
   * @returns Display format or original if invalid
   */
  static formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    
    // Clean the phone number
    const cleaned = this.cleanPhoneNumber(phone);
    
    // Check if it starts with country code
    let phoneDigits = cleaned;
    if (cleaned.startsWith(this.COUNTRY_CODE)) {
      phoneDigits = cleaned.substring(this.COUNTRY_CODE.length);
    }
    
    // Validate length
    if (phoneDigits.length !== this.PHONE_LENGTH) {
      return phone; // Return original if invalid length
    }
    
    // Validate that it starts with 8 or 9
    const firstDigit = phoneDigits.charAt(0);
    if (!this.MOBILE_PREFIXES.includes(firstDigit)) {
      return phone; // Return original if invalid prefix
    }
    
    // Format for display: +65-8953-2476 (with hyphens)
    const formatted = `+${this.COUNTRY_CODE}-${phoneDigits.substring(0, 4)}-${phoneDigits.substring(4, 8)}`;
    return formatted;
  }

  /**
   * Format phone number to Singapore format: +65-XXXX-XXXX (legacy method for compatibility)
   * @param phone - Raw phone number string
   * @returns Formatted phone number or original if invalid
   */
  static formatPhoneNumber(phone: string): string {
    return this.formatPhoneForDisplay(phone);
  }

  /**
   * Validate Singapore phone number
   * @param phone - Phone number to validate
   * @returns true if valid Singapore mobile number
   */
  static isValidSingaporePhone(phone: string): boolean {
    if (!phone) return false;
    
    // Clean the phone number
    const cleaned = this.cleanPhoneNumber(phone);
    
    // Extract phone digits (remove country code if present)
    let phoneDigits = cleaned;
    if (cleaned.startsWith(this.COUNTRY_CODE)) {
      phoneDigits = cleaned.substring(this.COUNTRY_CODE.length);
    }
    
    // Check length
    if (phoneDigits.length !== this.PHONE_LENGTH) {
      return false;
    }
    
    // Check if starts with valid prefix (8 or 9)
    const firstDigit = phoneDigits.charAt(0);
    if (!this.MOBILE_PREFIXES.includes(firstDigit)) {
      return false;
    }
    
    return true;
  }

  /**
   * Parse and format phone number, throwing error if invalid
   * @param phone - Phone number to parse
   * @returns Formatted phone number
   * @throws Error if invalid
   */
  static parseAndFormat(phone: string): string {
    if (!phone) {
      throw new Error('Phone number is required');
    }
    
    if (!this.isValidSingaporePhone(phone)) {
      throw new Error('Invalid Singapore mobile number. Must be 8 digits starting with 8 or 9');
    }
    
    return this.formatPhoneNumber(phone);
  }

  /**
   * Get validation regex pattern for Singapore phone
   * Matches: +65-XXXX-XXXX or 65XXXXXXXX or 8XXXXXXX or 9XXXXXXX
   */
  static getValidationPattern(): RegExp {
    return /^(\+?65)?[-\s]?[89]\d{7}$/;
  }

  /**
   * Get formatted pattern for display
   */
  static getFormattedPattern(): string {
    return '+65-XXXX-XXXX';
  }

  /**
   * Extract phone number without country code and formatting
   * @param phone - Formatted phone number
   * @returns Plain 8-digit number
   */
  static extractPlainNumber(phone: string): string {
    const cleaned = this.cleanPhoneNumber(phone);
    if (cleaned.startsWith(this.COUNTRY_CODE)) {
      return cleaned.substring(this.COUNTRY_CODE.length);
    }
    return cleaned;
  }

  /**
   * Validate and format an array of phone numbers
   * @param phones - Array of phone numbers
   * @returns Array of formatted phone numbers
   */
  static formatPhoneNumbers(phones: string[]): string[] {
    return phones.map(phone => {
      try {
        return this.parseAndFormat(phone);
      } catch (error) {
        return phone; // Return original if formatting fails
      }
    });
  }
}

