// src/utils/user.utils.ts
import { UserEntity } from '../user/users.entity';

export class UserUtils {
  /**
   * Get full name from user entity
   * @param user User entity
   * @returns Full name (firstName + lastName)
   */
  static getFullName(user: UserEntity): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Get public speaker information (only safe fields)
   * @param user User entity (speaker) with optional speakerProfile
   * @returns Public speaker data with only allowed fields
   */
  static getPublicSpeakerInfo(user: Partial<UserEntity> & { speakerProfile?: any }) {
    return {
      id: user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.firstName || 'Unknown Speaker',
      email: user.email || '',
      position: user.speakerProfile?.position || '',
      companyName: user.speakerProfile?.companyName || '',
      description: user.speakerProfile?.description || '',
      location: user.city && user.state 
        ? `${user.city}, ${user.state}`.trim() 
        : user.city || user.state || '',
      profilePicture: user.profilePicture || '',
      linkedinProfile: user.linkedinProfile || '',
      // Add more user fields for complete information
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      mobile: user.mobile || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postalCode: user.postalCode || '',
      countryCurrency: user.countryCurrency || '',
      isVerify: user.isVerify || false,
      role: user.role || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get admin speaker information (more detailed)
   * @param user User entity (speaker) with optional speakerProfile
   * @returns Speaker data for admin view
   */
  static getAdminSpeakerInfo(user: Partial<UserEntity> & { speakerProfile?: any }) {
    return {
      id: user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.firstName || 'Unknown Speaker',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      mobile: user.mobile || '',
      position: user.speakerProfile?.position || '',
      companyName: user.speakerProfile?.companyName || '',
      description: user.speakerProfile?.description || '',
      profilePicture: user.profilePicture || '',
      linkedinProfile: user.linkedinProfile || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postalCode: user.postalCode || '',
      countryCurrency: user.countryCurrency || '',
      isVerify: user.isVerify || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get basic speaker info for events (minimal fields)
   * @param user User entity (speaker) with optional speakerProfile
   * @returns Basic speaker info for event displays
   */
  static getBasicSpeakerInfo(user: Partial<UserEntity> & { speakerProfile?: any }) {
    return {
      id: user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.firstName || 'Unknown Speaker',
      email: user.email || '',
      position: user.speakerProfile?.position || '',
      companyName: user.speakerProfile?.companyName || '',
      description: user.speakerProfile?.description || '',
      location: user.city && user.state && user.address
        ? `${user.city}, ${user.state}, ${user.address}`.trim() 
        : user.city || user.state || user.address || '',
      profilePicture: user.profilePicture || '',
      speakingStartTime: user.speakerProfile?.speakingStartTime || '',
      speakingEndTime: user.speakerProfile?.speakingEndTime || '',
    };
  }

  /**
   * Get user display info with safe handling of null/undefined fields
   * @param user User entity (can be partial)
   * @returns Display info object
   */
  static getUserDisplayInfo(user: Partial<UserEntity>) {
    return {
      id: user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.firstName || 'Unknown User',
      email: user.email || '',
    };
  }

  /**
   * Sanitize user data by removing sensitive fields
   * @param user User entity
   * @returns User data without sensitive fields
   */
  static sanitizeUserData(user: UserEntity): Partial<UserEntity> {
    const { 
      password, 
      resetToken, 
      resetTokenExpiry,
      otp, 
      otpExpiry,
      socialAccessToken, 
      socialRefreshToken,
      socialTokenExpiry,
      refreshToken,
      ...sanitizedUser 
    } = user;
    return sanitizedUser;
  }

  /**
   * Check if user has required fields for specific role
   * @param user User entity with optional speakerProfile
   * @param role User role to check
   * @returns Validation result
   */
  static validateUserForRole(user: Partial<UserEntity> & { speakerProfile?: any }, role: string): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    // Common required fields
    if (!user.firstName) missingFields.push('firstName');
    if (!user.lastName) missingFields.push('lastName');
    if (!user.email) missingFields.push('email');

    // Role-specific validations
    if (role === 'speaker') {
      if (!user.speakerProfile?.position) missingFields.push('position');
      if (!user.speakerProfile?.companyName) missingFields.push('companyName');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Generate user initials
   * @param user User entity
   * @returns User initials (e.g., "JD" for John Doe)
   */
  static getUserInitials(user: Partial<UserEntity>): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  /**
   * Format user address
   * @param user User entity
   * @returns Formatted address string
   */
  static formatUserAddress(user: Partial<UserEntity>): string {
    const parts = [
      user.address,
      user.city,
      user.state,
      user.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Get speaker info based on user role/permission level
   * @param user User entity (speaker) with optional speakerProfile
   * @param viewerRole Role of the person viewing (admin, user, etc.)
   * @returns Appropriate speaker data based on viewer permissions
   */
  static getSpeakerInfoByPermission(user: Partial<UserEntity> & { speakerProfile?: any }, viewerRole?: string) {
    switch (viewerRole) {
      case 'admin':
        return this.getAdminSpeakerInfo(user);
      case 'public':
        return this.getPublicSpeakerInfo(user);
      default:
        return this.getBasicSpeakerInfo(user);
    }
  }
}
