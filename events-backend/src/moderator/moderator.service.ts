import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moderator } from './moderator.entity';
import { ModeratorEvent } from './moderator-event.entity';
import { CreateModeratorDto, UpdateModeratorDto, AssignModeratorToEventDto, AssignModeratorToSessionDto, AssignMultipleEventsDto } from './moderator.dto';
import { Event } from '../event/event.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';
import { EmailService } from '../service/email.service';
import { UserEntity, UserRole } from '../user/users.entity';
import { PasswordUtils } from '../utils/password.utils';
import { JwtService } from '@nestjs/jwt';
import { EngagementQnaQuestion } from '../engagement-qna/engagement-qna.entity';
import { Engagement } from '../engagement/engagement.entity';

@Injectable()
export class ModeratorService {
  constructor(
    @InjectRepository(Moderator)
    private moderatorRepository: Repository<Moderator>,
    @InjectRepository(ModeratorEvent)
    private moderatorEventRepository: Repository<ModeratorEvent>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(ProgrammeTrack)
    private programmeTrackRepository: Repository<ProgrammeTrack>,
    @InjectRepository(ProgrammeSession)
    private programmeSessionRepository: Repository<ProgrammeSession>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(EngagementQnaQuestion)
    private engagementQnaQuestionRepository: Repository<EngagementQnaQuestion>,
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  // Create a new moderator
  async createModerator(createModeratorDto: CreateModeratorDto): Promise<Moderator> {
    // Check if email already exists in moderator table
    const existingModerator = await this.moderatorRepository.findOne({
      where: { email: createModeratorDto.email },
    });

    if (existingModerator) {
      throw new ConflictException('Email already exists');
    }

    // Check if email already exists in user table
    const existingUser = await this.userRepository.findOne({
      where: { email: createModeratorDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists in user system');
    }

    // Create moderator record
    const moderator = this.moderatorRepository.create(createModeratorDto);
    const savedModerator = await this.moderatorRepository.save(moderator);

    // Create user account for moderator
    const user = this.userRepository.create({
      email: createModeratorDto.email,
      firstName: createModeratorDto.firstName,
      lastName: createModeratorDto.lastName,
      mobile: createModeratorDto.mobile || '',
      role: UserRole.Moderator,
      isVerify: true,
      password: await PasswordUtils.hashPassword('Moderator@123'), // Default password
    });

    await this.userRepository.save(user);

    return savedModerator;
  }

  // Helper method to group moderator assignments by event and track
  private groupModeratorAssignments(moderatorEvents: any[]): any[] {
    const groupedMap = new Map<string, any>();

    moderatorEvents.forEach((me) => {
      const key = `${me.eventId}-${me.trackId || 'null'}`;
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: me.id,
          eventId: me.eventId,
          trackId: me.trackId,
          event: me.event,
          track: me.track,
          sessions: [],
          createdAt: me.createdAt,
        });
      }

      const group = groupedMap.get(key);
      
      // Add session if it exists
      if (me.sessionId && me.session) {
        group.sessions.push({
          id: me.sessionId,
          session: me.session,
        });
      }
    });

    return Array.from(groupedMap.values());
  }

  // Get all moderators
  async getAllModerators(): Promise<any[]> {
    const moderators = await this.moderatorRepository.find({
      relations: [
        'moderatorEvents', 
        'moderatorEvents.event',
        'moderatorEvents.track',
        'moderatorEvents.session'
      ],
      order: { createdAt: 'DESC' },
    });

    return moderators.map(moderator => ({
      id: moderator.id,
      firstName: moderator.firstName,
      lastName: moderator.lastName,
      email: moderator.email,
      mobile: moderator.mobile,
      isActive: moderator.isActive,
      createdAt: moderator.createdAt,
      updatedAt: moderator.updatedAt,
      assignments: this.groupModeratorAssignments(moderator.moderatorEvents || [])
    }));
  }

  // Get moderator by ID
  async getModeratorById(id: string): Promise<any> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id },
      relations: [
        'moderatorEvents', 
        'moderatorEvents.event',
        'moderatorEvents.track',
        'moderatorEvents.session'
      ],
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${id} not found`);
    }

    return {
      id: moderator.id,
      firstName: moderator.firstName,
      lastName: moderator.lastName,
      email: moderator.email,
      mobile: moderator.mobile,
      isActive: moderator.isActive,
      createdAt: moderator.createdAt,
      updatedAt: moderator.updatedAt,
      assignments: this.groupModeratorAssignments(moderator.moderatorEvents || [])
    };
  }

  // Update a moderator
  async updateModerator(id: string, updateModeratorDto: UpdateModeratorDto): Promise<Moderator> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${id} not found`);
    }

    // Check email uniqueness if updating email
    if (updateModeratorDto.email && updateModeratorDto.email !== moderator.email) {
      const existingModerator = await this.moderatorRepository.findOne({
        where: { email: updateModeratorDto.email },
      });

      if (existingModerator) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(moderator, updateModeratorDto);
    return await this.moderatorRepository.save(moderator);
  }

  // Delete a moderator
  async deleteModerator(id: string): Promise<{ message: string }> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${id} not found`);
    }

    await this.moderatorRepository.remove(moderator);
    return { message: 'Moderator deleted successfully' };
  }

  // Assign moderator to event
  async assignModeratorToEvent(assignDto: AssignModeratorToEventDto): Promise<ModeratorEvent> {
    // Verify moderator exists
    const moderator = await this.moderatorRepository.findOne({
      where: { id: assignDto.moderatorId },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${assignDto.moderatorId} not found`);
    }

    // Verify event exists
    const event = await this.eventRepository.findOne({
      where: { id: assignDto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${assignDto.eventId} not found`);
    }

    // Validate track if provided
    if (assignDto.trackId) {
      const track = await this.programmeTrackRepository.findOne({
        where: { id: assignDto.trackId, eventId: assignDto.eventId },
      });

      if (!track) {
        throw new NotFoundException(`Track with ID ${assignDto.trackId} not found or does not belong to this event`);
      }
    }

    // Validate session if provided
    if (assignDto.sessionId) {
      const session = await this.programmeSessionRepository.findOne({
        where: { id: assignDto.sessionId },
        relations: ['track'],
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${assignDto.sessionId} not found`);
      }

      // If trackId is also provided, verify session belongs to that track
      if (assignDto.trackId && session.trackId !== assignDto.trackId) {
        throw new NotFoundException(`Session ${assignDto.sessionId} does not belong to track ${assignDto.trackId}`);
      }

      // Verify session's track belongs to the event
      if (session.track?.eventId !== assignDto.eventId) {
        throw new NotFoundException(`Session ${assignDto.sessionId} does not belong to event ${assignDto.eventId}`);
      }
    }

    // Check if assignment already exists
    const whereCondition: any = {
      moderatorId: assignDto.moderatorId,
      eventId: assignDto.eventId,
    };

    if (assignDto.trackId) {
      whereCondition.trackId = assignDto.trackId;
    } else {
      whereCondition.trackId = null;
    }

    if (assignDto.sessionId) {
      whereCondition.sessionId = assignDto.sessionId;
    } else {
      whereCondition.sessionId = null;
    }

    const existingAssignment = await this.moderatorEventRepository.findOne({
      where: whereCondition,
    });

    if (existingAssignment) {
      throw new ConflictException('Moderator already assigned to this event/track/session combination');
    }

    const moderatorEvent = this.moderatorEventRepository.create(assignDto);
    return await this.moderatorEventRepository.save(moderatorEvent);
  }

  // Assign moderator to specific session
  async assignModeratorToSession(assignDto: AssignModeratorToSessionDto): Promise<any> {
    // Verify moderator exists
    const moderator = await this.moderatorRepository.findOne({
      where: { id: assignDto.moderatorId },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${assignDto.moderatorId} not found`);
    }

    // Verify event exists
    const event = await this.eventRepository.findOne({
      where: { id: assignDto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${assignDto.eventId} not found`);
    }

    // Verify track exists and belongs to event
    const track = await this.programmeTrackRepository.findOne({
      where: { id: assignDto.trackId, eventId: assignDto.eventId },
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${assignDto.trackId} not found or does not belong to this event`);
    }

    // Verify session exists and belongs to track
    const session = await this.programmeSessionRepository.findOne({
      where: { id: assignDto.sessionId, trackId: assignDto.trackId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${assignDto.sessionId} not found or does not belong to track ${assignDto.trackId}`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.moderatorEventRepository.findOne({
      where: {
        moderatorId: assignDto.moderatorId,
        eventId: assignDto.eventId,
        trackId: assignDto.trackId,
        sessionId: assignDto.sessionId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Moderator already assigned to this session');
    }

    const moderatorEvent = this.moderatorEventRepository.create(assignDto);
    const savedAssignment = await this.moderatorEventRepository.save(moderatorEvent);

    // Get session questions for this assignment
    const sessionQuestions = await this.getSessionQuestions(assignDto.sessionId);

    const assignmentData = {
      assignment: savedAssignment,
      moderator: {
        id: moderator.id,
        firstName: moderator.firstName,
        lastName: moderator.lastName,
        email: moderator.email,
        fullName: `${moderator.firstName} ${moderator.lastName}`.trim(),
      },
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location || null,
      },
      track: {
        id: track.id,
        title: track.title,
        description: track.description || null,
      },
      session: {
        id: session.id,
        title: session.title,
        description: session.description || null,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        venue: session.venue || null,
      },
      questions: sessionQuestions,
    };

    // Send email notification with session details and questions
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Generate access token for moderator
      const accessToken = this.jwtService.sign({
        sub: moderator.id,
        email: moderator.email,
        name: `${moderator.firstName} ${moderator.lastName}`,
        role: 'moderator',
        type: 'access'
      }, {
        secret: process.env.JWT_SECRET,
        expiresIn: '30d' // Token valid for 30 days
      });

      // Create session-specific landing URL with session ID and token
      const sessionLandingUrl = `${baseUrl}/moderator/session/${assignDto.sessionId}?token=${accessToken}`;

      await this.emailService.sendModeratorSessionAssignmentEmail(
        moderator.email,
        `${moderator.firstName} ${moderator.lastName}`,
        assignmentData,
        sessionLandingUrl,
        accessToken
      );
    } catch (error) {
      console.error('Error sending session assignment email:', error);
      // Don't throw error - assignment was successful, email is just a notification
    }

    return assignmentData;
  }

  // Assign moderator to multiple events
  async assignModeratorToMultipleEvents(assignDto: AssignMultipleEventsDto): Promise<ModeratorEvent[]> {
    // Verify moderator exists
    const moderator = await this.moderatorRepository.findOne({
      where: { id: assignDto.moderatorId },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${assignDto.moderatorId} not found`);
    }

    const createdAssignments: ModeratorEvent[] = [];

    for (const eventId of assignDto.eventIds) {
      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        continue; // Skip if event not found
      }

      // Check if assignment already exists
      const existingAssignment = await this.moderatorEventRepository.findOne({
        where: {
          moderatorId: assignDto.moderatorId,
          eventId: eventId,
        },
      });

      if (!existingAssignment) {
        const moderatorEvent = this.moderatorEventRepository.create({
          moderatorId: assignDto.moderatorId,
          eventId: eventId,
        });
        const saved = await this.moderatorEventRepository.save(moderatorEvent);
        createdAssignments.push(saved);
      }
    }

    // Send email notification to moderator if any assignments were created
    if (createdAssignments.length > 0) {
      try {
        const assignedEvents = await Promise.all(
          createdAssignments.map(async (assignment) => {
            const event = await this.eventRepository.findOne({
              where: { id: assignment.eventId },
            });
            return event;
          })
        );

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Generate access token for moderator
        const accessToken = this.jwtService.sign({
          sub: moderator.id,
          email: moderator.email,
          name: `${moderator.firstName} ${moderator.lastName}`,
          role: 'moderator',
          type: 'access'
        }, {
          secret: process.env.JWT_SECRET,
          expiresIn: '30d' // Token valid for 30 days
        });

        const moderatorLandingUrl = `${baseUrl}/moderator/${moderator.id}?token=${accessToken}`;

        await this.emailService.sendModeratorAssignmentEmail(
          moderator.email,
          `${moderator.firstName} ${moderator.lastName}`,
          assignedEvents,
          moderatorLandingUrl,
          accessToken
        );
      } catch (error) {
        console.error('Error sending email notification:', error);
        // Don't throw error - assignment was successful, email is just a notification
      }
    }

    return createdAssignments;
  }

  // Remove moderator from event
  async removeModeratorFromEvent(moderatorId: string, eventId: string): Promise<{ message: string }> {
    const moderatorEvent = await this.moderatorEventRepository.findOne({
      where: {
        moderatorId,
        eventId,
      },
    });

    if (!moderatorEvent) {
      throw new NotFoundException('Assignment not found');
    }

    await this.moderatorEventRepository.remove(moderatorEvent);
    return { message: 'Moderator removed from event successfully' };
  }

  // Get moderator assignments with track and session details
  async getModeratorAssignments(moderatorId: string): Promise<any[]> {
    const assignments = await this.moderatorEventRepository.find({
      where: { moderatorId },
      relations: ['event', 'track', 'session'],
    });

    return assignments.map(assignment => ({
      id: assignment.id,
      moderatorId: assignment.moderatorId,
      event: {
        id: assignment.event?.id,
        name: assignment.event?.name,
        startDate: assignment.event?.startDate,
        endDate: assignment.event?.endDate,
      },
      track: assignment.track ? {
        id: assignment.track.id,
        title: assignment.track.title,
      } : null,
      session: assignment.session ? {
        id: assignment.session.id,
        title: assignment.session.title,
        startTime: assignment.session.startTime,
        endTime: assignment.session.endTime,
      } : null,
      createdAt: assignment.createdAt,
    }));
  }

  // Get all events for a moderator
  async getModeratorEvents(moderatorId: string): Promise<any[]> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id: moderatorId },
      relations: [
        'moderatorEvents', 
        'moderatorEvents.event',
        'moderatorEvents.track',
        'moderatorEvents.session'
      ],
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${moderatorId} not found`);
    }

    return this.groupModeratorAssignments(moderator.moderatorEvents || []);
  }

  // Get all moderators for an event
  async getEventModerators(eventId: string): Promise<any[]> {
    const moderatorEvents = await this.moderatorEventRepository.find({
      where: { eventId },
      relations: [
        'moderator',
        'event',
        'track',
        'session'
      ],
    });

    // Group by moderator
    const moderatorMap = new Map<string, any>();
    
    moderatorEvents.forEach((me) => {
      if (!moderatorMap.has(me.moderatorId)) {
        moderatorMap.set(me.moderatorId, {
          moderator: me.moderator,
          assignments: []
        });
      }
      
      const moderatorData = moderatorMap.get(me.moderatorId);
      moderatorData.assignments.push({
        id: me.id,
        eventId: me.eventId,
        trackId: me.trackId,
        sessionId: me.sessionId,
        event: me.event,
        track: me.track,
        session: me.session,
        createdAt: me.createdAt,
      });
    });

    // Group assignments for each moderator
    return Array.from(moderatorMap.values()).map(moderatorData => ({
      ...moderatorData.moderator,
      assignments: this.groupModeratorAssignments(moderatorData.assignments)
    }));
  }

  // Get session questions for moderator assignment
  async getSessionQuestions(sessionId: string): Promise<any> {
    try {
      // First get session details with track and event information
      const session = await this.programmeSessionRepository.findOne({
        where: { id: sessionId },
        relations: ['track', 'track.event'],
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      // Get all questions for this session
      const questions = await this.engagementQnaQuestionRepository.find({
        where: { 
          sessionId: sessionId,
          isActive: true 
        },
        relations: ['askedBy', 'answeredByUser', 'engagement', 'engagement.track', 'engagement.track.event'],
        order: { 
          isPinned: 'DESC',
          likesCount: 'DESC',
          createdAt: 'DESC' 
        },
      });

      // Process questions to include relevant information
      const processedQuestions = questions.map(question => ({
        id: question.id,
        question: question.question,
        askedBy: question.askedBy ? {
          id: question.askedBy.id,
          firstName: question.askedBy.firstName,
          lastName: question.askedBy.lastName,
          fullName: `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim(),
        } : null,
        answeredBy: question.answeredByUser ? {
          id: question.answeredByUser.id,
          firstName: question.answeredByUser.firstName,
          lastName: question.answeredByUser.lastName,
          fullName: `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
        } : null,
        status: question.status || 'not_answered',
        answer: question.answer || null,
        answeredAt: question.answeredAt || null,
        likesCount: question.likesCount,
        isPinned: question.isPinned,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        isAnswered: !!question.answeredAt,
        engagement: question.engagement ? {
          id: question.engagement.id,
          trackTitle: question.engagement.track?.title || 'Unknown Track',
          eventName: question.engagement.track?.event?.name || 'Unknown Event',
        } : null,
      }));

      // Calculate summary statistics
      const totalQuestions = questions.length;
      const answeredQuestions = questions.filter(q => q.status === 'answered').length;
      const unansweredQuestions = questions.filter(q => q.status === 'not_answered' || q.status === null).length;
      const pinnedQuestions = questions.filter(q => q.isPinned).length;

      return {
        sessionDetails: {
          id: session.id,
          title: session.title,
          description: session.description || null,
          sessionDate: session.sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
          venue: session.venue || null,
          track: {
            id: session.track?.id,
            title: session.track?.title || 'Unknown Track',
            description: session.track?.description || null,
          },
          event: {
            id: session.track?.event?.id,
            name: session.track?.event?.name || 'Unknown Event',
            startDate: session.track?.event?.startDate,
            endDate: session.track?.event?.endDate,
            location: session.track?.event?.location || null,
          },
        },
        questions: processedQuestions,
        summary: {
          total: totalQuestions,
          answered: answeredQuestions,
          unanswered: unansweredQuestions,
          pinned: pinnedQuestions,
        },
      };
    } catch (error) {
      console.error('Error fetching session questions:', error);
      return {
        sessionDetails: null,
        questions: [],
        summary: {
          total: 0,
          answered: 0,
          unanswered: 0,
          pinned: 0,
        },
      };
    }
  }

  // Get session-specific moderator data for landing page
  async getSessionModeratorData(sessionId: string, token?: string): Promise<any> {
    try {
      // Get session details with track and event information
      const session = await this.programmeSessionRepository.findOne({
        where: { id: sessionId },
        relations: ['track', 'track.event', 'speakers'],
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      // Get moderator assignments for this session
      const moderatorAssignments = await this.moderatorEventRepository.find({
        where: { sessionId: sessionId },
        relations: ['moderator', 'event', 'track'],
      });

      if (moderatorAssignments.length === 0) {
        throw new NotFoundException(`No moderators assigned to session ${sessionId}`);
      }

      // Get session questions with full details
      const sessionQuestions = await this.getSessionQuestions(sessionId);

      // Prepare moderator data with assignment details
      const moderators = moderatorAssignments.map(assignment => ({
        id: assignment.moderator.id,
        firstName: assignment.moderator.firstName,
        lastName: assignment.moderator.lastName,
        email: assignment.moderator.email,
        mobile: assignment.moderator.mobile,
        fullName: `${assignment.moderator.firstName} ${assignment.moderator.lastName}`.trim(),
        isActive: assignment.moderator.isActive,
        assignmentId: assignment.id,
        assignedAt: assignment.createdAt,
        eventId: assignment.eventId,
        trackId: assignment.trackId,
      }));

      // Get engagement data for this session
      const engagements = await this.engagementRepository.find({
        where: { trackId: session.trackId },
        relations: ['track', 'track.event'],
      });

      // Calculate session statistics
      const sessionStats = {
        totalQuestions: sessionQuestions.summary?.total || 0,
        answeredQuestions: sessionQuestions.summary?.answered || 0,
        unansweredQuestions: sessionQuestions.summary?.unanswered || 0,
        pinnedQuestions: sessionQuestions.summary?.pinned || 0,
        totalModerators: moderators.length,
        activeModerators: moderators.filter(m => m.isActive).length,
        totalSpeakers: session.speakers?.length || 0,
        totalEngagements: engagements.length,
      };

      // Prepare speakers data
      const speakers = session.speakers?.map(speaker => ({
        id: speaker.id,
        firstName: speaker.firstName,
        lastName: speaker.lastName,
        email: speaker.email,
        fullName: `${speaker.firstName} ${speaker.lastName}`.trim(),
        mobile: speaker.mobile,
      })) || [];

      // Prepare engagement data
      const engagementData = engagements.map(engagement => ({
        id: engagement.id,
        isActive: engagement.isActive,
        trackTitle: engagement.track?.title,
        eventName: engagement.track?.event?.name,
        createdAt: engagement.createdAt,
        updatedAt: engagement.updatedAt,
      }));

      return {
        // Session Information
        sessionDetails: {
          id: session.id,
          title: session.title,
          description: session.description || null,
          sessionDate: session.sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
          venue: session.venue || null,
          isActive: session.isActive,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          track: {
            id: session.track?.id,
            title: session.track?.title || 'Unknown Track',
            description: session.track?.description || null,
          },
          event: {
            id: session.track?.event?.id,
            name: session.track?.event?.name || 'Unknown Event',
            startDate: session.track?.event?.startDate,
            endDate: session.track?.event?.endDate,
            location: session.track?.event?.location || null,
            description: session.track?.event?.description || null,
          },
        },

        // Moderator Information
        moderators: moderators,
        
        // Speaker Information
        speakers: speakers,

        // Questions and Q&A Data
        questions: sessionQuestions,

        // Engagement Data
        engagements: engagementData,

        // Assignment Information
        assignmentInfo: {
          sessionId: sessionId,
          assignmentDate: moderatorAssignments[0]?.createdAt,
          lastUpdated: moderatorAssignments[0]?.createdAt,
          totalAssignments: moderatorAssignments.length,
        },

        // Session Statistics
        statistics: sessionStats,

        // Access Information
        accessInfo: {
          tokenProvided: !!token,
          sessionId: sessionId,
          landingPageUrl: `/moderator/session/${sessionId}`,
          apiEndpoints: {
            questions: `/api/moderators/session/${sessionId}/questions`,
            landing: `/api/moderators/session/${sessionId}/landing`,
            engagementQna: `/api/engagements/qna/questions?sessionId=${sessionId}`,
          },
        },

        // Metadata
        metadata: {
          generatedAt: new Date().toISOString(),
          dataVersion: '1.0',
          sessionStatus: session.isActive ? 'active' : 'inactive',
        },
      };
    } catch (error) {
      console.error('Error fetching session moderator data:', error);
      throw error;
    }
  }

  // Update question status for moderator actions
  async updateQuestionStatus(questionId: string, action: 'cancel' | 'answer', answer?: string): Promise<any> {
    try {
      // Find the question
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id: questionId, isActive: true },
        relations: ['askedBy', 'answeredByUser', 'engagement', 'engagement.track', 'engagement.track.event'],
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }

      // Update status based on action
      if (action === 'cancel') {
        question.status = 'not_answered';
        question.answer = undefined;
        question.answeredAt = undefined;
        question.answeredBy = undefined;
      } else if (action === 'answer') {
        question.status = 'answered';
        question.answer = answer ? answer.trim() : undefined; // Optional answer text
        question.answeredAt = new Date();
        // Note: answeredBy will be set by the moderator who answers (from token)
        // For now, we'll leave it null or set it based on the token
      }

      const updatedQuestion = await this.engagementQnaQuestionRepository.save(question);

      // Return the updated question with relations
      return {
        id: updatedQuestion.id,
        question: updatedQuestion.question,
        status: updatedQuestion.status,
        answer: updatedQuestion.answer,
        answeredAt: updatedQuestion.answeredAt,
        answeredBy: updatedQuestion.answeredBy,
        askedBy: updatedQuestion.askedBy ? {
          id: updatedQuestion.askedBy.id,
          firstName: updatedQuestion.askedBy.firstName,
          lastName: updatedQuestion.askedBy.lastName,
          fullName: `${updatedQuestion.askedBy.firstName} ${updatedQuestion.askedBy.lastName}`.trim(),
        } : null,
        answeredByUser: updatedQuestion.answeredByUser ? {
          id: updatedQuestion.answeredByUser.id,
          firstName: updatedQuestion.answeredByUser.firstName,
          lastName: updatedQuestion.answeredByUser.lastName,
          fullName: `${updatedQuestion.answeredByUser.firstName} ${updatedQuestion.answeredByUser.lastName}`.trim(),
        } : null,
        likesCount: updatedQuestion.likesCount,
        isPinned: updatedQuestion.isPinned,
        createdAt: updatedQuestion.createdAt,
        updatedAt: updatedQuestion.updatedAt,
        engagement: updatedQuestion.engagement ? {
          id: updatedQuestion.engagement.id,
          trackTitle: updatedQuestion.engagement.track?.title || 'Unknown Track',
          eventName: updatedQuestion.engagement.track?.event?.name || 'Unknown Event',
        } : null,
      };
    } catch (error) {
      console.error('Error updating question status:', error);
      throw error;
    }
  }
}
