import { EventAgenda } from '../agenda/agenda.entity';

export interface FormattedAgenda {
  id: string;
  eventId: string;
  userId: string;
  createdBy: string;
  title: string;
  time: string;
  duration: number;
  location?: string;
  details?: string;
  category: {
    id: string;
    name: string;
    color?: string;
    isActive: boolean;
  } | null;
  categoryId: string;
  meetingStatus?: string;
  requestStatus?: string;
  requestType?: string;
  meetingNotes?: string;
  meetingDate?: Date;
  isMeetingRequest?: boolean;
  durationFormatted: string;
  startTime: string;
  endTime: string;
}

export class AgendaUtils {
  /**
   * Format duration in readable format
   * @param duration Duration in minutes
   * @returns Formatted duration string (e.g., "1h 30m", "45m")
   */
  static formatDuration(duration: number): string {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get readable time range
   * @param time Start time in HH:MM format
   * @param duration Duration in minutes
   * @returns Formatted time range (e.g., "14:00 - 15:30")
   */
  static getTimeRange(time: string, duration: number): string {
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = hours * 60 + minutes;
    const endTime = startTime + duration;
    
    const endHours = Math.floor(endTime / 60);
    const endMinutes = endTime % 60;
    
    const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    return `${time} - ${endTimeStr}`;
  }

  /**
   * Calculate end time based on start time and duration
   * @param time Start time in HH:MM format
   * @param duration Duration in minutes
   * @returns End time in HH:MM format (e.g., "15:30")
   */
  static calculateEndTime(time: string, duration: number): string {
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = hours * 60 + minutes;
    const endTime = startTime + duration;
    
    const endHours = Math.floor(endTime / 60);
    const endMinutes = endTime % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  /**
   * Validate if a date is in the future
   * @param dateString Date string to validate
   * @returns boolean True if date is in the future
   */
  static isFutureDate(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
  }

  /**
   * Validate if a date is within reasonable future limit (not more than 1 year)
   * @param dateString Date string to validate
   * @param maxYears Maximum years in the future (default: 1)
   * @returns boolean True if date is within reasonable future limit
   */
  static isReasonableFutureDate(dateString: string, maxYears: number = 1): boolean {
    const date = new Date(dateString);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + maxYears);
    return date <= maxDate;
  }

  /**
   * Validate meeting date (not in past, not too far in future)
   * @param dateString Date string to validate
   * @param maxYears Maximum years in the future (default: 1)
   * @returns object with validation result and error message if any
   */
  static validateMeetingDate(dateString: string, maxYears: number = 1): { isValid: boolean; errorMessage?: string } {
    if (!this.isFutureDate(dateString)) {
      return { 
        isValid: false, 
        errorMessage: 'Meeting date cannot be in the past.' 
      };
    }

    if (!this.isReasonableFutureDate(dateString, maxYears)) {
      return { 
        isValid: false, 
        errorMessage: `Meeting date cannot be more than ${maxYears} year(s) in the future.` 
      };
    }

    return { isValid: true };
  }

  /**
   * Format date for display
   * @param date Date to format
   * @returns Formatted date string
   */
  static formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format agenda data to show only readable, essential information
   * @param agendas Array of EventAgenda entities
   * @returns Array of formatted agenda objects
   */
  static formatAgendas(agendas: EventAgenda[]): FormattedAgenda[] {
    return agendas.map(agenda => ({
      id: agenda.id,
      eventId: agenda.eventId,
      userId: agenda.userId,
      createdBy: agenda.createdBy,
      title: agenda.title,
      time: agenda.time,
      duration: agenda.duration,
      location: agenda.location,
      details: agenda.details,
      category: agenda.category ? {
        id: agenda.category.id,
        name: agenda.category.name,
        color: agenda.category.color,
        isActive: agenda.category.isActive
      } : null,
      categoryId: agenda.categoryId,
      meetingStatus: agenda.meetingStatus,
      requestStatus: agenda.requestStatus,
      requestType: agenda.requestType,
      meetingNotes: agenda.meetingNotes,
      meetingDate: agenda.meetingDate,
      isMeetingRequest: agenda.isMeetingRequest,
      durationFormatted: this.formatDuration(agenda.duration),
      startTime: agenda.time,
      endTime: this.calculateEndTime(agenda.time, agenda.duration)
    }));
  }

  /**
   * Get user's personal agenda items for a specific event
   * @param agendaRepository TypeORM repository for EventAgenda
   * @param eventId Event ID
   * @param userId User ID
   * @param registerEventRepository Optional repository for RegisterEvent to get user's table/lucky draw info
   * @returns Promise of formatted agenda items
   */
  static async getUserPersonalAgendas(
    agendaRepository: any,
    eventId: string,
    userId: string,
    registerEventRepository?: any
  ): Promise<FormattedAgenda[]> {
    // Get all agendas where user is involved (either as recipient or creator)
    const allAgendas = await agendaRepository.find({
      where: [
        { eventId: eventId, userId: userId, isActive: true },
        { eventId: eventId, createdBy: userId, isActive: true }
      ],
      order: { time: 'ASC' }
    });

    // Filter and deduplicate agendas based on meeting request logic
    const filteredAgendas = this.filterRelevantAgendas(allAgendas, userId);

    let userRegistration = null;
    let event = null;
    if (registerEventRepository) {
      try {
        userRegistration = await registerEventRepository.findOne({
          where: { eventId: eventId, userId: userId },
          relations: ['event']
        });
        event = userRegistration?.event;
      } catch (error) {
        // If there's an error fetching registration, continue without table/lucky draw info
        console.warn('Could not fetch user registration for table/lucky draw info:', error);
      }
    }

    // Format agendas and include user's table/lucky draw info
    const formattedAgendas = this.formatAgendas(filteredAgendas);
    
    // Add user's table and lucky draw info to each agenda item
    return formattedAgendas.map(agenda => ({
      ...agenda,
      // No need to connect agenda with lucky draw functionality
    }));
  }

  /**
   * Filter agendas to show only relevant meeting requests based on user's role
   * @param agendas Array of all agendas where user is involved
   * @param userId Current user ID
   * @returns Filtered array of relevant agendas
   */
  private static filterRelevantAgendas(agendas: any[], userId: string): any[] {
    const agendaMap = new Map();
    
    agendas.forEach(agenda => {
      // Create a unique key based on meeting content (excluding ID and requestType)
      const meetingKey = `${agenda.eventId}-${agenda.title}-${agenda.time}-${agenda.duration}-${agenda.meetingDate}`;
      
      if (!agendaMap.has(meetingKey)) {
        // For the first occurrence, determine the appropriate requestType
        let finalRequestType = agenda.requestType;
        
        // If user is both creator and recipient, prioritize based on context
        if (agenda.userId === userId && agenda.createdBy === userId) {
          // Self-meeting - show as sent
          finalRequestType = 'sent';
        } else if (agenda.userId === userId) {
          // User is recipient - show as incoming
          finalRequestType = 'incoming';
        } else if (agenda.createdBy === userId) {
          // User is creator - show as sent
          finalRequestType = 'sent';
        }
        
        // Create a modified agenda object with the correct requestType
        const relevantAgenda = {
          ...agenda,
          requestType: finalRequestType
        };
        
        agendaMap.set(meetingKey, relevantAgenda);
      }
    });

    // Convert map values to array
    return Array.from(agendaMap.values());
  }

  /**
   * Get agenda summary for display
   * @param agendas Array of formatted agendas
   * @returns Summary object with counts and status breakdown
   */
  static getAgendaSummary(agendas: FormattedAgenda[]) {
    const total = agendas.length;
    const confirmed = agendas.filter(a => a.meetingStatus === 'confirmed').length;
    const pending = agendas.filter(a => a.meetingStatus === 'pending').length;
    const cancelled = agendas.filter(a => a.meetingStatus === 'cancelled').length;
    const meetings = agendas.filter(a => a.category?.name === 'Meeting').length;
    const workshops = agendas.filter(a => a.category?.name === 'Workshop').length;
    const presentations = agendas.filter(a => a.category?.name === 'Presentation').length;

    return {
      total,
      byStatus: { confirmed, pending, cancelled },
      byCategory: { meetings, workshops, presentations },
      hasMeetings: meetings > 0,
      hasPendingRequests: pending > 0
    };
  }

  /**
   * Sort agendas by priority (meeting requests first, then by time)
   * @param agendas Array of formatted agendas
   * @returns Sorted array of agendas
   */
  static sortAgendasByPriority(agendas: FormattedAgenda[]): FormattedAgenda[] {
    return [...agendas].sort((a, b) => {
      // Meeting requests first
      if (a.isMeetingRequest && !b.isMeetingRequest) return -1;
      if (!a.isMeetingRequest && b.isMeetingRequest) return 1;
      
      // Then by time
      return a.time.localeCompare(b.time);
    });
  }

  /**
   * Filter agendas by category
   * @param agendas Array of formatted agendas
   * @param category Category to filter by
   * @returns Filtered array of agendas
   */
  static filterAgendasByCategory(agendas: FormattedAgenda[], category: string): FormattedAgenda[] {
    return agendas.filter(agenda => agenda.category?.name === category);
  }

  /**
   * Filter agendas by status
   * @param agendas Array of formatted agendas
   * @param status Status to filter by
   * @returns Filtered array of agendas
   */
  static filterAgendasByStatus(agendas: FormattedAgenda[], status: string): FormattedAgenda[] {
    return agendas.filter(agenda => agenda.meetingStatus === status);
  }

  /**
   * Filter agendas by request type
   * @param agendas Array of formatted agendas
   * @param requestType Request type to filter by ('incoming' or 'sent')
   * @returns Filtered array of agendas
   */
  static filterAgendasByRequestType(agendas: FormattedAgenda[], requestType: string): FormattedAgenda[] {
    return agendas.filter(agenda => agenda.requestType === requestType);
  }

  /**
   * Get meeting requests summary
   * @param agendas Array of formatted agendas
   * @returns Summary object with request type counts
   */
  static getMeetingRequestsSummary(agendas: FormattedAgenda[]) {
    const meetingRequests = agendas.filter(a => a.isMeetingRequest);
    const incoming = meetingRequests.filter(a => a.requestType === 'incoming').length;
    const sent = meetingRequests.filter(a => a.requestType === 'sent').length;
    const pending = meetingRequests.filter(a => a.requestStatus === 'pending').length;
    const accepted = meetingRequests.filter(a => a.requestStatus === 'accepted').length;
    const rejected = meetingRequests.filter(a => a.requestStatus === 'rejected').length;

    return {
      total: meetingRequests.length,
      byType: { incoming, sent },
      byStatus: { pending, accepted, rejected },
      hasIncomingRequests: incoming > 0,
      hasSentRequests: sent > 0,
      hasPendingRequests: pending > 0
    };
  }

  /**
   * Check if a user is registered for an event
   * @param registerEventRepository Repository for RegisterEvent
   * @param userId User ID to check
   * @param eventId Event ID to check
   * @returns Promise<boolean> True if user is registered, false otherwise
   */
  static async isUserRegisteredForEvent(
    registerEventRepository: any,
    userId: string,
    eventId: string
  ): Promise<boolean> {
    try {
      const registration = await registerEventRepository.findOne({
        where: { 
          userId, 
          eventId, 
          isRegister: true,
          status: 'Sucesss' // Using the enum value from the entity
        }
      });
      
      return !!registration;
    } catch (error) {
      console.error('Error checking user event registration:', error);
      return false;
    }
  }
}
