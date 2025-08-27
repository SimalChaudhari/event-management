import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventAgenda, AgendaCategory, MeetingStatus, RequestStatus, RequestType } from './agenda.entity';
import { 
  CreateMeetingRequestDto,
  RespondToMeetingRequestDto,
  RescheduleMeetingDto
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
import { MeetingEmailTemplates } from '../utils/meeting-email-templates.utils';
import { AgendaUtils } from '../utils/agenda.utils';


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
  async getIncomingMeetingRequests(userId: string, eventId?: string, currentUser?: any) {
    try {
      // Admin can view all incoming meeting requests without restrictions
      if (currentUser.role === 'admin') {
        const queryBuilder = this.agendaRepository
          .createQueryBuilder('agenda')
          .where('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
          .andWhere('agenda.isActive = :isActive', { isActive: true });

        if (eventId) {
          queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
        }

        const requests = await queryBuilder.getMany();
        
        // Format the requests using AgendaUtils and ensure requestType is 'admin-view'
        const formattedRequests = AgendaUtils.formatAgendas(requests).map(request => ({
          ...request,
          requestType: 'admin-view',
          isAdminAccess: true
        }));
        
        return formattedRequests;
      }

      // Regular users can only view their own incoming requests
      if (currentUser.id !== userId) {
        throw new BadRequestException('You can only view your own incoming meeting requests.');
      }

      // Check if user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(userId, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to view meeting requests.');
        }
      }

      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('agenda.userId = :userId', { userId }) // User is the recipient
        .andWhere('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const requests = await queryBuilder.getMany();
      
      // Format the requests using AgendaUtils and ensure requestType is 'incoming'
      const formattedRequests = AgendaUtils.formatAgendas(requests).map(request => ({
        ...request,
        requestType: 'incoming' // This is always incoming for the recipient
      }));
      
      return formattedRequests;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Incoming meeting requests retrieval');
    }
  }

  // New method for getting sent meeting requests (for sender)
  async getSentMeetingRequests(userId: string, eventId?: string, currentUser?: any) {
    try {
      // Admin can view all sent meeting requests without restrictions
      if (currentUser.role === 'admin') {
        const queryBuilder = this.agendaRepository
          .createQueryBuilder('agenda')
          .where('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
          .andWhere('agenda.isActive = :isActive', { isActive: true });

        if (eventId) {
          queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
        }

        const requests = await queryBuilder.getMany();
        
        // Format the requests using AgendaUtils and ensure requestType is 'sent'
        const formattedRequests = AgendaUtils.formatAgendas(requests).map(request => ({
          ...request,
          requestType: 'admin-view',
          isAdminAccess: true
        }));
        
        return formattedRequests;
      }

      // Regular users can only view their own sent requests
      if (currentUser.id !== userId) {
        throw new BadRequestException('You can only view your own sent meeting requests.');
      }

      // Check if user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(userId, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to view meeting requests.');
        }
      }

      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('agenda.createdBy = :userId', { userId }) // User is the creator
        .andWhere('agenda.isMeetingRequest = :isMeetingRequest', { isMeetingRequest: true })
        .andWhere('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      const requests = await queryBuilder.getMany();
      
      // Debug: Log the raw requests to see what's in the database
      console.log('Raw sent requests:', requests.map(r => ({
        id: r.id,
        requestType: r.requestType,
        isMeetingRequest: r.isMeetingRequest,
        userId: r.userId,
        createdBy: r.createdBy
      })));
      
      // Format the requests using AgendaUtils and ensure requestType is 'sent'
      const formattedRequests = AgendaUtils.formatAgendas(requests).map(request => ({
        ...request,
        requestType: 'sent' // This is always sent for the creator
      }));
      
      // Debug: Log the formatted requests
      console.log('Formatted sent requests:', formattedRequests.map(r => ({
        id: r.id,
        requestType: r.requestType,
        isMeetingRequest: r.isMeetingRequest
      })));
      
      return formattedRequests;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Sent meeting requests retrieval');
    }
  }

  // New method for getting user's meetings (all types)
  async getMyMeetings(userId: string, eventId?: string, status?: string, currentUser?: any) {
    try {
      // Admin can view all meetings without restrictions
      if (currentUser.role === 'admin') {
        const queryBuilder = this.agendaRepository
          .createQueryBuilder('agenda')
          .where('agenda.isActive = :isActive', { isActive: true });

        if (eventId) {
          queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
        }

        if (status) {
          queryBuilder.andWhere('agenda.meetingStatus = :status', { status });
        }

        // Order by creation date (newest first)
        queryBuilder.orderBy('agenda.createdAt', 'DESC');

        const meetings = await queryBuilder.getMany();
        
        // Format the meetings using AgendaUtils
        const formattedMeetings = AgendaUtils.formatAgendas(meetings).map(meeting => ({
          ...meeting,
          requestType: 'admin-view',
          isAdminAccess: true
        }));
        
        return formattedMeetings;
      }

      // Regular users can only view their own meetings
      if (currentUser.id !== userId) {
        throw new BadRequestException('You can only view your own meetings.');
      }

      // Check if user is registered for the event (if eventId is provided)
      if (eventId) {
        const userRegistration = await this.checkUserEventRegistration(currentUser.id, eventId);
        if (!userRegistration) {
          throw new BadRequestException('You must be registered for this event to view meetings.');
        }
      }

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
        console.warn('Meeting location not provided. Consider adding a location for better organization.');
      }

      // Validate meeting details are provided (optional but recommended)
      if (!createMeetingDto.details || createMeetingDto.details.trim() === '') {
        console.warn('Meeting details not provided. Consider adding details for better context.');
      }

      // Validate meeting notes are provided (optional but recommended)
      if (!createMeetingDto.meetingNotes || createMeetingDto.meetingNotes.trim() === '') {
        console.warn('Meeting notes not provided. Consider adding notes for better organization.');
      }

      // Ensure meeting attendees are properly set
      const attendees = [currentUser.id, createMeetingDto.targetUserId];
      if (attendees.length < 2) {
        throw new BadRequestException('Meeting must have at least 2 attendees (sender and recipient).');
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
        category: AgendaCategory.Meeting,
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
      console.log('Saved meeting data:', {
        id: savedMeeting.id,
        requestType: savedMeeting.requestType,
        isMeetingRequest: savedMeeting.isMeetingRequest,
        meetingStatus: savedMeeting.meetingStatus,
        requestStatus: savedMeeting.requestStatus
      });

      // Send notification to the target user about the meeting request
      await this.sendMeetingRequestNotification(savedMeeting, currentUser, targetUser);

      // Meeting request created successfully
      console.log(`Meeting request created successfully: ${savedMeeting.id} by ${currentUser.id} for ${targetUser.id}`);

      const response = await this.getAgendaWithRelations(savedMeeting.id);
      
      // Debug: Log the response to see what's being returned
      console.log('Response data:', {
        id: response?.id,
        requestType: response?.requestType,
        isMeetingRequest: response?.isMeetingRequest,
        meetingStatus: response?.meetingStatus,
        requestStatus: response?.requestStatus
      });

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

      // Update both statuses consistently based on response
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

      // Meeting response processed successfully
      console.log(`Meeting response processed successfully: ${meeting.id} by ${currentUser.id} with response: ${responseDto.response}`);

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
        throw new BadRequestException('Cannot reschedule an inactive meeting.');
      }

      // Validate permissions - only meeting creator or recipient can reschedule
      if (meeting.userId !== currentUser.id && meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('You can only reschedule meetings that you own or created.');
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
        throw new BadRequestException('Cannot reschedule a meeting that has already started or completed.');
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
        throw new BadRequestException('New meeting time must be at least 1 hour from now.');
      }

      // Validate meeting time format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(rescheduleDto.newTime)) {
        throw new BadRequestException('Meeting time must be in HH:MM format (24-hour).');
      }

      // Validate that new date/time is different from current
      const currentMeetingDate = meeting.meetingDate;
      
      if (!currentMeetingDate) {
        throw new BadRequestException('Original meeting date is missing. Cannot reschedule.');
      }
      
      if (newMeetingDate.getTime() === currentMeetingDate.getTime() && 
          rescheduleDto.newTime === meeting.time) {
        throw new BadRequestException('New date and time must be different from current meeting date and time.');
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

      // Meeting rescheduled successfully
      console.log(`Meeting rescheduled successfully: ${meeting.id} by ${currentUser.id}`);

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
      const meeting = await this.agendaRepository.findOne({ where: { id: meetingId } });
      if (!meeting) {
        throw new ResourceNotFoundException('Meeting', meetingId);
      }

      // Admin can view any meeting without restrictions
      if (currentUser.role === 'admin') {
        const formattedMeeting = AgendaUtils.formatAgendas([meeting])[0];
        return {
          ...formattedMeeting,
          requestType: 'admin-view',
          isAdminAccess: true
        };
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

      // Admin can delete any meeting without restrictions
      if (currentUser.role === 'admin') {
        meeting.isActive = false;
        meeting.meetingNotes = meeting.meetingNotes 
          ? `${meeting.meetingNotes}\n\nDeleted by Admin ${currentUser.firstName || currentUser.id} on ${new Date().toISOString()}`
          : `Deleted by Admin ${currentUser.firstName || currentUser.id} on ${new Date().toISOString()}`;

        await this.agendaRepository.save(meeting);
        console.log(`Meeting deleted by admin: ${meetingId} by ${currentUser.id}`);
        return { message: 'Meeting deleted successfully by admin' };
      }

      // Regular users can only delete meetings they created (not received)
      if (meeting.createdBy !== currentUser.id) {
        throw new BadRequestException('You can only delete meetings that you created. You cannot delete meeting requests sent to you.');
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
      console.log(`Meeting deleted successfully: ${meetingId} by ${currentUser.id}`);

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

  // New method for deleting all meetings for a user (Admin only)
  async deleteAllMeetings(userId: string, eventId?: string, currentUser?: any) {
    try {
      // Only admin can delete all meetings
      if (currentUser.role !== 'admin') {
        throw new BadRequestException('Only administrators can delete all meetings.');
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
          ? `${meeting.meetingNotes}\n\nBulk deleted by Admin ${currentUser.firstName || currentUser.id} on ${new Date().toISOString()}`
          : `Bulk deleted by Admin ${currentUser.firstName || currentUser.id} on ${new Date().toISOString()}`;
      }

      await this.agendaRepository.save(meetings);

      // Bulk meeting deletion completed successfully
      console.log(`Bulk meeting deletion completed successfully: ${meetings.length} meetings deleted by Admin ${currentUser.id}`);

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
    const agenda = await this.agendaRepository.findOne({
      where: { id },
      // No need to fetch relations since we only need IDs
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
      console.error('Error checking user event registration:', error);
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
          `Time conflict detected on ${this.formatDate(meetingDate)}. This time slot overlaps with "${agenda.title}" (${agenda.time} - ${this.formatDuration(agenda.duration)})`,
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

      // Send email notification to the rescheduler (confirmation)
      if (currentUser?.email) {
        const emailSubject = `Meeting Rescheduled Successfully: ${originalMeetingData.title}`;
        const emailHtml = MeetingEmailTemplates.generateRescheduleConfirmationEmailHTML(
          currentUser,
          targetUser,
          originalMeetingData,
          updatedMeeting,
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
