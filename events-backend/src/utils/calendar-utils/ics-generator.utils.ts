import { AgendaUtils } from '../agenda.utils';

export class ICSGenerator {
  /**
   * Generate .ics content for a single meeting
   */
  static generateMeetingICS(meeting: any, creator: any, targetUser: any): string {
    const startDate = meeting.time
      ? AgendaUtils.getMeetingStartDate(new Date(meeting.meetingDate), meeting.time)
      : new Date(meeting.meetingDate);
    const endDate = new Date(startDate.getTime() + (meeting.duration * 60 * 1000));
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Event Management System//Meeting Request//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${meeting.id}@eventsystem.com`,
      `DTSTAMP:${this.formatDateForICS(new Date())}`,
      `DTSTART:${this.formatDateForICS(startDate)}`,
      `DTEND:${this.formatDateForICS(endDate)}`,
      `SUMMARY:${this.escapeText(meeting.title)}`,
      `DESCRIPTION:${this.escapeText(meeting.details || 'Meeting request')}`,
      `LOCATION:${this.escapeText(meeting.location || 'Location not specified')}`,
      `ORGANIZER;CN=${this.escapeText(creator.firstName || creator.email)}:mailto:${creator.email}`,
      `ATTENDEE;CN=${this.escapeText(targetUser.firstName || targetUser.email)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:mailto:${targetUser.email}`,
      `STATUS:${meeting.meetingStatus === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      `CATEGORIES:Meeting Request`,
      `CLASS:PUBLIC`,
      `PRIORITY:5`,
      `TRANSP:OPAQUE`,
      `BEGIN:VALARM`,
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${this.escapeText(meeting.title)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Generate .ics content for multiple meetings
   */
  static generateMultipleMeetingsICS(meetings: any[], currentUser: any): string {
    const icsEvents = meetings.map(meeting => {
      const startDate = meeting.time
        ? AgendaUtils.getMeetingStartDate(new Date(meeting.meetingDate), meeting.time)
        : new Date(meeting.meetingDate);
      const endDate = new Date(startDate.getTime() + (meeting.duration * 60 * 1000));
      
      return [
        'BEGIN:VEVENT',
        `UID:${meeting.id}@eventsystem.com`,
        `DTSTAMP:${this.formatDateForICS(new Date())}`,
        `DTSTART:${this.formatDateForICS(startDate)}`,
        `DTEND:${this.formatDateForICS(endDate)}`,
        `SUMMARY:${this.escapeText(meeting.title)}`,
        `DESCRIPTION:${this.escapeText(meeting.details || 'Meeting request')}`,
        `LOCATION:${this.escapeText(meeting.location || 'Location not specified')}`,
        `STATUS:${meeting.meetingStatus === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        `CATEGORIES:Meeting Request`,
        `CLASS:PUBLIC`,
        `PRIORITY:5`,
        `TRANSP:OPAQUE`,
        `BEGIN:VALARM`,
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${this.escapeText(meeting.title)}`,
        'END:VALARM',
        'END:VEVENT'
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Event Management System//Multiple Meetings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:My Meeting Requests',
      'X-WR-CALDESC:All my meeting requests from Event Management System',
      ...icsEvents,
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Format date for ICS format (YYYYMMDDTHHMMSSZ)
   */
  private static formatDateForICS(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escape special characters in text for ICS format
   */
  private static escapeText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Generate filename for single meeting
   */
  static generateSingleMeetingFilename(meeting: any): string {
    const date = new Date(meeting.meetingDate);
    const dateStr = date.toISOString().split('T')[0];
    const title = meeting.title.replace(/[^a-zA-Z0-9]/g, '_');
    return `meeting_${title}_${dateStr}.ics`;
  }

  /**
   * Generate filename for multiple meetings
   */
  static generateMultipleMeetingsFilename(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return `all_meetings_${dateStr}.ics`;
  }
}
