import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventAgenda, AgendaCategory, MeetingStatus, RequestStatus } from './agenda.entity';
import { 
  CreateMeetingRequestDto,
  RespondToMeetingRequestDto,
  RescheduleMeetingDto
} from './agenda.dto';
import { Event } from '../event/event.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { UserEntity } from 'user/users.entity';
import { EmailService } from '../service/email.service';
import { MeetingEmailTemplates } from '../utils/meeting-email-templates.utils';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(EventAgenda)
    private agendaRepository: Repository<EventAgenda>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,

    private readonly errorHandler: ErrorHandlerService,
    private readonly emailService: EmailService,
  ) {}


  // New method for getting incoming meeting requests (for recipient)
  async getIncomingMeetingRequests(userId: string, eventId?: string) {
    try {
      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('agenda.userId = :userId', { userId })
        .andWhere('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const requests = await queryBuilder.getMany();
      return requests.map(request => this.formatAgendaResponse(request));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Incoming meeting requests retrieval');
    }
  }

  // New method for getting sent meeting requests (for sender)
  async getSentMeetingRequests(userId: string, eventId?: string) {
    try {
      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('agenda.createdBy = :userId', { userId })
        .andWhere('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const requests = await queryBuilder.getMany();
      return requests.map(request => this.formatAgendaResponse(request));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Sent meeting requests retrieval');
    }
  }

  // New method for getting user's meetings (all types)
  async getMyMeetings(userId: string, eventId?: string, status?: string) {
    try {
      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('(agenda.userId = :userId OR agenda.createdBy = :userId)', { userId })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      if (status) {
        queryBuilder.andWhere('agenda.meetingStatus = :status', { status });
      }

      const meetings = await queryBuilder.getMany();
      return meetings.map(meeting => this.formatAgendaResponse(meeting));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'My meetings retrieval');
    }
  }

  // New method for creating meeting requests
  async createMeetingRequest(createMeetingDto: CreateMeetingRequestDto, currentUser?: any) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: createMeetingDto.eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', createMeetingDto.eventId);
      }

      // Validate target user exists and has appropriate role
      const targetUser = await this.userRepository.findOne({
        where: { id: createMeetingDto.targetUserId },
      });
      if (!targetUser) {
        throw new ResourceNotFoundException('User', createMeetingDto.targetUserId);
      }

      if (!targetUser.role || (targetUser.role !== 'exhibitor' && targetUser.role !== 'user')) {
        throw new BadRequestException('Only exhibitors and regular users can receive meeting requests.');
      }

      // Check if current user is registered for the event
      await this.validateBothUsersRegistration(createMeetingDto.eventId, currentUser.id, createMeetingDto.targetUserId);

      // Check for time conflicts
      await this.checkTimeConflicts(
        createMeetingDto.eventId,
        createMeetingDto.time,
        createMeetingDto.duration,
        undefined,
      );

      // Create meeting request
      const meetingRequest = this.agendaRepository.create({
        eventId: createMeetingDto.eventId,
        userId: createMeetingDto.targetUserId, // Target user receives the request
        title: createMeetingDto.title,
        time: createMeetingDto.time,
        duration: createMeetingDto.duration,
        location: createMeetingDto.location,
        details: createMeetingDto.details,
        category: AgendaCategory.Meeting,
        createdBy: currentUser.id,
        isMeetingRequest: true,
        meetingStatus: MeetingStatus.Pending,
        requestStatus: RequestStatus.Pending,
        attendees: [currentUser.id, createMeetingDto.targetUserId],
        meetingNotes: createMeetingDto.meetingNotes,
        meetingDate: new Date(createMeetingDto.meetingDate),
      });

      const savedMeeting = await this.agendaRepository.save(meetingRequest);

      // Send notification to the target user about the meeting request
      await this.sendMeetingRequestNotification(savedMeeting, currentUser, targetUser);

      return await this.getAgendaWithRelations(savedMeeting.id);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Meeting request creation');
    }
  }

  // New method for responding to meeting requests
  async respondToMeetingRequest(meetingId: string, responseDto: RespondToMeetingRequestDto, currentUser?: any) {
    try {
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Validate that current user is the target of the meeting request
      if (meeting.userId !== currentUser.id) {
        throw new BadRequestException('You can only respond to meeting requests sent to you.');
      }

      // Validate that this is a meeting request
      if (!meeting.isMeetingRequest) {
        throw new BadRequestException('This is not a meeting request.');
      }

      // Update meeting status based on response
      if (responseDto.response === RequestStatus.Accepted) {
        meeting.requestStatus = RequestStatus.Accepted;
        meeting.meetingStatus = MeetingStatus.Confirmed;
      } else if (responseDto.response === RequestStatus.Rejected) {
        meeting.requestStatus = RequestStatus.Rejected;
        meeting.meetingStatus = MeetingStatus.Cancelled;
      }

      // Add response message to meeting notes if provided
      if (responseDto.message) {
        meeting.meetingNotes = meeting.meetingNotes 
          ? `${meeting.meetingNotes}\n\nResponse: ${responseDto.message}`
          : `Response: ${responseDto.message}`;
      }

      const updatedMeeting = await this.agendaRepository.save(meeting);

      // Send notification to the meeting creator
      await this.sendMeetingResponseNotification(meeting, responseDto, currentUser);

      return await this.getAgendaWithRelations(updatedMeeting.id);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Meeting response');
    }
  }

  // New method for rescheduling meetings
  async rescheduleMeeting(meetingId: string, rescheduleDto: RescheduleMeetingDto, currentUser?: any) {
    try {
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Validate permissions
      if (meeting.userId !== currentUser.id && meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('You can only reschedule meetings that you own or created.');
      }

      // Validate that this is a confirmed meeting
      if (meeting.requestStatus !== RequestStatus.Accepted) {
        throw new BadRequestException('You can only reschedule confirmed meetings.');
      }

      // Check for time conflicts with new time
      await this.checkTimeConflicts(
        meeting.eventId,
        rescheduleDto.newTime,
        meeting.duration,
        meetingId,
      );

      // Get user details for notifications
      const [currentUserDetails, targetUserDetails] = await Promise.all([
        this.userRepository.findOne({ where: { id: currentUser.id } }),
        this.userRepository.findOne({ where: { id: meeting.userId } })
      ]);

      // Create new meeting entry for rescheduled time
      const rescheduledMeeting = this.agendaRepository.create({
        eventId: meeting.eventId,
        userId: meeting.userId,
        title: `${meeting.title} (Rescheduled)`,
        time: rescheduleDto.newTime,
        duration: meeting.duration,
        location: meeting.location,
        details: meeting.details,
        category: AgendaCategory.Meeting,
        createdBy: currentUser.id,
        isMeetingRequest: false,
        meetingStatus: MeetingStatus.Rescheduled,
        requestStatus: RequestStatus.Accepted,
        attendees: meeting.attendees,
        meetingNotes: rescheduleDto.reason 
          ? `Rescheduled: ${rescheduleDto.reason}\n\nOriginal meeting: ${meeting.id}`
          : `Rescheduled from original meeting: ${meeting.id}`,
        meetingDate: new Date(rescheduleDto.newDate),
        parentMeetingId: meeting.id,
      });

      // Update original meeting status
      meeting.meetingStatus = MeetingStatus.Cancelled;
      meeting.meetingNotes = meeting.meetingNotes 
        ? `${meeting.meetingNotes}\n\nCancelled due to rescheduling`
        : 'Cancelled due to rescheduling';

      await this.agendaRepository.save(meeting);
      const savedRescheduledMeeting = await this.agendaRepository.save(rescheduledMeeting);

      // Send notifications to the other party
      await this.sendRescheduleNotifications(
        meeting,
        savedRescheduledMeeting,
        currentUserDetails,
        targetUserDetails,
        rescheduleDto
      );

      return await this.getAgendaWithRelations(savedRescheduledMeeting.id);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Meeting rescheduling');
    }
  }

  // New method for getting meeting by ID
  async getMeetingById(meetingId: string, currentUser?: any) {
    try {
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Validate that current user has access to this meeting
      if (meeting.userId !== currentUser.id && meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('You can only view meetings that you own or created.');
      }

      return this.formatAgendaResponse(meeting);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Meeting retrieval');
    }
  }

  // New method for deleting a specific meeting
  async deleteMeeting(meetingId: string, currentUser?: any) {
    try {
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Validate permissions
      if (meeting.userId !== currentUser.id && meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('You can only delete meetings that you own or created.');
      }

      // Soft delete by setting isActive to false
      meeting.isActive = false;
      meeting.meetingNotes = meeting.meetingNotes 
        ? `${meeting.meetingNotes}\n\nDeleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`
        : `Deleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`;

      await this.agendaRepository.save(meeting);

      return { message: 'Meeting deleted successfully' };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Meeting deletion');
    }
  }

  // New method for deleting all meetings for a user
  async deleteAllMeetings(userId: string, eventId?: string, currentUser?: any) {
    try {
      // Validate that current user is deleting their own meetings
      if (currentUser.id !== userId) {
        throw new BadRequestException('You can only delete your own meetings.');
      }

      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('(agenda.userId = :userId OR agenda.createdBy = :userId)', { userId })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const meetings = await queryBuilder.getMany();

      if (meetings.length === 0) {
        return { message: 'No meetings found to delete' };
      }

      // Soft delete all meetings
      for (const meeting of meetings) {
        meeting.isActive = false;
        meeting.meetingNotes = meeting.meetingNotes 
          ? `${meeting.meetingNotes}\n\nBulk deleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`
          : `Bulk deleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`;
      }

      await this.agendaRepository.save(meetings);

      return { 
        message: `Successfully deleted ${meetings.length} meeting(s)`,
        deletedCount: meetings.length
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Bulk meeting deletion');
    }
  }


  // Helper methods
  private async getAgendaWithRelations(id: string) {
    return await this.agendaRepository.findOne({
      where: { id },
      // No need to fetch relations since we only need IDs
    });
  }

  private async checkTimeConflicts(
    eventId: string,
    time: string,
    duration: number,
    excludeId?: string,
  ) {
    const startTime = this.parseTimeToMinutes(time);
    const endTime = startTime + duration;

    const queryBuilder = this.agendaRepository
      .createQueryBuilder('agenda')
      .where('agenda.eventId = :eventId', { eventId })
      .andWhere('agenda.isActive = :isActive', { isActive: true });

    if (excludeId) {
      queryBuilder.andWhere('agenda.id != :excludeId', { excludeId });
    }

    const conflictingAgendas = await queryBuilder.getMany();

    for (const agenda of conflictingAgendas) {
      const agendaStartTime = this.parseTimeToMinutes(agenda.time);
      const agendaEndTime = agendaStartTime + agenda.duration;

      if (
        (startTime >= agendaStartTime && startTime < agendaEndTime) ||
        (endTime > agendaStartTime && endTime <= agendaEndTime) ||
        (startTime <= agendaStartTime && endTime >= agendaEndTime)
      ) {
        throw new ValidationException(
          `Time conflict detected. This time slot overlaps with "${agenda.title}" (${agenda.time} - ${this.formatDuration(agenda.duration)})`,
        );
      }
    }
  }

  // New helper methods for meeting functionality
  private async validateBothUsersRegistration(eventId: string, currentUserId: string, targetUserId: string) {
    try {
      // Check current user registration
      const currentUserRegistration = await this.registerEventRepository.findOne({
        where: {
          userId: currentUserId,
          eventId: eventId,
          isRegister: true,
        },
      });

      // Check target user registration
      const targetUserRegistration = await this.registerEventRepository.findOne({
        where: {
          userId: targetUserId,
          eventId: eventId,
          isRegister: true,
        },
      });

      // Provide specific error messages
      if (!currentUserRegistration && !targetUserRegistration) {
        throw new ValidationException(
          `Both you and the target user are not registered for this event. Please register for the event before scheduling meetings.`
        );
      }

      if (!currentUserRegistration) {
        throw new ValidationException(
          `You are not registered for this event. Please register for the event before scheduling meetings.`
        );
      }

      if (!targetUserRegistration) {
        throw new ValidationException(
          `The target user is not registered for this event. They must register for the event before you can schedule a meeting with them.`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      throw error;
    }
  }


 

  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatDuration(duration: number): string {
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

  private formatAgendaResponse(agenda: any) {
    // Since we're not fetching relations, just return the agenda data with IDs
    return {
      id: agenda.id,
      eventId: agenda.eventId,
      userId: agenda.userId,  // Add userId field
      exhibitorId: agenda.exhibitorId,
      title: agenda.title,
      time: agenda.time,
      duration: agenda.duration,
      location: agenda.location,
      details: agenda.details,
      category: agenda.category,
      isActive: agenda.isActive,
      createdBy: agenda.createdBy,
      createdAt: agenda.createdAt,
      updatedAt: agenda.updatedAt,
      tableNumber: agenda.tableNumber,
      luckyDrawTicketNumber: agenda.luckyDrawTicketNumber,
      // New meeting fields
      meetingStatus: agenda.meetingStatus,
      requestStatus: agenda.requestStatus,


      attendees: agenda.attendees,
      meetingNotes: agenda.meetingNotes,
      isMeetingRequest: agenda.isMeetingRequest,
      meetingDate: agenda.meetingDate,
      parentMeetingId: agenda.parentMeetingId,
    };
  }

    // Helper method to send reschedule notifications
  private async sendRescheduleNotifications(
    originalMeeting: EventAgenda,
    rescheduledMeeting: EventAgenda,
    currentUser: any,
    targetUser: any,
    rescheduleDto: RescheduleMeetingDto
  ) {
    try {
      // Send email notification to the other party
      if (targetUser?.email) {
        const emailSubject = `Meeting Rescheduled: ${originalMeeting.title}`;
        const emailHtml = MeetingEmailTemplates.generateRescheduleEmailHTML(
          targetUser,
          currentUser,
          originalMeeting,
          rescheduledMeeting,
          rescheduleDto
        );

        await this.emailService.sendEmail(targetUser.email, emailSubject, emailHtml);
      }

      // Send email notification to the rescheduler (confirmation)
      if (currentUser?.email) {
        const emailSubject = `Meeting Rescheduled Successfully: ${originalMeeting.title}`;
        const emailHtml = MeetingEmailTemplates.generateRescheduleConfirmationEmailHTML(
          currentUser,
          targetUser,
          originalMeeting,
          rescheduledMeeting,
          rescheduleDto
        );

        await this.emailService.sendEmail(currentUser.email, emailSubject, emailHtml);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to send reschedule notifications: ${errorMessage}`);
    }
  }

  // Helper method to send meeting response notifications
  private async sendMeetingResponseNotification(
    meeting: EventAgenda,
    responseDto: RespondToMeetingRequestDto,
    currentUser: any
  ) {
    try {
      // Get meeting creator details
      const creator = await this.userRepository.findOne({ where: { id: meeting.createdBy } });
      
      // Send email notification to the meeting creator
      if (creator?.email) {
        const emailSubject = `Meeting Request ${responseDto.response === 'accepted' ? 'Accepted' : 'Rejected'}: ${meeting.title}`;
        const emailHtml = MeetingEmailTemplates.generateMeetingResponseEmailHTML(
          creator,
          currentUser,
          meeting,
          responseDto
        );

        await this.emailService.sendEmail(creator.email, emailSubject, emailHtml);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to send meeting response notification: ${errorMessage}`);
    }
  }

  // Helper method to send meeting request notifications
  private async sendMeetingRequestNotification(
    meeting: EventAgenda,
    currentUser: any,
    targetUser: any
  ) {
    try {
      // Send email notification to the target user
      if (targetUser?.email) {
        const emailSubject = `New Meeting Request: ${meeting.title}`;
        const emailHtml = MeetingEmailTemplates.generateMeetingRequestEmailHTML(
          targetUser,
          currentUser,
          meeting
        );

        await this.emailService.sendEmail(targetUser.email, emailSubject, emailHtml);
      }

      // Send confirmation email to the sender
      if (currentUser?.email) {
        const emailSubject = `Meeting Request Sent: ${meeting.title}`;
        const emailHtml = MeetingEmailTemplates.generateMeetingRequestConfirmationEmailHTML(
          currentUser,
          targetUser,
          meeting
        );

        await this.emailService.sendEmail(currentUser.email, emailSubject, emailHtml);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to send meeting request notification: ${errorMessage}`);
    }
  }
}
