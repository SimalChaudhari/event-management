import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
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
import { EventStaff } from '../event/event-staff.entity';
import { ExhibitorRating } from '../exhibitor/exhibitor-rating.entity';
import { EventStampService } from '../event/event-stamp.service';
import { forwardRef, Inject, Optional } from '@nestjs/common';
import { EventRegistrationShareLink } from './event-registration-share-link.entity';
import * as crypto from 'crypto';
import { EventAttendance, AttendanceStatus } from '../attendance/attendance.entity';
import { AttendanceGateway } from '../attendance/attendance.gateway';

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

    @InjectRepository(EventStaff)
    private readonly eventStaffRepository: Repository<EventStaff>,

    @InjectRepository(ExhibitorRating)
    private readonly exhibitorRatingRepository: Repository<ExhibitorRating>,

    @InjectRepository(EventRegistrationShareLink)
    private readonly eventRegistrationShareLinkRepository: Repository<EventRegistrationShareLink>,

    @InjectRepository(EventAttendance)
    private readonly eventAttendanceRepository: Repository<EventAttendance>,

    private readonly engagementService: EngagementService,
    private readonly surveyUtils: SurveyUtils,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => EventStampService))
    private readonly eventStampService: EventStampService,
    @Optional() private readonly attendanceGateway?: AttendanceGateway,
  ) {}

  /**
   * For multi-event orders: attach this event's price, name, and discount-aware amounts
   * so UI can show per-event price and (when discount applied) this event's share of paid amount.
   * Loads order by orderId when not joined (we no longer join order on register event).
   */
  private async attachPaymentSummaryForEvent(checkoutData: any, registerEvent: RegisterEvent): Promise<any> {
    let order: Order | undefined = registerEvent.order;
    if (!order && registerEvent.orderId) {
      order = (await this.orderRepository.findOne({ where: { id: registerEvent.orderId } })) ?? undefined;
    }
    const eventPrice = registerEvent.event?.price != null ? Number(registerEvent.event.price) : null;
    const orderTotal = order?.price != null ? Number(order.price) : null;
    const orderOriginalTotal = order?.originalPrice != null ? Number(order.originalPrice) : orderTotal;
    const orderDiscount = order?.discount != null ? Number(order.discount) : 0;

    // When discount applied: this event's share of the final paid amount (proportional)
    let thisEventAmountPaid: number | null = eventPrice;
    if (
      eventPrice != null &&
      orderTotal != null &&
      orderOriginalTotal != null &&
      orderOriginalTotal > 0 &&
      orderDiscount > 0
    ) {
      thisEventAmountPaid = Math.round((eventPrice / orderOriginalTotal) * orderTotal * 100) / 100;
    }

    // Discount in percentage for UI to show "10% off"
    const orderDiscountPercent =
      orderOriginalTotal != null && orderOriginalTotal > 0 && orderDiscount > 0
        ? Math.round((orderDiscount / orderOriginalTotal) * 10000) / 100
        : null;

    const { totalAmount: _ta, discount: _d, cartItems: _ci, ...restCheckout } = checkoutData || {};
    return {
      ...restCheckout,
      orderNo: order?.orderNo ?? null,
      orderStatus: order?.status ?? null,
      thisEventPrice: eventPrice,
      thisEventName: registerEvent.event?.name ?? null,
      orderDiscountPercent,
      thisEventAmountPaid,
    };
  }

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
          const saved = await this.registerEventRepository.save(existingRegistration);
          if (eventId) this.attendanceGateway?.emitParticipantsUpdate(eventId);
          return saved;
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
      const saved = await this.registerEventRepository.save(registerEvent);
      if (eventId) this.attendanceGateway?.emitParticipantsUpdate(eventId);
      return saved;
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

  async findAll(userId: string, role: string, filters?: { filter?: string; userFilter?: string; eventFilter?: string; userId?: string; eventId?: string; startDate?: string; endDate?: string; page?: number; limit?: number; keyword?: string; search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
    try {
      // Check if pagination parameters are provided
      const hasPagination = filters?.page !== undefined || filters?.limit !== undefined;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const sortBy = filters?.sortBy || 'event.startDate';
      const sortOrder = filters?.sortOrder || (role === 'admin' ? 'DESC' : 'ASC');
      const skip = (page - 1) * limit;

      let queryBuilder;
      let totalCount = 0;
      let registerEvents: RegisterEvent[];

      if (role === 'admin') {
        // Admin can see all register events
        // Optimized: Only load basic details - event and registration details (order not joined; checkout has what we need)
        queryBuilder = this.registerEventRepository
          .createQueryBuilder('registerEvent')
          .leftJoinAndSelect('registerEvent.user', 'user')
          .leftJoinAndSelect('registerEvent.event', 'event')
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

        // Apply global search if provided
        const searchTerm = filters?.keyword || filters?.search;
        if (searchTerm && searchTerm.trim() !== '') {
          queryBuilder.andWhere(
            '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(event.name) LIKE LOWER(:search) OR LOWER(event.location) LIKE LOWER(:search))',
            { search: `%${searchTerm.trim()}%` }
          );
        }

        // Get total count before pagination
        totalCount = await queryBuilder.getCount();

        // Apply sorting at database level (will be re-applied in JavaScript after filtering if needed)
        // Map sortBy field names to actual database fields
        let orderByField = 'event.startDate'; // default
        if (sortBy === 'user.firstName' || sortBy === 'firstName' || sortBy === 'user') {
          orderByField = 'user.firstName';
        } else if (sortBy === 'user.lastName' || sortBy === 'lastName') {
          orderByField = 'user.lastName';
        } else if (sortBy === 'name' || sortBy === 'event.name') {
          orderByField = 'event.name';
        } else if (sortBy === 'startDate' || sortBy === 'event.startDate') {
          orderByField = 'event.startDate';
        } else if (sortBy === 'location' || sortBy === 'event.location') {
          orderByField = 'event.location';
        } else if (sortBy === 'type' || sortBy === 'registerEvent.type') {
          orderByField = 'registerEvent.type';
        } else if (sortBy === 'status' || sortBy === 'registerEvent.status') {
          orderByField = 'registerEvent.status';
        } else if (sortBy === 'createdAt' || sortBy === 'registerEvent.createdAt') {
          orderByField = 'registerEvent.createdAt';
        } else {
          // Default to startDate if unknown field
          orderByField = 'event.startDate';
        }
        
        queryBuilder.orderBy(orderByField, sortOrder);

        // Apply pagination only if pagination parameters are provided
        if (hasPagination) {
          queryBuilder.skip(skip).take(limit);
        }

        registerEvents = await queryBuilder.getMany();
      } else {
        // Normal user can only see their own registered events
        // Exclude past events - only show upcoming/active events
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
        queryBuilder = this.registerEventRepository
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
          .leftJoinAndSelect('exhibitor.boothBanners', 'boothBanners')
          .leftJoinAndSelect('event.programmeTracks', 'programmeTracks')
          .leftJoinAndSelect('programmeTracks.sessions', 'programmeSessions')
          .leftJoinAndSelect('programmeSessions.speakers', 'programmeSessionSpeakers')
          .leftJoinAndSelect('programmeSessionSpeakers.speakerProfile', 'programmeSessionSpeakerProfile')
          .leftJoinAndSelect('programmeSessionSpeakers.addresses', 'programmeSessionSpeakerAddresses')
          .leftJoinAndSelect('registerEvent.adminInfo', 'adminInfo')
          .leftJoinAndSelect('registerEvent.billingDetails', 'billingDetails')
          .where('user.id = :userId', { userId })
          .andWhere('registerEvent.isRegister = :isRegister', { isRegister: true })
          // Exclude past events - only show events where endDate is today or in the future
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

        // Apply global search if provided
        const searchTerm = filters?.keyword || filters?.search;
        if (searchTerm && searchTerm.trim() !== '') {
          queryBuilder.andWhere(
            '(LOWER(event.name) LIKE LOWER(:search) OR LOWER(event.location) LIKE LOWER(:search))',
            { search: `%${searchTerm.trim()}%` }
          );
        }

        // Get total count before pagination
        totalCount = await queryBuilder.getCount();

        // Apply sorting at database level (will be re-applied in JavaScript after filtering if needed)
        // Map sortBy field names to actual database fields
        let orderByField = 'event.startDate'; // default
        if (sortBy === 'user.firstName' || sortBy === 'firstName' || sortBy === 'user') {
          orderByField = 'user.firstName';
        } else if (sortBy === 'user.lastName' || sortBy === 'lastName') {
          orderByField = 'user.lastName';
        } else if (sortBy === 'name' || sortBy === 'event.name') {
          orderByField = 'event.name';
        } else if (sortBy === 'startDate' || sortBy === 'event.startDate') {
          orderByField = 'event.startDate';
        } else if (sortBy === 'location' || sortBy === 'event.location') {
          orderByField = 'event.location';
        } else if (sortBy === 'type' || sortBy === 'registerEvent.type') {
          orderByField = 'registerEvent.type';
        } else if (sortBy === 'status' || sortBy === 'registerEvent.status') {
          orderByField = 'registerEvent.status';
        } else if (sortBy === 'createdAt' || sortBy === 'registerEvent.createdAt') {
          orderByField = 'registerEvent.createdAt';
        } else {
          // Default to startDate if unknown field
          orderByField = 'event.startDate';
        }
        
        queryBuilder.orderBy(orderByField, sortOrder);

        // Apply pagination only if pagination parameters are provided
        if (hasPagination) {
          queryBuilder.skip(skip).take(limit);
        }

        registerEvents = await queryBuilder.getMany();
        
        // Additional filter to ensure past events are excluded (safety check)
        // Filter out events where endDate < today
        const todayForFilter = new Date();
        todayForFilter.setHours(0, 0, 0, 0);
        
        registerEvents = registerEvents.filter((registerEvent: RegisterEvent) => {
          if (!registerEvent.event?.endDate) return false;
          const eventEndDate = new Date(registerEvent.event.endDate);
          eventEndDate.setHours(0, 0, 0, 0);
          // Only include events where endDate >= today
          return eventEndDate >= todayForFilter;
        });
      }

      // Add attendance count and favorite status to each registered event
      const registerEventsWithAttendance = await Promise.all(
        registerEvents.map(async (registerEvent: RegisterEvent) => {
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

            // Fetch checkout data if order exists (use orderId; we no longer join order)
            let checkoutData = null;
            if (registerEvent.orderId) {
              try {
                checkoutData = await CheckoutUtils.getCheckoutByOrderId(
                  registerEvent.orderId,
                  this.orderRepository,
                  this.checkoutRepository,
                  this.checkoutCartItemRepository
                );
              } catch (error) {
                // If checkout not found, continue without checkout data
                console.log('Checkout data not found for order:', registerEvent.orderId);
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
              adminInfo: registerEvent.adminInfo || null,
              checkout: checkoutData ? await this.attachPaymentSummaryForEvent(checkoutData, registerEvent) : null,
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
                (doc: string, index: number) => ({
                  name:
                    registerEvent.event?.documentNames?.[index] ||
                    `Document ${index + 1}`,
                  document: doc,
                }),
              );
            } else if (registerEvent?.event?.documents) {
              // Fallback if no names are provided
              formattedDocuments = registerEvent.event.documents.map(
                (doc: string, index: number) => ({
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
            const categories = registerEvent.event?.category?.map((ec: any) => ec.category) || [];
            const formattedProgrammeTracks = registerEvent.event?.programmeTracks 
              ? UserUtils.formatProgrammeTracks(registerEvent.event.programmeTracks)
              : [];

            // Get engagements for this event with Q&A and polling data
            const engagements = registerEvent.eventId 
              ? await this.engagementService.getEngagementsByEvent(registerEvent.eventId) 
              : [];

            // Get event stamps from new structure
            const eventStamps = registerEvent.eventId 
              ? await this.eventStampService.getStampsByEventId(registerEvent.eventId)
              : [];

            // Get user-specific stamp visits for this user
            const { UserStampVisit } = await import('../event/user-stamp-visit.entity');
            const userStampVisitRepository = this.registerEventRepository.manager.getRepository(UserStampVisit);
            
            const userStampVisits = await userStampVisitRepository.find({
              where: {
                userId: userId,
                isVisited: true,
              },
            });

            // Create a map of stampId -> isVisited for quick lookup
            const stampVisitMap = new Map(
              userStampVisits.map(visit => [visit.stampId, visit.isVisited])
            );

            const {
              eventSpeakers,
              category,
              eventExhibitors,
              exhibitorDescription,
              documents,
              documentNames,
              programmeTracks,
              eventStampDescription,
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
                description: eventStampDescription || '',
                stamps: eventStamps.map(stamp => ({
                  id: stamp.id,
                  boothNumber: stamp.name, // name field contains booth number
                  exhibitorId: stamp.exhibitorId || null,
                  image: stamp.image,
                  isVisited: stampVisitMap.get(stamp.id) || false, // Check user-specific visit status
                })),
              },
              exhibitorsData: {
                exhibitorDescription: exhibitorDescription || '',
                exhibitors: await Promise.all(
                  (registerEvent.event?.eventExhibitors
                    ?.filter((ee: any) => ee.exhibitor?.isActive) || [])
                    .map(async (ee: any) => {
                      const exhibitorId = ee.exhibitorId || ee.exhibitor?.id;
                      const exhibitorData = {
                        ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
                      };

                      // Get Event Staff for this exhibitor - show to all users
                      (exhibitorData as any).eventStaff = registerEvent.eventId
                        ? await ExhibitorUtils.getEventStaffForExhibitor(
                            this.eventStaffRepository,
                            registerEvent.eventId,
                            exhibitorId,
                          )
                        : [];

                      // Get average rating for this exhibitor in this event
                      (exhibitorData as any).rating = await ExhibitorUtils.getExhibitorRating(
                        this.exhibitorRatingRepository,
                        exhibitorId,
                        registerEvent.eventId || '',
                      );

                      return exhibitorData;
                    })
                ),
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

            // Fetch checkout data if order exists (use orderId; we no longer join order)
            let checkoutData = null;
            if (registerEvent.orderId) {
              try {
                checkoutData = await CheckoutUtils.getCheckoutByOrderId(
                  registerEvent.orderId,
                  this.orderRepository,
                  this.checkoutRepository,
                  this.checkoutCartItemRepository
                );
              } catch (error) {
                // If checkout not found, continue without checkout data
                console.log('Checkout data not found for order:', registerEvent.orderId);
              }
            }

            return {
              ...cleanRegisterEvent,
              event,
              user: cleanedUser,
              isCreatedByAdmin: registerEvent.isCreatedByAdmin,
              adminInfo: registerEvent.adminInfo || null,
              checkout: checkoutData ? await this.attachPaymentSummaryForEvent(checkoutData, registerEvent) : null,
            };
          }
        }),
      );

      // Always apply JavaScript sorting to ensure correct order (especially after filtering for regular users)
      // This ensures the sortBy and sortOrder parameters from frontend are properly respected
      registerEventsWithAttendance.sort((a: any, b: any) => {
        // Map sortBy to actual field values
        const getFieldValue = (item: any, field: string) => {
          if (field === 'user.firstName' || field === 'firstName' || field === 'user') {
            return (item.user?.firstName || '').toLowerCase();
          } else if (field === 'user.lastName' || field === 'lastName') {
            return (item.user?.lastName || '').toLowerCase();
          } else if (field === 'name' || field === 'event.name') {
            return item.event?.name || '';
          } else if (field === 'startDate' || field === 'event.startDate') {
            return item.event?.startDate || '';
          } else if (field === 'location' || field === 'event.location') {
            return item.event?.location || '';
          } else if (field === 'type' || field === 'registerEvent.type') {
            return item.type || '';
          } else if (field === 'status' || field === 'registerEvent.status') {
            return item.status || '';
          } else if (field === 'createdAt' || field === 'registerEvent.createdAt') {
            return item.createdAt || '';
          }
          return item.event?.startDate || '';
        };

        const fieldA = getFieldValue(a, sortBy);
        const fieldB = getFieldValue(b, sortBy);

        // Handle date fields (startDate, createdAt)
        if (sortBy === 'startDate' || sortBy === 'event.startDate' || sortBy === 'createdAt' || sortBy === 'registerEvent.createdAt') {
          const dateA = fieldA ? new Date(fieldA) : new Date(0);
          const dateB = fieldB ? new Date(fieldB) : new Date(0);
          dateA.setHours(0, 0, 0, 0);
          dateB.setHours(0, 0, 0, 0);
          
          // ASC: earliest first (1 Jan, 2 Jan) | DESC: latest first (2 Jan, 1 Jan)
          if (sortOrder === 'ASC') {
            return dateA.getTime() - dateB.getTime(); // Positive if A > B (A comes after B)
          } else {
            return dateB.getTime() - dateA.getTime(); // Positive if B > A (B comes after A)
          }
        }

        // Handle string fields (case-insensitive for user names)
        const strA = String(fieldA || '').toLowerCase();
        const strB = String(fieldB || '').toLowerCase();
        
        if (sortOrder === 'ASC') {
          return strA.localeCompare(strB);
        } else {
          return strB.localeCompare(strA);
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

      // Build pagination metadata
      let pagination;
      if (hasPagination) {
        const totalPages = Math.ceil(totalCount / limit);
        pagination = {
          page: page,
          limit: limit,
          total: totalCount,
          totalPages: totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        };
      } else {
        // No pagination - return all data
        pagination = {
          page: 1,
          limit: registerEventsWithAttendance.length,
          total: totalCount,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
      
      const metadata = {
        total: totalCount,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        message:
          role === 'admin'
            ? 'All registered events fetched for admin'
            : 'Your registered events fetched successfully',
        count: registerEventsWithAttendance.length,
        data: registerEventsWithAttendance,
        pagination: pagination,
        metadata: metadata,
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
          'event.eventExhibitors.exhibitor.boothBanners',
          'event.programmeTracks',
          'event.programmeTracks.sessions',
          'event.programmeTracks.sessions.speakers',
          'event.programmeTracks.sessions.speakers.speakerProfile',
          'event.programmeTracks.sessions.speakers.addresses',
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
            };
          }) || [];

      // Format programme tracks with basic speaker info using utility
      const formattedProgrammeTracks = UserUtils.formatProgrammeTracks(registerEvent.event?.programmeTracks || []);

      // Get engagements for this event with Q&A and polling data
      const engagements = registerEvent.eventId 
        ? await this.engagementService.getEngagementsByEvent(registerEvent.eventId) 
        : [];

      // Get event stamps from new structure
      const eventStamps = registerEvent.eventId 
        ? await this.eventStampService.getStampsByEventId(registerEvent.eventId)
        : [];

      // Get user-specific stamp visits for this user (only for stamps in this event)
      const { UserStampVisit } = await import('../event/user-stamp-visit.entity');
      const userStampVisitRepository = this.registerEventRepository.manager.getRepository(UserStampVisit);
      
      // Optimize: Only query visits for stamps that belong to this event
      const eventStampIds = eventStamps.map(stamp => stamp.id);
      const userStampVisits = eventStampIds.length > 0
        ? await userStampVisitRepository.find({
            where: {
              userId: userId,
              stampId: eventStampIds.length === 1 ? eventStampIds[0] : In(eventStampIds),
            },
          })
        : [];

      // Create a map of stampId -> isVisited for quick lookup
      // Include all records (both true and false) to properly track visit status
      const stampVisitMap = new Map(
        userStampVisits.map(visit => [visit.stampId, visit.isVisited])
      );

      // Clean up event object
      const {
        eventSpeakers,
        category,
        eventExhibitors,
        exhibitorDescription,
        documents, // Remove original documents
        documentNames, // Remove original documentNames
        programmeTracks,
        eventStampDescription,
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
          description: eventStampDescription || '',
          stamps: eventStamps.map(stamp => ({
            id: stamp.id,
            name: stamp.name,
            boothNumber: stamp.name, // name field contains booth number
            exhibitorId: stamp.exhibitorId || null,
            image: stamp.image,
            isVisited: stampVisitMap.get(stamp.id) || false, // Check user-specific visit status
          })),
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

      // Exclude unnecessary fields (order not needed – use checkout.orderNo etc. instead)
      const {
        orderId: _,
        eventId: __,
        isRegister: ___,
        order: _order,
        ...cleanRegisterEvent
      } = registerEvent;

      // Get admin info for this registration - always show if it exists
      const adminInfo = registerEvent.adminInfo
        ? {
            ...registerEvent.adminInfo,
          }
        : null;

      // Fetch checkout data if order exists (use orderId; we no longer join order)
      let checkoutData = null;
      if (registerEvent.orderId) {
        try {
          checkoutData = await CheckoutUtils.getCheckoutByOrderId(
            registerEvent.orderId,
            this.orderRepository,
            this.checkoutRepository,
            this.checkoutCartItemRepository
          );
        } catch (error) {
          // If checkout not found, continue without checkout data
          console.log('Checkout data not found for order:', registerEvent.orderId);
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
          adminInfo,
          checkout: checkoutData ? await this.attachPaymentSummaryForEvent(checkoutData, registerEvent) : null,
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
    keyword?: string,
  ): Promise<PublicParticipantDto[]> {
    try {
      const queryBuilder = this.registerEventRepository
        .createQueryBuilder('registerEvent')
        .leftJoinAndSelect('registerEvent.user', 'user')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('registerEvent.isRegister = :isRegister', {
          isRegister: true,
        });

      if (keyword) {
        const normalizedSearch = `%${keyword.toLowerCase()}%`;
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

      // Prepare receipt data (orderNo from checkout; totalAmount/discount may be omitted from checkout payload – use thisEventAmountPaid if needed)
      const totalAmount = checkout.totalAmount != null ? parseFloat(checkout.totalAmount.toString()) : (checkout.thisEventAmountPaid != null ? Number(checkout.thisEventAmountPaid) : 0);
      const discount = checkout.discount != null ? parseFloat(checkout.discount.toString()) : undefined;

      // GST breakdown for receipt: event price (base), GST amount, gstRate
      const eventPriceBase = event?.price != null ? Number(event.price) : 0;
      const gstRate = event?.gstRate != null ? Number(event.gstRate) : 18;
      const gstPrice = Math.round(eventPriceBase * (gstRate / 100) * 100) / 100;
      const subtotalBeforeDiscount = Math.round((eventPriceBase + gstPrice) * 100) / 100;

      return {
        checkoutId: checkout.checkoutId,
        transactionId: checkout.transactionId,
        totalAmount,
        discount,
        eventPrice: eventPriceBase,
        gstPrice,
        gstRate,
        subtotalBeforeDiscount,
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
        orderNo: checkout?.orderNo || undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Get receipt data');
    }
  }

  /**
   * Generate or retrieve share link for event registration list (admin).
   * Returns dynamic URL for public page that shows name, email, basic details only.
   */
  async generateRegistrationShareLink(eventId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      shareUrl: string;
      shareToken: string;
      eventId: string;
      expiresAt?: Date;
      createdAt: Date;
    };
  }> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ResourceNotFoundException('Event', eventId);
    }

    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
    const sharePath = '/events/registrations/share';

    let shareLink = await this.eventRegistrationShareLinkRepository.findOne({
      where: { eventId, isActive: true },
    });

    if (shareLink) {
      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        shareLink.isActive = false;
        await this.eventRegistrationShareLinkRepository.save(shareLink);
        shareLink = null;
      } else {
        const shareUrl = `${baseUrl}${sharePath}/${shareLink.shareToken}`;
        return {
          success: true,
          message: 'Share link retrieved successfully',
          data: {
            shareUrl,
            shareToken: shareLink.shareToken,
            eventId: shareLink.eventId,
            expiresAt: shareLink.expiresAt ?? undefined,
            createdAt: shareLink.createdAt,
          },
        };
      }
    }

    const shareToken = crypto.randomBytes(16).toString('hex');
    const newLink = this.eventRegistrationShareLinkRepository.create({
      eventId,
      shareToken,
      isActive: true,
    });
    const saved = await this.eventRegistrationShareLinkRepository.save(newLink);
    const shareUrl = `${baseUrl}${sharePath}/${saved.shareToken}`;

    return {
      success: true,
      message: 'Share link generated successfully',
      data: {
        shareUrl,
        shareToken: saved.shareToken,
        eventId: saved.eventId,
        expiresAt: saved.expiresAt ?? undefined,
        createdAt: saved.createdAt,
      },
    };
  }

  /**
   * Get participants by share token (public). Returns basic details plus attendance status.
   */
  async getParticipantsByShareToken(shareToken: string): Promise<{
    eventId: string;
    eventName: string;
    participants: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      type: string;
      attendanceStatus: 'Attended' | 'Not Attended';
      checkInTime?: string;
    }>;
  }> {
    const shareLink = await this.eventRegistrationShareLinkRepository.findOne({
      where: { shareToken, isActive: true },
    });
    if (!shareLink) {
      throw new ResourceNotFoundException('Share link', shareToken);
    }
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new ValidationException('This share link has expired');
    }

    const event = await this.eventRepository.findOne({
      where: { id: shareLink.eventId },
    });
    if (!event) {
      throw new ResourceNotFoundException('Event', shareLink.eventId);
    }

    const registrations = await this.registerEventRepository.find({
      where: { eventId: shareLink.eventId, isRegister: true },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    const attendanceRecords = await this.eventAttendanceRepository.find({
      where: { eventId: shareLink.eventId },
    });
    const attendanceByUserId = new Map<string, { status: AttendanceStatus; checkInTime?: Date }>();
    attendanceRecords.forEach((a) => {
      attendanceByUserId.set(a.userId, {
        status: a.status,
        checkInTime: a.checkInTime,
      });
    });

    const participants = registrations
      .filter((r) => r.user)
      .map((r) => {
        const att = r.userId ? attendanceByUserId.get(r.userId) : undefined;
        const hasAttended =
          att &&
          (att.status === AttendanceStatus.CheckedIn || att.status === AttendanceStatus.CheckedOut);
        const attendanceStatus: 'Attended' | 'Not Attended' = hasAttended ? 'Attended' : 'Not Attended';
        return {
          id: r.user!.id ?? r.userId ?? '',
          firstName: r.user!.firstName ?? '',
          lastName: r.user!.lastName ?? '',
          email: r.user!.email ?? '',
          type: r.type ?? 'Attendee',
          attendanceStatus,
          checkInTime: att?.checkInTime
            ? att.checkInTime.toISOString()
            : undefined,
        };
      });

    return {
      eventId: shareLink.eventId,
      eventName: event.name ?? '',
      participants,
    };
  }
}
