import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
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
import { Checkout } from '../checkout/checkout.entity';
import { CheckoutCartItem } from '../checkout/checkout-cart-item.entity';
import { CheckoutUtils } from '../utils/checkout.utils';

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

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Checkout)
    private readonly checkoutRepository: Repository<Checkout>,

    @InjectRepository(CheckoutCartItem)
    private readonly checkoutCartItemRepository: Repository<CheckoutCartItem>,

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

  async findAll(userId: string, role: string, filters?: { filter?: string; userFilter?: string; eventFilter?: string; userId?: string; eventId?: string; startDate?: string; endDate?: string }) {
    try {
      let registerEvents;
      if (role === 'admin') {
        // Admin can see all register events
        // Optimized: Only load basic details - event, order, and registration details
        const queryBuilder = this.registerEventRepository
          .createQueryBuilder('registerEvent')
          .leftJoinAndSelect('registerEvent.user', 'user')
          .leftJoinAndSelect('registerEvent.event', 'event')
          .leftJoinAndSelect('registerEvent.order', 'order')
          .leftJoinAndSelect('registerEvent.adminInfo', 'adminInfo')
          .leftJoinAndSelect('registerEvent.billingDetails', 'billingDetails');

        // Apply filters if provided
        // Filter by user ID (exact match) - takes priority over userFilter
        if (filters?.userId) {
          queryBuilder.andWhere('user.id = :userId', { userId: filters.userId });
        } else if (filters?.userFilter) {
          // Filter by user name/email (LIKE search)
          queryBuilder.andWhere(
            '(LOWER(user.firstName) LIKE LOWER(:userFilter) OR LOWER(user.lastName) LIKE LOWER(:userFilter) OR LOWER(user.email) LIKE LOWER(:userFilter))',
            { userFilter: `%${filters.userFilter}%` }
          );
        }

        // Filter by event ID (exact match) - takes priority over eventFilter
        if (filters?.eventId) {
          queryBuilder.andWhere('event.id = :eventId', { eventId: filters.eventId });
        } else if (filters?.eventFilter) {
          // Filter by event name/location (LIKE search)
          queryBuilder.andWhere(
            '(LOWER(event.name) LIKE LOWER(:eventFilter) OR LOWER(event.location) LIKE LOWER(:eventFilter))',
            { eventFilter: `%${filters.eventFilter}%` }
          );
        }

        // Filter by date range
        if (filters?.startDate) {
          queryBuilder.andWhere('DATE(event.startDate) >= :startDate', { startDate: filters.startDate });
        }
        if (filters?.endDate) {
          queryBuilder.andWhere('DATE(event.startDate) <= :endDate', { endDate: filters.endDate });
        }

        // Sort by event startDate in descending order (newest first)
        queryBuilder.orderBy('event.startDate', 'DESC');

        registerEvents = await queryBuilder.getMany();
      } else {
        // Normal user can only see their own registered events
        // Exclude past events - only show upcoming/active events
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
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
          .andWhere('registerEvent.isRegister = :isRegister', { isRegister: true })
          // Exclude past events - only show events where endDate is today or in the future
          // Use MoreThanOrEqual for proper date comparison
          .andWhere('event.endDate >= :today', { today });

        // Apply event filter for regular users
        if (filters?.eventFilter) {
          queryBuilder.andWhere(
            '(LOWER(event.name) LIKE LOWER(:eventFilter) OR LOWER(event.location) LIKE LOWER(:eventFilter))',
            { eventFilter: `%${filters.eventFilter}%` }
          );
        }

        // Filter by date range for regular users
        if (filters?.startDate) {
          queryBuilder.andWhere('DATE(event.startDate) >= :startDate', { startDate: filters.startDate });
        }
        if (filters?.endDate) {
          queryBuilder.andWhere('DATE(event.startDate) <= :endDate', { endDate: filters.endDate });
        }

        // Sort by event startDate in ascending order (upcoming first)
        queryBuilder.orderBy('event.startDate', 'ASC');

        registerEvents = await queryBuilder.getMany();
        
        // Additional filter to ensure past events are excluded (safety check)
        // Filter out events where endDate < today
        const todayForFilter = new Date();
        todayForFilter.setHours(0, 0, 0, 0);
        
        registerEvents = registerEvents.filter((registerEvent) => {
          if (!registerEvent.event?.endDate) return false;
          const eventEndDate = new Date(registerEvent.event.endDate);
          eventEndDate.setHours(0, 0, 0, 0);
          // Only include events where endDate >= today
          return eventEndDate >= todayForFilter;
        });
      }

      // Add attendance count and favorite status to each registered event
      const registerEventsWithAttendance = await Promise.all(
        registerEvents.map(async (registerEvent) => {
          // Get attendance count for both admin and regular users
          const attendanceCount = registerEvent.eventId
            ? await this.getEventAttendanceCount(registerEvent.eventId)
            : 0;

          if (role === 'admin') {
            // For admin: Only return basic event details, order details, and registration details
            const { firstName, lastName, email, mobile, id } = registerEvent.user || {};
            const cleanedUser = { firstName, lastName, email, mobile, id };

            // Extract only basic event fields (no nested relations)
            const basicEvent = registerEvent.event ? {
              id: registerEvent.event.id,
              name: registerEvent.event.name,
              description: registerEvent.event.description,
              startDate: registerEvent.event.startDate,
              endDate: registerEvent.event.endDate,
              startTime: registerEvent.event.startTime,
              endTime: registerEvent.event.endTime,
              location: registerEvent.event.location,
              venue: registerEvent.event.venue,
              country: registerEvent.event.country,
              type: registerEvent.event.type,
              price: registerEvent.event.price,
              currency: registerEvent.event.currency,
              registerEventId: registerEvent.id,
              attendanceCount: attendanceCount,
            } : null;

            // Fetch checkout data if order exists
            let checkoutData = null;
            if (registerEvent.order?.id) {
              try {
                checkoutData = await CheckoutUtils.getCheckoutByOrderId(
                  registerEvent.order.id,
                  this.orderRepository,
                  this.checkoutRepository,
                  this.checkoutCartItemRepository
                );
              } catch (error) {
                // If checkout not found, continue without checkout data
                console.log('Checkout data not found for order:', registerEvent.order.id);
              }
            }

            return {
              id: registerEvent.id,
              status: registerEvent.status,
              type: registerEvent.type,
              createdAt: registerEvent.createdAt,
              isCreatedByAdmin: registerEvent.isCreatedByAdmin,
              event: basicEvent,
              user: cleanedUser,
              order: registerEvent.order || null,
              adminInfo: registerEvent.adminInfo || null,
              checkout: checkoutData || null,
            };
          } else {
            // For regular users: Keep full details
            // attendanceCount already calculated above

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

            // For regular users, load full event details
            const speakers = registerEvent.event?.eventSpeakers 
              ? EventSpeakerUtils.buildSpeakerSchedule(registerEvent.event)
              : [];
            const categories = registerEvent.event?.category?.map((ec) => ec.category) || [];
            const formattedProgrammeTracks = registerEvent.event?.programmeTracks 
              ? UserUtils.formatProgrammeTracks(registerEvent.event.programmeTracks)
              : [];

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
              documents,
              documentNames,
              eventStampImages,
              programmeTracks,
              ...restEvent
            } = registerEvent.event || {};

            const event = {
              ...restEvent,
              registerEventId: registerEvent.id,
              color: getEventColor(registerEvent.event?.type),
              speakers,
              speakersData: speakers,
              categories,
              documents: formattedDocuments,
              engagements: engagements,
              programmeTracks: formattedProgrammeTracks,
              eventStamps: {
                description: registerEvent.event?.eventStampDescription,
                images: registerEvent.event?.eventStampImages,
              },
              exhibitorsData: {
                exhibitorDescription: exhibitorDescription || '',
                exhibitors: registerEvent.event?.eventExhibitors
                  ?.filter((ee) => ee.exhibitor?.isActive)
                  ?.map((ee) => {
                    return {
                      ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
                      promotionalOffers: ee.exhibitor?.promotionalOffers || [],
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

            // Fetch checkout data if order exists
            let checkoutData = null;
            if (registerEvent.order?.id) {
              try {
                checkoutData = await CheckoutUtils.getCheckoutByOrderId(
                  registerEvent.order.id,
                  this.orderRepository,
                  this.checkoutRepository,
                  this.checkoutCartItemRepository
                );
              } catch (error) {
                // If checkout not found, continue without checkout data
                console.log('Checkout data not found for order:', registerEvent.order.id);
              }
            }

            return {
              ...cleanRegisterEvent,
              event,
              user: cleanedUser,
              isCreatedByAdmin: registerEvent.isCreatedByAdmin,
              adminInfo: registerEvent.adminInfo || null,
              checkout: checkoutData || null,
            };
          }
        }),
      );

      // Sort registrations by event startDate
      // For admin: descending order (newest first)
      // For regular users: ascending order (upcoming first) - already filtered to exclude past events
      registerEventsWithAttendance.sort((a, b) => {
        // Create date objects and normalize to midnight (ignore time component)
        const dateA = a.event?.startDate ? new Date(a.event.startDate) : new Date(0);
        dateA.setHours(0, 0, 0, 0);
        const dateB = b.event?.startDate ? new Date(b.event.startDate) : new Date(0);
        dateB.setHours(0, 0, 0, 0);
        
        if (role === 'admin') {
          // Admin: descending order (newest first)
          return dateB.getTime() - dateA.getTime();
        } else {
          // Regular users: ascending order (upcoming first)
          return dateA.getTime() - dateB.getTime();
        }
      });

      // For admin role, include filter data (events and users list)
      // Extract unique events and users from ALL registered events (not filtered ones)
      // This ensures filter dropdown always shows all registered events/users, not just filtered subset
      let filterData = null;
      if (role === 'admin') {
        // Fetch ALL registered events (without filters) to get complete filter data
        const allRegisterEvents = await this.registerEventRepository
          .createQueryBuilder('registerEvent')
          .leftJoinAndSelect('registerEvent.user', 'user')
          .leftJoinAndSelect('registerEvent.event', 'event')
          .orderBy('event.startDate', 'DESC')
          .getMany();

        // Extract unique events and users from all registered events
        const uniqueEventsMap = new Map<string, { id: string; eventName: string }>();
        const uniqueUsersMap = new Map<string, { id: string; username: string; email: string }>();

        allRegisterEvents.forEach((registerEvent) => {
          // Extract unique events
          if (registerEvent.event && registerEvent.event.id) {
            if (!uniqueEventsMap.has(registerEvent.event.id)) {
              uniqueEventsMap.set(registerEvent.event.id, {
                id: registerEvent.event.id,
                eventName: registerEvent.event.name || '',
              });
            }
          }

          // Extract unique users
          if (registerEvent.user && registerEvent.user.id) {
            if (!uniqueUsersMap.has(registerEvent.user.id)) {
              const firstName = registerEvent.user.firstName || '';
              const lastName = registerEvent.user.lastName || '';
              const email = registerEvent.user.email || '';
              const username = `${firstName} ${lastName}`.trim() || email || 'Unknown User';
              
              uniqueUsersMap.set(registerEvent.user.id, {
                id: registerEvent.user.id,
                username: username,
                email: email,
              });
            }
          }
        });

        // Convert maps to arrays and sort
        const formattedEvents = Array.from(uniqueEventsMap.values()).sort((a, b) => 
          a.eventName.localeCompare(b.eventName)
        );
        const formattedUsers = Array.from(uniqueUsersMap.values()).sort((a, b) => 
          a.username.localeCompare(b.username)
        );

        filterData = {
          events: formattedEvents,
          users: formattedUsers,
        };
      }

      return {
        success: true,
        message:
          role === 'admin'
            ? 'All registered events fetched for admin'
            : 'Your registered events fetched successfully',
        count: registerEventsWithAttendance.length,
        data: registerEventsWithAttendance,
        ...(filterData && { filter: filterData }),
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

      // Get admin info for this registration - always show if it exists
      const adminInfo = registerEvent.adminInfo
        ? {
            ...registerEvent.adminInfo,
          }
        : null;

      // Fetch checkout data if order exists
      let checkoutData = null;
      if (registerEvent.order?.id) {
        try {
          checkoutData = await CheckoutUtils.getCheckoutByOrderId(
            registerEvent.order.id,
            this.orderRepository,
            this.checkoutRepository,
            this.checkoutCartItemRepository
          );
        } catch (error) {
          // If checkout not found, continue without checkout data
          console.log('Checkout data not found for order:', registerEvent.order.id);
        }
      }

      return {
        success: true,
        message: 'Register event fetched successfully',
        data: {
          ...cleanRegisterEvent,
          event,
          user: cleanedUser,
          isCreatedByAdmin: registerEvent.isCreatedByAdmin,
          adminInfo, // Add admin info
          checkout: checkoutData || null, // Add checkout data as separate field
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

  /**
   * Get receipt data for PDF generation
   */
  async getReceiptData(
    registrationId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    try {
      const registerEvent = await this.findOne(registrationId, userId, role);

      if (!registerEvent?.data) {
        throw new NotFoundException('Registration not found');
      }

      const data = registerEvent.data;

      // Check if checkout exists and is completed
      if (!data.checkout || data.checkout.status !== 'Completed') {
        return null;
      }

      const checkout = data.checkout;
      const user = data.user;
      const event = data.event;
      const order = data.order;

      // Prepare receipt data
      return {
        checkoutId: checkout.checkoutId,
        transactionId: checkout.transactionId,
        totalAmount: parseFloat(checkout.totalAmount?.toString() || '0'),
        discount: checkout.discount ? parseFloat(checkout.discount.toString()) : undefined,
        couponCode: checkout.couponCode,
        promoCode: checkout.promoCode,
        paymentGateway: checkout.paymentGateway,
        paymentMethod: checkout.paymentMethod,
        status: checkout.status,
        createdAt: checkout.createdAt ? new Date(checkout.createdAt) : new Date(),
        completedAt: checkout.completedAt ? new Date(checkout.completedAt) : undefined,
        user: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          mobile: user?.mobile || undefined,
        },
        event: {
          name: event?.name || '',
          startDate: event?.startDate || '',
          endDate: event?.endDate || event?.startDate || '',
          location: event?.location || undefined,
          venue: event?.venue || undefined,
        },
        orderNo: order?.orderNo || undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Get receipt data');
    }
  }
}
