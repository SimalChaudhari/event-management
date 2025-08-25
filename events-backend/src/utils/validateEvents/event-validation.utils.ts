import { ValidationException } from '../exceptions/custom-exceptions';
import { EventDto } from '../../event/event.dto';
import { Event } from '../../event/event.entity';

export class EventValidationUtils {
  /**
   * Validate event references (categories, speakers, exhibitors)
   */
  static async validateEventReferences(
    eventDto: Partial<EventDto>,
    validationFunctions: {
      validateCategory: (id: string) => Promise<boolean>;
      validateSpeaker: (id: string) => Promise<boolean>;
      validateExhibitor: (id: string) => Promise<boolean>;
    }
  ): Promise<void> {
    const validationErrors: string[] = [];

    // Validate category IDs if provided
    if (eventDto.categoryIds) {
      const categoryIdsArray = eventDto.categoryIds.split(',');
      for (const categoryId of categoryIdsArray) {
        const categoryExists = await validationFunctions.validateCategory(categoryId.trim());
        if (!categoryExists) {
          validationErrors.push(
            `Category with ID "${categoryId}" does not exist`,
          );
        }
      }
    }

    // Validate speaker IDs if provided
    if (eventDto.speakerIds) {
      const speakerIdsArray = eventDto.speakerIds.split(',');
      for (const speakerId of speakerIdsArray) {
        const speakerExists = await validationFunctions.validateSpeaker(speakerId.trim());
        if (!speakerExists) {
          validationErrors.push(
            `Speaker with ID "${speakerId}" does not exist`,
          );
        }
      }
    }

    // Validate exhibitor IDs if provided
    if (eventDto.exhibitorIds) {
      const exhibitorIdsArray = eventDto.exhibitorIds.split(',');
      for (const exhibitorId of exhibitorIdsArray) {
        const exhibitorExists = await validationFunctions.validateExhibitor(exhibitorId.trim());
        if (!exhibitorExists) {
          validationErrors.push(
            `Exhibitor with ID "${exhibitorId}" does not exist`,
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      throw new ValidationException('Invalid references', validationErrors);
    }
  }

  /**
   * Validate event dates and times
   */
  static validateEventDates(
    eventDto: Partial<EventDto>,
    existingEvent?: Event,
  ): void {
    const today = new Date();
    
    // Get start and end dates with times
    const startDateTime = eventDto.startDate && eventDto.startTime
      ? new Date(`${eventDto.startDate}T${eventDto.startTime}`)
      : existingEvent
        ? new Date(`${existingEvent.startDate}T${existingEvent.startTime}`)
        : null;
         
    const endDateTime = eventDto.endDate && eventDto.endTime
      ? new Date(`${eventDto.endDate}T${eventDto.endTime}`)
      : existingEvent
        ? new Date(`${existingEvent.endDate}T${existingEvent.endTime}`)
        : null;

    if (startDateTime && startDateTime < today) {
      throw new ValidationException('Start date and time cannot be in the past');
    }
    
    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      throw new ValidationException('End date and time must be after start date and time');
    }
    
    // Additional validation for same day events with AM/PM time conflicts
    if (startDateTime && endDateTime) {
      const startDateOnly = new Date(startDateTime.toDateString());
      const endDateOnly = new Date(endDateTime.toDateString());
      
      // If dates are the same, check if end time is before start time
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        const startTimeInMinutes = startDateTime.getHours() * 60 + startDateTime.getMinutes();
        const endTimeInMinutes = endDateTime.getHours() * 60 + endDateTime.getMinutes();
        
        if (endTimeInMinutes <= startTimeInMinutes) {
          throw new ValidationException(
            'For events on the same day, end time must be after start time. ' +
            'If you want the event to end the next day, please set the end date to the next day.'
          );
        }
      }
    }
  }

  /**
   * Validate event coordinates
   */
  static validateCoordinates(eventDto: Partial<EventDto>): void {
    if (
      eventDto.latitude &&
      (eventDto.latitude < -90 || eventDto.latitude > 90)
    ) {
      throw new ValidationException('Invalid latitude value');
    }
    if (
      eventDto.longitude &&
      (eventDto.longitude < -180 || eventDto.longitude > 180)
    ) {
      throw new ValidationException('Invalid longitude value');
    }
  }

  /**
   * Validate event type enum
   */
  static validateEventType(type: any, validTypes: any[]): void {
    if (type && !validTypes.includes(type)) {
      throw new ValidationException(
        `Invalid event type. Valid types are: ${validTypes.join(', ')}`,
      );
    }
  }

  /**
   * Validate event name uniqueness
   */
  static async validateEventNameUniqueness(
    name: string,
    checkUniqueness: (name: string, excludeId?: string) => Promise<boolean>,
    excludeId?: string
  ): Promise<void> {
    const isUnique = await checkUniqueness(name, excludeId);
    if (!isUnique) {
      throw new ValidationException(`Event name "${name}" already exists`);
    }
  }

  /**
   * Validate location conflict for events
   */
  static async validateLocationConflict(
    eventDto: Partial<EventDto>,
    checkLocationConflict: (location: string, startDate: string, endDate: string, excludeId?: string) => Promise<boolean>,
    excludeId?: string
  ): Promise<void> {
    if (!eventDto.location || !eventDto.startDate || !eventDto.endDate) {
      return; // Skip validation if required fields are missing
    }

    const hasConflict = await checkLocationConflict(
      eventDto.location,
      eventDto.startDate,
      eventDto.endDate,
      excludeId
    );

    if (hasConflict) {
      throw new ValidationException(
        'Another event is already scheduled at this location during these dates and times',
      );
    }
  }

  /**
   * Validate required fields for event creation
   */
  static validateRequiredFields(eventDto: EventDto): void {
    const requiredFields = ['name', 'startDate', 'startTime', 'endDate', 'endTime'];
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      if (!eventDto[field as keyof EventDto]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw new ValidationException(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
    }
  }

  /**
   * Validate event price and currency
   */
  static validateEventPricing(eventDto: Partial<EventDto>): void {
    if (eventDto.price !== undefined && eventDto.price < 0) {
      throw new ValidationException('Event price cannot be negative');
    }

    if (eventDto.price && !eventDto.currency) {
      throw new ValidationException('Currency is required when price is specified');
    }

    if (eventDto.currency && !eventDto.price) {
      throw new ValidationException('Price is required when currency is specified');
    }
  }
}
