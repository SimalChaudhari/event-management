// src/services/survey.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Survey, SurveyResponse, SurveySession } from './survey.entity';
import {
  CreateSurveyDto,
  SurveyResponseDto,
  CreateSessionDto,
} from './survey.dto';
import { Event } from 'event/event.entity';
import {
  ValidationException,
  ResourceNotFoundException,
  DuplicateResourceException,
  BusinessLogicException,
} from '../utils/exceptions/custom-exceptions';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { UserEntity } from 'user/users.entity';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(SurveySession)
    private surveySessionRepository: Repository<SurveySession>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private errorHandler: ErrorHandlerService,
  ) {}

  // Helper function to validate time format
  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Calculate event duration in days
  private calculateEventDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Including both start and end date
  }

  // Convert time string to minutes
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Generate session suggestions based on event data
  private generateSessionSuggestions(event: Event) {
    try {
      // Convert string dates to Date objects
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      const days = this.calculateEventDays(startDate, endDate);
      const suggestions = [];

      const start = new Date(startDate);

      for (let day = 1; day <= days; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + day - 1);
        const dateStr = currentDate.toISOString().split('T')[0];

        const daySuggestions = {
          day: day,
          date: dateStr,
          sessions: [
            {
              name: `Day ${day} - Morning Session`,
              startTime: '09:00:00',
              endTime: '10:30:00',
              description: `Morning session for Day ${day}`,
            },
            {
              name: `Day ${day} - Mid Morning Session`,
              startTime: '10:30:00',
              endTime: '12:00:00',
              description: `Mid morning session for Day ${day}`,
            },
            {
              name: `Day ${day} - Afternoon Session`,
              startTime: '13:00:00',
              endTime: '15:00:00',
              description: `Afternoon session for Day ${day}`,
            },
            {
              name: `Day ${day} - Late Afternoon Session`,
              startTime: '15:00:00',
              endTime: '17:00:00',
              description: `Late afternoon session for Day ${day}`,
            },
            {
              name: `Day ${day} - Evening Session`,
              startTime: '17:00:00',
              endTime: '18:00:00',
              description: `Evening session for Day ${day}`,
            },
          ],
        };

        suggestions.push(daySuggestions);
      }

      return suggestions;
    } catch (error: any) {
      this.errorHandler.logError(error, 'Generate session suggestions');
      throw new BusinessLogicException(
        'Failed to generate session suggestions',
      );
    }
  }

  // Get event suggestions by event ID
  async getEventSuggestionsByEventId(eventId: string) {
    try {
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Convert string dates to Date objects
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      const totalDays = this.calculateEventDays(startDate, endDate);
      const startTimeMinutes = this.timeToMinutes(event.startTime);
      const endTimeMinutes = this.timeToMinutes(event.endTime);
      const hoursPerDay = (endTimeMinutes - startTimeMinutes) / 60;
      const totalHours = totalDays * hoursPerDay;

      const sessionSuggestions = this.generateSessionSuggestions(event);

      return {
        eventInfo: {
          id: event.id,
          name: event.name,
          description: event.description,
          startDate: event.startDate,
          startTime: event.startTime,
          endDate: event.endDate,
          endTime: event.endTime,
          location: event.location,
          venue: event.venue,
        },
        sessionSuggestions,
        timeSlots: [
          { name: 'Morning', startTime: '09:00:00', endTime: '10:30:00' },
          { name: 'Mid Morning', startTime: '10:30:00', endTime: '12:00:00' },
          { name: 'Afternoon', startTime: '13:00:00', endTime: '15:00:00' },
          {
            name: 'Late Afternoon',
            startTime: '15:00:00',
            endTime: '17:00:00',
          },
          { name: 'Evening', startTime: '17:00:00', endTime: '18:00:00' },
        ],
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get event suggestions by ID');
      this.errorHandler.handleDatabaseError(error, 'Event suggestions');
    }
  }

  // Validate survey data with event
  private async validateSurveyWithEvent(surveyData: any): Promise<Event> {
    try {
      // 1. Check if event exists
      const event = await this.eventRepository.findOne({
        where: { id: surveyData.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', surveyData.eventId);
      }

      // 2. Convert dates to Date objects for comparison
      const surveyStartDate = new Date(surveyData.startDate);
      const surveyEndDate = new Date(surveyData.endDate);
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      // Format dates for better readability in errors
      const eventStartDateStr = eventStartDate.toISOString().split('T')[0];
      const eventEndDateStr = eventEndDate.toISOString().split('T')[0];
      const surveyStartDateStr = surveyStartDate.toISOString().split('T')[0];
      const surveyEndDateStr = surveyEndDate.toISOString().split('T')[0];

      // 3. Enhanced validation with detailed suggestions
      if (surveyStartDate < eventStartDate) {
        throw new ValidationException(
          `Survey start date (${surveyStartDateStr}) cannot be before event start date. ` +
            `Event "${event.name}" runs from ${eventStartDateStr} to ${eventEndDateStr}. ` +
            `Suggested: Use startDate: "${eventStartDateStr}" or any date between ${eventStartDateStr} and ${eventEndDateStr}.`,
          [
            {
              field: 'startDate',
              providedValue: surveyStartDateStr,
              suggestedValue: eventStartDateStr,
              validRange: `${eventStartDateStr} to ${eventEndDateStr}`,
              eventInfo: {
                name: event.name,
                startDate: eventStartDateStr,
                endDate: eventEndDateStr,
                startTime: event.startTime,
                endTime: event.endTime,
              },
            },
          ],
        );
      }

      if (surveyEndDate > eventEndDate) {
        throw new ValidationException(
          `Survey end date (${surveyEndDateStr}) cannot be after event end date. ` +
            `Event "${event.name}" runs from ${eventStartDateStr} to ${eventEndDateStr}. ` +
            `Suggested: Use endDate: "${eventEndDateStr}" or any date between ${eventStartDateStr} and ${eventEndDateStr}.`,
          [
            {
              field: 'endDate',
              providedValue: surveyEndDateStr,
              suggestedValue: eventEndDateStr,
              validRange: `${eventStartDateStr} to ${eventEndDateStr}`,
              eventInfo: {
                name: event.name,
                startDate: eventStartDateStr,
                endDate: eventEndDateStr,
                startTime: event.startTime,
                endTime: event.endTime,
              },
            },
          ],
        );
      }

      // 4. Validate time formats with suggestions
      if (!this.validateTimeFormat(surveyData.startTime)) {
        throw new ValidationException(
          `Invalid start time format "${surveyData.startTime}". Use HH:MM:SS format. ` +
            `Event "${event.name}" starts at ${event.startTime}. ` +
            `Suggested: Use startTime: "${event.startTime}" or time in HH:MM:SS format.`,
          [
            {
              field: 'startTime',
              providedValue: surveyData.startTime,
              suggestedValue: event.startTime,
              validFormat: 'HH:MM:SS',
              eventInfo: {
                name: event.name,
                startTime: event.startTime,
                endTime: event.endTime,
              },
            },
          ],
        );
      }

      if (!this.validateTimeFormat(surveyData.endTime)) {
        throw new ValidationException(
          `Invalid end time format "${surveyData.endTime}". Use HH:MM:SS format. ` +
            `Event "${event.name}" ends at ${event.endTime}. ` +
            `Suggested: Use endTime: "${event.endTime}" or time in HH:MM:SS format.`,
          [
            {
              field: 'endTime',
              providedValue: surveyData.endTime,
              suggestedValue: event.endTime,
              validFormat: 'HH:MM:SS',
              eventInfo: {
                name: event.name,
                startTime: event.startTime,
                endTime: event.endTime,
              },
            },
          ],
        );
      }

      // 5. Enhanced time range validation
      const surveyStartTimeMinutes = this.timeToMinutes(surveyData.startTime);
      const surveyEndTimeMinutes = this.timeToMinutes(surveyData.endTime);
      const eventStartTimeMinutes = this.timeToMinutes(event.startTime);
      const eventEndTimeMinutes = this.timeToMinutes(event.endTime);

      if (surveyEndTimeMinutes <= surveyStartTimeMinutes) {
        throw new ValidationException(
          `Survey end time (${surveyData.endTime}) must be after start time (${surveyData.startTime}). ` +
            `Event "${event.name}" timing: ${event.startTime} to ${event.endTime}. ` +
            `Suggested: Use startTime: "${event.startTime}" and endTime: "${event.endTime}".`,
          [
            {
              field: 'timeRange',
              providedStartTime: surveyData.startTime,
              providedEndTime: surveyData.endTime,
              suggestedStartTime: event.startTime,
              suggestedEndTime: event.endTime,
              eventInfo: {
                name: event.name,
                startTime: event.startTime,
                endTime: event.endTime,
              },
            },
          ],
        );
      }

      // For same day events, check time range with detailed suggestions
      if (
        surveyStartDate.getTime() === surveyEndDate.getTime() &&
        surveyStartDate.getTime() === eventStartDate.getTime()
      ) {
        if (surveyStartTimeMinutes < eventStartTimeMinutes) {
          throw new ValidationException(
            `Survey start time (${surveyData.startTime}) cannot be before event start time (${event.startTime}) on ${eventStartDateStr}. ` +
              `Event "${event.name}" starts at ${event.startTime} and ends at ${event.endTime}. ` +
              `Suggested: Use startTime: "${event.startTime}" or any time between ${event.startTime} and ${event.endTime}.`,
            [
              {
                field: 'startTime',
                providedValue: surveyData.startTime,
                suggestedValue: event.startTime,
                validTimeRange: `${event.startTime} to ${event.endTime}`,
                eventInfo: {
                  name: event.name,
                  date: eventStartDateStr,
                  startTime: event.startTime,
                  endTime: event.endTime,
                },
              },
            ],
          );
        }

        if (surveyEndTimeMinutes > eventEndTimeMinutes) {
          throw new ValidationException(
            `Survey end time (${surveyData.endTime}) cannot be after event end time (${event.endTime}) on ${eventEndDateStr}. ` +
              `Event "${event.name}" starts at ${event.startTime} and ends at ${event.endTime}. ` +
              `Suggested: Use endTime: "${event.endTime}" or any time between ${event.startTime} and ${event.endTime}.`,
            [
              {
                field: 'endTime',
                providedValue: surveyData.endTime,
                suggestedValue: event.endTime,
                validTimeRange: `${event.startTime} to ${event.endTime}`,
                eventInfo: {
                  name: event.name,
                  date: eventEndDateStr,
                  startTime: event.startTime,
                  endTime: event.endTime,
                },
              },
            ],
          );
        }
      }

      // 6. Validate sessions with enhanced error messages
      if (surveyData.sessions && surveyData.sessions.length > 0) {
        await this.validateSessionsWithSuggestions(
          surveyData.sessions,
          event,
          surveyStartDate,
          surveyEndDate,
        );
      }

      return event;
    } catch (error: any) {
      if (
        error instanceof ValidationException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Survey validation with event');
      this.errorHandler.handleDatabaseError(error, 'Survey validation');
    }
  }

  // Enhanced session validation with suggestions
  private async validateSessionsWithSuggestions(
    sessions: CreateSessionDto[],
    event: Event,
    surveyStartDate: Date,
    surveyEndDate: Date,
  ): Promise<void> {
    try {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      const eventStartTimeMinutes = this.timeToMinutes(event.startTime);
      const eventEndTimeMinutes = this.timeToMinutes(event.endTime);

      const eventStartDateStr = eventStartDate.toISOString().split('T')[0];
      const eventEndDateStr = eventEndDate.toISOString().split('T')[0];
      const surveyStartDateStr = surveyStartDate.toISOString().split('T')[0];
      const surveyEndDateStr = surveyEndDate.toISOString().split('T')[0];

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        const sessionDate = new Date(session.date);
        const sessionDateStr = sessionDate.toISOString().split('T')[0];

        // 1. Session date validation with suggestions
        if (sessionDate < surveyStartDate || sessionDate > surveyEndDate) {
          throw new ValidationException(
            `Session ${i + 1} "${session.name}" date (${sessionDateStr}) is outside survey date range (${surveyStartDateStr} to ${surveyEndDateStr}). ` +
              `Event "${event.name}" runs from ${eventStartDateStr} to ${eventEndDateStr}. ` +
              `Suggested: Use any date between ${surveyStartDateStr} and ${surveyEndDateStr}.`,
            [
              {
                field: `sessions[${i}].date`,
                sessionName: session.name,
                providedValue: sessionDateStr,
                validRange: `${surveyStartDateStr} to ${surveyEndDateStr}`,
                eventDateRange: `${eventStartDateStr} to ${eventEndDateStr}`,
                suggestedValue: surveyStartDateStr,
                eventInfo: {
                  name: event.name,
                  startDate: eventStartDateStr,
                  endDate: eventEndDateStr,
                },
              },
            ],
          );
        }

        if (sessionDate < eventStartDate || sessionDate > eventEndDate) {
          throw new ValidationException(
            `Session ${i + 1} "${session.name}" date (${sessionDateStr}) is outside event date range. ` +
              `Event "${event.name}" runs from ${eventStartDateStr} to ${eventEndDateStr}. ` +
              `Suggested: Use any date between ${eventStartDateStr} and ${eventEndDateStr}.`,
            [
              {
                field: `sessions[${i}].date`,
                sessionName: session.name,
                providedValue: sessionDateStr,
                validRange: `${eventStartDateStr} to ${eventEndDateStr}`,
                suggestedValue: eventStartDateStr,
                eventInfo: {
                  name: event.name,
                  startDate: eventStartDateStr,
                  endDate: eventEndDateStr,
                },
              },
            ],
          );
        }

        // 2. Session time format validation with suggestions
        if (!this.validateTimeFormat(session.startTime)) {
          throw new ValidationException(
            `Session ${i + 1} "${session.name}" start time format is invalid. Use HH:MM:SS format. ` +
              `Event "${event.name}" timing: ${event.startTime} to ${event.endTime}. ` +
              `Suggested: Use time in HH:MM:SS format, e.g., "${event.startTime}".`,
            [
              {
                field: `sessions[${i}].startTime`,
                sessionName: session.name,
                providedValue: session.startTime,
                validFormat: 'HH:MM:SS',
                suggestedValue: event.startTime,
                eventInfo: {
                  name: event.name,
                  startTime: event.startTime,
                  endTime: event.endTime,
                },
              },
            ],
          );
        }

        if (!this.validateTimeFormat(session.endTime)) {
          throw new ValidationException(
            `Session ${i + 1} "${session.name}" end time format is invalid. Use HH:MM:SS format. ` +
              `Event "${event.name}" timing: ${event.startTime} to ${event.endTime}. ` +
              `Suggested: Use time in HH:MM:SS format, e.g., "${event.endTime}".`,
            [
              {
                field: `sessions[${i}].endTime`,
                sessionName: session.name,
                providedValue: session.endTime,
                validFormat: 'HH:MM:SS',
                suggestedValue: event.endTime,
                eventInfo: {
                  name: event.name,
                  startTime: event.startTime,
                  endTime: event.endTime,
                },
              },
            ],
          );
        }

        // 3. Session time logic validation
        const sessionStartMinutes = this.timeToMinutes(session.startTime);
        const sessionEndMinutes = this.timeToMinutes(session.endTime);

        if (sessionEndMinutes <= sessionStartMinutes) {
          const suggestedEndTime = this.addMinutesToTime(session.startTime, 90); // Add 1.5 hours
          throw new ValidationException(
            `Session ${i + 1} "${session.name}" end time (${session.endTime}) must be after start time (${session.startTime}). ` +
              `Event "${event.name}" timing: ${event.startTime} to ${event.endTime}. ` +
              `Suggested: Use endTime: "${suggestedEndTime}" or any time after ${session.startTime}.`,
            [
              {
                field: `sessions[${i}].timeRange`,
                sessionName: session.name,
                providedStartTime: session.startTime,
                providedEndTime: session.endTime,
                suggestedEndTime: suggestedEndTime,
                eventInfo: {
                  name: event.name,
                  startTime: event.startTime,
                  endTime: event.endTime,
                },
              },
            ],
          );
        }

        // 4. Session within event time range validation
        if (sessionDate.getTime() === eventStartDate.getTime()) {
          if (sessionStartMinutes < eventStartTimeMinutes) {
            throw new ValidationException(
              `Session ${i + 1} "${session.name}" start time (${session.startTime}) cannot be before event start time (${event.startTime}) on ${eventStartDateStr}. ` +
                `Event "${event.name}" runs from ${event.startTime} to ${event.endTime}. ` +
                `Suggested: Use startTime: "${event.startTime}" or later.`,
              [
                {
                  field: `sessions[${i}].startTime`,
                  sessionName: session.name,
                  providedValue: session.startTime,
                  suggestedValue: event.startTime,
                  eventDate: eventStartDateStr,
                  validTimeRange: `${event.startTime} to ${event.endTime}`,
                  eventInfo: {
                    name: event.name,
                    date: eventStartDateStr,
                    startTime: event.startTime,
                    endTime: event.endTime,
                  },
                },
              ],
            );
          }
        }

        if (sessionDate.getTime() === eventEndDate.getTime()) {
          if (sessionEndMinutes > eventEndTimeMinutes) {
            throw new ValidationException(
              `Session ${i + 1} "${session.name}" end time (${session.endTime}) cannot be after event end time (${event.endTime}) on ${eventEndDateStr}. ` +
                `Event "${event.name}" runs from ${event.startTime} to ${event.endTime}. ` +
                `Suggested: Use endTime: "${event.endTime}" or earlier.`,
              [
                {
                  field: `sessions[${i}].endTime`,
                  sessionName: session.name,
                  providedValue: session.endTime,
                  suggestedValue: event.endTime,
                  eventDate: eventEndDateStr,
                  validTimeRange: `${event.startTime} to ${event.endTime}`,
                  eventInfo: {
                    name: event.name,
                    date: eventEndDateStr,
                    startTime: event.startTime,
                    endTime: event.endTime,
                  },
                },
              ],
            );
          }
        }

        // 5. Session overlap validation with suggestions
        for (let j = i + 1; j < sessions.length; j++) {
          const otherSession = sessions[j];
          const otherSessionDate = new Date(otherSession.date);

          if (sessionDate.getTime() === otherSessionDate.getTime()) {
            const otherStartMinutes = this.timeToMinutes(
              otherSession.startTime,
            );
            const otherEndMinutes = this.timeToMinutes(otherSession.endTime);

            if (
              sessionStartMinutes < otherEndMinutes &&
              sessionEndMinutes > otherStartMinutes
            ) {
              const suggestedTime = this.addMinutesToTime(session.endTime, 15); // 15 min gap
              throw new ValidationException(
                `Session ${i + 1} "${session.name}" (${session.startTime}-${session.endTime}) overlaps with Session ${j + 1} "${otherSession.name}" (${otherSession.startTime}-${otherSession.endTime}) on ${sessionDateStr}. ` +
                  `Suggested: Adjust Session ${j + 1} to start at "${suggestedTime}" or later to avoid overlap.`,
                [
                  {
                    field: `sessions[${i}].overlap`,
                    sessionName: session.name,
                    conflictingSession: otherSession.name,
                    session1Time: `${session.startTime}-${session.endTime}`,
                    session2Time: `${otherSession.startTime}-${otherSession.endTime}`,
                    suggestedStartTime: suggestedTime,
                    date: sessionDateStr,
                  },
                ],
              );
            }
          }
        }
      }
    } catch (error: any) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Session validation with suggestions');
      throw new ValidationException('Session validation failed');
    }
  }

  // Helper method to add minutes to time string
  private addMinutesToTime(timeString: string, minutesToAdd: number): string {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Get user feedback history for sessions
  private async getUserFeedbackHistory(
    userId: string,
    surveyId: string,
  ): Promise<{ [sessionId: string]: SurveyResponse }> {
    try {
      if (!userId) return {};

      const feedbacks = await this.surveyResponseRepository.find({
        where: { userId, surveyId },
      });

      const feedbackMap: { [sessionId: string]: SurveyResponse } = {};
      feedbacks.forEach((feedback) => {
        feedbackMap[feedback.sessionId] = feedback;
      });

      return feedbackMap;
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get user feedback history');
      return {};
    }
  }

  // Enhanced method with clear event status logic
  private getSessionsForUserWithHistory(
    sessions: SurveySession[],
    survey: Survey,
    userId?: string,
  ): {
    sessionsToShow: SurveySession[];
    pastSessions: SurveySession[];
    upcomingSessions: SurveySession[];
    currentSessions: SurveySession[];
    eventStatus: 'PAST_EVENT' | 'TODAY_EVENT' | 'UPCOMING_EVENT';
  } {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

      const surveyStartDate = new Date(survey.startDate);
      const surveyEndDate = new Date(survey.endDate);
      const surveyStartDateStr = surveyStartDate.toISOString().split('T')[0];
      const surveyEndDateStr = surveyEndDate.toISOString().split('T')[0];

      const eventStartTimeMinutes = this.timeToMinutes(survey.startTime);
      const eventEndTimeMinutes = this.timeToMinutes(survey.endTime);

      // Sort sessions by date and time
      const sortedSessions = sessions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        return (
          this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
        );
      });

      // Determine event status first
      let eventStatus: 'PAST_EVENT' | 'TODAY_EVENT' | 'UPCOMING_EVENT';

      if (surveyEndDateStr < currentDate) {
        // Event completely ended (past date)
        eventStatus = 'PAST_EVENT';
      } else if (surveyStartDateStr > currentDate) {
        // Event in future (upcoming)
        eventStatus = 'UPCOMING_EVENT';
      } else if (
        surveyStartDateStr <= currentDate &&
        surveyEndDateStr >= currentDate
      ) {
        // Event is today or spanning multiple days including today
        eventStatus = 'TODAY_EVENT';

        // Check if event ended today
        if (
          surveyEndDateStr === currentDate &&
          currentTimeMinutes > eventEndTimeMinutes
        ) {
          eventStatus = 'PAST_EVENT';
        }
      } else {
        eventStatus = 'TODAY_EVENT';
      }

      // Categorize sessions for reference
      const pastSessions: SurveySession[] = [];
      const currentSessions: SurveySession[] = [];
      const upcomingSessions: SurveySession[] = [];

      sortedSessions.forEach((session) => {
        const sessionDate = new Date(session.date).toISOString().split('T')[0];
        const sessionStartMinutes = this.timeToMinutes(session.startTime);
        const sessionEndMinutes = this.timeToMinutes(session.endTime);

        if (sessionDate < currentDate) {
          pastSessions.push(session);
        } else if (sessionDate === currentDate) {
          if (
            currentTimeMinutes >= sessionStartMinutes - 5 &&
            currentTimeMinutes <= sessionEndMinutes + 5
          ) {
            currentSessions.push(session);
          } else if (currentTimeMinutes > sessionEndMinutes + 5) {
            pastSessions.push(session);
          } else {
            upcomingSessions.push(session);
          }
        } else {
          upcomingSessions.push(session);
        }
      });

      // Main logic based on event status
      let sessionsToShow: SurveySession[] = [];

      if (eventStatus === 'PAST_EVENT') {
        // Event is over - show ALL sessions
        sessionsToShow = sortedSessions;
      } else if (eventStatus === 'UPCOMING_EVENT') {
        // Event is upcoming - show only FIRST session
        sessionsToShow = sortedSessions.length > 0 ? [sortedSessions[0]] : [];
      } else if (eventStatus === 'TODAY_EVENT') {
        // Event is today - time-based logic

        // Check if event hasn't started yet today
        if (
          surveyStartDateStr === currentDate &&
          currentTimeMinutes < eventStartTimeMinutes
        ) {
          // Event is today but hasn't started - show first session only
          sessionsToShow = sortedSessions.length > 0 ? [sortedSessions[0]] : [];
        } else {
          // Event has started today - show based on current time

          if (currentSessions.length > 0) {
            // Current session active - show first session + current sessions
            const firstSession = sortedSessions[0];
            const sessionsSet = new Set(
              [firstSession, ...currentSessions].map((s) => s.id),
            );
            sessionsToShow = sortedSessions.filter((s) =>
              sessionsSet.has(s.id),
            );
          } else if (pastSessions.length > 0) {
            // Some sessions completed - show next upcoming session
            const nextSession = upcomingSessions[0];
            if (nextSession) {
              sessionsToShow = [nextSession];
            } else {
              // No more sessions today - show all past sessions
              sessionsToShow = pastSessions;
            }
          } else {
            // First session hasn't started yet
            sessionsToShow =
              sortedSessions.length > 0 ? [sortedSessions[0]] : [];
          }
        }
      }

      return {
        sessionsToShow,
        pastSessions,
        upcomingSessions,
        currentSessions,
        eventStatus,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get sessions for user with history');
      return {
        sessionsToShow: [],
        pastSessions: [],
        upcomingSessions: [],
        currentSessions: [],
        eventStatus: 'TODAY_EVENT',
      };
    }
  }

  // Helper method to determine session type
  private determineSessionType(
    session: SurveySession,
    sessionInfo: any,
  ): string {
    if (
      sessionInfo.pastSessions.some((s: SurveySession) => s.id === session.id)
    )
      return 'PAST';
    if (
      sessionInfo.currentSessions.some(
        (s: SurveySession) => s.id === session.id,
      )
    )
      return 'CURRENT';
    return 'UPCOMING';
  }

  // CREATE - Admin creates survey with sessions (AUTO-FILL EVENT DATE/TIME)
  async createSurvey(createSurveyDto: CreateSurveyDto) {
    try {
      // 1. First get event details to auto-fill date/time if not provided
      const event = await this.eventRepository.findOne({
        where: { id: createSurveyDto.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', createSurveyDto.eventId);
      }

      // 2. Auto-fill survey date/time from event if not provided
      const surveyData = {
        ...createSurveyDto,
        startDate:
          createSurveyDto.startDate || event.startDate.toString().split('T')[0],
        startTime: createSurveyDto.startTime || event.startTime,
        endDate:
          createSurveyDto.endDate || event.endDate.toString().split('T')[0],
        endTime: createSurveyDto.endTime || event.endTime,
      };

      // 3. Validate survey with event (now with auto-filled data)
      await this.validateSurveyWithEvent(surveyData);

      // 4. Check if survey already exists for this event
      const existingSurvey = await this.surveyRepository.findOne({
        where: { eventId: createSurveyDto.eventId },
      });

      if (existingSurvey) {
        throw new DuplicateResourceException(
          'Survey',
          'eventId',
          createSurveyDto.eventId,
        );
      }

      // 5. Create survey with auto-filled data
      const survey = new Survey();
      survey.eventId = surveyData.eventId;
      survey.title = surveyData.title;
      survey.description = surveyData.description;
      survey.startDate = new Date(surveyData.startDate);
      survey.startTime = surveyData.startTime;
      survey.endDate = new Date(surveyData.endDate);
      survey.endTime = surveyData.endTime;
      survey.isActive = surveyData.isActive ?? true;

      const savedSurvey = await this.surveyRepository.save(survey);

      // 6. Create sessions if provided
      const sessionsToCreate = createSurveyDto.sessions || [];
      const createdSessions = [];

      for (const sessionDto of sessionsToCreate) {
        try {
          const session = new SurveySession();
          session.surveyId = savedSurvey.id;
          session.name = sessionDto.name;
          session.date = new Date(sessionDto.date);
          session.startTime = sessionDto.startTime;
          session.endTime = sessionDto.endTime;
          session.description = sessionDto.description;
          session.isActive = sessionDto.isActive ?? true;

          const savedSession = await this.surveySessionRepository.save(session);
          createdSessions.push(savedSession);
        } catch (sessionError: any) {
          // If session creation fails, delete the survey and sessions
          await this.surveyRepository.delete(savedSurvey.id);
          await Promise.all(
            createdSessions.map((session) =>
              this.surveySessionRepository.delete(session.id),
            ),
          );
          this.errorHandler.logError(
            sessionError,
            'Session creation in survey',
          );
          throw new ValidationException(
            `Failed to create session: ${sessionError.message}`,
          );
        }
      }

      // 7. Return created survey with auto-filled event information
      const finalSurvey = await this.surveyRepository.findOne({
        where: { id: savedSurvey.id },
      });

      return {
        ...finalSurvey,
        autoFilledFromEvent: {
          eventName: event.name,
          eventLocation: event.location,
          autoFilledFields: {
            startDate: !createSurveyDto.startDate,
            startTime: !createSurveyDto.startTime,
            endDate: !createSurveyDto.endDate,
            endTime: !createSurveyDto.endTime,
          },
        },
      };
    } catch (error: any) {
      if (
        error instanceof ValidationException ||
        error instanceof DuplicateResourceException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }

      this.errorHandler.logError(error, 'Survey creation');
      this.errorHandler.handleDatabaseError(error, 'Survey creation');
    }
  }

  // READ - Get all surveys with sessions (Admin only)
  async getAllSurveysWithSessions() {
    try {
      const surveys = await this.surveyRepository.find({
        order: { createdAt: 'DESC' },
      });

      const surveysWithSessions = [];

      for (const survey of surveys) {
        const sessions = await this.surveySessionRepository.find({
          where: { surveyId: survey.id, isActive: true },
          order: { date: 'ASC', startTime: 'ASC' },
        });

        surveysWithSessions.push({
          ...survey,
          sessions,
        });
      }

      return surveysWithSessions;
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all surveys with sessions');
      this.errorHandler.handleDatabaseError(error, 'All surveys retrieval');
    }
  }

  // Updated method for current time surveys
  async getCurrentTimeSurveysWithSessions(userId?: string) {
    try {
      const allSurveys = await this.surveyRepository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });

      const currentTimeSurveys = [];

      for (const survey of allSurveys) {
        const allSessions = await this.surveySessionRepository.find({
          where: { surveyId: survey.id, isActive: true },
          order: { date: 'ASC', startTime: 'ASC' },
        });

        if (allSessions.length === 0) continue;

        const sessionInfo = this.getSessionsForUserWithHistory(
          allSessions,
          survey,
          userId,
        );

        // Show all surveys (past, today, upcoming) but with different session visibility
        if (sessionInfo.sessionsToShow.length > 0) {
          // Get user feedback history if userId provided
          const feedbackHistory = userId
            ? await this.getUserFeedbackHistory(userId, survey.id)
            : {};

          // Add feedback status to sessions
          const sessionsWithFeedback = sessionInfo.sessionsToShow.map(
            (session) => ({
              ...session,
              userFeedback: feedbackHistory[session.id] || null,
              hasFeedback: !!feedbackHistory[session.id],
              canSubmitFeedback:
                sessionInfo.eventStatus === 'PAST_EVENT' ||
                (sessionInfo.eventStatus === 'TODAY_EVENT' &&
                  (sessionInfo.currentSessions.some(
                    (s) => s.id === session.id,
                  ) ||
                    sessionInfo.pastSessions.some((s) => s.id === session.id))),
              sessionType: this.determineSessionType(session, sessionInfo),
            }),
          );

          // For users: Single session → object, Multiple sessions → array
          // For admin: Always array (they see all sessions)
          const sessionsFormat =
            sessionsWithFeedback.length === 1
              ? sessionsWithFeedback[0]
              : sessionsWithFeedback;

          currentTimeSurveys.push({
            ...survey,
            sessions: sessionsFormat,
          });
        }
      }

      return currentTimeSurveys;
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Get current time surveys with sessions',
      );
      this.errorHandler.handleDatabaseError(error, 'Current surveys retrieval');
    }
  }

  // Get single survey with all sessions (Admin only)
  async getSurveyWithAllSessions(surveyId: string) {
    try {
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      const sessions = await this.surveySessionRepository.find({
        where: { surveyId, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      const totalDays = this.calculateEventDays(
        new Date(survey.startDate),
        new Date(survey.endDate),
      );
      const totalHours = this.calculateTotalEventTime(
        survey.startDate,
        survey.endDate,
        survey.startTime,
        survey.endTime,
      );

      return {
        ...survey,
        sessions,
        eventStats: {
          totalDays,
          totalHours,
          totalSessions: sessions.length,
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get survey with all sessions');
      this.errorHandler.handleDatabaseError(error, 'Survey with all sessions');
    }
  }

  // Updated method for single survey
  async getSurveyWithCurrentSessions(surveyId: string, userId?: string) {
    try {
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId, isActive: true },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      const allSessions = await this.surveySessionRepository.find({
        where: { surveyId, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      const sessionInfo = this.getSessionsForUserWithHistory(
        allSessions,
        survey,
        userId,
      );

      // Get user feedback history
      const feedbackHistory = userId
        ? await this.getUserFeedbackHistory(userId, surveyId)
        : {};

      // Add feedback status to sessions
      const sessionsWithFeedback = sessionInfo.sessionsToShow.map(
        (session) => ({
          ...session,
          userFeedback: feedbackHistory[session.id] || null,
          hasFeedback: !!feedbackHistory[session.id],
          canSubmitFeedback:
            sessionInfo.eventStatus === 'PAST_EVENT' ||
            (sessionInfo.eventStatus === 'TODAY_EVENT' &&
              (sessionInfo.currentSessions.some((s) => s.id === session.id) ||
                sessionInfo.pastSessions.some((s) => s.id === session.id))),
          sessionType: this.determineSessionType(session, sessionInfo),
        }),
      );

      // For users: Single session → object, Multiple sessions → array
      const sessionsFormat =
        sessionsWithFeedback.length === 1
          ? sessionsWithFeedback[0]
          : sessionsWithFeedback;

      return {
        ...survey,
        sessions: sessionsFormat,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get survey with current sessions');
      this.errorHandler.handleDatabaseError(
        error,
        'Survey with current sessions',
      );
    }
  }

  calculateTotalEventTime(
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string,
  ): number {
    try {
      // Calculate total days
      const totalDays = this.calculateEventDays(startDate, endDate);

      // Convert time strings to minutes
      const startTimeMinutes = this.timeToMinutes(startTime);
      const endTimeMinutes = this.timeToMinutes(endTime);

      // Calculate hours per day
      const hoursPerDay = (endTimeMinutes - startTimeMinutes) / 60;

      // Calculate total hours for the entire event period
      const totalHours = totalDays * hoursPerDay;

      return totalHours;
    } catch (error: any) {
      this.errorHandler.logError(error, 'Calculate total event time');
      return 0;
    }
  }

  async getFeedbackSurveyById(surveyId: string) {
    try {
      return await this.surveyRepository.findOne({
        where: { id: surveyId },
      });
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get survey by ID');
      this.errorHandler.handleDatabaseError(error, 'Survey retrieval');
    }
  }

  // Get survey sessions
  async getSurveySessions(surveyId: string) {
    try {
      return await this.surveySessionRepository.find({
        where: { surveyId, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get survey sessions');
      this.errorHandler.handleDatabaseError(error, 'Survey sessions retrieval');
    }
  }

  // Simplified submit feedback method
  async submitFeedback(
    surveyId: string,
    eventId: string,
    userId: string,
    feedbackDto: SurveyResponseDto,
  ) {
    try {
      // 1. Validate survey
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId, eventId, isActive: true },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey not found or inactive');
      }

      // 2. Validate session
      const session = await this.surveySessionRepository.findOne({
        where: { id: feedbackDto.sessionId, surveyId, isActive: true },
      });

      if (!session) {
        throw new ResourceNotFoundException('Session not found or inactive');
      }

      // 3. Get all sessions and categorize them
      const allSessions = await this.surveySessionRepository.find({
        where: { surveyId, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      const sessionInfo = this.getSessionsForUserWithHistory(
        allSessions,
        survey,
        userId,
      );

      // 4. Enhanced feedback eligibility logic
      let canSubmitFeedback = false;
      let feedbackReason = '';
      let sessionStatus = '';

      // Determine session status
      if (
        sessionInfo.pastSessions.some((s) => s.id === feedbackDto.sessionId)
      ) {
        sessionStatus = 'COMPLETED';
      } else if (
        sessionInfo.currentSessions.some((s) => s.id === feedbackDto.sessionId)
      ) {
        sessionStatus = 'ONGOING';
      } else {
        sessionStatus = 'UPCOMING';
      }

      // Enhanced feedback rules
      switch (sessionInfo.eventStatus) {
        case 'PAST_EVENT':
          canSubmitFeedback = true;
          feedbackReason = `Feedback allowed for completed event. Session: ${session.name} (${sessionStatus})`;
          break;

        case 'TODAY_EVENT':
          if (sessionStatus === 'COMPLETED' || sessionStatus === 'ONGOING') {
            canSubmitFeedback = true;
            feedbackReason = `Feedback allowed for ${sessionStatus.toLowerCase()} session: ${session.name}`;
          } else {
            feedbackReason = `Feedback not allowed for upcoming session: ${session.name}. Please wait until session starts.`;
          }
          break;

        case 'UPCOMING_EVENT':
          feedbackReason = `Feedback not allowed for future event. Session: ${session.name} is scheduled for future.`;
          break;
      }

      if (!canSubmitFeedback) {
        throw new BusinessLogicException(feedbackReason);
      }

      // 5. Check for duplicate feedback
      const existingResponse = await this.surveyResponseRepository.findOne({
        where: { surveyId, sessionId: feedbackDto.sessionId, userId },
      });

      if (existingResponse) {
        throw new DuplicateResourceException(
          'Feedback',
          'session',
          `You have already submitted feedback for session: ${session.name}`,
        );
      }

      // 6. Create feedback response
      const response = new SurveyResponse();
      response.surveyId = surveyId;
      response.sessionId = feedbackDto.sessionId;
      response.eventId = eventId;
      response.userId = userId;
      response.name = feedbackDto.name;
      response.title = feedbackDto.title;
      response.comment = feedbackDto.comment;

      const savedResponse = await this.surveyResponseRepository.save(response);

      // 7. Simple response - केवल ID return करें
      return {
        feedbackId: savedResponse.id,
        message: 'Feedback created successfully',
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException ||
        error instanceof BusinessLogicException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Submit feedback');
      this.errorHandler.handleDatabaseError(error, 'Feedback submission');
    }
  }

  //  method - Feedback details
  async getFeedbackById(feedbackId: string) {
    try {
      // 1. Get feedback response
      const feedback = await this.surveyResponseRepository.findOne({
        where: { id: feedbackId },
      });

      if (!feedback) {
        throw new ResourceNotFoundException('Feedback not found');
      }

      // 2. Get user information
      const user = await this.userRepository.findOne({
        where: { id: feedback.userId },
        select: ['id', 'firstName', 'lastName', 'email', 'mobile', 'role'],
      });

      // 3. Get session information
      const session = await this.surveySessionRepository.findOne({
        where: { id: feedback.sessionId },
      });

      // 4. Get event information
      const event = await this.eventRepository.findOne({
        where: { id: feedback.eventId },
        select: [
          'id',
          'name',
          'description',
          'startDate',
          'endDate',
          'location',
          'venue',
        ],
      });

      // 5. Get survey information
      const survey = await this.surveyRepository.findOne({
        where: { id: feedback.surveyId },
      });

      // 6. Return detailed information
      return {
        feedbackId: feedback.id,
        feedbackData: {
          name: feedback.name,
          title: feedback.title,
          comment: feedback.comment,
          submittedAt: feedback.createdAt,
        },
        user: {
          id: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          mobile: user?.mobile,
          role: user?.role,
        },
        session: {
          id: session?.id,
          name: session?.name,
          description: session?.description,
          date: session?.date,
          time: `${session?.startTime} - ${session?.endTime}`,
        },
        event: {
          id: event?.id,
          name: event?.name,
          description: event?.description,
          location: event?.location,
          venue: event?.venue,
        },
        survey: {
          id: survey?.id,
          title: survey?.title,
          description: survey?.description,
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get feedback by ID');
      this.errorHandler.handleDatabaseError(error, 'Feedback retrieval');
    }
  }

  // Add new session to existing survey
  async addSession(surveyId: string, sessionDto: CreateSessionDto) {
    try {
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      const session = new SurveySession();
      session.surveyId = surveyId;
      session.name = sessionDto.name;
      session.date = new Date(sessionDto.date);
      session.startTime = sessionDto.startTime;
      session.endTime = sessionDto.endTime;
      session.description = sessionDto.description;
      session.isActive = sessionDto.isActive ?? true;

      return await this.surveySessionRepository.save(session);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Add session to survey');
      this.errorHandler.handleDatabaseError(error, 'Survey session addition');
    }
  }

  // Updated method for survey detail by role
  async getSurveyDetailByRole(surveyId: string, userRole: string) {
    try {
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId, isActive: true },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      const allSessions = await this.surveySessionRepository.find({
        where: { surveyId, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      // For Admin: Show all sessions (always array)
      if (userRole === 'admin') {
        return {
          ...survey,
          sessions: allSessions,
        };
      }

      // For User: Show sessions based on current time and event status
      const sessionInfo = this.getSessionsForUserWithHistory(
        allSessions,
        survey,
      );

      // For users: Single session → object, Multiple sessions → array
      const sessionsFormat =
        sessionInfo.sessionsToShow.length === 1
          ? sessionInfo.sessionsToShow[0]
          : sessionInfo.sessionsToShow;

      return {
        ...survey,
        sessions: sessionsFormat,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get survey detail by role');
      this.errorHandler.handleDatabaseError(error, 'Survey detail by role');
    }
  }

  // Get survey detail by event ID and user role
  async getSurveyDetailByEventId(
    eventId: string,
    userRole: string,
    userId?: string,
  ) {
    try {
      // First find the survey for this event
      const survey = await this.surveyRepository.findOne({
        where: { eventId, isActive: true },
      });

      if (!survey) {
        throw new ResourceNotFoundException(
          'Survey not found for this event',
          eventId,
        );
      }

      const allSessions = await this.surveySessionRepository.find({
        where: { surveyId: survey.id, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      // For Admin: Show all sessions (always array)
      if (userRole === 'admin') {
        return {
          ...survey,
          sessions: allSessions,
        };
      }

      // For User: Show sessions based on current time and event status
      const sessionInfo = this.getSessionsForUserWithHistory(
        allSessions,
        survey,
        userId,
      );

      // Get user feedback history if userId provided
      const feedbackHistory = userId
        ? await this.getUserFeedbackHistory(userId, survey.id)
        : {};

      // Add feedback status to sessions for users
      const sessionsWithFeedback = sessionInfo.sessionsToShow.map(
        (session) => ({
          ...session,
          userFeedback: feedbackHistory[session.id] || null,
          hasFeedback: !!feedbackHistory[session.id],
          canSubmitFeedback:
            sessionInfo.eventStatus === 'PAST_EVENT' ||
            (sessionInfo.eventStatus === 'TODAY_EVENT' &&
              (sessionInfo.currentSessions.some((s) => s.id === session.id) ||
                sessionInfo.pastSessions.some((s) => s.id === session.id))),
          sessionType: this.determineSessionType(session, sessionInfo),
        }),
      );

      // For users: Single session → object, Multiple sessions → array
      const sessionsFormat =
        sessionsWithFeedback.length === 1
          ? sessionsWithFeedback[0]
          : sessionsWithFeedback;

      return {
        ...survey,
        sessions: sessionsFormat,
      };
    } catch (error: any) {
      console.log(error, '$$$$$$');
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get survey detail by event ID');
      this.errorHandler.handleDatabaseError(error, 'Survey detail by event ID');
    }
  }

  // Get all feedbacks - Admin detailed information
  async getAllFeedbacks() {
    try {
      const feedbacks = await this.surveyResponseRepository.find({
        order: { createdAt: 'DESC' },
      });

      // Get detailed information for each feedback
      const detailedFeedbacks = await Promise.all(
        feedbacks.map(async (feedback) => {
          // Get user information
          const user = await this.userRepository.findOne({
            where: { id: feedback.userId },
            select: ['id', 'firstName', 'lastName', 'email', 'mobile', 'role'],
          });

          // Get session information
          const session = await this.surveySessionRepository.findOne({
            where: { id: feedback.sessionId },
          });

          // Get event information
          const event = await this.eventRepository.findOne({
            where: { id: feedback.eventId },
            select: [
              'id',
              'name',
              'description',
              'startDate',
              'endDate',
              'location',
              'venue',
            ],
          });

          // Get survey information
          const survey = await this.surveyRepository.findOne({
            where: { id: feedback.surveyId },
            select: ['id', 'title', 'description'],
          });

          return {
            feedbackId: feedback.id,
            feedbackData: {
              name: feedback.name,
              title: feedback.title,
              comment: feedback.comment,
              submittedAt: feedback.createdAt,
            },
            user: {
              id: user?.id,
              name: `${user?.firstName} ${user?.lastName}`,
              email: user?.email,
              mobile: user?.mobile,
              role: user?.role,
            },
            session: {
              id: session?.id,
              name: session?.name,
              description: session?.description,
              date: session?.date,
              time: `${session?.startTime} - ${session?.endTime}`,
            },
            event: {
              id: event?.id,
              name: event?.name,
              description: event?.description,
              location: event?.location,
              venue: event?.venue,
            },
            survey: {
              id: survey?.id,
              title: survey?.title,
              description: survey?.description,
            },
          };
        }),
      );

      return {
        totalFeedbacks: feedbacks.length,
        feedbacks: detailedFeedbacks,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all feedbacks');
      this.errorHandler.handleDatabaseError(error, 'Feedbacks retrieval');
    }
  }

  // Get feedbacks by user ID - Simple
  async getFeedbacksByUserId(userId: string) {
    try {
      // Get all feedbacks for user
      const feedbacks = await this.surveyResponseRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      // Get detailed information for each feedback
      const detailedFeedbacks = await Promise.all(
        feedbacks.map(async (feedback) => {
          // Get session information
          const session = await this.surveySessionRepository.findOne({
            where: { id: feedback.sessionId },
          });

          // Get event information
          const event = await this.eventRepository.findOne({
            where: { id: feedback.eventId },
            select: [
              'id',
              'name',
              'description',
              'startDate',
              'endDate',
              'location',
              'venue',
            ],
          });

          // Get survey information
          const survey = await this.surveyRepository.findOne({
            where: { id: feedback.surveyId },
            select: ['id', 'title', 'description'],
          });

          return {
            feedbackId: feedback.id,
            feedbackData: {
              name: feedback.name,
              title: feedback.title,
              comment: feedback.comment,
              submittedAt: feedback.createdAt,
            },
            session: {
              id: session?.id,
              name: session?.name,
              description: session?.description,
              date: session?.date,
              time: `${session?.startTime} - ${session?.endTime}`,
            },
            event: {
              id: event?.id,
              name: event?.name,
              description: event?.description,
              location: event?.location,
              venue: event?.venue,
            },
            survey: {
              id: survey?.id,
              title: survey?.title,
              description: survey?.description,
            },
          };
        }),
      );

      return {
        totalFeedbacks: feedbacks.length,
        feedbacks: detailedFeedbacks,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get feedbacks by user ID');
      this.errorHandler.handleDatabaseError(error, 'User feedbacks retrieval');
    }
  }
}
