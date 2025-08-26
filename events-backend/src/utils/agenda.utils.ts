import { EventAgenda } from '../agenda/agenda.entity';

export interface FormattedAgenda {
  id: string;
  title: string;
  time: string;
  duration: number;
  location?: string;
  details?: string;
  category: string;
  meetingStatus?: string;
  requestStatus?: string;
  meetingNotes?: string;
  meetingDate?: Date;
  isMeetingRequest?: boolean;
  durationFormatted: string;
  timeRange: string;
  tableNumber?: string;
  luckyDrawTicketNumber?: string;
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
   * Format agenda data to show only readable, essential information
   * @param agendas Array of EventAgenda entities
   * @returns Array of formatted agenda objects
   */
  static formatAgendas(agendas: EventAgenda[]): FormattedAgenda[] {
    return agendas.map(agenda => ({
      id: agenda.id,
      title: agenda.title,
      time: agenda.time,
      duration: agenda.duration,
      location: agenda.location,
      details: agenda.details,
      category: agenda.category,
      meetingStatus: agenda.meetingStatus,
      requestStatus: agenda.requestStatus,
      meetingNotes: agenda.meetingNotes,
      meetingDate: agenda.meetingDate,
      isMeetingRequest: agenda.isMeetingRequest,
      tableNumber: agenda.tableNumber,
      luckyDrawTicketNumber: agenda.luckyDrawTicketNumber,
      // Add readable duration format
      durationFormatted: this.formatDuration(agenda.duration),
      // Add readable time range
      timeRange: this.getTimeRange(agenda.time, agenda.duration)
    }));
  }

  /**
   * Get user's personal agenda items for a specific event
   * @param agendaRepository TypeORM repository for EventAgenda
   * @param eventId Event ID
   * @param userId User ID
   * @returns Promise of formatted agenda items
   */
  static async getUserPersonalAgendas(
    agendaRepository: any,
    eventId: string,
    userId: string
  ): Promise<FormattedAgenda[]> {
    const myAgendas = await agendaRepository.find({
      where: [
        { eventId: eventId, userId: userId, isActive: true },
        { eventId: eventId, createdBy: userId, isActive: true }
      ],
      order: { time: 'ASC' }
    });

    return this.formatAgendas(myAgendas);
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
    const meetings = agendas.filter(a => a.category === 'Meeting').length;
    const workshops = agendas.filter(a => a.category === 'Workshop').length;
    const presentations = agendas.filter(a => a.category === 'Presentation').length;

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
    return agendas.filter(agenda => agenda.category === category);
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
}
