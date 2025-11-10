import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterEvent } from './registerEvent.entity';
import {
  CreateRegisterEventDto,
  Type,
  UpdateRegisterEventDto,
} from './registerEvent.dto';
import { Event } from 'event/event.entity';
import { Order } from 'order/order.entity';
import { getEventColor } from 'utils/event-color.util';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { UserEntity, UserRole } from 'user/users.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { SurveyUtils } from 'utils/survey-utils';
import { UserUtils } from '../utils/user.utils';
import { EventSpeakerUtils } from '../utils/event-speaker.utils';
import { ExhibitorUtils } from '../utils/exhibitor.utils';
import { AgendaUtils, FormattedAgenda } from '../utils/agenda.utils';
import { AdminInfo } from './admin-info.entity';
import { Engagement } from '../engagement/engagement.entity';
import { EngagementService } from '../engagement/engagement.service';

export interface PublicParticipantDto {
  registrationId: string;
  participantUid: string | null;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  designation: string;
  type: string | undefined;
  status: string | undefined;
  createdAt: Date;
}

@Injectable()
export class RegisterEventService {
  constructor(
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,

    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(FavoriteEvent)
    private readonly favoriteEventRepository: Repository<FavoriteEvent>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(EventAgenda)
    private readonly agendaRepository: Repository<EventAgenda>,

    @InjectRepository(AdminInfo)
    private readonly adminInfoRepository: Repository<AdminInfo>,

    @InjectRepository(Engagement)
    private readonly engagementRepository: Repository<Engagement>,

    private readonly engagementService: EngagementService,
    private readonly surveyUtils: SurveyUtils,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async createRegisterEvent(
    userId: string,
    createRegisterEventDto: CreateRegisterEventDto,
  ): Promise<RegisterEvent> {
    try {
      const { eventId, type, isCreatedByAdmin } = createRegisterEventDto;

      // Check if event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if the user has already registered for this event
      const existingRegistration = await this.registerEventRepository.findOne({
        where: {
          user: { id: userId },
          event: { id: eventId },
        },
      });

      if (existingRegistration) {
        // Check if user is trying to register with a different role
        if (
          user.role === UserRole.Exhibitor &&
          existingRegistration.type !== Type.Exhibitor
        ) {
          // Update existing registration to exhibitor type
          existingRegistration.type = Type.Exhibitor;
          return await this.registerEventRepository.save(existingRegistration);
        } else if (
          user.role === UserRole.Exhibitor &&
          existingRegistration.type === Type.Exhibitor
        ) {
          throw new DuplicateResourceException(
            'User already registered as an exhibitor for this event',
          );
        } else {
          throw new DuplicateResourceException(
            'User already registered for this event',
          );
        }
      }

      // Auto-set type to 'Exhibitor' if user role is exhibitor
      let finalType = type;
      if (user.role === UserRole.Exhibitor) {
        finalType = Type.Exhibitor;
      }

      // Create new registration
      const registerEventData = {
        userId: userId, // Use the authenticated user's ID from token
        eventId: eventId,
        type: finalType,
        isCreatedByAdmin: isCreatedByAdmin || false,
        isRegister: true,
        orderId: isCreatedByAdmin ? undefined : createRegisterEventDto.orderId,
      };

      const registerEvent =
        this.registerEventRepository.create(registerEventData);
      return await this.registerEventRepository.save(registerEvent);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Register Event creation');
    }
  }

  async findAll(userId: string, role: string, filters?: { filter?: string; userFilter?: string; eventFilter?: string }) {
    try {
      let registerEvents;
      if (role === 'admin') {
        // Admin can see all register events
        const queryBuilder = this.registerEventRepository
          .createQueryBuilder('registerEvent')
          .leftJoinAndSelect('registerEvent.user', 'user')
          .leftJoinAndSelect('registerEvent.event', 'event')
          .leftJoinAndSelect('event.eventSpeakers', 'eventSpeakers')
          .leftJoinAndSelect('eventSpeakers.speaker', 'speaker')
          .leftJoinAndSelect('speaker.speakerProfile', 'speakerProfile')
          .leftJoinAndSelect('speaker.addresses', 'speakerAddresses')
          .leftJoinAndSelect('event.category', 'category')
          .leftJoinAndSelect('category.category', 'categoryDetails')
          .leftJoinAndSelect('event.galleries', 'galleries')
          .leftJoinAndSelect('event.eventExhibitors', 'eventExhibitors')
          .leftJoinAndSelect('eventExhibitors.exhibitor', 'exhibitor')
          .leftJoinAndSelect('exhibitor.promotionalOffers', 'promotionalOffers')
          .leftJoinAndSelect('event.programmeTracks', 'programmeTracks')
          .leftJoinAndSelect('programmeTracks.sessions', 'programmeSessions')
          .leftJoinAndSelect('programmeSessions.speakers', 'programmeSessionSpeakers')
          .leftJoinAndSelect('programmeSessionSpeakers.speakerProfile', 'programmeSessionSpeakerProfile')
          .leftJoinAndSelect('programmeSessionSpeakers.addresses', 'programmeSessionSpeakerAddresses')
          .leftJoinAndSelect('registerEvent.order', 'order')
          .leftJoinAndSelect('registerEvent.adminInfo', 'adminInfo')
          .leftJoinAndSelect('registerEvent.billingDetails', 'billingDetails');

        // Apply filters if provided
        if (filters?.userFilter) {
          queryBuilder.andWhere(
            '(LOWER(user.firstName) LIKE LOWER(:userFilter) OR LOWER(user.lastName) LIKE LOWER(:userFilter) OR LOWER(user.email) LIKE LOWER(:userFilter))',
            { userFilter: `%${filters.userFilter}%` }
          );
        }

        if (filters?.eventFilter) {
          queryBuilder.andWhere(
            '(LOWER(event.name) LIKE LOWER(:eventFilter) OR LOWER(event.location) LIKE LOWER(:eventFilter))',
            { eventFilter: `%${filters.eventFilter}%` }
          );
        }

        registerEvents = await queryBuilder.getMany();
      } else {
        // Normal user can only see their own registered events
        const queryBuilder = this.registerEventRepository
          .createQueryBuilder('registerEvent')
          .leftJoinAndSelect('registerEvent.user', 'user')
          .leftJoinAndSelect('registerEvent.event', 'event')
          .leftJoinAndSelect('event.eventSpeakers', 'eventSpeakers')
          .leftJoinAndSelect('eventSpeakers.speaker', 'speaker')
          .leftJoinAndSelect('speaker.speakerProfile', 'speakerProfile')
          .leftJoinAndSelect('speaker.addresses', 'speakerAddresses')
          .leftJoinAndSelect('event.category', 'category')
          .leftJoinAndSelect('category.category', 'categoryDetails')
          .leftJoinAndSelect('event.galleries', 'galleries')
          .leftJoinAndSelect('event.eventExhibitors', 'eventExhibitors')
          .leftJoinAndSelect('eventExhibitors.exhibitor', 'exhibitor')
          .leftJoinAndSelect('exhibitor.promotionalOffers', 'promotionalOffers')
          .leftJoinAndSelect('event.programmeTracks', 'programmeTracks')
          .leftJoinAndSelect('programmeTracks.sessions', 'programmeSessions')
          .leftJoinAndSelect('programmeSessions.speakers', 'programmeSessionSpeakers')
          .leftJoinAndSelect('programmeSessionSpeakers.speakerProfile', 'programmeSessionSpeakerProfile')
          .leftJoinAndSelect('programmeSessionSpeakers.addresses', 'programmeSessionSpeakerAddresses')
          .leftJoinAndSelect('registerEvent.order', 'order')
          .leftJoinAndSelect('registerEvent.adminInfo', 'adminInfo')
          .leftJoinAndSelect('registerEvent.billingDetails', 'billingDetails')
          .where('user.id = :userId', { userId })
          .andWhere('registerEvent.isRegister = :isRegister', { isRegister: true });

        // Apply event filter for regular users
        if (filters?.eventFilter) {
          queryBuilder.andWhere(
            '(LOWER(event.name) LIKE LOWER(:eventFilter) OR LOWER(event.location) LIKE LOWER(:eventFilter))',
            { eventFilter: `%${filters.eventFilter}%` }
          );
        }

        registerEvents = await queryBuilder.getMany();
      }

      // Add attendance count and favorite status to each registered event
      const registerEventsWithAttendance = await Promise.all(
        registerEvents.map(async (registerEvent) => {
          const attendanceCount = registerEvent.eventId
            ? await this.getEventAttendanceCount(registerEvent.eventId)
            : 0;

          const surveyDetails = registerEvent.eventId
            ? await this.surveyUtils.getSurveyDetailsByEventId(
                registerEvent.eventId,
                userId,
              )
            : null;

          // Get user's personal agenda items for this specific event
          const formattedAgendas = await AgendaUtils.getUserPersonalAgendas(
            this.agendaRepository,
            registerEvent.eventId || '',
            registerEvent.userId || '',
          );

          let formattedDocuments: { name: string; document: string }[] = [];
          if (
            registerEvent?.event?.documents &&
            registerEvent?.event?.documentNames
          ) {
            formattedDocuments = registerEvent.event.documents.map(
              (doc, index) => ({
                name:
                  registerEvent.event?.documentNames?.[index] ||
                  `Document ${index + 1}`,
                document: doc,
              }),
            );
          } else if (registerEvent?.event?.documents) {
            // Fallback if no names are provided
            formattedDocuments = registerEvent.event.documents.map(
              (doc, index) => ({
                name: `Document ${index + 1}`,
                document: doc,
              }),
            );
          }

          // Check if event is favorited by the user
          let isFavorite = false;
          if (registerEvent.userId) {
            const favorite = await this.favoriteEventRepository.findOne({
              where: {
                userId: registerEvent.userId,
                eventId: registerEvent.eventId,
              },
            });
            isFavorite = !!favorite;
          }

          const speakers = EventSpeakerUtils.buildSpeakerSchedule(
            registerEvent.event,
          );
          const categories =
            registerEvent.event?.category?.map((ec) => ec.category) || [];

          // Format programme tracks with basic speaker info using utility
          const formattedProgrammeTracks = UserUtils.formatProgrammeTracks(registerEvent.event?.programmeTracks || []);

          // Get engagements for this event with Q&A and polling data
          const engagements = registerEvent.eventId 
            ? await this.engagementService.getEngagementsByEvent(registerEvent.eventId) 
            : [];

          const {
            eventSpeakers,
            category,
            eventExhibitors,
            exhibitorDescription,
            eventStampDescription,
            documents, // Remove original documents
            documentNames, // Remove original documentNames
            eventStampImages,
            programmeTracks,
            ...restEvent
          } = registerEvent.event || {};

          const event = {
            ...restEvent,
            registerEventId: registerEvent.id, // Add registerEventId inside event object
            color: getEventColor(registerEvent.event?.type),
            speakers,
            speakersData: speakers,
            categories,
            documents: formattedDocuments,
            engagements: engagements,
            programmeTracks: formattedProgrammeTracks, // Add formatted programme tracks

            eventStamps: {
              description: registerEvent.event?.eventStampDescription,
              images: registerEvent.event?.eventStampImages,
            },

            exhibitorsData: {
              exhibitorDescription: exhibitorDescription || '',
              exhibitors:
                registerEvent.event?.eventExhibitors
                  ?.filter((ee) => ee.exhibitor.isActive)
                  ?.map((ee) => {
                    return {
                      ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
                      promotionalOffers: ee.exhibitor.promotionalOffers || [],
                    };
                  }) || [],
            },
            myAgendas: formattedAgendas || [],

            attendanceCount: attendanceCount,
            surveyDetails: surveyDetails,
            hasSurvey: !!surveyDetails,
            isFavorite: isFavorite,
            isRegister: registerEvent.isRegister,
          };

          const { firstName, lastName, email, mobile, id } =
            registerEvent.user || {};
          const cleanedUser = { firstName, lastName, email, mobile, id };

          const {
            orderId: _,
            eventId: __,
            isRegister: ___,
          
            ...cleanRegisterEvent
          } = registerEvent;

          // Get admin info for this registration - show if lucky draw feature is enabled
          const hasAdminInfo =
            registerEvent.adminInfo &&
            registerEvent.event?.enableLuckyDrawFeature;

          const adminInfo = hasAdminInfo
            ? {
                ...registerEvent.adminInfo,
              }
            : null;

          return {
            ...cleanRegisterEvent,
            event,
            user: cleanedUser,
            isCreatedByAdmin: registerEvent.isCreatedByAdmin,
            adminInfo, // Add admin info
            billingDetails: registerEvent.billingDetails || [], // Add billing details
            // Add user's personal agenda data
          };
        }),
      );

      return {
        success: true,
        message:
          role === 'admin'
            ? 'All registered events fetched for admin'
            : 'Your registered events fetched successfully',
        count: registerEventsWithAttendance.length,
        data: registerEventsWithAttendance,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Register Event retrieval');
    }
  }

  async getEventAttendanceCount(eventId: string): Promise<number> {
    try {
      const count = await this.registerEventRepository.count({
        where: { eventId: eventId },
      });
      return count;
    } catch (error) {
      this.errorHandler.logError(error, 'Event Attendance Count', eventId);
      return 0;
    }
  }

  async findOne(registrationId: string, userId: string, role: string) {
    try {
      // Query to find the specific register event
      const registerEvent = await this.registerEventRepository.findOne({
        where:
          role === 'admin'
            ? { id: registrationId }
            : { id: registrationId, user: { id: userId } },
        relations: [
          'user',
          'event',
          'event.eventSpeakers',
          'event.eventSpeakers.speaker',
          'event.eventSpeakers.speaker.speakerProfile',
          'event.eventSpeakers.speaker.addresses',
          'event.category',
          'event.category.category',
          'event.galleries',
          'event.eventExhibitors',
          'event.eventExhibitors.exhibitor',
          'event.eventExhibitors.exhibitor.promotionalOffers',
          'event.programmeTracks',
          'event.programmeTracks.sessions',
          'event.programmeTracks.sessions.speakers',
          'event.programmeTracks.sessions.speakers.speakerProfile',
          'event.programmeTracks.sessions.speakers.addresses',
          'order',
          'adminInfo',
          'billingDetails',
        ],
      });

      if (!registerEvent) {
        throw new ResourceNotFoundException('Register Event', registrationId);
      }

      // Get user's personal agenda items for this registered event
      const formattedAgendas = await AgendaUtils.getUserPersonalAgendas(
        this.agendaRepository,
        registerEvent.eventId || '',
        registerEvent.userId || '',
      );

      // Get attendance count for this event
      const attendanceCount = registerEvent.eventId
        ? await this.getEventAttendanceCount(registerEvent.eventId)
        : 0;

      // Check if event is favorited by the user
      let isFavorite = false;
      if (registerEvent.userId) {
        const favorite = await this.favoriteEventRepository.findOne({
          where: {
            userId: registerEvent.userId,
            eventId: registerEvent.eventId,
          },
        });
        isFavorite = !!favorite;
      }

      // Format documents with names
      let formattedDocuments: { name: string; document: string }[] = [];
      if (
        registerEvent?.event?.documents &&
        registerEvent?.event?.documentNames
      ) {
        formattedDocuments = registerEvent.event.documents.map(
          (doc, index) => ({
            name:
              registerEvent?.event?.documentNames?.[index] ||
              `Document ${index + 1}`,
            document: doc,
          }),
        );
      } else if (registerEvent?.event?.documents) {
        // Fallback if no names are provided
        formattedDocuments = registerEvent.event.documents.map(
          (doc, index) => ({
            name: `Document ${index + 1}`,
            document: doc,
          }),
        );
      }

      const surveyDetails = registerEvent.eventId
        ? await this.surveyUtils.getSurveyDetailsByEventId(
            registerEvent.eventId,
            userId,
          )
        : null;

      // Extract speaker schedule
      const speakers = EventSpeakerUtils.buildSpeakerSchedule(
        registerEvent.event,
      );
      const categories =
        registerEvent.event?.category?.map((ec) => ec.category) || [];

      // Extract exhibitors (only active ones)
      const exhibitors =
        registerEvent.event?.eventExhibitors
          ?.filter((ee) => ee.exhibitor.isActive)
          ?.map((ee) => {
            return {
              ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
              promotionalOffers: ee.exhibitor.promotionalOffers || [],
            };
          }) || [];

      // Format programme tracks with basic speaker info using utility
      const formattedProgrammeTracks = UserUtils.formatProgrammeTracks(registerEvent.event?.programmeTracks || []);

      // Get engagements for this event with Q&A and polling data
      const engagements = registerEvent.eventId 
        ? await this.engagementService.getEngagementsByEvent(registerEvent.eventId) 
        : [];

      // Clean up event object
      const {
        eventSpeakers,
        category,
        eventExhibitors,
        exhibitorDescription,
        eventStampDescription,
        eventStampImages,
        documents, // Remove original documents
        documentNames, // Remove original documentNames
        programmeTracks,
        ...restEvent
      } = registerEvent.event || {};

      const event = {
        ...restEvent,
        registerEventId: registerEvent.id, // Add registerEventId inside event object
        color: getEventColor(registerEvent.event?.type),
        speakers,
        speakersData: speakers,
        categories,
        documents: formattedDocuments,
        programmeTracks: formattedProgrammeTracks, // Add formatted programme tracks
        engagements: engagements,
        eventStamps: {
          description: registerEvent.event?.eventStampDescription,
          images: registerEvent.event?.eventStampImages,
        },
        exhibitorsData: {
          exhibitorDescription: exhibitorDescription || '',
          exhibitors: exhibitors,
        },
        myAgendas: formattedAgendas || [],

        attendanceCount: attendanceCount,
        surveyDetails: surveyDetails,
        hasSurvey: !!surveyDetails,
        isFavorite: isFavorite,
        isRegister: registerEvent.isRegister,
      };

      // Clean up user object
      const { firstName, lastName, email, mobile, id } =
        registerEvent.user || {};
      const cleanedUser = { firstName, lastName, email, mobile, id };

      // Exclude unnecessary fields
      const {
        orderId: _,
        eventId: __,
        isRegister: ___,
        ...cleanRegisterEvent
      } = registerEvent;

      // Get admin info for this registration - show if lucky draw feature is enabled
      const hasAdminInfo =
        registerEvent.adminInfo && registerEvent.event?.enableLuckyDrawFeature;

      const adminInfo = hasAdminInfo
        ? {
            ...registerEvent.adminInfo,
          }
        : null;

      return {
        success: true,
        message: 'Register event fetched successfully',
        data: {
          ...cleanRegisterEvent,
          event,
          user: cleanedUser,
          isCreatedByAdmin: registerEvent.isCreatedByAdmin,
          adminInfo, // Add admin info
          billingDetails: registerEvent.billingDetails || [], // Add billing details
          // Add user's personal agenda data
        },
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(
        error,
        'Register Event retrieval by ID',
      );
    }
  }

  async adminUpdateRegisterEvent(
    id: string,
    updateRegisterEventDto: UpdateRegisterEventDto,
  ): Promise<RegisterEvent> {
    try {
      const registration = await this.registerEventRepository.findOne({
        where: { id },
        relations: ['user', 'event'],
      });

      if (!registration) {
        throw new ResourceNotFoundException('Registration', id);
      }

      // Update user if provided
      if (updateRegisterEventDto.userId !== undefined) {
        const newUser = await this.userRepository.findOne({
          where: { id: updateRegisterEventDto.userId },
        });
        if (!newUser) {
          throw new ResourceNotFoundException(
            'User',
            updateRegisterEventDto.userId,
          );
        }
        registration.userId = updateRegisterEventDto.userId;
        registration.user = newUser;
      }

      // Update event if provided
      if (updateRegisterEventDto.eventId !== undefined) {
        const newEvent = await this.eventRepository.findOne({
          where: { id: updateRegisterEventDto.eventId },
        });
        if (!newEvent) {
          throw new ResourceNotFoundException(
            'Event',
            updateRegisterEventDto.eventId,
          );
        }
        registration.eventId = updateRegisterEventDto.eventId;
        registration.event = newEvent;
      }

      // Update other fields
      if (updateRegisterEventDto.type !== undefined) {
        registration.type = updateRegisterEventDto.type;
      }

      if (updateRegisterEventDto.isCreatedByAdmin !== undefined) {
        registration.isCreatedByAdmin = updateRegisterEventDto.isCreatedByAdmin;
      }
      if (updateRegisterEventDto.orderId !== undefined) {
        registration.orderId = updateRegisterEventDto.orderId;
      }

      // Save the updated registration
      const updatedRegistration =
        await this.registerEventRepository.save(registration);

      // Fetch the updated registration with fresh relations
      const freshRegistration = await this.registerEventRepository.findOne({
        where: { id: updatedRegistration.id },
        relations: ['user', 'event'],
      });

      if (!freshRegistration) {
        throw new ResourceNotFoundException('Updated Registration', id);
      }

      return freshRegistration;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Register Event update');
    }
  }

  async adminDeleteRegisterEvent(id: string): Promise<void> {
    try {
      const registration = await this.registerEventRepository.findOne({
        where: { id },
      });

      if (!registration) {
        throw new ResourceNotFoundException('Registration', id);
      }

      await this.registerEventRepository.remove(registration);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Register Event deletion');
    }
  }

  async exportRegisteredUsersByEvent(eventId: string): Promise<string> {
    try {
      // Get all registered users for the specific event
      const registerEvents = await this.registerEventRepository
        .createQueryBuilder('registerEvent')
        .leftJoinAndSelect('registerEvent.user', 'user')
        .leftJoinAndSelect('registerEvent.event', 'event')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('registerEvent.isRegister = :isRegister', { isRegister: true })
        .getMany();

      // Generate CSV content
      const headers = ['First Name', 'Last Name', 'Company', 'Designation', 'Email', 'UID'];
      
      // Sort users alphabetically by name
      const sortedRegistrations = registerEvents.sort((a, b) => {
        const nameA = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim().toLowerCase();
        const nameB = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

      const csvRows = sortedRegistrations.map(reg => {
        const firstName = reg.user?.firstName || 'N/A';
        const lastName = reg.user?.lastName || 'N/A';
        const company = reg.user?.company || 'N/A';
        const designation = reg.user?.designation || 'N/A';
        const email = reg.user?.email || 'N/A';
        const uid = reg.user?.id || 'N/A';
        
        return [firstName, lastName, company, designation, email, uid];
      });
      
      // Combine headers and rows, escape fields that contain commas
      const csvContent = [headers, ...csvRows]
        .map(row => row.map(field => {
          // Escape fields containing commas, quotes, or newlines
          const fieldStr = String(field || '');
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        }).join(','))
        .join('\n');
      
      return csvContent;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Export registered users by event');
    }
  }

  async getPublicParticipants(
    eventId: string,
    search?: string,
  ): Promise<PublicParticipantDto[]> {
    try {
      const queryBuilder = this.registerEventRepository
        .createQueryBuilder('registerEvent')
        .leftJoinAndSelect('registerEvent.user', 'user')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('registerEvent.isRegister = :isRegister', {
          isRegister: true,
        });

      if (search) {
        const normalizedSearch = `%${search.toLowerCase()}%`;
        queryBuilder.andWhere(
          `(LOWER(user.email) LIKE :search OR LOWER(CONCAT(COALESCE(user.firstName, ''), ' ', COALESCE(user.lastName, ''))) LIKE :search)`,
          { search: normalizedSearch },
        );
      }

      const registrations = await queryBuilder
        .orderBy('LOWER(user.firstName)', 'ASC')
        .addOrderBy('LOWER(user.lastName)', 'ASC')
        .getMany();

      return registrations.map((registration) => ({
        registrationId: registration.id,
        participantUid: registration.user?.id ?? null,
        firstName: registration.user?.firstName ?? '',
        lastName: registration.user?.lastName ?? '',
        email: registration.user?.email ?? '',
        company: registration.user?.company ?? '',
        designation: registration.user?.designation ?? '',
        type: registration.type,
        status: registration.status,
        createdAt: registration.createdAt,
      }));
    } catch (error) {
      this.errorHandler.handleDatabaseError(
        error,
        'Get public event participants',
      );
    }
  }
}
