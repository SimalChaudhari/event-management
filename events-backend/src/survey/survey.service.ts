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

@Injectable()
export class SurveyService {
  validateTimeFormat: any;
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(SurveySession)
    private surveySessionRepository: Repository<SurveySession>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

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
  }

  // Get event suggestions by event ID
  async getEventSuggestionsByEventId(eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
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
      eventStats: {
        totalDays,
        totalHours,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
      },
      sessionSuggestions,
      timeSlots: [
        { name: 'Morning', startTime: '09:00:00', endTime: '10:30:00' },
        { name: 'Mid Morning', startTime: '10:30:00', endTime: '12:00:00' },
        { name: 'Afternoon', startTime: '13:00:00', endTime: '15:00:00' },
        { name: 'Late Afternoon', startTime: '15:00:00', endTime: '17:00:00' },
        { name: 'Evening', startTime: '17:00:00', endTime: '18:00:00' },
      ],
    };
  }

  // Validate survey data with event
  private async validateSurveyWithEvent(
    createSurveyDto: CreateSurveyDto,
  ): Promise<void> {
    // 1. Check if event exists
    const event = await this.eventRepository.findOne({
      where: { id: createSurveyDto.eventId },
    });

    if (!event) {
      throw new BadRequestException('Event not found with provided eventId');
    }

    // 2. Convert dates to Date objects for comparison
    const surveyStartDate = new Date(createSurveyDto.startDate);
    const surveyEndDate = new Date(createSurveyDto.endDate);
    const eventStartDate = new Date(event.startDate);
    const eventEndDate = new Date(event.endDate);

    // 3. Validate survey date range is within event date range
    if (surveyStartDate < eventStartDate) {
      throw new BadRequestException(
        `Survey start date (${createSurveyDto.startDate}) cannot be before event start date (${event.startDate})`,
      );
    }

    if (surveyEndDate > eventEndDate) {
      throw new BadRequestException(
        `Survey end date (${createSurveyDto.endDate}) cannot be after event end date (${event.endDate})`,
      );
    }

    // 4. Validate survey time range is within event time range
    const surveyStartTimeMinutes = this.timeToMinutes(
      createSurveyDto.startTime,
    );
    const surveyEndTimeMinutes = this.timeToMinutes(createSurveyDto.endTime);
    const eventStartTimeMinutes = this.timeToMinutes(event.startTime);
    const eventEndTimeMinutes = this.timeToMinutes(event.endTime);

    // For same day events, check time range
    if (
      surveyStartDate.getTime() === surveyEndDate.getTime() &&
      surveyStartDate.getTime() === eventStartDate.getTime()
    ) {
      if (surveyStartTimeMinutes < eventStartTimeMinutes) {
        throw new BadRequestException(
          `Survey start time (${createSurveyDto.startTime}) cannot be before event start time (${event.startTime})`,
        );
      }

      if (surveyEndTimeMinutes > eventEndTimeMinutes) {
        throw new BadRequestException(
          `Survey end time (${createSurveyDto.endTime}) cannot be after event end time (${event.endTime})`,
        );
      }
    }

    // 5. Validate sessions if provided
    if (createSurveyDto.sessions && createSurveyDto.sessions.length > 0) {
      await this.validateSessions(
        createSurveyDto.sessions,
        event,
        surveyStartDate,
        surveyEndDate,
      );
    }
  }

  // Validate sessions
  private async validateSessions(
    sessions: CreateSessionDto[],
    event: Event,
    surveyStartDate: Date,
    surveyEndDate: Date,
  ): Promise<void> {
    const eventStartDate = new Date(event.startDate);
    const eventEndDate = new Date(event.endDate);
    const eventStartTimeMinutes = this.timeToMinutes(event.startTime);
    const eventEndTimeMinutes = this.timeToMinutes(event.endTime);

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];

      // Convert session date to Date object
      const sessionDate = new Date(session.date);

      // 1. Check if session date is within survey date range
      if (sessionDate < surveyStartDate || sessionDate > surveyEndDate) {
        throw new BadRequestException(
          `Session ${i + 1} date (${session.date}) is outside survey date range (${surveyStartDate.toISOString().split('T')[0]} to ${surveyEndDate.toISOString().split('T')[0]})`,
        );
      }

      // 2. Check if session date is within event date range
      if (sessionDate < eventStartDate || sessionDate > eventEndDate) {
        throw new BadRequestException(
          `Session ${i + 1} date (${session.date}) is outside event date range (${event.startDate} to ${event.endDate})`,
        );
      }

      // 3. Validate session time format
      if (!this.validateTimeFormat(session.startTime)) {
        throw new BadRequestException(
          `Session ${i + 1} start time format is invalid. Use HH:MM:SS format`,
        );
      }

      if (!this.validateTimeFormat(session.endTime)) {
        throw new BadRequestException(
          `Session ${i + 1} end time format is invalid. Use HH:MM:SS format`,
        );
      }

      // 4. Check if session end time is after start time
      const sessionStartMinutes = this.timeToMinutes(session.startTime);
      const sessionEndMinutes = this.timeToMinutes(session.endTime);

      if (sessionEndMinutes <= sessionStartMinutes) {
        throw new BadRequestException(
          `Session ${i + 1} end time must be after start time`,
        );
      }

      // 5. Check if session time is within event time range (for same day)
      if (sessionDate.getTime() === eventStartDate.getTime()) {
        if (sessionStartMinutes < eventStartTimeMinutes) {
          throw new BadRequestException(
            `Session ${i + 1} start time (${session.startTime}) cannot be before event start time (${event.startTime})`,
          );
        }
      }

      if (sessionDate.getTime() === eventEndDate.getTime()) {
        if (sessionEndMinutes > eventEndTimeMinutes) {
          throw new BadRequestException(
            `Session ${i + 1} end time (${session.endTime}) cannot be after event end time (${event.endTime})`,
          );
        }
      }

      // 6. Check for overlapping sessions on same day
      for (let j = i + 1; j < sessions.length; j++) {
        const otherSession = sessions[j];
        const otherSessionDate = new Date(otherSession.date);

        if (sessionDate.getTime() === otherSessionDate.getTime()) {
          // Same day, check for time overlap
          const otherStartMinutes = this.timeToMinutes(otherSession.startTime);
          const otherEndMinutes = this.timeToMinutes(otherSession.endTime);

          if (
            sessionStartMinutes < otherEndMinutes &&
            sessionEndMinutes > otherStartMinutes
          ) {
            throw new BadRequestException(
              `Session ${i + 1} and Session ${j + 1} have overlapping time slots on ${session.date}`,
            );
          }
        }
      }
    }
  }

  //

  // CREATE - Admin creates survey with sessions
  async createSurvey(createSurveyDto: CreateSurveyDto) {
    try {
      // 1. Check if event exists
      const event = await this.eventRepository.findOne({
        where: { id: createSurveyDto.eventId },
      });
      
      if (!event) {
        throw new BadRequestException('Event not found with provided eventId');
      }

      // 2. Check if survey already exists for this event
      const existingSurvey = await this.surveyRepository.findOne({
        where: { eventId: createSurveyDto.eventId },
      });

      if (existingSurvey) {
        throw new ConflictException(
          `Survey already exists for event ID: ${createSurveyDto.eventId}. You can update the existing survey but cannot create a new one.`,
        );
      }

      // 3. Validate survey date and time with event
      const surveyStartDate = new Date(createSurveyDto.startDate);
      const surveyEndDate = new Date(createSurveyDto.endDate);
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      // Date validation
      if (surveyStartDate < eventStartDate) {
        throw new BadRequestException(
          `Survey start date (${createSurveyDto.startDate}) cannot be before event start date (${event.startDate})`,
        );
      }
      
      if (surveyEndDate > eventEndDate) {
        throw new BadRequestException(
          `Survey end date (${createSurveyDto.endDate}) cannot be after event end date (${event.endDate})`,
        );
      }

      // Time validation for same day events
      const surveyStartTimeMinutes = this.timeToMinutes(createSurveyDto.startTime);
      const surveyEndTimeMinutes = this.timeToMinutes(createSurveyDto.endTime);
      const eventStartTimeMinutes = this.timeToMinutes(event.startTime);
      const eventEndTimeMinutes = this.timeToMinutes(event.endTime);

      if (
        surveyStartDate.getTime() === surveyEndDate.getTime() &&
        surveyStartDate.getTime() === eventStartDate.getTime()
      ) {
        if (surveyStartTimeMinutes < eventStartTimeMinutes) {
          throw new BadRequestException(
            `Survey start time (${createSurveyDto.startTime}) cannot be before event start time (${event.startTime})`,
          );
        }

        if (surveyEndTimeMinutes > eventEndTimeMinutes) {
          throw new BadRequestException(
            `Survey end time (${createSurveyDto.endTime}) cannot be after event end time (${event.endTime})`,
          );
        }
      }

      // 4. Create survey
      const survey = new Survey();
      survey.eventId = createSurveyDto.eventId;
      survey.title = createSurveyDto.title;
      survey.description = createSurveyDto.description;
      survey.startDate = new Date(createSurveyDto.startDate);
      survey.startTime = createSurveyDto.startTime;
      survey.endDate = new Date(createSurveyDto.endDate);
      survey.endTime = createSurveyDto.endTime;
      survey.isActive = createSurveyDto.isActive ?? true;

      const savedSurvey = await this.surveyRepository.save(survey);

      // 5. Create sessions if provided
      const sessionsToCreate = createSurveyDto.sessions || [];
      
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
          
          await this.surveySessionRepository.save(session);
        } catch (sessionError:any) {
          // If session creation fails, delete the survey and throw error
          await this.surveyRepository.delete(savedSurvey.id);
          throw new BadRequestException(`Failed to create session: ${sessionError.message}`);
        }
      }

      return await this.surveyRepository.findOne({
        where: { id: savedSurvey.id },
      });

    } catch (error:any) {
      // Handle different types of errors
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error; // Re-throw validation errors as they are
      }
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Survey with this event already exists',error.message);
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new BadRequestException('Invalid event ID provided',error.message);
      }
      
      // Log the error for debugging
      console.error('Survey creation error:', error);
      throw new BadRequestException('Failed to create survey. Please try again.',error.message);
    }
  }

  // READ - Get all surveys with sessions (Admin only)
  async getAllSurveysWithSessions() {
    const surveys = await this.surveyRepository.find({
      order: { createdAt: 'DESC' },
    });

    const surveysWithSessions = [];

    for (const survey of surveys) {
      const sessions = await this.surveySessionRepository.find({
        where: { surveyId: survey.id, isActive: true },
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

      surveysWithSessions.push({
        ...survey,
        sessions,
        eventStats: {
          totalDays,
          totalHours,
          totalSessions: sessions.length,
        },
      });
    }

    return surveysWithSessions;
  }

  // READ - Get current time surveys with current sessions (For users)
  async getCurrentTimeSurveysWithSessions() {
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

      const currentSessions = allSessions.filter((session) =>
        this.isCurrentTimeInSession(session),
      );

      if (currentSessions.length > 0) {
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

        currentTimeSurveys.push({
          ...survey,
          currentSessions,
          allSessions, // Show all sessions but highlight current ones
          eventStats: {
            totalDays,
            totalHours,
            totalSessions: allSessions.length,
            currentSessionsCount: currentSessions.length,
          },
        });
      }
    }

    return currentTimeSurveys;
  }

  // Get single survey with all sessions (Admin only)
  async getSurveyWithAllSessions(surveyId: string) {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
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
  }

  // Get single survey with current sessions (For users)
  async getSurveyWithCurrentSessions(surveyId: string) {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId, isActive: true },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found or inactive');
    }

    const allSessions = await this.surveySessionRepository.find({
      where: { surveyId, isActive: true },
      order: { date: 'ASC', startTime: 'ASC' },
    });

    const currentSessions = allSessions.filter((session) =>
      this.isCurrentTimeInSession(session),
    );

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
      currentSessions,
      allSessions,
      eventStats: {
        totalDays,
        totalHours,
        totalSessions: allSessions.length,
        currentSessionsCount: currentSessions.length,
      },
    };
  }

  calculateTotalEventTime(
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string,
  ): number {
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
  }

  async getSurveyById(surveyId: string) {
    return await this.surveyRepository.findOne({
      where: { id: surveyId },
    });
  }

  // Get survey sessions
  async getSurveySessions(surveyId: string) {
    return await this.surveySessionRepository.find({
      where: { surveyId, isActive: true },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  // Check if current time is within session time
  private isCurrentTimeInSession(session: SurveySession): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sessionDate = new Date(session.date);
    const sessionStartTime = new Date(
      today.getTime() + this.timeToMinutes(session.startTime) * 60000,
    );
    const sessionEndTime = new Date(
      today.getTime() + this.timeToMinutes(session.endTime) * 60000,
    );

    // Check if today's date matches session date
    if (
      now.getDate() !== sessionDate.getDate() ||
      now.getMonth() !== sessionDate.getMonth() ||
      now.getFullYear() !== sessionDate.getFullYear()
    ) {
      return false;
    }

    // Check if current time is within session time
    return now >= sessionStartTime && now <= sessionEndTime;
  }

  // User submits feedback
  async submitFeedback(
    surveyId: string,
    eventId: string,
    userId: string,
    feedbackDto: SurveyResponseDto,
  ) {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId, eventId, isActive: true },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found or inactive');
    }

    // Check if session exists and is currently active
    const session = await this.surveySessionRepository.findOne({
      where: { id: feedbackDto.sessionId, surveyId, isActive: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found or inactive');
    }

    // Check if current time is within session time
    if (!this.isCurrentTimeInSession(session)) {
      throw new BadRequestException('This session is not currently active');
    }

    // Check if user already submitted for this session
    const existingResponse = await this.surveyResponseRepository.findOne({
      where: { surveyId, sessionId: feedbackDto.sessionId, userId },
    });

    if (existingResponse) {
      throw new ConflictException(
        'You have already submitted feedback for this session',
      );
    }

    const response = new SurveyResponse();
    response.surveyId = surveyId;
    response.sessionId = feedbackDto.sessionId;
    response.eventId = eventId;
    response.userId = userId;
    response.name = feedbackDto.name;
    response.title = feedbackDto.title;
    response.comment = feedbackDto.comment;

    return await this.surveyResponseRepository.save(response);
  }

  // Add new session to existing survey
  async addSession(surveyId: string, sessionDto: CreateSessionDto) {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
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
  }

  // Get survey detail based on user role
  async getSurveyDetailByRole(surveyId: string, userRole: string) {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId, isActive: true },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found or inactive');
    }

    const allSessions = await this.surveySessionRepository.find({
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

    // For Admin: Show all sessions
    if (userRole === 'admin') {
      return {
        ...survey,
        sessions: allSessions,
        eventStats: {
          totalDays,
          totalHours,
          totalSessions: allSessions.length,
        },
      };
    }

    // For User: Show only current session or first session for upcoming events
    const currentSessions = allSessions.filter((session) =>
      this.isCurrentTimeInSession(session),
    );

    let sessionsToShow = [];

    if (currentSessions.length > 0) {
      // If there are current sessions, show only current sessions
      sessionsToShow = currentSessions;
    } else {
      // Check if event is upcoming (current date < survey start date)
      const now = new Date();
      const surveyStartDate = new Date(survey.startDate);
      
      if (now < surveyStartDate) {
        // Event is upcoming, show only first session
        sessionsToShow = allSessions.length > 0 ? [allSessions[0]] : [];
      } else {
        // Event is ongoing or past, show current sessions (which will be empty if none)
        sessionsToShow = currentSessions;
      }
    }

    return {
      ...survey,
      sessions: sessionsToShow,
      allSessions: allSessions, // Keep reference to all sessions
      eventStats: {
        totalDays,
        totalHours,
        totalSessions: allSessions.length,
        currentSessionsCount: sessionsToShow.length,
      },
    };
  }
}
