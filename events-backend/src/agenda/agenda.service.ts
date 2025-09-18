import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventAgenda, MeetingStatus, RequestStatus, RequestType } from './agenda.entity';
import { AgendaCategory } from './agenda-category.entity';
import { 
  CreateMeetingRequestDto,
  RespondToMeetingRequestDto,
  RescheduleMeetingDto,
  GetMonthlyAgendaDto,
  AgendaItemDto,
  MonthlyAgendaResponseDto
} from './agenda.dto';
import { Event } from '../event/event.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { Status } from '../registerEvent/registerEvent.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { UserEntity } from 'user/users.entity';
import { EmailService } from '../service/email.service';
import { MeetingEmailTemplates } from '../utils/email-templates';
import { AgendaUtils } from '../utils/agenda.utils';
import { ICSGenerator } from '../utils/calendar-utils/ics-generator.utils';
import { NotificationGateway } from '../settings/notification.gateway';
import { NotificationUtil } from '../utils/notification.util';
import { EventNotificationType } from '../types/notification.types';
import { NotificationTextUtil } from '../utils/notification-text.util';


@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(EventAgenda)
    private agendaRepository: Repository<EventAgenda>,
    @InjectRepository(AgendaCategory)
    private agendaCategoryRepository: Repository<AgendaCategory>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,

    private readonly errorHandler: ErrorHandlerService,
    private readonly emailService: EmailService,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationUtil: NotificationUtil,
  ) {}


  // New method for getting incoming meeting requests (for recipient)
  async getIncomingMeetingRequests(userId: string, eventId?: string) {
    try {
      // Check if user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(userId, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to view meeting requests.');
        }
      }

      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.category', 'category')
        .where('agenda.userId = :userId', { userId }) // User is the recipient
        .andWhere('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const requests = await queryBuilder.getMany();
      
      // Debug: Log the raw requests to see what's in the database
  
      
      // Format the requests using AgendaUtils and ensure requestType is 'incoming'
      const formattedRequests = AgendaUtils.formatAgendas(requests).map(request => ({
        ...request,
        requestType: 'incoming' // This is always incoming for the recipient
      }));
      
      // Debug: Log the formatted requests
   
      
      return formattedRequests;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Incoming meeting requests retrieval');
    }
  }

  // New method for getting sent meeting requests (for sender)
  async getSentMeetingRequests(userId: string, eventId?: string) {
    try {
      // Check if user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(userId, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to view meeting requests.');
        }
      }

      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.category', 'category')
        .where('agenda.createdBy = :userId', { userId }) // User is the creator
        .andWhere('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const requests = await queryBuilder.getMany();
      
      // Debug: Log the raw requests to see what's in the database
  
      
      // Format the requests using AgendaUtils and ensure requestType is 'sent'
      const formattedRequests = AgendaUtils.formatAgendas(requests).map(request => ({
        ...request,
        requestType: 'sent' // This is always sent for the creator
      }));
      
      // Debug: Log the formatted requests
 
      
      return formattedRequests;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Sent meeting requests retrieval');
    }
  }

  // New method for getting user's meetings (all types)
  async getMyMeetings(userId: string, eventId?: string, status?: string) {
    try {
      // Check if user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(userId, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to view meetings.');
        }
      }

      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.category', 'category')
        .where('(agenda.userId = :userId OR agenda.createdBy = :userId)', { userId })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      if (status) {
        queryBuilder.andWhere('agenda.meetingStatus = :status', { status });
      }

      const meetings = await queryBuilder.getMany();
      
      // Format the meetings using AgendaUtils and determine requestType based on user's role
      const formattedMeetings = AgendaUtils.formatAgendas(meetings).map(meeting => {
        let requestType = 'meeting'; // Default for regular meetings
        
        if (meeting.isMeetingRequest) {
          // Determine if this is incoming or sent based on user's role
          if (meeting.userId === userId) {
            requestType = 'incoming'; // User is recipient
          } else if (meeting.createdBy === userId) {
            requestType = 'sent'; // User is creator
          }
        }
        
        return {
          ...meeting,
          requestType
        };
      });
      
      return formattedMeetings;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
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

      // Allow both registered users and exhibitors to create and receive meeting requests
      if (!targetUser.role || (targetUser.role !== 'exhibitor' && targetUser.role !== 'user')) {
        throw new BadRequestException('Only exhibitors and regular users can receive meeting requests.');
      }

      // Validate that current user also has appropriate role
      if (!currentUser.role || (currentUser.role !== 'exhibitor' && currentUser.role !== 'user')) {
        throw new BadRequestException('Only exhibitors and regular users can create meeting requests.');
      }

      // Prevent users from creating meeting requests with themselves
      if (currentUser.id === createMeetingDto.targetUserId) {
        throw new BadRequestException('You cannot create a meeting request with yourself.');
      }

      // Check if both users are registered for the event
      const [senderRegistration, targetRegistration] = await Promise.all([
        this.checkUserEventRegistration(currentUser.id, createMeetingDto.eventId),
        this.checkUserEventRegistration(createMeetingDto.targetUserId, createMeetingDto.eventId)
      ]);

      if (!senderRegistration) {
        throw new BadRequestException('You must be registered for this event to send meeting requests.');
      }

      if (!targetRegistration) {
        throw new BadRequestException('The target user must be registered for this event to receive meeting requests.');
      }

      // Use AgendaUtils to validate meeting date
      const dateValidation = AgendaUtils.validateMeetingDate(createMeetingDto.meetingDate, 1);
      if (!dateValidation.isValid) {
        throw new BadRequestException(dateValidation.errorMessage);
      }

      // Validate meeting duration is reasonable (already validated in DTO, but double-check)
      if (createMeetingDto.duration < 15 || createMeetingDto.duration > 480) {
        throw new BadRequestException('Meeting duration must be between 15 minutes and 8 hours.');
      }

      // Validate meeting time format (already validated in DTO, but double-check)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(createMeetingDto.time)) {
        throw new BadRequestException('Meeting time must be in HH:MM format (24-hour).');
      }

      // Validate meeting location is provided (optional but recommended)
      if (!createMeetingDto.location || createMeetingDto.location.trim() === '') {
        console.warn(NotificationTextUtil.getLocationNotProvidedWarning());
      }

      // Validate meeting details are provided (optional but recommended)
      if (!createMeetingDto.details || createMeetingDto.details.trim() === '') {
        console.warn(NotificationTextUtil.getDetailsNotProvidedWarning());
      }

      // Validate meeting notes are provided (optional but recommended)
      if (!createMeetingDto.meetingNotes || createMeetingDto.meetingNotes.trim() === '') {
        console.warn(NotificationTextUtil.getNotesNotProvidedWarning());
      }

      // Ensure meeting attendees are properly set
      const attendees = [currentUser.id, createMeetingDto.targetUserId];
      if (attendees.length < 2) {
        throw new BadRequestException('Meeting must have at least 2 attendees (sender and recipient).');
      }

      // Determine category to use
      let categoryId: string;
      if (createMeetingDto.categoryId) {
        // Validate that the provided category exists
        const category = await this.agendaCategoryRepository.findOne({
          where: { id: createMeetingDto.categoryId }
        });
        if (!category) {
          throw new BadRequestException(`Category with ID "${createMeetingDto.categoryId}" not found`);
        }
        if (!category.isActive) {
          throw new BadRequestException(`Category "${category.name}" is not active`);
        }
        categoryId = createMeetingDto.categoryId;
      } else {
        // Use default meeting category if no category provided
        categoryId = await this.getOrCreateMeetingCategory();
      }

      // All validations passed, proceed with meeting creation
      // Check for time conflicts on the specific date
      await this.checkTimeConflictsOnDate(
        createMeetingDto.eventId,
        createMeetingDto.time,
        createMeetingDto.duration,
        new Date(createMeetingDto.meetingDate),
        undefined,
      );

      // Create only ONE meeting entry - this will be used for both sender and recipient
      const meetingRequest = this.agendaRepository.create({
        eventId: createMeetingDto.eventId,
        userId: createMeetingDto.targetUserId, // Target user receives the request
        title: createMeetingDto.title,
        time: createMeetingDto.time,
        duration: createMeetingDto.duration,
        location: createMeetingDto.location,
        details: createMeetingDto.details,
        categoryId: categoryId,
        createdBy: currentUser.id,
        isMeetingRequest: true,
        requestType: RequestType.Incoming, // Set as incoming for the recipient
        meetingStatus: MeetingStatus.Pending,
        requestStatus: RequestStatus.Pending,
        attendees: attendees,
        meetingNotes: createMeetingDto.meetingNotes,
        meetingDate: new Date(createMeetingDto.meetingDate),
      });

      const savedMeeting = await this.agendaRepository.save(meetingRequest);

      // Debug: Log the saved meeting to see what was actually saved
   

      // Send notification to the target user about the meeting request
      await this.sendMeetingRequestNotification(savedMeeting, currentUser, targetUser);

      // Send Socket.IO notification to the target user (recipient)
      this.notificationGateway.sendMeetingRequestNotification(targetUser.id, {
        id: savedMeeting.id,
        eventId: savedMeeting.eventId,
        title: savedMeeting.title,
        createdBy: savedMeeting.createdBy,
        meetingDate: savedMeeting.meetingDate,
        time: savedMeeting.time,
        location: savedMeeting.location
      });


      // Store notification in database for the target user (recipient) only
      try {
        await this.notificationUtil.sendTargetedEventNotification({
          eventId: savedMeeting.eventId,
          title: NotificationTextUtil.getMeetingRequestTitle(),
          description: NotificationTextUtil.getMeetingRequestDescription(
            savedMeeting.title,
            currentUser.firstName || 'User',
            savedMeeting.meetingDate!,
            savedMeeting.time,
            savedMeeting.location
          ),
          type: EventNotificationType.MEETING_REQUEST,
          targetUserIds: [targetUser.id] // Only send to the recipient
        });
      } catch (error) {
        console.error('Failed to store meeting request notification:', error);
      }


      // Meeting request created successfully
   
      const response = await this.getAgendaWithRelations(savedMeeting.id);
      
      return response;
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

      // Check if current user is registered for the event
      const userRegistration = await this.checkUserEventRegistration(currentUser.id, meeting.eventId);
      if (!userRegistration) {
        throw new BadRequestException('You must be registered for this event to respond to meeting requests.');
      }

      // Get meeting creator details for notifications
      const creator = await this.userRepository.findOne({ where: { id: meeting.createdBy } });
      if (!creator) {
        throw new ResourceNotFoundException('Meeting creator', meeting.createdBy);
      }

      // Store original meeting data for notification purposes
      const originalMeetingData = {
        title: meeting.title,
        time: meeting.time,
        date: meeting.meetingDate,
        location: meeting.location,
        details: meeting.details
      };

      let responseMessage = '';

      if (responseDto.response === RequestStatus.Accepted) {
        // Accept the meeting request
        meeting.requestStatus = RequestStatus.Accepted;
        meeting.meetingStatus = MeetingStatus.Confirmed;
        responseMessage = NotificationTextUtil.getMeetingAcceptedResponseMessage();
        
        // Add response message to meeting notes if provided
        if (responseDto.message) {
          meeting.meetingNotes = meeting.meetingNotes 
            ? `${meeting.meetingNotes}\n\nResponse: ${responseDto.message}`
            : `Response: ${responseDto.message}`;
        }

        const updatedMeeting = await this.agendaRepository.save(meeting);

        // Send acceptance notification to the meeting creator
        await this.sendMeetingResponseNotification(meeting, responseDto, currentUser);

        // Send Socket.IO notification to the meeting creator
        this.notificationGateway.sendMeetingResponseNotification(meeting.createdBy, {
          meetingId: meeting.id,
          eventId: meeting.eventId,
          meetingTitle: meeting.title,
          response: responseDto.response,
          responderId: currentUser.id,
          message: responseDto.message
        });

        // Store notification in database for the meeting creator only
        try {
          await this.notificationUtil.sendTargetedEventNotification({
            eventId: meeting.eventId,
            title: NotificationTextUtil.getMeetingAcceptedTitle(),
            description: NotificationTextUtil.getMeetingAcceptedDescription(
              meeting.title,
              currentUser.firstName || 'User',
              meeting.meetingDate!,
              meeting.time,
              meeting.location,
              responseDto.message
            ),
            type: EventNotificationType.MEETING_RESPONSE,
            targetUserIds: [meeting.createdBy] // Only send to the meeting creator
          });
        } catch (error) {
          console.error('Failed to store meeting acceptance notification:', error);
        }

        // Meeting request accepted successfully
  
        return await this.getAgendaWithRelations(updatedMeeting.id);

      } else if (responseDto.response === RequestStatus.Rejected) {
        // Reject the meeting request - remove it from both parties
        responseMessage = NotificationTextUtil.getMeetingRejectedResponseMessage();

        // Add rejection message to meeting notes if provided
        if (responseDto.message) {
          meeting.meetingNotes = meeting.meetingNotes 
            ? `${meeting.meetingNotes}\n\nRejection: ${responseDto.message}`
            : `Rejection: ${responseDto.message}`;
        }

        // Soft delete the meeting request (remove from both parties)
        meeting.isActive = false;
        meeting.meetingStatus = MeetingStatus.Cancelled;
        meeting.requestStatus = RequestStatus.Rejected;

        await this.agendaRepository.save(meeting);

        // Send rejection notification to the meeting creator
        await this.sendMeetingRejectionNotification(
          originalMeetingData,
          meeting,
          currentUser,
          creator,
          responseDto.message
        );

        // Send Socket.IO notification to the meeting creator
        this.notificationGateway.sendMeetingResponseNotification(meeting.createdBy, {
          meetingId: meeting.id,
          eventId: meeting.eventId,
          meetingTitle: meeting.title,
          response: responseDto.response,
          responderId: currentUser.id,
          message: responseDto.message
        });

        // Store notification in database for the meeting creator only
        try {
          await this.notificationUtil.sendTargetedEventNotification({
            eventId: meeting.eventId,
            title: NotificationTextUtil.getMeetingRejectedTitle(),
            description: NotificationTextUtil.getMeetingRejectedDescription(
              meeting.title,
              currentUser.firstName || 'User',
              responseDto.message
            ),
            type: EventNotificationType.MEETING_RESPONSE,
            targetUserIds: [meeting.createdBy] // Only send to the meeting creator
          });
        } catch (error) {
          console.error('Failed to store meeting rejection notification:', error);
        }

        // Meeting request rejected and removed successfully
    
        return {
          message: NotificationTextUtil.getMeetingRejectedSuccessMessage(),
          meetingId: meeting.id,
          rejectedAt: new Date().toISOString(),
          rejectedBy: currentUser.id
        };
      }

      throw new BadRequestException(NotificationTextUtil.getInvalidResponseStatusMessage());

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
      // Validate input parameters
      if (!meetingId || !rescheduleDto || !currentUser) {
        throw new BadRequestException('Missing required parameters for rescheduling.');
      }

      // Find the meeting to reschedule
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Validate that the meeting is active
      if (!meeting.isActive) {
        throw new BadRequestException(NotificationTextUtil.getCannotRescheduleInactiveMeetingMessage());
      }

      // Validate permissions - only meeting creator can reschedule
      if (meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('Only the person who created the meeting request can reschedule it.');
      }

      // Validate that this is a meeting that can be rescheduled
      if (!meeting.isMeetingRequest) {
        // For regular meetings, check if they're confirmed
        if (meeting.meetingStatus !== MeetingStatus.Confirmed) {
          throw new BadRequestException('You can only reschedule confirmed meetings.');
        }
      } else {
        // For meeting requests, check if they're accepted
        if (meeting.requestStatus !== RequestStatus.Accepted) {
          throw new BadRequestException('You can only reschedule accepted meeting requests.');
        }
      }

      // Check if the meeting is already in progress or completed
      if (meeting.meetingDate && meeting.meetingDate <= new Date()) {
        throw new BadRequestException(NotificationTextUtil.getCannotRescheduleStartedMeetingMessage());
      }

      // Check if current user is registered for the event
      const userRegistration = await this.checkUserEventRegistration(currentUser.id, meeting.eventId);
      if (!userRegistration) {
        throw new BadRequestException('You must be registered for this event to reschedule meetings.');
      }

      // Validate new date and time using AgendaUtils
      const dateValidation = AgendaUtils.validateMeetingDate(rescheduleDto.newDate, 1);
      if (!dateValidation.isValid) {
        throw new BadRequestException(dateValidation.errorMessage);
      }

      // Validate that new date/time is not too close to current time (minimum 1 hour notice)
      const newMeetingDate = new Date(rescheduleDto.newDate);
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      if (newMeetingDate <= oneHourFromNow) {
        throw new BadRequestException(NotificationTextUtil.getNewTimeTooCloseMessage());
      }

      // Validate meeting time format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(rescheduleDto.newTime)) {
        throw new BadRequestException('Meeting time must be in HH:MM format (24-hour).');
      }

      // Validate that new date/time is different from current
      const currentMeetingDate = meeting.meetingDate;
      
      if (!currentMeetingDate) {
        throw new BadRequestException(NotificationTextUtil.getMissingOriginalDateMessage());
      }
      
      if (newMeetingDate.getTime() === currentMeetingDate.getTime() && 
          rescheduleDto.newTime === meeting.time) {
        throw new BadRequestException(NotificationTextUtil.getSameDateTimeMessage());
      }

      // Check for time conflicts on the new date
      await this.checkTimeConflictsOnDate(
        meeting.eventId,
        rescheduleDto.newTime,
        meeting.duration,
        newMeetingDate,
        meetingId
      );

      // Get user details for notifications
      const [currentUserDetails, targetUserDetails] = await Promise.all([
        this.userRepository.findOne({ where: { id: currentUser.id } }),
        this.userRepository.findOne({ where: { id: meeting.userId } })
      ]);

      // Store original values for notification purposes
      const originalMeetingData = {
        title: meeting.title,
        time: meeting.time,
        date: meeting.meetingDate,
        location: meeting.location,
        details: meeting.details
      };

      // Update the existing meeting with new details
      meeting.time = rescheduleDto.newTime;
      meeting.meetingDate = newMeetingDate;
      meeting.location = rescheduleDto.newLocation || meeting.location;
      meeting.details = rescheduleDto.newDetails || meeting.details;
      meeting.meetingStatus = MeetingStatus.Confirmed; // Ensure it's confirmed
      meeting.requestStatus = RequestStatus.Accepted; // Ensure it's accepted
      meeting.isMeetingRequest = false; // No longer a request after rescheduling
      meeting.requestType = undefined; // No request type for rescheduled meetings
      
      // Add reschedule information to meeting notes
      const rescheduleNote = `Rescheduled by ${currentUser.firstName || currentUser.id} on ${new Date().toISOString()}`;
      const reasonNote = rescheduleDto.reason ? `\nReason: ${rescheduleDto.reason}` : '';
      const originalDetails = `\nOriginal: ${originalMeetingData.time} on ${originalMeetingData.date?.toLocaleDateString()}`;
      
      meeting.meetingNotes = meeting.meetingNotes 
        ? `${meeting.meetingNotes}\n\n${rescheduleNote}${reasonNote}${originalDetails}`
        : `${rescheduleNote}${reasonNote}${originalDetails}`;

      // Save the updated meeting
      const updatedMeeting = await this.agendaRepository.save(meeting);

      // Send notifications to the other party
      await this.sendRescheduleNotifications(
        originalMeetingData,
        updatedMeeting,
        currentUserDetails,
        targetUserDetails,
        rescheduleDto
      );

      // Send Socket.IO notification to the other party
      if (targetUserDetails && currentUserDetails) {
        this.notificationGateway.sendMeetingRescheduleNotification(targetUserDetails.id, {
          meetingId: updatedMeeting.id,
          eventId: updatedMeeting.eventId,
          meetingTitle: updatedMeeting.title,
          reschedulerId: currentUserDetails.id,
          originalDate: originalMeetingData.date,
          originalTime: originalMeetingData.time,
          newDate: updatedMeeting.meetingDate,
          newTime: updatedMeeting.time,
          newLocation: updatedMeeting.location,
          reason: rescheduleDto.reason
        });
      }

      // Store notification in database for the other party only
      try {
        if (targetUserDetails) {
          await this.notificationUtil.sendTargetedEventNotification({
            eventId: updatedMeeting.eventId,
            title: NotificationTextUtil.getMeetingRescheduledTitle(),
            description: NotificationTextUtil.getMeetingRescheduledDescription(
              updatedMeeting.title,
              currentUserDetails?.firstName || 'User',
              updatedMeeting.meetingDate!,
              updatedMeeting.time,
              updatedMeeting.location,
              rescheduleDto.reason
            ),
            type: EventNotificationType.MEETING_RESCHEDULE,
            targetUserIds: [targetUserDetails.id] // Only send to the other party
          });
        }
      } catch (error) {
        console.error('Failed to store meeting reschedule notification:', error);
      }

      // Meeting rescheduled successfully
 
      return await this.getAgendaWithRelations(updatedMeeting.id);
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
      const meeting = await this.agendaRepository.findOne({ 
        where: { id: meetingId },
        relations: ['category']
      });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Validate that current user has access to this meeting
      if (meeting.userId !== currentUser.id && meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('You can only view meetings that you own or created.');
      }

      // Check if current user is registered for the event
      const userRegistration = await this.checkUserEventRegistration(currentUser.id, meeting.eventId);
      if (!userRegistration) {
        throw new BadRequestException('You must be registered for this event to view meetings.');
      }

      // Format the meeting using AgendaUtils and determine requestType based on user's role
      const formattedMeeting = AgendaUtils.formatAgendas([meeting])[0];
      
      // Determine request type based on user's role
      let requestType = 'meeting'; // Default for regular meetings
      if (meeting.isMeetingRequest) {
        if (meeting.userId === currentUser.id) {
          requestType = 'incoming'; // User is recipient
        } else if (meeting.createdBy === currentUser.id) {
          requestType = 'sent'; // User is creator
        }
      }
      
      return {
        ...formattedMeeting,
        requestType
      };
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

      // Validate permissions - only meeting creator can delete
      if (meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('Only the person who created the meeting request can delete it.');
      }

      // Check if current user is registered for the event
      const userRegistration = await this.checkUserEventRegistration(currentUser.id, meeting.eventId);
      if (!userRegistration) {
        throw new BadRequestException('You must be registered for this event to delete meetings.');
      }

      // Soft delete by setting isActive to false
      meeting.isActive = false;
      meeting.meetingNotes = meeting.meetingNotes 
        ? `${meeting.meetingNotes}\n\nDeleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`
        : `Deleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`;

      await this.agendaRepository.save(meeting);

      // Meeting deleted successfully
      return { message: NotificationTextUtil.getMeetingDeletedMessage() };
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

      // Check if current user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(currentUser.id, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to delete meetings.');
        }
      }

      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.category', 'category')
        .where('(agenda.userId = :userId OR agenda.createdBy = :userId)', { userId })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const meetings = await queryBuilder.getMany();

      if (meetings.length === 0) {
        return { message: NotificationTextUtil.getNoMeetingsFoundMessage() };
      }

      // Soft delete all meetings
      for (const meeting of meetings) {
        meeting.isActive = false;
        meeting.meetingNotes = meeting.meetingNotes 
          ? `${meeting.meetingNotes}\n\nBulk deleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`
          : `Bulk deleted by ${currentUser.firstName} ${currentUser.lastName} on ${new Date().toISOString()}`;
      }

      await this.agendaRepository.save(meetings);

      // Bulk meeting deletion completed successfully

      return { 
        message: NotificationTextUtil.getBulkMeetingDeletedMessage(meetings.length),
        deletedCount: meetings.length
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Bulk meeting deletion');
    }
  }


  // Helper method to get or create meeting category
  private async getOrCreateMeetingCategory(): Promise<string> {
    try {
      // Try to find existing "Meeting" category
      let meetingCategory = await this.agendaCategoryRepository.findOne({
        where: { name: 'Meeting' }
      });

      if (!meetingCategory) {
        // Create meeting category if it doesn't exist
        meetingCategory = this.agendaCategoryRepository.create({
          name: 'Meeting',
          color: '#3B82F6', // Blue color for meetings
          isActive: true
        });
        meetingCategory = await this.agendaCategoryRepository.save(meetingCategory);
      }

      return meetingCategory.id;
    } catch (error) {
      console.error('Error getting or creating meeting category:', error);
      throw new Error('Failed to get or create meeting category');
    }
  }

  // Helper methods
  private async getAgendaWithRelations(id: string) {
    const agenda = await this.agendaRepository.findOne({
      where: { id },
      relations: ['category'], // Fetch category details
    });
    
    if (!agenda) {
      return null;
    }
    
    // Format the response properly
    return this.formatAgendaResponse(agenda);
  }

  // New helper method to check if user is registered for an event
  private async checkUserEventRegistration(userId: string, eventId: string): Promise<boolean> {
    try {
      const registration = await this.registerEventRepository.findOne({
        where: { 
          userId, 
          eventId, 
          isRegister: true,
          status: Status.Sucesss
        }
      });
      
      return !!registration;
    } catch (error) {
      return false;
    }
  }

  // New helper method to check time conflicts on a specific date
  private async checkTimeConflictsOnDate(
    eventId: string,
    time: string,
    duration: number,
    meetingDate: Date,
    excludeId?: string,
  ) {
    const startTime = this.parseTimeToMinutes(time);
    const endTime = startTime + duration;

    const queryBuilder = this.agendaRepository
      .createQueryBuilder('agenda')
      .where('agenda.eventId = :eventId', { eventId })
      .andWhere('agenda.isActive = :isActive', { isActive: true })
      .andWhere('DATE(agenda.meetingDate) = DATE(:meetingDate)', { meetingDate });

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
          NotificationTextUtil.getTimeConflictMessage(
            this.formatDate(meetingDate),
            agenda.title,
            agenda.time,
            this.formatDuration(agenda.duration)
          ),
        );
      }
    }
  }

  // Helper method to format date for display
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    return {
      id: agenda.id,
      eventId: agenda.eventId,
      userId: agenda.userId,
      exhibitorId: agenda.exhibitorId,
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
      categoryId: agenda.categoryId, // Keep categoryId for backward compatibility
      isActive: agenda.isActive,
      createdBy: agenda.createdBy,
      createdAt: agenda.createdAt,
      updatedAt: agenda.updatedAt,
      // New meeting fields
      meetingStatus: agenda.meetingStatus,
      requestStatus: agenda.requestStatus,
      requestType: agenda.requestType,
      attendees: agenda.attendees,
      meetingNotes: agenda.meetingNotes,
      isMeetingRequest: agenda.isMeetingRequest,
      meetingDate: agenda.meetingDate,
    };
  }

    // Helper method to send reschedule notifications
  private async sendRescheduleNotifications(
    originalMeetingData: { title: string; time: string; date: Date | undefined; location: string | undefined; details: string | undefined },
    updatedMeeting: EventAgenda,
    currentUser: any,
    targetUser: any,
    rescheduleDto: RescheduleMeetingDto
  ) {
    try {
      // Send email notification to the other party
      if (targetUser?.email) {
        const emailSubject = `Meeting Rescheduled: ${originalMeetingData.title}`;
        const emailHtml = MeetingEmailTemplates.generateRescheduleEmailHTML(
          targetUser,
          currentUser,
          originalMeetingData,
          updatedMeeting,
          rescheduleDto
        );

        await this.emailService.sendEmail(targetUser.email, emailSubject, emailHtml);
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

  // Helper method to send meeting rejection notifications
  private async sendMeetingRejectionNotification(
    originalMeetingData: { title: string; time: string; date: Date | undefined; location: string | undefined; details: string | undefined },
    rejectedMeeting: EventAgenda,
    currentUser: any,
    creator: any,
    rejectionMessage?: string
  ) {
    try {
      // Send email notification to the meeting creator about rejection
      if (creator?.email) {
        const emailSubject = `Meeting Request Rejected: ${originalMeetingData.title}`;
        const emailHtml = MeetingEmailTemplates.generateMeetingRejectionEmailHTML(
          creator,
          currentUser,
          originalMeetingData,
          rejectedMeeting,
          rejectionMessage
        );

        await this.emailService.sendEmail(creator.email, emailSubject, emailHtml);
      }


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to send meeting rejection notifications:', errorMessage);
      // Don't fail the rejection if notifications fail
    }
  }

  // Download single meeting as .ics file
  async downloadMeetingICS(meetingId: string, currentUser: any) {
    try {
      // Find the meeting
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Validate that current user has access to this meeting
      if (meeting.userId !== currentUser.id && meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('You can only download meetings that you own or created.');
      }

      // Check if current user is registered for the event
      const userRegistration = await this.checkUserEventRegistration(currentUser.id, meeting.eventId);
      if (!userRegistration) {
        throw new BadRequestException('You must be registered for this event to download meetings.');
      }

      // Get user details for the meeting
      const [creator, targetUser] = await Promise.all([
        this.userRepository.findOne({ where: { id: meeting.createdBy } }),
        this.userRepository.findOne({ where: { id: meeting.userId } })
      ]);

      if (!creator || !targetUser) {
        throw new ResourceNotFoundException('User details not found for meeting');
      }

      // Generate ICS content
      const icsContent = ICSGenerator.generateMeetingICS(meeting, creator, targetUser);
      const filename = ICSGenerator.generateSingleMeetingFilename(meeting);

      return {
        icsContent,
        filename,
        meetingTitle: meeting.title,
        meetingDate: meeting.meetingDate
      };

    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Meeting ICS download');
    }
  }

  // Download all meetings as .ics file
  async downloadAllMeetingsICS(currentUser: any, eventId?: string) {
    try {
      // Check if current user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(currentUser.id, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to download meetings.');
        }
      }

      // Get all meetings for the user
      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.category', 'category')
        .where('(agenda.userId = :userId OR agenda.createdBy = :userId)', { userId: currentUser.id })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const meetings = await queryBuilder.getMany();

      if (meetings.length === 0) {
        throw new BadRequestException('No meetings found to download');
      }

      // Generate ICS content for all meetings
      const icsContent = ICSGenerator.generateMultipleMeetingsICS(meetings, currentUser);
      const filename = ICSGenerator.generateMultipleMeetingsFilename();

      return {
        icsContent,
        filename,
        totalMeetings: meetings.length,
        eventId: eventId || 'all_events'
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'All meetings ICS download');
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


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to send meeting request notification: ${errorMessage}`);
    }
  }

  // New method for searching users to arrange meetups
  async searchUsersForMeetup(
    eventId: string,
    searchQuery: string,
    currentUser: any,
    limit: number = 20
  ) {
    try {
      // Check if current user is registered for the event
      const userRegistration = await this.checkUserEventRegistration(currentUser.id, eventId);
      if (!userRegistration) {
        throw new BadRequestException('You must be registered for this event to search for users.');
      }

      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Search for users who are registered for the same event
      let registrations: any[];
      
      try {
        // First get all registrations for the event
        const allRegistrations = await this.registerEventRepository.find({
          where: {
            eventId: eventId,
            isRegister: true,
            status: Status.Sucesss
          },
          relations: ['user']
        });

        // Filter out current user after fetching
        const filteredByUser = allRegistrations.filter(reg => reg.userId !== currentUser.id);

        // Filter by search query if provided
        let filteredRegistrations = filteredByUser;
        if (searchQuery && searchQuery.trim()) {
          const searchTerm = searchQuery.trim().toLowerCase();
          filteredRegistrations = filteredByUser.filter((reg: any) => 
            reg.user && (
              reg.user.firstName?.toLowerCase().includes(searchTerm) ||
              reg.user.lastName?.toLowerCase().includes(searchTerm) ||
              reg.user.email?.toLowerCase().includes(searchTerm)
            )
          );
        }

        // Filter by role and active status
        registrations = filteredRegistrations
          .filter((reg: any) => reg.user && ['user', 'exhibitor'].includes(reg.user.role || ''))
          .slice(0, limit);
      } catch (error) {
        console.error('Error in user search:', error);
        throw new Error('Failed to search for users');
      }

      // Format the results to show only necessary user information
      const searchResults = registrations
        .filter(registration => registration.user) // Filter out registrations without users
        .map(registration => {
          const user = registration.user!; // Safe to use ! after filtering
          return {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            // Include registration details
            registrationDate: registration.createdAt,
            // Check if there are existing meetings between these users
            hasExistingMeetings: false, // Will be updated below
            // Meeting statistics
            meetingStats: {
              totalMeetings: 0,
              confirmedMeetings: 0,
              pendingMeetings: 0
            }
          };
        });

      // Get meeting statistics for each user
      for (const result of searchResults) {
        const meetingStats = await this.getMeetingStatisticsBetweenUsers(
          currentUser.id,
          result.userId,
          eventId
        );
        
        result.hasExistingMeetings = meetingStats.totalMeetings > 0;
        result.meetingStats = meetingStats;
      }

      // Sort results: users with existing meetings first, then by name
      searchResults.sort((a: any, b: any) => {
        if (a.hasExistingMeetings && !b.hasExistingMeetings) return -1;
        if (!a.hasExistingMeetings && b.hasExistingMeetings) return 1;
        return a.firstName.localeCompare(b.firstName);
      });

      return {
        users: searchResults,
        total: searchResults.length,
        eventId,
        searchQuery: searchQuery || '',
        currentUser: {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName
        }
      };

    } catch (error) {
      console.error('Error in user search:', error);
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User search for meetups');
    }
  }

  // Helper method to get meeting statistics between two users
  private async getMeetingStatisticsBetweenUsers(
    user1Id: string,
    user2Id: string,
    eventId: string
  ) {
    try {
      const meetings = await this.agendaRepository.find({
        where: [
          {
            eventId,
            userId: user1Id,
            createdBy: user2Id,
            isActive: true
          },
          {
            eventId,
            userId: user2Id,
            createdBy: user1Id,
            isActive: true
          }
        ]
      });

      const totalMeetings = meetings.length;
      const confirmedMeetings = meetings.filter(m => m.meetingStatus === MeetingStatus.Confirmed).length;
      const pendingMeetings = meetings.filter(m => m.meetingStatus === MeetingStatus.Pending).length;

      return {
        totalMeetings,
        confirmedMeetings,
        pendingMeetings
      };
    } catch (error) {
      console.error('Error getting meeting statistics:', error);
      return {
        totalMeetings: 0,
        confirmedMeetings: 0,
        pendingMeetings: 0
      };
    }
  }

  // New method for canceling meeting requests
  async cancelMeetingRequest(meetingId: string, currentUser: any) {
    try {
      // Find the meeting request
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting request', meetingId);
      }

      // Validate that this is a meeting request
      if (!meeting.isMeetingRequest) {
        throw new BadRequestException('This is not a meeting request.');
      }

      // Validate permissions - only meeting creator can cancel
      if (meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('Only the person who created the meeting request can cancel it.');
      }

      // Check if the meeting request is already cancelled or completed
      if (meeting.meetingStatus === MeetingStatus.Cancelled) {
        throw new BadRequestException(NotificationTextUtil.getAlreadyCancelledMessage());
      }

      if (meeting.meetingStatus === MeetingStatus.Confirmed) {
        throw new BadRequestException(NotificationTextUtil.getCannotCancelConfirmedMeetingMessage());
      }

      // Check if current user is registered for the event
      const userRegistration = await this.checkUserEventRegistration(currentUser.id, meeting.eventId);
      if (!userRegistration) {
        throw new BadRequestException('You must be registered for this event to cancel meeting requests.');
      }

      // Get target user details for notification
      const targetUser = await this.userRepository.findOne({ where: { id: meeting.userId } });
      if (!targetUser) {
        throw new ResourceNotFoundException('Target user', meeting.userId);
      }

      // Store original meeting data for notification
      const originalMeetingData = {
        title: meeting.title,
        time: meeting.time,
        date: meeting.meetingDate,
        location: meeting.location,
        details: meeting.details
      };

      // Cancel the meeting request
      meeting.meetingStatus = MeetingStatus.Cancelled;
      meeting.requestStatus = RequestStatus.Rejected;
      meeting.isActive = false;
      
      // Add cancellation information to meeting notes
      const cancellationNote = `Cancelled by ${currentUser.firstName || currentUser.id} on ${new Date().toISOString()}`;
      meeting.meetingNotes = meeting.meetingNotes 
        ? `${meeting.meetingNotes}\n\n${cancellationNote}`
        : cancellationNote;

      // Save the updated meeting
      const updatedMeeting = await this.agendaRepository.save(meeting);

      // Send cancellation notifications
      await this.sendCancellationNotifications(
        originalMeetingData,
        updatedMeeting,
        currentUser,
        targetUser
      );

      // Send Socket.IO notification to the target user
      this.notificationGateway.sendMeetingCancellationNotification(targetUser.id, {
        meetingId: updatedMeeting.id,
        eventId: updatedMeeting.eventId,
        meetingTitle: updatedMeeting.title,
        cancellerId: currentUser.id,
        originalDate: originalMeetingData.date,
        originalTime: originalMeetingData.time
      });

      // Store notification in database for the target user only
      try {
        await this.notificationUtil.sendTargetedEventNotification({
          eventId: updatedMeeting.eventId,
          title: NotificationTextUtil.getMeetingCancelledTitle(),
          description: NotificationTextUtil.getMeetingCancelledDescription(
            updatedMeeting.title,
            currentUser.firstName || 'User',
            originalMeetingData.date!,
            originalMeetingData.time,
            originalMeetingData.location
          ),
          type: EventNotificationType.MEETING_CANCELLATION,
          targetUserIds: [targetUser.id] // Only send to the target user
        });
      } catch (error) {
        console.error('Failed to store meeting cancellation notification:', error);
      }

      // Meeting request cancelled successfully
      return true

    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Meeting request cancellation');
    }
  }

  // Helper method to send cancellation notifications
  private async sendCancellationNotifications(
    originalMeetingData: { title: string; time: string; date: Date | undefined; location: string | undefined; details: string | undefined },
    cancelledMeeting: EventAgenda,
    currentUser: any,
    targetUser: any
  ) {
    try {
      // Send email notification to the target user
      if (targetUser?.email) {
        const emailSubject = `Meeting Request Cancelled: ${originalMeetingData.title}`;
        const emailHtml = MeetingEmailTemplates.generateCancellationEmailHTML(
          targetUser,
          currentUser,
          originalMeetingData,
          cancelledMeeting
        );

        await this.emailService.sendEmail(targetUser.email, emailSubject, emailHtml);
      }


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to send cancellation notifications:', errorMessage);
      // Don't fail the cancellation if notifications fail
    }
  }

  // New method for getting monthly agenda grouped by date
  async getMonthlyAgenda(
    userId: string,
    month: string,
    year: string,
    day?: string
  ): Promise<MonthlyAgendaResponseDto> {
    try {
      // Get all events that the user is registered for
      const userRegistrations = await this.registerEventRepository.find({
        where: { 
          userId, 
          isRegister: true,
          status: Status.Sucesss
        }
      });

      if (userRegistrations.length === 0) {
        // Return empty object if user is not registered for any events
        return {};
      }

      // Extract event IDs from registrations
      const registeredEventIds = userRegistrations.map(reg => reg.eventId);

      // Create date range based on whether day filter is provided
      let startDate: Date;
      let endDate: Date;
      
      if (day) {
        // If day is provided, filter for specific day
        startDate = new Date(`${year}-${month}-${day}`);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999); // End of the specific day
      } else {
        // If no day provided, filter for entire month
        startDate = new Date(`${year}-${month}-01`);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Last day of month
        endDate.setHours(23, 59, 59, 999); // End of the last day of month
      }

      // Debug logging (can be removed in production)
      // console.log('Date filtering debug:', { month, year, day, startDate, endDate, registeredEventIds, userId });

      // Build query to get agenda items for the specified month/year from all registered events
      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.category', 'category')
        .leftJoinAndSelect('agenda.event', 'event')
        .leftJoinAndSelect('agenda.user', 'user')
        .leftJoinAndSelect('agenda.creator', 'creator')
        .where('(agenda.userId = :userId OR agenda.createdBy = :userId)', { userId })
        .andWhere('agenda.isActive = :isActive', { isActive: true })
        .andWhere('agenda.meetingDate >= :startDate', { startDate })
        .andWhere('agenda.meetingDate <= :endDate', { endDate })
        .andWhere('agenda.eventId IN (:...eventIds)', { eventIds: registeredEventIds });

      // Order by meeting date and time
      queryBuilder.orderBy('agenda.meetingDate', 'ASC').addOrderBy('agenda.time', 'ASC');

      const agendaItems = await queryBuilder.getMany();

      // Debug logging for query results (can be removed in production)
      // console.log('Query results debug:', { totalAgendaItems: agendaItems.length });

      // Get all unique creator IDs to fetch their information
      const creatorIds = [...new Set(agendaItems.map(item => item.createdBy))];
      
      // Fetch creator user information if there are any creators
      let creators = new Map();
      if (creatorIds.length > 0) {
        const creatorUsers = await this.userRepository.find({
          where: creatorIds.map(id => ({ id })),
          select: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture']
        });
        creators = new Map(creatorUsers.map(user => [user.id, user]));
      }

      // Use AgendaUtils to format the agenda items with user information
      const formattedAgendas = AgendaUtils.formatAgendasWithUsers(agendaItems, creators, userId);

      // Group formatted agenda items by date
      const groupedByDate: MonthlyAgendaResponseDto = {};

      for (const item of formattedAgendas) {
        if (!item.meetingDate) continue;

        // Format date as DD/MM/YYYY
        const dateKey = this.formatDateKey(item.meetingDate);
        
        // Add to grouped result
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(item);
      }

      return groupedByDate;

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Monthly agenda retrieval');
      throw error;
    }
  }

  // Helper method to format date as DD/MM/YYYY
  private formatDateKey(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  }


}
