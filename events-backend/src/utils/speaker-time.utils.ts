// src/utils/speaker-time.utils.ts
import { ValidationException } from './exceptions/custom-exceptions';

export interface SpeakerTimeValidation {
  speakerIds: string[];
  speakerStartTimes: string[];
  speakerEndTimes: string[];
}

export interface EventTimeInfo {
  startTime: string;
  endTime: string;
}

export class SpeakerTimeUtils {
  /**
   * Validates speaker times against event times and checks for overlaps
   * @param speakerData - Object containing speaker IDs and times
   * @param eventTime - Object containing event start and end times
   * @param existingEvent - Optional existing event for update scenarios
   */
  static validateSpeakerTimes(
    speakerData: SpeakerTimeValidation,
    eventTime: EventTimeInfo,
    existingEvent?: EventTimeInfo,
  ): void {
    if (!this.hasSpeakerTimes(speakerData)) {
      return; // No speaker times to validate
    }

    // Validate array consistency
    this.validateArrayConsistency(speakerData);

    // Get event times (from DTO or existing event)
    const eventStartTime = eventTime.startTime || existingEvent?.startTime;
    const eventEndTime = eventTime.endTime || existingEvent?.endTime;

    if (!eventStartTime || !eventEndTime) {
      throw new ValidationException('Event start and end times are required for speaker time validation');
    }

    // Validate each speaker's time
    this.validateIndividualSpeakerTimes(speakerData, eventStartTime, eventEndTime);

    // Check for overlapping times between speakers
    this.validateSpeakerTimeOverlaps(speakerData);
  }

  /**
   * Checks if speaker time data exists
   */
  private static hasSpeakerTimes(speakerData: SpeakerTimeValidation): boolean {
    return !!(speakerData.speakerIds && speakerData.speakerStartTimes && speakerData.speakerEndTimes);
  }

  /**
   * Validates that all arrays have the same length
   */
  private static validateArrayConsistency(speakerData: SpeakerTimeValidation): void {
    const { speakerIds, speakerStartTimes, speakerEndTimes } = speakerData;

    if (speakerIds.length !== speakerStartTimes.length || speakerIds.length !== speakerEndTimes.length) {
      throw new ValidationException(
        'Speaker IDs, start times, and end times must have the same number of entries',
      );
    }
  }

  /**
   * Validates each individual speaker's time
   */
  private static validateIndividualSpeakerTimes(
    speakerData: SpeakerTimeValidation,
    eventStartTime: string,
    eventEndTime: string,
  ): void {
    const { speakerIds, speakerStartTimes, speakerEndTimes } = speakerData;

    // Convert event times to minutes for comparison
    const eventStartMinutes = this.timeToMinutes(eventStartTime);
    const eventEndMinutes = this.timeToMinutes(eventEndTime);

    for (let i = 0; i < speakerIds.length; i++) {
      const startTime = speakerStartTimes[i].trim();
      const endTime = speakerEndTimes[i].trim();

      // Validate time format
      this.validateTimeFormat(startTime, endTime, i + 1);

      // Convert speaker times to minutes
      const speakerStartMinutes = this.timeToMinutes(startTime);
      const speakerEndMinutes = this.timeToMinutes(endTime);

      // Check if speaker time is within event time
      this.validateTimeRange(
        speakerStartMinutes,
        speakerEndMinutes,
        startTime,
        endTime,
        eventStartTime,
        eventEndTime,
        i + 1,
      );

      // Check if start time is before end time
      this.validateTimeOrder(speakerStartMinutes, speakerEndMinutes, startTime, endTime, i + 1);
    }
  }

  /**
   * Validates time format (HH:MM)
   */
  private static validateTimeFormat(startTime: string, endTime: string, speakerIndex: number): void {
    if (!this.isValidTimeFormat(startTime) || !this.isValidTimeFormat(endTime)) {
      throw new ValidationException(
        `Invalid time format for speaker ${speakerIndex}. Use HH:MM format (e.g., 09:30)`,
      );
    }
  }

  /**
   * Validates that speaker time is within event time range
   */
  private static validateTimeRange(
    speakerStartMinutes: number,
    speakerEndMinutes: number,
    startTime: string,
    endTime: string,
    eventStartTime: string,
    eventEndTime: string,
    speakerIndex: number,
  ): void {
    const eventStartMinutes = this.timeToMinutes(eventStartTime);
    const eventEndMinutes = this.timeToMinutes(eventEndTime);

    if (speakerStartMinutes < eventStartMinutes || speakerEndMinutes > eventEndMinutes) {
      throw new ValidationException(
        `Speaker ${speakerIndex} time (${startTime}-${endTime}) must be within event time (${eventStartTime}-${eventEndTime})`,
      );
    }
  }

  /**
   * Validates that start time is before end time
   */
  private static validateTimeOrder(
    speakerStartMinutes: number,
    speakerEndMinutes: number,
    startTime: string,
    endTime: string,
    speakerIndex: number,
  ): void {
    if (speakerStartMinutes >= speakerEndMinutes) {
      throw new ValidationException(
        `Speaker ${speakerIndex} start time (${startTime}) must be before end time (${endTime})`,
      );
    }
  }

  /**
   * Validates that no speaker times overlap
   */
  private static validateSpeakerTimeOverlaps(speakerData: SpeakerTimeValidation): void {
    const { speakerStartTimes, speakerEndTimes } = speakerData;

    for (let i = 0; i < speakerStartTimes.length; i++) {
      for (let j = i + 1; j < speakerStartTimes.length; j++) {
        const start1 = this.timeToMinutes(speakerStartTimes[i].trim());
        const end1 = this.timeToMinutes(speakerEndTimes[i].trim());
        const start2 = this.timeToMinutes(speakerStartTimes[j].trim());
        const end2 = this.timeToMinutes(speakerEndTimes[j].trim());

        if (this.timesOverlap(start1, end1, start2, end2)) {
          throw new ValidationException(
            `Speaker times overlap: Speaker ${i + 1} (${speakerStartTimes[i].trim()}-${speakerEndTimes[i].trim()}) and Speaker ${j + 1} (${speakerStartTimes[j].trim()}-${speakerEndTimes[j].trim()})`,
          );
        }
      }
    }
  }

  /**
   * Converts time string (HH:MM) to minutes
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Checks if time format is valid (HH:MM)
   */
  static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  }

  /**
   * Checks if two time ranges overlap
   */
  static timesOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Formats time for display (adds leading zero if needed)
   */
  static formatTimeForDisplay(time: string): string {
    if (!time) return time;
    
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  /**
   * Calculates duration between two times in minutes
   */
  static calculateDuration(startTime: string, endTime: string): number {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    return endMinutes - startMinutes;
  }

  /**
   * Checks if a time is between two other times
   */
  static isTimeBetween(time: string, startTime: string, endTime: string): boolean {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  /**
   * Sorts speaker times chronologically
   */
  static sortSpeakerTimesByStartTime(speakerData: SpeakerTimeValidation): SpeakerTimeValidation {
    const { speakerIds, speakerStartTimes, speakerEndTimes } = speakerData;
    
    // Create array of objects with index for sorting
    const speakersWithIndex = speakerIds.map((id, index) => ({
      id,
      startTime: speakerStartTimes[index],
      endTime: speakerEndTimes[index],
      originalIndex: index,
    }));

    // Sort by start time
    speakersWithIndex.sort((a, b) => {
      const aMinutes = this.timeToMinutes(a.startTime);
      const bMinutes = this.timeToMinutes(b.startTime);
      return aMinutes - bMinutes;
    });

    // Reconstruct arrays in sorted order
    return {
      speakerIds: speakersWithIndex.map(s => s.id),
      speakerStartTimes: speakersWithIndex.map(s => s.startTime),
      speakerEndTimes: speakersWithIndex.map(s => s.endTime),
    };
  }

  /**
   * Finds gaps between speaker times
   */
  static findTimeGaps(speakerData: SpeakerTimeValidation): Array<{ start: string; end: string; duration: number }> {
    const sortedData = this.sortSpeakerTimesByStartTime(speakerData);
    const gaps: Array<{ start: string; end: string; duration: number }> = [];

    for (let i = 0; i < sortedData.speakerEndTimes.length - 1; i++) {
      const currentEnd = sortedData.speakerEndTimes[i];
      const nextStart = sortedData.speakerStartTimes[i + 1];

      if (currentEnd !== nextStart) {
        const gapStart = currentEnd;
        const gapEnd = nextStart;
        const duration = this.calculateDuration(gapStart, gapEnd);

        gaps.push({
          start: gapStart,
          end: gapEnd,
          duration,
        });
      }
    }

    return gaps;
  }

  /**
   * Validates that there are no gaps smaller than minimum gap
   */
  static validateMinimumGap(
    speakerData: SpeakerTimeValidation,
    minimumGapMinutes: number = 0,
  ): void {
    if (minimumGapMinutes <= 0) return;

    const gaps = this.findTimeGaps(speakerData);
    
    for (const gap of gaps) {
      if (gap.duration < minimumGapMinutes) {
        throw new ValidationException(
          `Gap between speakers (${gap.start}-${gap.end}) is too small. Minimum gap required: ${minimumGapMinutes} minutes`,
        );
      }
    }
  }
}
