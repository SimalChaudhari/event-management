// src/services/survey.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Survey, SurveyResponse, SurveySession } from './survey.entity';
import {
  CreateSurveyDto,
  SurveyResponseDto,
  CreateSessionDto,
  UpdateSurveyDto,
  UpdateSessionDto,
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
          startDate: new Date(event.startDate).toISOString().split('T')[0],
          startTime: event.startTime,
          endDate: new Date(event.endDate).toISOString().split('T')[0],
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
          `Use startDate: "${eventStartDateStr}" or any date between ${eventStartDateStr} and ${eventEndDateStr}.`,
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
          `Use endDate: "${eventEndDateStr}" or any date between ${eventStartDateStr} and ${eventEndDateStr}.`,
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
          `Invalid start time format.Use startTime: "${event.startTime}" or time in HH:MM:SS format.`,
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
          `Invalid end time format.Use endTime: "${event.endTime}" or time in HH:MM:SS format.`,
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
          `Use startTime: "${event.startTime}" and endTime: "${event.endTime}".`,
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
            `Use startTime: "${event.startTime}" or any time between ${event.startTime} and ${event.endTime}.`,
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
            `Use endTime: "${event.endTime}" or any time between ${event.startTime} and ${event.endTime}.`,
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
            `Outside the event date range.Use date between ${surveyStartDateStr} and ${surveyEndDateStr}.`,

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
            `Outside the event date range.Use date between ${eventStartDateStr} and ${eventEndDateStr}.`,
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
            `start time format is invalid. Use time in HH:MM:SS format, e.g., "${event.startTime}".`,
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
            `End time format is invalid. Use time in HH:MM:SS format, e.g., "${event.endTime}".`,
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
            `End time  must be after start time.Use endTime: "${suggestedEndTime}" or any time after ${session.startTime}.`,
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
              `start time cannot be before event start time Use startTime: "${event.startTime}" or later.`,
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
              `Use endTime: "${event.endTime}" or earlier.`,
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
                `Adjust Session ${j + 1} to start at "${suggestedTime}" or later to avoid overlap.`,
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
        throw new ResourceNotFoundException('Event');
      }

      // 2. Auto-fill survey date/time from event if not provided
      const surveyData = {
        ...createSurveyDto,
        startDate:
          createSurveyDto.startDate ||
          new Date(event.startDate).toISOString().split('T')[0],
        startTime: createSurveyDto.startTime || event.startTime,
        endDate:
          createSurveyDto.endDate ||
          new Date(event.endDate).toISOString().split('T')[0],
        endTime: createSurveyDto.endTime || event.endTime,
      };

      // 3. Validate survey with event (now with auto-filled data)
      await this.validateSurveyWithEvent(surveyData);

      // 4. Check if survey already exists for this event
      const existingSurvey = await this.surveyRepository.findOne({
        where: { eventId: createSurveyDto.eventId },
      });

      if (existingSurvey) {
        throw new DuplicateResourceException('Survey event');
      }

      // 5. Create survey with auto-filled data
      const survey = new Survey();
      survey.eventId = surveyData.eventId;
      survey.title = surveyData.title;
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

      //Open when testing over-------------

      // if (!canSubmitFeedback) {
      //   throw new BusinessLogicException(feedbackReason);
      // }
      //Open when testing over-------------

      // 5. Check for duplicate feedback - ENABLED
      const existingResponse = await this.surveyResponseRepository.findOne({
        where: { surveyId, sessionId: feedbackDto.sessionId, userId },
      });

      if (existingResponse) {
        throw new DuplicateResourceException(
          `You have already submitted feedback for session: ${session.name}. Only one feedback per session is allowed.`,
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

  
      // 7. Simple response - return the saved response
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
            select: ['id', 'title'],
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
            select: ['id', 'title'],
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

  // DELETE METHODS

  // Delete single survey with all its sessions and responses
  async deleteSurvey(surveyId: string) {
    try {
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      // First delete all survey responses
      await this.surveyResponseRepository.delete({ surveyId });

      // Then delete all sessions
      await this.surveySessionRepository.delete({ surveyId });

      // Finally delete the survey
      await this.surveyRepository.delete(surveyId);

      return {
        message: 'Survey elated data successfully deleted',
        deletedSurveyId: surveyId,
        deletedData: {
          survey: survey.title,
          eventId: survey.eventId,
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Delete survey');
      this.errorHandler.handleDatabaseError(error, 'Survey deletion');
    }
  }

  // Delete all surveys (Admin only)
  async deleteAllSurveys() {
    try {
      // Get count before deletion for response
      const totalSurveys = await this.surveyRepository.count();
      const totalSessions = await this.surveySessionRepository.count();
      const totalResponses = await this.surveyResponseRepository.count();

      // Delete in correct order (foreign key constraints)
      await this.surveyResponseRepository.delete({});
      await this.surveySessionRepository.delete({});
      await this.surveyRepository.delete({});

      return {
        message: 'survey related data successfully deleted',
        deletedCounts: {
          surveys: totalSurveys,
          sessions: totalSessions,
          responses: totalResponses,
        },
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete all surveys');
      this.errorHandler.handleDatabaseError(error, 'All surveys deletion');
    }
  }

  // Delete single session
  async deleteSession(surveyId: string, sessionId: string) {
    try {
      const session = await this.surveySessionRepository.findOne({
        where: { id: sessionId, surveyId },
      });

      if (!session) {
        throw new ResourceNotFoundException('Session', sessionId);
      }

      // Delete all responses for this session first
      await this.surveyResponseRepository.delete({ sessionId });

      // Delete the session
      await this.surveySessionRepository.delete(sessionId);

      return {
        message: 'Session responses successfully deleted',
        deletedSession: {
          id: sessionId,
          name: session.name,
          date: session.date,
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Delete session');
      this.errorHandler.handleDatabaseError(error, 'Session deletion');
    }
  }

  // UPDATE METHODS

  // Update survey (Enhanced like createSurvey with auto-fill and comprehensive validation)
  async updateSurvey(surveyId: string, updateSurveyDto: UpdateSurveyDto) {
    try {
      // 1. Check if survey exists
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      // 2. Get event details for auto-fill and validation
      const event = await this.eventRepository.findOne({
        where: { id: survey.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', survey.eventId);
      }

      // 3. Auto-fill missing fields from event (just like createSurvey)
      const updatedSurveyData = {
        eventId: survey.eventId,
        title:
          updateSurveyDto.title !== undefined
            ? updateSurveyDto.title
            : survey.title,
        startDate:
          updateSurveyDto.startDate ||
          survey.startDate.toISOString().split('T')[0],
        endDate:
          updateSurveyDto.endDate || survey.endDate.toISOString().split('T')[0],
        startTime: updateSurveyDto.startTime || survey.startTime,
        endTime: updateSurveyDto.endTime || survey.endTime,
        isActive:
          updateSurveyDto.isActive !== undefined
            ? updateSurveyDto.isActive
            : survey.isActive,
      };

      // 4. Comprehensive validation with event (same as createSurvey)
      await this.validateSurveyWithEvent(updatedSurveyData);

      // 5. Get existing sessions for overlap validation
      const existingSessions = await this.surveySessionRepository.find({
        where: { surveyId, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      // 6. Validate existing sessions with new survey timing
      if (existingSessions.length > 0) {
        await this.validateExistingSessionsAfterSurveyUpdate(
          existingSessions,
          event,
          new Date(updatedSurveyData.startDate),
          new Date(updatedSurveyData.endDate),
        );
      }

      // 7. Update survey fields
      if (updateSurveyDto.title !== undefined) {
        survey.title = updateSurveyDto.title;
      }
      if (updateSurveyDto.startDate !== undefined) {
        survey.startDate = new Date(updateSurveyDto.startDate);
      }
      if (updateSurveyDto.endDate !== undefined) {
        survey.endDate = new Date(updateSurveyDto.endDate);
      }
      if (updateSurveyDto.startTime !== undefined) {
        survey.startTime = updateSurveyDto.startTime;
      }
      if (updateSurveyDto.endTime !== undefined) {
        survey.endTime = updateSurveyDto.endTime;
      }
      if (updateSurveyDto.isActive !== undefined) {
        survey.isActive = updateSurveyDto.isActive;
      }

      const updatedSurvey = await this.surveyRepository.save(survey);

      // 8. Return response with auto-filled information (like createSurvey)
      return {
        message: 'Survey successfully updated',
        survey: updatedSurvey,
        updatedFields: Object.keys(updateSurveyDto),
        autoFilledFromEvent: {
          eventName: event.name,
          eventLocation: event.location,
          autoFilledFields: {
            startDate: !updateSurveyDto.startDate && !survey.startDate,
            startTime: !updateSurveyDto.startTime && !survey.startTime,
            endDate: !updateSurveyDto.endDate && !survey.endDate,
            endTime: !updateSurveyDto.endTime && !survey.endTime,
          },
        },
        existingSessionsValidated: existingSessions.length,
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException ||
        error instanceof BusinessLogicException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Update survey');
      this.errorHandler.handleDatabaseError(error, 'Survey update');
    }
  }

  // Helper method to validate existing sessions after survey update
  private async validateExistingSessionsAfterSurveyUpdate(
    existingSessions: SurveySession[],
    event: Event,
    newSurveyStartDate: Date,
    newSurveyEndDate: Date,
  ): Promise<void> {
    try {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      const eventStartTimeMinutes = this.timeToMinutes(event.startTime);
      const eventEndTimeMinutes = this.timeToMinutes(event.endTime);

      const eventStartDateStr = eventStartDate.toISOString().split('T')[0];
      const eventEndDateStr = eventEndDate.toISOString().split('T')[0];
      const newSurveyStartDateStr = newSurveyStartDate
        .toISOString()
        .split('T')[0];
      const newSurveyEndDateStr = newSurveyEndDate.toISOString().split('T')[0];

      // Check each existing session against new survey timing
      for (let i = 0; i < existingSessions.length; i++) {
        const session = existingSessions[i];
        const sessionDate = new Date(session.date);
        const sessionDateStr = sessionDate.toISOString().split('T')[0];
        const sessionStartMinutes = this.timeToMinutes(session.startTime);
        const sessionEndMinutes = this.timeToMinutes(session.endTime);

        // 1. Session date validation with new survey range
        if (
          sessionDate < newSurveyStartDate ||
          sessionDate > newSurveyEndDate
        ) {
          throw new ValidationException(
            `Session "${session.name}" (${sessionDateStr}) is outside the survey date range
               (${newSurveyStartDateStr}–${newSurveyEndDateStr}). Update survey dates or modify the session.`,

            [
              {
                field: 'existingSession.date',
                sessionName: session.name,
                sessionDate: sessionDateStr,
                newSurveyRange: `${newSurveyStartDateStr} to ${newSurveyEndDateStr}`,
                suggestion: `Update survey dates to include ${sessionDateStr} or delete/update session "${session.name}"`,
                eventInfo: {
                  name: event.name,
                  startDate: eventStartDateStr,
                  endDate: eventEndDateStr,
                },
              },
            ],
          );
        }

        // 2. Session within event date range
        if (sessionDate < eventStartDate || sessionDate > eventEndDate) {
          throw new ValidationException(
            `Session "${session.name}" (${sessionDateStr}) is outside event date range 
              (${eventStartDateStr}–${eventEndDateStr}). Update or remove it before changing the survey.`,

            [
              {
                field: 'existingSession.eventDate',
                sessionName: session.name,
                sessionDate: sessionDateStr,
                eventDateRange: `${eventStartDateStr} to ${eventEndDateStr}`,
                suggestion: `Delete session "${session.name}" or move to valid date between ${eventStartDateStr} and ${eventEndDateStr}`,
                eventInfo: {
                  name: event.name,
                  startDate: eventStartDateStr,
                  endDate: eventEndDateStr,
                },
              },
            ],
          );
        }

        // 3. Session time within event time on same day
        if (sessionDate.getTime() === eventStartDate.getTime()) {
          if (sessionStartMinutes < eventStartTimeMinutes) {
            throw new ValidationException(
              `Update session start time to ${event.startTime} or later, or delete the session.`,
              [
                {
                  field: 'existingSession.startTime',
                  sessionName: session.name,
                  sessionStartTime: session.startTime,
                  eventStartTime: event.startTime,
                  suggestion: `Update session "${session.name}" start time to ${event.startTime} or delete the session`,
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
              `Update session end time to ${event.endTime} or earlier, or delete the session.`,
              [
                {
                  field: 'existingSession.endTime',
                  sessionName: session.name,
                  sessionEndTime: session.endTime,
                  eventEndTime: event.endTime,
                  suggestion: `Update session "${session.name}" end time to ${event.endTime} or delete the session`,
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

        // 4. Check session overlaps with other existing sessions
        for (let j = i + 1; j < existingSessions.length; j++) {
          const otherSession = existingSessions[j];
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
              const suggestedTime = this.addMinutesToTime(session.endTime, 15);
              throw new ValidationException(
                `Update one of the session timings to avoid overlap. Suggested: Move "${otherSession.name}" to start at "${suggestedTime}" or later.`,
                [
                  {
                    field: 'existingSession.overlap',
                    session1Name: session.name,
                    session2Name: otherSession.name,
                    session1Time: `${session.startTime}-${session.endTime}`,
                    session2Time: `${otherSession.startTime}-${otherSession.endTime}`,
                    suggestedTime: suggestedTime,
                    date: sessionDateStr,
                    suggestion: `Update "${otherSession.name}" start time to ${suggestedTime} or adjust "${session.name}" timing`,
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
      this.errorHandler.logError(
        error,
        'Validate existing sessions after survey update',
      );
      throw new ValidationException('Existing sessions validation failed');
    }
  }

  // Update session (Enhanced with comprehensive validation and overlap detection)
  async updateSession(
    surveyId: string,
    sessionId: string,
    updateSessionDto: UpdateSessionDto,
  ) {
    try {
      // 1. Validate session exists
      const session = await this.surveySessionRepository.findOne({
        where: { id: sessionId, surveyId },
      });

      if (!session) {
        throw new ResourceNotFoundException('Session', sessionId);
      }

      // 2. Validate survey exists
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      // 3. Get event details for validation
      const event = await this.eventRepository.findOne({
        where: { id: survey.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', survey.eventId);
      }

      // 4. Prepare updated session data
      const newDate =
        updateSessionDto.date ||
        new Date(session.date).toISOString().split('T')[0];
      const newStartTime = updateSessionDto.startTime || session.startTime;
      const newEndTime = updateSessionDto.endTime || session.endTime;
      const newName = updateSessionDto.name || session.name;
      const newDescription =
        updateSessionDto.description || session.description;
      const newIsActive =
        updateSessionDto.isActive !== undefined
          ? updateSessionDto.isActive
          : session.isActive;

      // 5. Get other sessions for overlap validation (exclude current session)
      const otherSessions = await this.surveySessionRepository.find({
        where: {
          surveyId,
          isActive: true,
          id: Not(sessionId), // Exclude current session
        },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      // 6. Comprehensive validation if date/time is being updated
      if (
        updateSessionDto.date ||
        updateSessionDto.startTime ||
        updateSessionDto.endTime
      ) {
        // Create a temporary session object for validation
        const sessionForValidation = {
          name: newName,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          description: newDescription,
          isActive: newIsActive,
        };

        // Validate single session with event and survey
        await this.validateSingleSessionWithSurveyAndEvent(
          sessionForValidation,
          survey,
          event,
        );

        // Check overlap with other sessions
        if (otherSessions.length > 0) {
          await this.validateSessionOverlapWithOthers(
            sessionForValidation,
            otherSessions,
            event,
          );
        }
      }

      // 7. Update session fields
      if (updateSessionDto.name !== undefined) {
        session.name = updateSessionDto.name;
      }
      if (updateSessionDto.date !== undefined) {
        session.date = new Date(updateSessionDto.date);
      }
      if (updateSessionDto.startTime !== undefined) {
        session.startTime = updateSessionDto.startTime;
      }
      if (updateSessionDto.endTime !== undefined) {
        session.endTime = updateSessionDto.endTime;
      }
      if (updateSessionDto.description !== undefined) {
        session.description = updateSessionDto.description;
      }
      if (updateSessionDto.isActive !== undefined) {
        session.isActive = updateSessionDto.isActive;
      }

      const updatedSession = await this.surveySessionRepository.save(session);

      return {
        message: 'Session successfully updated',
        session: updatedSession,
        updatedFields: Object.keys(updateSessionDto),
        validatedAgainstSessions: otherSessions?.length || 0,
        eventInfo: {
          name: event.name,
          dateRange: `${new Date(event.startDate).toISOString().split('T')[0]} to ${new Date(event.endDate).toISOString().split('T')[0]}`,
          timeRange: `${event.startTime} to ${event.endTime}`,
        },
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Update session');
      this.errorHandler.handleDatabaseError(error, 'Session update');
    }
  }

  // Helper method to validate single session with survey and event
  private async validateSingleSessionWithSurveyAndEvent(
    sessionData: any,
    survey: Survey,
    event: Event,
  ): Promise<void> {
    try {
      const sessionDate = new Date(sessionData.date);
      const sessionDateStr = sessionDate.toISOString().split('T')[0];
      const surveyStartDate = new Date(survey.startDate);
      const surveyEndDate = new Date(survey.endDate);
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      const surveyStartDateStr = surveyStartDate.toISOString().split('T')[0];
      const surveyEndDateStr = surveyEndDate.toISOString().split('T')[0];
      const eventStartDateStr = eventStartDate.toISOString().split('T')[0];
      const eventEndDateStr = eventEndDate.toISOString().split('T')[0];

      // 1. Session date within survey range
      if (sessionDate < surveyStartDate || sessionDate > surveyEndDate) {
        throw new ValidationException(
          `Use any date between ${surveyStartDateStr} and ${surveyEndDateStr}.`,
          [
            {
              field: 'date',
              sessionName: sessionData.name,
              providedValue: sessionDateStr,
              validRange: `${surveyStartDateStr} to ${surveyEndDateStr}`,
              suggestedValue: surveyStartDateStr,
              surveyInfo: {
                title: survey.title,
                startDate: surveyStartDateStr,
                endDate: surveyEndDateStr,
              },
            },
          ],
        );
      }

      // 2. Session date within event range
      if (sessionDate < eventStartDate || sessionDate > eventEndDate) {
        throw new ValidationException(
          `Use any date between ${eventStartDateStr} and ${eventEndDateStr}.`,
          [
            {
              field: 'date',
              sessionName: sessionData.name,
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

      // 3. Time format validation
      if (!this.validateTimeFormat(sessionData.startTime)) {
        throw new ValidationException(
          `start time format is invalid.
           Use startTime: "${event.startTime}" or time in HH:MM:SS format.`,
          [
            {
              field: 'startTime',
              sessionName: sessionData.name,
              providedValue: sessionData.startTime,
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

      if (!this.validateTimeFormat(sessionData.endTime)) {
        throw new ValidationException(
          `End time format is invalid. Use endTime: "${event.endTime}" or time in HH:MM:SS format.`,
          [
            {
              field: 'endTime',
              sessionName: sessionData.name,
              providedValue: sessionData.endTime,
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

      // 4. Session time logic validation
      const sessionStartMinutes = this.timeToMinutes(sessionData.startTime);
      const sessionEndMinutes = this.timeToMinutes(sessionData.endTime);

      if (sessionEndMinutes <= sessionStartMinutes) {
        const suggestedEndTime = this.addMinutesToTime(
          sessionData.startTime,
          90,
        );
        throw new ValidationException(
          `Use endTime: "${suggestedEndTime}" or any time after ${sessionData.startTime}.`,
          [
            {
              field: 'timeRange',
              sessionName: sessionData.name,
              providedStartTime: sessionData.startTime,
              providedEndTime: sessionData.endTime,
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

      // 5. Session within event time range on same day
      const eventStartTimeMinutes = this.timeToMinutes(event.startTime);
      const eventEndTimeMinutes = this.timeToMinutes(event.endTime);

      if (sessionDate.getTime() === eventStartDate.getTime()) {
        if (sessionStartMinutes < eventStartTimeMinutes) {
          throw new ValidationException(
            `Use startTime: "${event.startTime}" or later.`,
            [
              {
                field: 'startTime',
                sessionName: sessionData.name,
                providedValue: sessionData.startTime,
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
            `Use endTime: "${event.endTime}" or earlier.`,
            [
              {
                field: 'endTime',
                sessionName: sessionData.name,
                providedValue: sessionData.endTime,
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
    } catch (error: any) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(
        error,
        'Validate single session with survey and event',
      );
      throw new ValidationException('Session validation failed');
    }
  }

  // Helper method to validate session overlap with other sessions
  private async validateSessionOverlapWithOthers(
    sessionData: any,
    otherSessions: SurveySession[],
    event: Event,
  ): Promise<void> {
    try {
      const sessionDate = new Date(sessionData.date);
      const sessionDateStr = sessionDate.toISOString().split('T')[0];
      const sessionStartMinutes = this.timeToMinutes(sessionData.startTime);
      const sessionEndMinutes = this.timeToMinutes(sessionData.endTime);

      for (const otherSession of otherSessions) {
        const otherSessionDate = new Date(otherSession.date);
        const otherSessionDateStr = otherSessionDate
          .toISOString()
          .split('T')[0];

        // Only check overlap for sessions on the same date
        if (sessionDate.getTime() === otherSessionDate.getTime()) {
          const otherStartMinutes = this.timeToMinutes(otherSession.startTime);
          const otherEndMinutes = this.timeToMinutes(otherSession.endTime);

          // Check for time overlap
          if (
            sessionStartMinutes < otherEndMinutes &&
            sessionEndMinutes > otherStartMinutes
          ) {
            const suggestedTime = this.addMinutesToTime(
              otherSession.endTime,
              15,
            );
            throw new ValidationException(
              `Change session start time to "${suggestedTime}" or later to avoid overlap.`,
              [
                {
                  field: 'overlap',
                  sessionName: sessionData.name,
                  conflictingSession: otherSession.name,
                  sessionTime: `${sessionData.startTime}-${sessionData.endTime}`,
                  conflictingSessionTime: `${otherSession.startTime}-${otherSession.endTime}`,
                  suggestedStartTime: suggestedTime,
                  date: sessionDateStr,
                  suggestion: `Change "${sessionData.name}" start time to ${suggestedTime} or adjust "${otherSession.name}" timing`,
                  eventInfo: {
                    name: event.name,
                    timeRange: `${event.startTime} to ${event.endTime}`,
                  },
                },
              ],
            );
          }
        }
      }
    } catch (error: any) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Validate session overlap with others');
      throw new ValidationException('Session overlap validation failed');
    }
  }
}
