// src/utils/user.utils.ts
import { UserEntity } from '../user/users.entity';
import { AddressEntity } from '../user/address.entity';

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
   * @param user User entity (speaker) with optional speakerProfile and addresses
   * @returns Public speaker data with only allowed fields
   */
  static getPublicSpeakerInfo(user: Partial<UserEntity> & { speakerProfile?: any; addresses?: AddressEntity[] }) {
    const defaultAddress = user.addresses?.find(addr => addr.isDefault) || user.addresses?.[0];
    
    return {
      id: user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.firstName || 'Unknown Speaker',
      email: user.email || '',
      position: user.speakerProfile?.position || '',
      companyName: user.speakerProfile?.companyName || '',
      description: user.speakerProfile?.description || '',
      location: defaultAddress 
        ? `${defaultAddress.city}, ${defaultAddress.state}`.trim() 
        : '',
      profilePicture: user.profilePicture || '',
      linkedinProfile: user.linkedinProfile || '',
      // Add more user fields for complete information
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      mobile: user.mobile || '',
      defaultAddress: defaultAddress ? {
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
        country: defaultAddress.country
      } : null,
      countryCurrency: user.countryCurrency || '',
      isVerify: user.isVerify || false,
      role: user.role || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get admin speaker information (more detailed)
   * @param user User entity (speaker) with optional speakerProfile and addresses
   * @returns Speaker data for admin view
   */
  static getAdminSpeakerInfo(user: Partial<UserEntity> & { speakerProfile?: any; addresses?: AddressEntity[] }) {
    const defaultAddress = user.addresses?.find(addr => addr.isDefault) || user.addresses?.[0];
    
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
      // addresses: user.addresses || [],
      addresses: defaultAddress ? {
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
        country: defaultAddress.country
      } : null,
      countryCurrency: user.countryCurrency || '',
      isVerify: user.isVerify || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get basic speaker info for events (minimal fields)
   * @param user User entity (speaker) with optional speakerProfile and addresses
   * @returns Basic speaker info for event displays
   */
  static getBasicSpeakerInfo(user: Partial<UserEntity> & { speakerProfile?: any; addresses?: AddressEntity[] }) {

    const defaultAddress = user.addresses?.find(addr => addr.isDefault) || user.addresses?.[0];
  
    return {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user.firstName || 'Unknown Speaker',
      email: user.email || '',
      position: user.speakerProfile?.position || '',
      companyName: user.speakerProfile?.companyName || '',
      description: user.speakerProfile?.description || '',
      location: defaultAddress
        ? `${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.street}`.trim() 
        : '',
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
   * Sanitize user data by removing sensitive fields and adding address information
   * @param user User entity with addresses
   * @returns User data without sensitive fields but with address information
   */
  static sanitizeUserData(user: UserEntity): any {
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
    
    return {
      ...sanitizedUser,
      formattedAddress: this.formatUserAddress(user)
    };
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
   * Format user address from addresses relationship
   * @param user User entity with addresses
   * @param addressType Optional address type to find, defaults to default address
   * @returns Formatted address string
   */
  static formatUserAddress(user: Partial<UserEntity> & { addresses?: AddressEntity[] }, addressType?: string): string {
    let address: AddressEntity | undefined;
    
    if (addressType) {
      address = user.addresses?.find(addr => addr.type === addressType);
    } else {
      address = user.addresses?.find(addr => addr.isDefault) || user.addresses?.[0];
    }
    
    if (!address) return '';
    
    const parts = [
      address.street,
      address.apartment,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Get default address for user
   * @param user User entity with addresses
   * @returns Default address or first address if no default set
   */
  static getDefaultAddress(user: Partial<UserEntity> & { addresses?: AddressEntity[] }): AddressEntity | null {
    if (!user.addresses || user.addresses.length === 0) return null;
    return user.addresses.find(addr => addr.isDefault) || user.addresses[0] || null;
  }

  /**
   * Get speaker info based on user role/permission level
   * @param user User entity (speaker) with optional speakerProfile and addresses
   * @param viewerRole Role of the person viewing (admin, user, etc.)
   * @returns Appropriate speaker data based on viewer permissions
   */
  static getSpeakerInfoByPermission(user: Partial<UserEntity> & { speakerProfile?: any; addresses?: AddressEntity[] }, viewerRole?: string) {
    switch (viewerRole) {
      case 'admin':
        return this.getAdminSpeakerInfo(user);
      case 'public':
        return this.getPublicSpeakerInfo(user);
      default:
        return this.getBasicSpeakerInfo(user);
    }
  }

  /**
   * Format programme tracks with basic speaker information
   * @param programmeTracks Programme tracks array with sessions and speakers
   * @returns Formatted programme tracks with sanitized speaker data
   */
  static formatProgrammeTracks(programmeTracks: any[]): any[] {
    if (!programmeTracks || !Array.isArray(programmeTracks)) {
      return [];
    }

    return programmeTracks.map(track => ({
      ...track,
      sessions: track.sessions?.map((session: any) => ({
        ...session,
        speakers: session.speakers?.map((speaker: any) => 
          this.getBasicSpeakerInfo(speaker)
        ) || []
      })) || []
    }));
  }

  /**
   * Format engagements with minimal essential data
   * @param engagements Engagements array with track relations
   * @param isUserFacing If true, filter out inactive tracks and inactive sessions for regular users
   * @returns Formatted engagements with only required fields
   */
  static formatEngagements(engagements: any[], isUserFacing: boolean = false): any[] {
    if (!engagements || !Array.isArray(engagements)) {
      return [];
    }

    // Group engagements by event
    const eventsMap = new Map();

    engagements.forEach(engagement => {
      const eventId = engagement.track?.event?.id;
      if (!eventId) return;

      // For user-facing APIs: Skip inactive engagements and inactive tracks
      if (isUserFacing) {
        // Skip if engagement is not active (false, null, or undefined)
        if (engagement.isActive !== true) return;
        // Skip if track is not active (false, null, or undefined)
        if (engagement.track?.isActive !== true) return;
      }

      if (!eventsMap.has(eventId)) {
        eventsMap.set(eventId, {
          event: {
            id: engagement.track?.event?.id,
            name: engagement.track?.event?.name,
            startDate: engagement.track?.event?.startDate,
            endDate: engagement.track?.event?.endDate,
            startTime: engagement.track?.event?.startTime,
            endTime: engagement.track?.event?.endTime,
          },
          programmeTracks: [],
          allStatistics: {
            questionsCount: 0,
            answeredQuestionsCount: 0,
            unansweredQuestionsCount: 0,
            pollsCount: 0,
            totalVotesCount: 0
          },
          totalSessionsCount: 0
        });
      }

      const eventData = eventsMap.get(eventId);
      
      // Filter sessions based on sessionIds if available
      const allSessions = engagement.track?.sessions || [];
      const sessionIds = engagement.sessionIds;
      let filteredSessions = (sessionIds && sessionIds.length > 0)
        ? allSessions.filter((session: any) => sessionIds.includes(session.id))
        : allSessions;

      // For user-facing APIs: Filter out inactive sessions
      if (isUserFacing) {
        filteredSessions = filteredSessions.filter((session: any) => session.isActive === true);
      }

      // Track with sessions
      const track = {
        id: engagement.track?.id,
        title: engagement.track?.title,
        engagementId: engagement.id,
        trackId: engagement.trackId,
        isActive: engagement.isActive,
        sessionIds: engagement.sessionIds, // Include sessionIds
        createdAt: engagement.createdAt,
        updatedAt: engagement.updatedAt,
        sessions: filteredSessions.map((session: any) => ({
          id: session.id,
          title: session.title,
          startDate: session.startDate || session.sessionDate,
          startTime: session.startTime,
          endDate: session.endDate,
          endTime: session.endTime,
          speakers: session.speakers?.map((speaker: any) => ({
            id: speaker.id,
            firstName: speaker.firstName || '',
            lastName: speaker.lastName || '',
            name: `${speaker.firstName || ''} ${speaker.lastName || ''}`.trim() || 'Unknown Speaker',
            profilePicture: speaker.profilePicture || '',
            description: speaker.speakerProfile?.description || ''
          })) || [],
          isActive: session.isActive !== undefined ? session.isActive : true,
          statistics: session.statistics || {
            questionsCount: 0,
            answeredQuestionsCount: 0,
            unansweredQuestionsCount: 0,
            pollsCount: 0,
            totalVotesCount: 0
          },
          questions: session.questions || [],
          polling: session.polling || null
        })),
        sessionsCount: filteredSessions.length
      };

      eventData.programmeTracks.push(track);
      eventData.totalSessionsCount += track.sessionsCount;

      // Merge statistics
      if (engagement.statistics) {
        eventData.allStatistics.questionsCount += engagement.statistics.questionsCount || 0;
        eventData.allStatistics.answeredQuestionsCount += engagement.statistics.answeredQuestionsCount || 0;
        eventData.allStatistics.unansweredQuestionsCount += engagement.statistics.unansweredQuestionsCount || 0;
        eventData.allStatistics.pollsCount += engagement.statistics.pollsCount || 0;
        eventData.allStatistics.totalVotesCount += engagement.statistics.totalVotesCount || 0;
      }
    });

    // Convert map to array
    return Array.from(eventsMap.values()).map(eventData => ({
      event: eventData.event,
      programmeTracks: eventData.programmeTracks,
      statistics: eventData.allStatistics,
      totalSessionsCount: eventData.totalSessionsCount
    }));
  }

  /**
   * Get engagements for an event by fetching all engagements linked to event's programme tracks
   * @param eventId Event ID
   * @param eventRepository Event repository instance
   * @param engagementRepository Engagement repository instance
   * @returns Formatted engagements object (converted from array)
   */
  static async getEngagementsByEventId(
    eventId: string,
    eventRepository: any,
    engagementRepository: any,
    isUserFacing: boolean = true // Default to true for user-facing APIs
  ): Promise<any> {
    try {
      // Get all programme tracks for this event
      const event = await eventRepository.findOne({
        where: { id: eventId },
        relations: ['programmeTracks'],
      });

      if (!event || !event.programmeTracks || event.programmeTracks.length === 0) {
        return {
          event: null,
          programmeTracks: [],
          statistics: {
            questionsCount: 0,
            answeredQuestionsCount: 0,
            unansweredQuestionsCount: 0,
            pollsCount: 0,
            totalVotesCount: 0
          },
          totalSessionsCount: 0
        };
      }

      // Get all track IDs - filter active tracks if user-facing
      let trackIds = event.programmeTracks.map((track: any) => track.id);
      if (isUserFacing) {
        trackIds = event.programmeTracks
          .filter((track: any) => track.isActive === true)
          .map((track: any) => track.id);
      }

      // Build where condition
      let whereCondition: any[];
      if (isUserFacing) {
        // For user-facing: only active engagements
        whereCondition = trackIds.map((trackId: string) => ({ 
          trackId, 
          isActive: true
        }));
      } else {
        // For admin: all engagements
        whereCondition = trackIds.map((trackId: string) => ({ trackId }));
      }

      // Fetch all engagements for these tracks
      let engagements = await engagementRepository.find({
        where: whereCondition,
        relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      });

      // Filter out inactive tracks if user-facing (TypeORM doesn't support nested where easily)
      if (isUserFacing) {
        engagements = engagements.filter((engagement: any) => engagement.track?.isActive === true);
      }

      // Format engagements as array first - pass isUserFacing parameter
      const formattedArray = this.formatEngagements(engagements, isUserFacing);
      
      // Convert array to object (return first element or empty object structure)
      if (formattedArray && formattedArray.length > 0) {
        return formattedArray[0];
      }
      
      return {
        event: {
          id: eventId,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
        },
        programmeTracks: [],
        statistics: {
          questionsCount: 0,
          answeredQuestionsCount: 0,
          unansweredQuestionsCount: 0,
          pollsCount: 0,
          totalVotesCount: 0
        },
        totalSessionsCount: 0
      };
    } catch (error) {
      console.error(`Error fetching engagements for event ${eventId}:`, error);
      return {
        event: null,
        programmeTracks: [],
        statistics: {
          questionsCount: 0,
          answeredQuestionsCount: 0,
          unansweredQuestionsCount: 0,
          pollsCount: 0,
          totalVotesCount: 0
        },
        totalSessionsCount: 0
      };
    }
  }
}
