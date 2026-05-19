// src/services/event.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ExhibitorService } from '../exhibitor/exhibitor.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventDto, EventType } from './event.dto';
import { Event, EventExhibitor } from './event.entity';
import { EventBooth } from './event-booth.entity';
import { EventStaff } from './event-staff.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { Between, Not, In } from 'typeorm';
import { UserEntity, UserRole } from '../user/users.entity';
import { EventSpeaker, EventCategory } from './event-speaker.entity';
import { Category } from 'category/category.entity';
import path from 'path';
import * as fs from 'fs';
import { getEventColor } from 'utils/event-color.util';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { AdminInfo } from 'registerEvent/admin-info.entity';
import { BillingDetail } from 'registerEvent/billing-detail.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { Survey } from '../survey/survey.entity';
import { Engagement } from '../engagement/engagement.entity';
import { Gallery } from '../gallery/gallery.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { removeSpeakersFromAssociations } from '../utils/speaker-with-associate-link.utils';
import { Cart } from '../cart/cart.entity';
import { OrderItemEntity } from '../order/event.item.entity';
import { EventAttendance } from '../attendance/attendance.entity';
import { Feedback } from '../feedback/feedback.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
  ForeignKeyConstraintException,
} from '../utils/exceptions/custom-exceptions';
import { SurveyUtils } from '../utils/survey-utils';
import { UserUtils } from '../utils/user.utils';
import { EventSpeakerUtils } from '../utils/event-speaker.utils';
import { ExhibitorUtils } from '../utils/exhibitor.utils';
import { EmailService } from '../service/email.service';
import { EmailUtils } from '../utils/email.utils';
import { EventValidationUtils } from '../utils/validateEvents';
import {
  EventQueryBuilderUtils,
  GlobalSearchUtils,
} from '../utils/searchEvent';
import { toDisplayPrice } from '../utils/price.util';
import { QnaUtils } from '../utils/qna.utils';
import { FilterService } from '../service/filter.service';
import { ExhibitorRating } from '../exhibitor/exhibitor-rating.entity';
import { ExhibitorView } from '../exhibitor/exhibitor-view.entity';
import { ExhibitorLead } from '../exhibitor/exhibitor-lead.entity';
import { EventStampService } from './event-stamp.service';
import { EventStampEvent } from './event-stamp-event.entity';
import { SurveyQuestion, SurveyAnswer } from '../survey/qa.entity';
import { Withdrawal } from '../cart/withdrawal.entity';
import { ModeratorEvent } from '../moderator/moderator-event.entity';
import { QnaQuestion, QnaLike } from '../qna/qna.entity';
import { Poll, PollOption, PollVote, UserPollSession, UserPollVote } from '../polling/polling.entity';
import { ScheduledPushNotification } from '../scheduled-push-notification/scheduled-push-notification.entity';
import { EventQRCode } from '../attendance/event-qr-code.entity';
import { ContactExchange } from '../attendance/contact-exchange.entity';
import { Coupon } from '../coupon/coupon.entity';
import { EventNotification } from '../settings/event-notification.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventSpeaker)
    private eventSpeakerRepository: Repository<EventSpeaker>,
    @InjectRepository(EventCategory)
    private eventCategoryRepository: Repository<EventCategory>,
    @InjectRepository(EventExhibitor)
    private eventExhibitorRepository: Repository<EventExhibitor>,
    @InjectRepository(EventBooth)
    private eventBoothRepository: Repository<EventBooth>,
    @InjectRepository(EventStaff)
    private eventStaffRepository: Repository<EventStaff>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(AdminInfo)
    private adminInfoRepository: Repository<AdminInfo>,
    @InjectRepository(BillingDetail)
    private billingDetailRepository: Repository<BillingDetail>,
    @InjectRepository(FavoriteEvent)
    private favoriteEventRepository: Repository<FavoriteEvent>,
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(EventAgenda)
    private eventAgendaRepository: Repository<EventAgenda>,
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    @InjectRepository(Gallery)
    private galleryRepository: Repository<Gallery>,
    @InjectRepository(ProgrammeSession)
    private programmeSessionRepository: Repository<ProgrammeSession>,
    @InjectRepository(ProgrammeTrack)
    private programmeTrackRepository: Repository<ProgrammeTrack>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(OrderItemEntity)
    private orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(EventAttendance)
    private attendanceRepository: Repository<EventAttendance>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(EventNotification)
    private eventNotificationRepository: Repository<EventNotification>,
    @InjectRepository(ExhibitorRating)
    private exhibitorRatingRepository: Repository<ExhibitorRating>,
    @InjectRepository(ExhibitorView)
    private exhibitorViewRepository: Repository<ExhibitorView>,
    @InjectRepository(ExhibitorLead)
    private exhibitorLeadRepository: Repository<ExhibitorLead>,
    @InjectRepository(EventStampEvent)
    private eventStampEventRepository: Repository<EventStampEvent>,
    @InjectRepository(SurveyQuestion)
    private surveyQuestionRepository: Repository<SurveyQuestion>,
    @InjectRepository(SurveyAnswer)
    private surveyAnswerRepository: Repository<SurveyAnswer>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(ModeratorEvent)
    private moderatorEventRepository: Repository<ModeratorEvent>,
    @InjectRepository(QnaQuestion)
    private qnaQuestionRepository: Repository<QnaQuestion>,
    @InjectRepository(QnaLike)
    private qnaLikeRepository: Repository<QnaLike>,
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private pollOptionRepository: Repository<PollOption>,
    @InjectRepository(PollVote)
    private pollVoteRepository: Repository<PollVote>,
    @InjectRepository(UserPollSession)
    private userPollSessionRepository: Repository<UserPollSession>,
    @InjectRepository(UserPollVote)
    private userPollVoteRepository: Repository<UserPollVote>,
    @InjectRepository(ScheduledPushNotification)
    private scheduledPushNotificationRepository: Repository<ScheduledPushNotification>,
    @InjectRepository(EventQRCode)
    private eventQRCodeRepository: Repository<EventQRCode>,
    @InjectRepository(ContactExchange)
    private contactExchangeRepository: Repository<ContactExchange>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private readonly errorHandler: ErrorHandlerService,
    private readonly surveyUtils: SurveyUtils,
    private readonly emailService: EmailService,
    private readonly qnaUtils: QnaUtils,
    private readonly filterService: FilterService,
    private readonly eventStampService: EventStampService,
    @Inject(forwardRef(() => ExhibitorService))
    private readonly exhibitorService: ExhibitorService,
  ) {}

  async createEvent(eventDto: EventDto) {
    try {
      // Normalize optional date fields so Postgres date columns never receive empty strings.
      this.normalizeOptionalDateFields(eventDto);

      // Check if event name already exists
      const existingEvent = await this.eventRepository.findOne({
        where: { name: eventDto.name },
      });
      if (existingEvent) {
        throw new DuplicateResourceException(`Event ${eventDto.name}`);
      }

      // Validate all IDs before creating the event
      await this.validateEventReferences(eventDto);

      // Validate event dates
      this.validateEventDates(eventDto);

      if (eventDto.location) {
        const conflictingEvents = await this.eventRepository.find({
          where: {
            location: eventDto.location,
            startDate: Between(
              new Date(eventDto.startDate),
              new Date(eventDto.endDate),
            ),
            endDate: Between(
              new Date(eventDto.startDate),
              new Date(eventDto.endDate),
            ),
          },
        });
        if (conflictingEvents.length > 0) {
          throw new ValidationException(
            'Another event is already scheduled at this location during these dates and times',
          );
        }
      }

      // Validate coordinates
      this.validateCoordinates(eventDto);

      // Set default currency if not provided
      if (!eventDto.currency) {
        eventDto.currency = 'SGD';
      }

      // Create and save the event
      const event = await this.eventRepository.create(eventDto);
      const savedEvent = await this.eventRepository.save(event);

      // Create category associations if categoryIds are provided
      if (eventDto.categoryIds) {
        const categoryIdsArray = eventDto.categoryIds.split(',');
        await Promise.all(
          categoryIdsArray.map(async (categoryId) => {
            const eventCategory = new EventCategory();
            eventCategory.eventId = savedEvent.id;
            eventCategory.categoryId = categoryId.trim();
            await this.eventCategoryRepository.save(eventCategory);
          }),
        );
      }

      // Create speaker associations if speakerIds are provided
      if (eventDto.speakerIds) {
        const speakerIdsArray = eventDto.speakerIds.split(',');

        await Promise.all(
          speakerIdsArray.map(async (speakerId) => {
            const eventSpeaker = new EventSpeaker();
            eventSpeaker.eventId = savedEvent.id;
            eventSpeaker.speakerId = speakerId.trim();
            
            await this.eventSpeakerRepository.save(eventSpeaker);
          }),
        );
      }

      // Create exhibitor associations if exhibitorIds are provided
      if (eventDto.exhibitorIds) {
        const exhibitorIdsArray = eventDto.exhibitorIds.split(',');
        await Promise.all(
          exhibitorIdsArray.map(async (exhibitorId) => {
            // Get exhibitor details for email
            const exhibitor = await this.exhibitorRepository.findOne({
              where: { id: exhibitorId.trim() },
            });

            // Check if EventExhibitor already exists
            let eventExhibitor = await this.eventExhibitorRepository.findOne({
              where: {
                eventId: savedEvent.id,
                exhibitorId: exhibitorId.trim(),
              },
            });

            if (!eventExhibitor) {
              // Create EventExhibitor record
              eventExhibitor = new EventExhibitor();
              eventExhibitor.eventId = savedEvent.id;
              eventExhibitor.exhibitorId = exhibitorId.trim();
              await this.eventExhibitorRepository.save(eventExhibitor);
            }

            // Check if EventBooth already exists (to avoid duplicate code generation)
            let eventBooth = await this.eventBoothRepository.findOne({
              where: {
                eventId: savedEvent.id,
                exhibitorId: exhibitorId.trim(),
              },
            });

            if (!eventBooth) {
              // Create EventBooth record with unique code
              eventBooth = new EventBooth();
              eventBooth.eventId = savedEvent.id;
              eventBooth.exhibitorId = exhibitorId.trim();
              eventBooth.uniqueCode = this.generateUniqueCode();
              await this.eventBoothRepository.save(eventBooth);

              // Send email to exhibitor if email exists (only for new booth codes)
              if (exhibitor && exhibitor.email) {
                await this.sendBoothCodeEmail(
                  exhibitor.email,
                  eventBooth.uniqueCode,
                  savedEvent.name,
                  this.formatDateForEmail(savedEvent.startDate),
                  savedEvent.venue || savedEvent.location || 'To be announced',
                );
              }
            }
          }),
        );
      }

      // Handle event stamps - create new stamps and associate existing ones
      const allStampIds: string[] = [];
      
      // Create new stamps if provided
      if (eventDto.newStamps && eventDto.newStamps.length > 0) {
        const newStamps = await this.eventStampService.createMultiple(eventDto.newStamps);
        allStampIds.push(...newStamps.map(stamp => stamp.id));
      }
      
      // Add existing stamp IDs
      if (eventDto.eventStampIds && eventDto.eventStampIds.length > 0) {
        allStampIds.push(...eventDto.eventStampIds);
      }
      
      // Associate stamps to event
      if (allStampIds.length > 0) {
        await this.eventStampService.associateStampsToEvent(savedEvent.id, allStampIds);
      }

      // Auto-create stamps for exhibitors (with logo and name)
      if (eventDto.exhibitorIds) {
        await this.exhibitorService.autoCreateStampsForEventExhibitors(savedEvent.id);
      }

      return this.normalizeEventPrices(savedEvent);
    } catch (error) {
  
      if (
        error instanceof DuplicateResourceException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Public event list: id and name only. No auth required. Excludes private events.
   */
  async getPublicEventList(): Promise<{ id: string; name: string }[]> {
    return this.eventRepository
      .createQueryBuilder('event')
      .select(['event.id', 'event.name'])
      .where('(event.isPrivate = :isPrivate OR event.isPrivate IS NULL)', { isPrivate: false })
      .orderBy('event.name', 'ASC')
      .getMany();
  }

  /**
   * Public event list for mobile: essential fields for listing cards. No auth required.
   */
  async getPublicEventListForMobile(filters: {
    upcoming?: boolean;
    limit?: number;
    page?: number;
  }): Promise<{
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    images: string[] | null;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    venue: string | null;
    location: string | null;
    price: number | null;
    earlyBirdPrice: number | null;
    earlyBirdEndDate: Date | null;
    currency: string;
    attendanceCount: number;
  }[]> {
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .select([
        'event.id',
        'event.name',
        'event.description',
        'event.images',
        'event.startDate',
        'event.endDate',
        'event.startTime',
        'event.endTime',
        'event.venue',
        'event.location',
        'event.price',
        'event.earlyBirdPrice',
        'event.earlyBirdEndDate',
        'event.currency',
      ])
      .orderBy('event.startDate', 'ASC');

    if (filters.upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      qb.andWhere('event.startDate >= :today', { today });
    }

    // Exclude private events from public list (only show in "Registered events" if already registered)
    qb.andWhere('(event.isPrivate = :isPrivate OR event.isPrivate IS NULL)', { isPrivate: false });

    const limit = Math.min(filters.limit ?? 50, 100);
    const page = Math.max(1, filters.page ?? 1);
    qb.take(limit).skip((page - 1) * limit);

    const events = await qb.getMany();
    const result = [];

    for (const event of events) {
      const attendanceCount = await this.getEventAttendanceCount(event.id);
      const imgList = event.images && Array.isArray(event.images) ? event.images : [];
      const image = imgList.length > 0 ? imgList[0] : null;
      result.push({
        id: event.id,
        name: event.name,
        description: event.description ?? null,
        image,
        images: event.images ?? null,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue ?? null,
        location: event.location ?? null,
        price: event.price != null ? Number(event.price) : null,
        earlyBirdPrice: event.earlyBirdPrice != null ? Number(event.earlyBirdPrice) : null,
        earlyBirdEndDate: event.earlyBirdEndDate ?? null,
        currency: event.currency ?? 'SGD',
        attendanceCount,
      });
    }
    return result;
  }

  async getAllEvents(
    filters: {
      keyword?: string;
      globalSearch?: string;
      startDate?: string;
      endDate?: string;
      publishStartDate?: string; // Publish start date filter
      publishEndDate?: string; // Publish end date filter
      type?: EventType;
      upcoming?: boolean;
      category?: string;
      eventName?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    userId?: string,
    userRole?: string,
  ) {
    try {
      // Check if pagination parameters are provided
      const hasPagination = filters?.page !== undefined || filters?.limit !== undefined;
      const pageRaw = Number(filters?.page);
      const limitRaw = Number(filters?.limit);
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 10;
      const sortBy = filters?.sortBy || 'startDate';
      const sortOrder = filters?.sortOrder || 'DESC';

      if (filters.type) {
        const validTypes = Object.values(EventType);
        if (!validTypes.includes(filters.type)) {
          throw new ValidationException(
            `Invalid event type. Valid types are: ${validTypes.join(', ')}`,
          );
        }
      }

      const queryBuilder = this.eventRepository.createQueryBuilder('event');

      // Use the utility for consistent query building
      EventQueryBuilderUtils.buildBaseQuery(queryBuilder);

      if (filters.category) {
        const today = new Date();
        queryBuilder.andWhere('event.startDate >= :today', { today });
      }

      // Track if WHERE clause has been set
      let whereClauseSet = false;

      // If globalSearch is provided, get all events for comprehensive search
      // If keyword is provided, use basic event field search
      if (filters.globalSearch) {
        // For global search, we'll get all events and then filter by comprehensive search
        // No WHERE clause needed here - we'll filter after getting all events
      } else if (filters.keyword) {
        // Use basic event field search for keyword
        const keyword = filters.keyword.toLowerCase();
        queryBuilder.where(
          'LOWER(event.name) LIKE :keyword OR LOWER(event.venue) LIKE :keyword OR LOWER(event.location) LIKE :keyword OR LOWER(event.country) LIKE :keyword OR LOWER(CAST(event.price AS TEXT)) LIKE :keyword',
          { keyword: `%${keyword}%` },
        );
        whereClauseSet = true;
      }

      // Filter by date range - handle startDate and endDate separately
      if (filters.startDate) {
        if (whereClauseSet) {
          queryBuilder.andWhere('DATE(event.startDate) >= :startDate', { startDate: filters.startDate });
        } else {
          queryBuilder.where('DATE(event.startDate) >= :startDate', { startDate: filters.startDate });
          whereClauseSet = true;
        }
      }
      if (filters.endDate) {
        if (whereClauseSet) {
          queryBuilder.andWhere('DATE(event.startDate) <= :endDate', { endDate: filters.endDate });
        } else {
          queryBuilder.where('DATE(event.startDate) <= :endDate', { endDate: filters.endDate });
          whereClauseSet = true;
        }
      }

      if (filters.type) {
        if (whereClauseSet) {
          queryBuilder.andWhere('event.type = :type', { type: filters.type });
        } else {
          queryBuilder.where('event.type = :type', { type: filters.type });
          whereClauseSet = true;
        }
      }

      // Filter by publish date range
      if (filters.publishStartDate) {
        if (whereClauseSet) {
          queryBuilder.andWhere('DATE(event.publishStartDate) >= :publishStartDate', { 
            publishStartDate: filters.publishStartDate 
          });
        } else {
          queryBuilder.where('DATE(event.publishStartDate) >= :publishStartDate', { 
            publishStartDate: filters.publishStartDate 
          });
          whereClauseSet = true;
        }
      }
      if (filters.publishEndDate) {
        if (whereClauseSet) {
          queryBuilder.andWhere('DATE(event.publishEndDate) <= :publishEndDate', { 
            publishEndDate: filters.publishEndDate 
          });
        } else {
          queryBuilder.where('DATE(event.publishEndDate) <= :publishEndDate', { 
            publishEndDate: filters.publishEndDate 
          });
          whereClauseSet = true;
        }
      }

      if (filters.category) {
        const categoryName = filters.category.toLowerCase();
        if (whereClauseSet) {
          queryBuilder.andWhere('LOWER(category.name) LIKE :categoryName', {
            categoryName: `%${categoryName}%`,
          });
        } else {
          queryBuilder.where('LOWER(category.name) LIKE :categoryName', {
            categoryName: `%${categoryName}%`,
          });
          whereClauseSet = true;
        }
      }

      if (filters.upcoming) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (whereClauseSet) {
          queryBuilder.andWhere('event.startDate >= :today', { today });
        } else {
          queryBuilder.where('event.startDate >= :today', { today });
          whereClauseSet = true;
        }
      }

      // Exclude private events for non-admin (featured/upcoming lists). Private events only show under "Registered events" if already registered.
      if (userRole !== UserRole.Admin) {
        if (whereClauseSet) {
          queryBuilder.andWhere('(event.isPrivate = :isPrivate OR event.isPrivate IS NULL)', { isPrivate: false });
        } else {
          queryBuilder.where('(event.isPrivate = :isPrivate OR event.isPrivate IS NULL)', { isPrivate: false });
          whereClauseSet = true;
        }
      }

      if (filters.eventName) {
        // Trim eventName to handle leading/trailing spaces
        // If empty after trimming, skip the filter
        const trimmedEventName = filters.eventName.trim();
        if (trimmedEventName.length > 0) {
          // Exact name match for dropdown filter
          // Use TRIM on both sides to handle cases where database has "Conference " but search is "Conference"
          // This ensures "Conference " in DB matches "Conference" in search
          if (whereClauseSet) {
            queryBuilder.andWhere('TRIM(event.name) = TRIM(:eventName)', {
              eventName: trimmedEventName,
            });
          } else {
            queryBuilder.where('TRIM(event.name) = TRIM(:eventName)', {
              eventName: trimmedEventName,
            });
            whereClauseSet = true;
          }
        }
      }

      // Apply sorting in query builder BEFORE getting results (only if not globalSearch)
      if (!filters.globalSearch) {
        // Map sortBy field names to actual database fields
        let orderByField = 'event.startDate'; // default
        if (sortBy === 'name' || sortBy === 'event.name') {
          orderByField = 'event.name';
        } else if (sortBy === 'startDate' || sortBy === 'event.startDate') {
          orderByField = 'event.startDate';
        } else if (sortBy === 'endDate' || sortBy === 'event.endDate') {
          orderByField = 'event.endDate';
        } else if (sortBy === 'publishStartDate' || sortBy === 'event.publishStartDate') {
          orderByField = 'event.publishStartDate';
        } else if (sortBy === 'publishEndDate' || sortBy === 'event.publishEndDate') {
          orderByField = 'event.publishEndDate';
        } else if (sortBy === 'location' || sortBy === 'event.location') {
          orderByField = 'event.location';
        } else if (sortBy === 'type' || sortBy === 'event.type') {
          orderByField = 'event.type';
        } else if (sortBy === 'price' || sortBy === 'event.price') {
          orderByField = 'event.price';
        } else if (sortBy === 'createdAt' || sortBy === 'event.createdAt') {
          orderByField = 'event.createdAt';
        } else if (sortBy === 'updatedAt' || sortBy === 'event.updatedAt') {
          orderByField = 'event.updatedAt';
        } else if (sortBy === 'isPrivate' || sortBy === 'event.isPrivate') {
          orderByField = 'event.isPrivate';
        } else {
          // Default to startDate if unknown field
          orderByField = 'event.startDate';
        }
        
        queryBuilder.orderBy(orderByField, sortOrder);
      }

      const events = await queryBuilder.getMany();

      // Filter out past events only for non-admin users
      // Admins can see all events including past events
      let filteredEvents = events;

      if (userRole !== UserRole.Admin) {
        // Use local date for "today" and event date comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filteredEvents = events.filter((event) => {
          // First check publish dates if they exist
          if (event.publishStartDate || event.publishEndDate) {
            const publishStart = event.publishStartDate ? new Date(event.publishStartDate) : null;
            const publishEnd = event.publishEndDate ? new Date(event.publishEndDate) : null;

            if (publishStart) {
              publishStart.setHours(0, 0, 0, 0);
              if (today < publishStart) {
                return false; // Event not yet published
              }
            }

            if (publishEnd) {
              publishEnd.setHours(0, 0, 0, 0);
              if (today > publishEnd) {
                return false; // Event publish period has ended
              }
            }
          }

          // Filter out past events: exclude only when endDate < today (local date)
          const eventEndDate = new Date(event.endDate);
          eventEndDate.setHours(0, 0, 0, 0);
          if (eventEndDate < today) {
            return false; // Past event - exclude
          }

          return true;
        });
      }

      // For non-admin users: exclude events they have already registered for from Featured/Upcoming list
      if (userRole !== UserRole.Admin && userId) {
        const registeredEventIds = await this.registerEventRepository.find({
          where: { userId, isRegister: true },
          select: ['eventId'],
        }).then((rows) => rows.map((r) => r.eventId).filter(Boolean));
        if (registeredEventIds.length > 0) {
          const registeredSet = new Set(registeredEventIds);
          filteredEvents = filteredEvents.filter((event) => !registeredSet.has(event.id));
        }
      }

      // Only re-sort if we filtered past events (which changes the order) or using globalSearch
      // Otherwise, query builder already sorted the results
      if (userRole !== UserRole.Admin || filters.globalSearch) {
        // Manual sorting needed when filtering past events or using globalSearch
        filteredEvents.sort((a, b) => {
          // Map sortBy to actual field names
          const getFieldValue = (event: any, field: string) => {
            if (field === 'name' || field === 'event.name') return event.name;
            if (field === 'startDate' || field === 'event.startDate') return event.startDate;
            if (field === 'endDate' || field === 'event.endDate') return event.endDate;
            if (field === 'publishStartDate' || field === 'event.publishStartDate') return event.publishStartDate;
            if (field === 'location' || field === 'event.location') return event.location;
            if (field === 'type' || field === 'event.type') return event.type;
            if (field === 'price' || field === 'event.price') return Number(event.price ?? 0);
            if (field === 'createdAt' || field === 'event.createdAt') return event.createdAt;
            if (field === 'updatedAt' || field === 'event.updatedAt') return event.updatedAt;
            return event.startDate; // default
          };
          
          const fieldA = getFieldValue(a, sortBy);
          const fieldB = getFieldValue(b, sortBy);
          
          // Handle date fields
          if (fieldA instanceof Date || (typeof fieldA === 'string' && fieldA.includes('-'))) {
            const dateA = new Date(fieldA);
            const dateB = new Date(fieldB);
            dateA.setHours(0, 0, 0, 0);
            dateB.setHours(0, 0, 0, 0);
            return sortOrder === 'ASC' 
              ? dateA.getTime() - dateB.getTime()
              : dateB.getTime() - dateA.getTime();
          }
          
          // Handle type field (enum: Physical, Virtual) - sort alphabetically
          if (sortBy === 'type' || sortBy === 'event.type') {
            const typeA = (fieldA || '').toString();
            const typeB = (fieldB || '').toString();
            if (sortOrder === 'ASC') {
              return typeA.localeCompare(typeB);
            } else {
              return typeB.localeCompare(typeA);
            }
          }
          
          // Handle string/number fields
          if (sortOrder === 'ASC') {
            return fieldA > fieldB ? 1 : fieldA < fieldB ? -1 : 0;
          } else {
            return fieldA < fieldB ? 1 : fieldA > fieldB ? -1 : 0;
          }
        });
      }

      // Apply pagination to filtered events only if pagination parameters are provided
      const total = filteredEvents.length;
      let paginatedEvents;
      let pagination;
      
      if (hasPagination) {
        pagination = this.filterService.calculatePaginationMetadata(total, page, limit);
        const skip = (page - 1) * limit;
        paginatedEvents = filteredEvents.slice(skip, skip + limit);
      } else {
        // Return all events if no pagination parameters
        paginatedEvents = filteredEvents;
        pagination = {
          page: 1,
          limit: total,
          total: total,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        };
      }

      // Admin: full event. Other roles: only basic info + speakersData
      const eventsWithAttendance = await Promise.all(
        paginatedEvents.map(async (event) => {
          const speakers = EventSpeakerUtils.buildSpeakerSchedule(event);

          let isFavorite = false;
          if (userId) {
            const favorite = await this.favoriteEventRepository.findOne({
              where: { userId, eventId: event.id },
            });
            isFavorite = !!favorite;
          }

          let isRegistered = false;
          let registerEventId: string | null = null;
          if (userId) {
            const registration = await this.registerEventRepository.findOne({
              where: {
                userId,
                eventId: event.id,
                isRegister: true,
              },
            });
            isRegistered = !!registration;
            registerEventId = registration?.id || null;
          }

          const { eventSpeakers: _s, category: _c, eventExhibitors: _e, documents: _d, documentNames: _dn, programmeTracks: _pt, exhibitorDescription: _ed, surveys: _sv, eventStampDescription: _esd, ...basicEvent } = event;
          const slimEvent = {
            ...basicEvent,
            price: toDisplayPrice(event.price),
            earlyBirdPrice: toDisplayPrice(event.earlyBirdPrice),
            isEarlyBirdActive: this.getIsEarlyBirdActive(event),
            color: getEventColor(event.type),
            speakersData: speakers,
            isFavorite,
            isRegistered,
            registerEventId,
          };

          // Non-admin: return only basic info + speakers
          if (userRole !== UserRole.Admin) {
            if (filters.globalSearch) {
              const searchResult = this.checkGlobalSearchMatch(slimEvent, filters.globalSearch);
              return { ...slimEvent, hasGlobalMatch: searchResult.hasMatch, searchResult };
            }
            return { ...slimEvent, hasGlobalMatch: false };
          }

          // Admin: build full event with all details
          const attendanceCount = await this.getEventAttendanceCount(event.id);
          const surveyDetails = await this.surveyUtils.getSurveyDetailsByEventId(event.id);
          let formattedDocuments: { name: string; document: string }[] = [];
          if (event.documents && event.documentNames) {
            formattedDocuments = event.documents.map((doc, index) => ({
              name: event.documentNames?.[index] || `Document ${index + 1}`,
              document: doc,
            }));
          } else if (event.documents) {
            formattedDocuments = event.documents.map((doc, index) => ({
              name: `Document ${index + 1}`,
              document: doc,
            }));
          }
          const eventStamps = await this.eventStampService.getStampsByEventId(event.id);
          const {
            eventSpeakers,
            category,
            eventExhibitors,
            documents: _documents,
            documentNames: _documentNames,
            ...eventData
          } = event;
          const { exhibitorDescription, surveys, programmeTracks, ...eventFilteredData } = eventData;
          const eventStampDescription = event.eventStampDescription;
          const formattedProgrammeTracks = UserUtils.formatProgrammeTracks(event?.programmeTracks || []);
          const engagements = await UserUtils.getEngagementsByEventId(event.id, this.eventRepository, this.engagementRepository, true);

          const exhibitorsData = {
            exhibitorDescription: exhibitorDescription || '',
            exhibitors: await Promise.all(
              (event?.eventExhibitors?.filter((ee) => ee.exhibitor.isActive) || []).map(async (ee) => {
                const exhibitorId = ee.exhibitorId || ee.exhibitor?.id;
                const exhibitorData = {
                  ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
                };
                if (exhibitorId) {
                  const eventBooth = await this.eventBoothRepository.findOne({
                    where: { eventId: event.id, exhibitorId },
                  });
                  if (eventBooth) (exhibitorData as any).boothCode = eventBooth.uniqueCode;
                }
                (exhibitorData as any).eventStaff = await ExhibitorUtils.getEventStaffForExhibitor(
                  this.eventStaffRepository,
                  event.id,
                  exhibitorId!,
                );
                (exhibitorData as any).rating = await ExhibitorUtils.getExhibitorRating(
                  this.exhibitorRatingRepository,
                  exhibitorId!,
                  event.id,
                );
                return exhibitorData;
              }),
            ),
          };

          const completeEvent = {
            ...eventFilteredData,
            price: toDisplayPrice(event.price),
            earlyBirdPrice: toDisplayPrice(event.earlyBirdPrice),
            isEarlyBirdActive: this.getIsEarlyBirdActive(event),
            color: getEventColor(event.type),
            documents: formattedDocuments,
            eventStamps: {
              description: eventStampDescription || '',
              stamps: eventStamps.map((stamp) => ({
                id: stamp.id,
                boothNumber: stamp.name,
                exhibitorId: stamp.exhibitorId || null,
                image: stamp.image,
              })),
            },
            attendanceCount,
            surveyDetails,
            hasSurvey: !!surveyDetails,
            isFavorite,
            isRegistered,
            registerEventId,
            speakersData: speakers,
            categoriesData: category?.map((ec) => ec.category) || [],
            programmeTracks: formattedProgrammeTracks,
            engagements,
            exhibitorsData,
          };

          try {
            const qnaData = await this.qnaUtils.getAllQuestionsForEvent(event.id);
            (completeEvent as any).qnaData = qnaData.data;
          } catch {
            (completeEvent as any).qnaData = null;
          }

          if (filters.globalSearch) {
            const searchResult = this.checkGlobalSearchMatch(completeEvent, filters.globalSearch);
            return { ...completeEvent, hasGlobalMatch: searchResult.hasMatch, searchResult };
          }
          return { ...completeEvent, hasGlobalMatch: false };
        }),
      );

      // If globalSearch is active, filter events that have global matches and aggregate results
      if (filters.globalSearch) {
        const eventsWithGlobalMatches = eventsWithAttendance.filter(event => event.hasGlobalMatch);
        
        // Aggregate all search results into separate arrays
        const allSpeakers: any[] = [];
        const allCategories: any[] = [];
        const allExhibitors: any[] = [];
        const allSurveySessions: any[] = [];
        
        eventsWithGlobalMatches.forEach(event => {
          // Type assertion to handle the searchResult property
          const eventWithSearch = event as any;
          if (eventWithSearch.searchResult) {
            allSpeakers.push(...eventWithSearch.searchResult.matchedSpeakers);
            allCategories.push(...eventWithSearch.searchResult.matchedCategories);
            allExhibitors.push(...eventWithSearch.searchResult.matchedExhibitors);
            allSurveySessions.push(...eventWithSearch.searchResult.matchedSurveySessions);
          }
        });

        // Only include events in the events array if the search matched the event itself, not just categories/speakers/exhibitors
        const eventsWithEventMatches = eventsWithGlobalMatches.filter(event => {
          const eventWithSearch = event as any;
          return eventWithSearch.searchResult?.matchedEvent === true;
        });

        // Return complete event data instead of simplified data
        const completeEvents = eventsWithEventMatches.map(event => {
          // Remove the searchResult and hasGlobalMatch properties for cleaner response
          const { searchResult, hasGlobalMatch, ...cleanEvent } = event as any;
          return cleanEvent;
        });

        // Sort events by startDate in descending order (newest first)
        // Dec 6, 5, 4, 1 should show before Nov 30, 29, 28
        completeEvents.sort((a, b) => {
          // Create date objects and normalize to midnight (ignore time component)
          const dateA = new Date(a.startDate);
          dateA.setHours(0, 0, 0, 0);
          const dateB = new Date(b.startDate);
          dateB.setHours(0, 0, 0, 0);
          
          // Compare dates in descending order (newest first)
          return dateB.getTime() - dateA.getTime();
        });

        // Apply pagination to filtered events
        const total = completeEvents.length;
        const pagination = this.filterService.calculatePaginationMetadata(total, page, limit);
        const skip = (page - 1) * limit;
        const paginatedEvents = completeEvents.slice(skip, skip + limit);

        // For admin role, include filter data from available events in response (not all events from database)
        let filterData = null;
        if (userRole === UserRole.Admin) {
          // Use the actual available events from the response, not all events from database
          const formattedEvents = completeEvents.map(event => ({
            id: event.id,
            eventName: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
          }));
          filterData = {
            events: formattedEvents,
          };
        }

        return {
          events: paginatedEvents,
          speakers: allSpeakers,
          categories: allCategories,
          exhibitors: allExhibitors,
          surveySessions: allSurveySessions,
          pagination: pagination,
          metadata: {
            total: total,
            totalSpeakers: allSpeakers.length,
            totalCategories: allCategories.length,
            totalExhibitors: allExhibitors.length,
            totalSurveySessions: allSurveySessions.length,
            timestamp: new Date().toISOString(),
            globalSearch: true,
            searchKeyword: filters.globalSearch,
            totalMatches: total
          },
          ...(filterData && { filter: filterData }), // Conditionally add filter data for admin
        };
      }

      // For admin role, include filter data from available events in response
      // Different filter data for events list vs upcoming events list
      let filterData = null;
      if (userRole === UserRole.Admin) {
        // Use the actual available events from the response, not all events from database
        // If upcoming filter is applied, only include upcoming events in filter data
        // Otherwise, include all available events in filter data
        const formattedEvents = filteredEvents.map(event => ({
          id: event.id,
          eventName: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
        }));
        filterData = {
          events: formattedEvents,
        };
      }

      return {
        events: eventsWithAttendance,
        pagination: pagination,
        metadata: {
          total: total,
          timestamp: new Date().toISOString(),
          globalSearch: false
        },
        ...(filterData && { filter: filterData }), // Conditionally add filter data for admin
      };
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Events retrieval');
    }
  }

  /**
   * Retrieve a lightweight list of active events for admin dropdowns.
   * Includes only core identifying fields and excludes past events for non-admin users.
   */
  async getEventSummariesForRegistration(userRole?: string) {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .select([
        'event.id',
        'event.name',
        'event.startDate',
        'event.endDate',
        'event.location',
        'event.venue',
      ]);

    // Only filter out past events and private events for non-admin users
    // Admins can see all events including past and private (for dropdown)
    if (userRole !== UserRole.Admin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      queryBuilder.where('event.endDate >= :today', { today });
      queryBuilder.andWhere(
        '(event.publishStartDate IS NULL OR event.publishStartDate <= :today)',
        { today }
      );
      queryBuilder.andWhere(
        '(event.publishEndDate IS NULL OR event.publishEndDate >= :today)',
        { today }
      );
      // Exclude private events from registration dropdown (only visible in "Registered events" if already registered)
      queryBuilder.andWhere('(event.isPrivate = :isPrivate OR event.isPrivate IS NULL)', { isPrivate: false });
    }

    const events = await queryBuilder
      .orderBy('event.startDate', 'ASC')
      .getMany();

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || event.venue || '',
    }));
  }

  // Get event attendance count
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

  async getEventEntityById(id: string): Promise<Event> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }
      return event;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event retrieval by ID');
    }
  }

  async getEventById(id: string, userId?: string, userRole?: string) {
    try {
      const queryBuilder = this.eventRepository.createQueryBuilder('event');

      // Use the utility for consistent query building
      EventQueryBuilderUtils.buildBaseQuery(queryBuilder);

      // Add the specific ID filter
      queryBuilder.where('event.id = :id', { id });

      const event = await queryBuilder.getOne();

      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      const speakerSchedule = EventSpeakerUtils.buildSpeakerSchedule(event);

      let isFavorite = false;
      if (userId) {
        const favorite = await this.favoriteEventRepository.findOne({
          where: { userId, eventId: id },
        });
        isFavorite = !!favorite;
      }

      let isRegistered = false;
      let registerEventId: string | null = null;
      if (userId) {
        const registration = await this.registerEventRepository.findOne({
          where: {
            userId,
            eventId: id,
            isRegister: true,
          },
        });
        isRegistered = !!registration;
        registerEventId = registration?.id || null;
      }

      // Non-admin: return only basic info + speakers (skip heavy loading)
      if (userRole !== UserRole.Admin) {
        const { eventSpeakers: _s, category: _c, eventExhibitors: _e, documents: _d, documentNames: _dn, programmeTracks: _pt, exhibitorDescription: _ed, surveys: _sv, eventStampDescription: _esd, ...basicEvent } = event;
        return {
          ...basicEvent,
          price: toDisplayPrice(event.price),
          earlyBirdPrice: toDisplayPrice(event.earlyBirdPrice),
          isEarlyBirdActive: this.getIsEarlyBirdActive(event),
          color: getEventColor(event.type),
          speakersData: speakerSchedule,
          isFavorite,
          isRegistered,
          registerEventId,
        };
      }

      const { eventSpeakers, category, eventExhibitors, ...eventData } = event;
      const attendanceCount = await this.getEventAttendanceCount(id);
      const surveyDetails =
        await this.surveyUtils.getSurveyDetailsByEventId(id);

      // Format documents with names
      let formattedDocuments: { name: string; document: string }[] = [];
      if (event.documents && event.documentNames) {
        formattedDocuments = event.documents.map((doc, index) => ({
          name: event.documentNames?.[index] || `Document ${index + 1}`,
          document: doc,
        }));
      } else if (event.documents) {
        // Fallback if no names are provided
        formattedDocuments = event.documents.map((doc, index) => ({
          name: `Document ${index + 1}`,
          document: doc,
        }));
      }

      // Get event stamps from new structure
      const eventStamps = await this.eventStampService.getStampsByEventId(id);

      const {
        exhibitorDescription,
        surveys,
        documents, // Remove original documents
        documentNames, // Remove original documentNames
        programmeTracks, // Remove original programmeTracks
        ...eventFilteredData
      } = eventData;

      // Format programme tracks with basic speaker info using utility
      const formattedProgrammeTracks = UserUtils.formatProgrammeTracks(event?.programmeTracks || []);

      // Get engagements for this event - pass isUserFacing=true for user-facing API
      const engagements = await UserUtils.getEngagementsByEventId(id, this.eventRepository, this.engagementRepository, true);

      // Get booth codes and event staff for all exhibitors
      const exhibitorsWithBoothCodes = await Promise.all(
        eventExhibitors.map(async (ee) => {
          const exhibitorId = ee.exhibitorId || ee.exhibitor?.id;
          const exhibitorData = {
            ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
           
          };

          // Add booth code only for admin users
          if (userRole === UserRole.Admin && exhibitorId) {
            const eventBooth = await this.eventBoothRepository.findOne({
              where: {
                eventId: id,
                exhibitorId: exhibitorId,
              },
            });
            if (eventBooth) {
              (exhibitorData as any).boothCode = eventBooth.uniqueCode;
            }
          }

          // Get Event Staff for this exhibitor - show to all users
          (exhibitorData as any).eventStaff = await ExhibitorUtils.getEventStaffForExhibitor(
            this.eventStaffRepository,
            id,
            exhibitorId,
          );

          return exhibitorData;
        }),
      );

      const eventResponse = {
        ...eventFilteredData,
        price: toDisplayPrice(event.price),
        earlyBirdPrice: toDisplayPrice(event.earlyBirdPrice),
        isEarlyBirdActive: this.getIsEarlyBirdActive(event),
        color: getEventColor(event.type),
        speakers: speakerSchedule,
        speakersData: speakerSchedule,
        categories: category?.map((ec) => ec.category) || [],
        documents: formattedDocuments, // New formatted documents
        eventStamps: {
          description: eventData.eventStampDescription || '',
          stamps: eventStamps.map(stamp => ({
            id: stamp.id,
            boothNumber: stamp.name, // name field contains booth number
            exhibitorId: stamp.exhibitorId || null,
            image: stamp.image,
          })),
        },
       
        exhibitors: {
          exhibitorDescription: exhibitorDescription || '',
          exhibitors: exhibitorsWithBoothCodes,
        },
        attendanceCount: attendanceCount,
        surveyDetails: surveyDetails,
        hasSurvey: !!surveyDetails,
        isFavorite: isFavorite,
        isRegistered: isRegistered,
        registerEventId: registerEventId,
        programmeTracks: formattedProgrammeTracks,
        engagements: engagements,
    
      };

      // Add Q&A data for admin users
      if (userRole === UserRole.Admin) {
        try {
          const qnaData = await this.qnaUtils.getAllQuestionsForEvent(id);
          (eventResponse as any).qnaData = qnaData.data;
        } catch (error) {
          // If Q&A data fails to load, continue without it
          console.warn(`Failed to load Q&A data for event ${id}:`, error);
          (eventResponse as any).qnaData = null;
        }
      }

      return eventResponse;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event retrieval by ID');
    }
  }

  async updateEvent(
    id: string,
    eventDto: Partial<EventDto>,
  ): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Check if name is being updated and if it conflicts
      if (eventDto.name && eventDto.name !== event.name) {
        await EventValidationUtils.validateEventNameUniqueness(
          eventDto.name,
          async (name: string, excludeId?: string) => {
            const existingEvent = await this.eventRepository.findOne({
              where: { name, id: Not(excludeId || id) },
            });
            return !existingEvent;
          },
          id,
        );
      }

      // Validate all IDs if provided
      await this.validateEventReferences(eventDto);

      // Date validations
      if (eventDto.startDate || eventDto.endDate) {
        this.validateEventDates(eventDto, event);
      }

      // Location conflict check
      if (eventDto.location) {
        await this.checkLocationConflict(eventDto, id);
      }

      // Coordinate validations
      this.validateCoordinates(eventDto);

      // Remove stamp-related fields from eventDto before assigning
      const { eventStampIds, newStamps, ...eventDtoWithoutStamps } = eventDto;

      Object.assign(event, eventDtoWithoutStamps);

      // When optional date fields are empty string or null, set to null so DB gets NULL (not "")
      const optionalDateFields = ['publishStartDate', 'publishEndDate', 'earlyBirdStartDate', 'earlyBirdEndDate'] as const;
      for (const field of optionalDateFields) {
        if (field in eventDto) {
          const val = eventDto[field];
          const isEmpty = val === '' || val === null || val === undefined || (typeof val === 'string' && val.trim() === '');
          if (isEmpty) {
            (event as any)[field] = null;
          }
        }
      }

      const updatedEvent = await this.eventRepository.save(event);

      // Update associations if provided
      await this.updateEventAssociations(id, eventDto);

      // Handle event stamps - create new stamps and associate existing ones
      // Only process if stamps are explicitly provided (not undefined)
      const hasStampUpdates = eventStampIds !== undefined || newStamps !== undefined;
      
      if (hasStampUpdates) {
        const allStampIds: string[] = [];
        
        // Create new stamps if provided
        if (newStamps && Array.isArray(newStamps) && newStamps.length > 0) {
          try {
            // Filter out stamps without names
            const validStamps = newStamps.filter(stamp => stamp && stamp.name && stamp.name.trim().length > 0);
            if (validStamps.length > 0) {
              const createdStamps = await this.eventStampService.createMultiple(validStamps);
              allStampIds.push(...createdStamps.map(stamp => stamp.id));
            }
          } catch (error: any) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            throw new ValidationException('Failed to create new event stamps: ' + errorMessage);
          }
        }
        
        // Validate and add existing stamp IDs
        if (eventStampIds && Array.isArray(eventStampIds) && eventStampIds.length > 0) {
          // Flatten the array in case of nested arrays and filter out invalid IDs
          const flattenedIds: any[] = eventStampIds.flat(Infinity);
          const validIds: string[] = [];
          
          for (const id of flattenedIds) {
            // Handle if ID is a stringified array or object
            if (typeof id === 'string') {
              // Try to parse if it looks like JSON
              try {
                const parsed = JSON.parse(id);
                // If parsed result is an array, add each element
                if (Array.isArray(parsed)) {
                  validIds.push(...parsed.map((item: any) => String(item).trim()).filter((item: string) => item.length > 0));
                } else {
                  // If it's a valid UUID string, add it
                  const trimmed = id.trim();
                  if (trimmed.length > 0) {
                    validIds.push(trimmed);
                  }
                }
              } catch {
                // Not JSON, add as is if valid
                const trimmed = id.trim();
                if (trimmed.length > 0) {
                  validIds.push(trimmed);
                }
              }
            } else if (typeof id === 'string' && id.trim().length > 0) {
              // If it's already a valid string, add it
              validIds.push(id.trim());
            }
          }
          
          // Remove duplicates and filter to valid UUIDs (36 chars)
          const uniqueIds = [...new Set(validIds)].filter(id => id.length === 36);
          
          // Validate stamp IDs - skip ones that no longer exist (e.g. deleted when exhibitor removed)
          for (const stampId of uniqueIds) {
            try {
              const trimmedId = String(stampId).trim();
              await this.eventStampService.findOne(trimmedId);
              allStampIds.push(trimmedId);
            } catch (error: any) {
              if (error?.name === 'NotFoundException' || error?.constructor?.name === 'NotFoundException') {
                // Stamp may have been deleted (e.g. exhibitor removed) - skip it
                continue;
              }
              console.error(`Error validating event stamp ID ${stampId}:`, error);
            }
          }
        }
        
        // Associate stamps to event (this will replace existing associations)
        await this.eventStampService.associateStampsToEvent(id, allStampIds);
      }

      // Auto-create stamps for exhibitors when exhibitors are added/updated (adds to existing)
      if (eventDto.exhibitorIds !== undefined) {
        await this.exhibitorService.autoCreateStampsForEventExhibitors(id);
      }

      return this.normalizeEventPrices(updatedEvent);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event update');
    }
  }

  async deleteEvent(id: string) {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Delete all associated data before deleting the event (force delete: participants + linked data)
      // 1. Get all register events for this event (participants)
      const registerEventsForEvent = await this.registerEventRepository.find({
        where: { eventId: id },
        select: ['id'],
      });
      const registerEventIds = registerEventsForEvent.map((r) => r.id);
      if (registerEventIds.length > 0) {
        // 2. Delete admin info linked to these registrations
        await this.adminInfoRepository
          .createQueryBuilder()
          .delete()
          .where('registerEventId IN (:...ids)', { ids: registerEventIds })
          .execute();
        // 3. Delete billing details linked to these registrations
        await this.billingDetailRepository
          .createQueryBuilder()
          .delete()
          .where('registerEventId IN (:...ids)', { ids: registerEventIds })
          .execute();
      }
      // 4. Delete registered events (participants / registrations)
      await this.registerEventRepository.delete({ eventId: id });

      // 2. Delete favorite events (has CASCADE but explicit for clarity)
      await this.favoriteEventRepository.delete({ eventId: id });

      // 3. Delete galleries (uploaded event galleries)
      await this.galleryRepository.delete({ eventId: id });

      // 4. Delete cart items
      await this.cartRepository.delete({ eventId: id });

      // 5. Delete attendance records (has CASCADE but explicit for clarity)
      await this.attendanceRepository.delete({ eventId: id });

      // 6. Delete feedback records (has CASCADE but explicit for clarity)
      await this.feedbackRepository.delete({ eventId: id });

      // 7. Delete event agendas
      await this.eventAgendaRepository.delete({ eventId: id });
      
      // 8. Delete event booths
      await this.eventBoothRepository.delete({ eventId: id });

      // 9. Delete event speakers
      await this.eventSpeakerRepository.delete({ eventId: id });

      // 10. Delete event categories
      await this.eventCategoryRepository.delete({ eventId: id });

      // 11. Delete event exhibitors
      await this.eventExhibitorRepository.delete({ eventId: id });

      // 12. Delete order items (handled via CASCADE in OrderItemEntity, but explicit for clarity)
      // Note: OrderItemEntity has onDelete: 'CASCADE' so items will be auto-deleted
      // Using query builder to find by event relationship
      const orderItems = await this.orderItemRepository
        .createQueryBuilder('orderItem')
        .leftJoinAndSelect('orderItem.event', 'event')
        .where('event.id = :eventId', { eventId: id })
        .getMany();
      
      if (orderItems.length > 0) {
        // Delete order items (cascade will handle, but explicit deletion for safety)
        await this.orderItemRepository.remove(orderItems);
      }

      // 13. Surveys and survey-related data (explicit delete; DB may not have CASCADE)
      await this.surveyAnswerRepository
        .createQueryBuilder()
        .delete()
        .where('eventId = :eventId', { eventId: id })
        .execute();
      const surveysForEvent = await this.surveyRepository.find({
        where: { eventId: id },
        select: ['id'],
      });
      const surveyIds = surveysForEvent.map((s) => s.id);
      if (surveyIds.length > 0) {
        await this.surveyQuestionRepository
          .createQueryBuilder()
          .delete()
          .where('surveyId IN (:...ids)', { ids: surveyIds })
          .execute();
      }
      await this.surveyRepository.delete({ eventId: id });

      // 14. Programme tracks and sessions (explicit delete)
      const programmeTracksForEvent = await this.programmeTrackRepository.find({
        where: { eventId: id },
        select: ['id'],
      });
      const trackIds = programmeTracksForEvent.map((t) => t.id);
      if (trackIds.length > 0) {
        await this.engagementRepository
          .createQueryBuilder()
          .delete()
          .where('trackId IN (:...ids)', { ids: trackIds })
          .execute();
        await this.programmeSessionRepository
          .createQueryBuilder()
          .delete()
          .where('trackId IN (:...ids)', { ids: trackIds })
          .execute();
      }
      await this.programmeTrackRepository.delete({ eventId: id });

      // 15. Moderator-event links
      await this.moderatorEventRepository.delete({ eventId: id });

      // 16. Q&A questions and likes
      const qnaQuestionsForEvent = await this.qnaQuestionRepository.find({
        where: { eventId: id },
        select: ['id'],
      });
      const qnaQuestionIds = qnaQuestionsForEvent.map((q) => q.id);
      if (qnaQuestionIds.length > 0) {
        await this.qnaLikeRepository
          .createQueryBuilder()
          .delete()
          .where('questionId IN (:...ids)', { ids: qnaQuestionIds })
          .execute();
      }
      await this.qnaQuestionRepository.delete({ eventId: id });

      // 17. Polling: user sessions/votes then polls/options/votes
      const pollSessionsForEvent = await this.userPollSessionRepository.find({
        where: { eventId: id },
        select: ['id'],
      });
      const sessionIds = pollSessionsForEvent.map((s) => s.id);
      if (sessionIds.length > 0) {
        await this.userPollVoteRepository
          .createQueryBuilder()
          .delete()
          .where('sessionId IN (:...ids)', { ids: sessionIds })
          .execute();
      }
      await this.userPollSessionRepository.delete({ eventId: id });
      const pollsForEvent = await this.pollRepository.find({
        where: { eventId: id },
        select: ['id'],
      });
      const pollIds = pollsForEvent.map((p) => p.id);
      if (pollIds.length > 0) {
        await this.pollVoteRepository
          .createQueryBuilder()
          .delete()
          .where('pollId IN (:...ids)', { ids: pollIds })
          .execute();
        await this.pollOptionRepository
          .createQueryBuilder()
          .delete()
          .where('pollId IN (:...ids)', { ids: pollIds })
          .execute();
      }
      await this.pollRepository.delete({ eventId: id });

      // 18. Scheduled push notifications and event notifications
      await this.scheduledPushNotificationRepository
        .createQueryBuilder()
        .delete()
        .where('eventId = :eventId', { eventId: id })
        .execute();
      await this.eventNotificationRepository.delete({ eventId: id });

      // 19. Withdrawals (eventId from ManyToOne)
      await this.withdrawalRepository
        .createQueryBuilder()
        .delete()
        .where('eventId = :eventId', { eventId: id })
        .execute();

      // 20. Exhibitor ratings, views, leads
      await this.exhibitorRatingRepository.delete({ eventId: id });
      await this.exhibitorViewRepository.delete({ eventId: id });
      await this.exhibitorLeadRepository.delete({ eventId: id });

      // 21. Contact exchange and event QR codes
      await this.contactExchangeRepository.delete({ eventId: id });
      await this.eventQRCodeRepository.delete({ eventId: id });

      // Delete associated files
      await this.deleteEventFiles(event);

      // Finally, delete the event itself
      await this.eventRepository.remove(event);
      return { message: 'Event and all associated data deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event deletion');
    }
  }

  async updateEventImages(
    id: string,
    images: string[],
  ): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      event.images = images;
      return await this.eventRepository.save(event);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event images update');
    }
  }

  async updateEventDocuments(
    id: string,
    documents: string[],
  ): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      event.documents = documents;
      return await this.eventRepository.save(event);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event documents update');
    }
  }

  async updateTabVisibility(
    id: string,
    tabVisibility: {
      details?: boolean;
      location?: boolean;
      speakers?: boolean;
      floorplan?: boolean;
      gallery?: boolean;
      stamps?: boolean;
      survey?: boolean;
      exhibitors?: boolean;
      categories?: boolean;
      documents?: boolean;
      engagement?: boolean;
    },
  ): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Merge with existing tab visibility settings
      event.tabVisibility = {
        ...event.tabVisibility,
        ...tabVisibility,
      };

      return await this.eventRepository.save(event);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event tab visibility update');
    }
  }

  async updateIsPrivate(id: string, isPrivate: boolean): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }
      event.isPrivate = isPrivate;
      return await this.eventRepository.save(event);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event isPrivate update');
    }
  }

  async updateEventFloorPlan(
    id: string,
    floorPlan: string | null,
  ): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Delete existing floor plan from filesystem if it exists
      if (event.floorPlan) {
        const existingFloorPlanPath = path.resolve(event.floorPlan);
        if (fs.existsSync(existingFloorPlanPath)) {
          fs.unlinkSync(existingFloorPlanPath);
        }
      }

      // Update floor plan in database - set to empty string instead of null
      event.floorPlan = floorPlan === null ? '' : floorPlan;
      return await this.eventRepository.save(event);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event floor plan update');
    }
  }

  async updateEventBackgroundImage(
    id: string,
    backgroundImage: string | null,
  ): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Delete existing background image from filesystem if it exists
      if (event.backgroundImage) {
        const existingBackgroundImagePath = path.resolve(event.backgroundImage);
        if (fs.existsSync(existingBackgroundImagePath)) {
          fs.unlinkSync(existingBackgroundImagePath);
        }
      }

      // Update background image in database - set to empty string instead of null
      event.backgroundImage = backgroundImage === null ? '' : backgroundImage;
      return await this.eventRepository.save(event);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw this.errorHandler.handleDatabaseError(error, 'Event background image update');
    }
  }

  private async updateEventAssociations(
    eventId: string,
    eventDto: Partial<EventDto>,
  ) {
    // Update category associations if provided
    if (eventDto.categoryIds !== undefined) {
      await this.eventCategoryRepository.delete({ eventId });
      if (eventDto.categoryIds) {
        const categoryIdsArray = eventDto.categoryIds.split(',');
        await Promise.all(
          categoryIdsArray.map(async (categoryId) => {
            const eventCategory = new EventCategory();
            eventCategory.eventId = eventId;
            eventCategory.categoryId = categoryId.trim();
            await this.eventCategoryRepository.save(eventCategory);
          }),
        );
      }
    }

    // Update speaker associations if provided
    if (eventDto.speakerIds !== undefined) {
      // Get existing speakers before deletion
      const existingSpeakers = await this.eventSpeakerRepository.find({
        where: { eventId },
        select: ['speakerId'],
      });
      const existingSpeakerIds = new Set(
        existingSpeakers
          .map((es) => es.speakerId)
          .filter((id): id is string => Boolean(id)),
      );

      // Get new speaker IDs
      const newSpeakerIds = eventDto.speakerIds
        ? new Set(eventDto.speakerIds.split(',').map((id) => id.trim()))
        : new Set<string>();

      // Find removed speakers
      const removedSpeakerIds = Array.from(existingSpeakerIds).filter(
        (id) => !newSpeakerIds.has(id),
      );

      // If speakers were removed, remove them from programme tracks, sessions and engagement tracks (not delete sessions)
      if (removedSpeakerIds.length > 0) {
        await removeSpeakersFromAssociations(
          this.programmeSessionRepository,
          this.programmeTrackRepository,
          this.engagementRepository,
          eventId,
          removedSpeakerIds,
        );
      }

      // Now update event speakers
      await this.eventSpeakerRepository.delete({ eventId });
      if (eventDto.speakerIds) {
        const speakerIdsArray = eventDto.speakerIds.split(',');

        await Promise.all(
          speakerIdsArray.map(async (speakerId) => {
            const eventSpeaker = new EventSpeaker();
            eventSpeaker.eventId = eventId;
            eventSpeaker.speakerId = speakerId.trim();

            await this.eventSpeakerRepository.save(eventSpeaker);
          }),
        );
      }
    }

    // Update exhibitor associations if provided
    if (eventDto.exhibitorIds !== undefined) {
      // Get current event details for email
      const currentEvent = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      // Get existing exhibitor IDs for this event
      const existingExhibitorIds = await this.eventExhibitorRepository.find({
        where: { eventId },
        select: ['exhibitorId'],
      });
      const existingExhibitorIdSet = new Set(
        existingExhibitorIds.map((ee) => ee.exhibitorId),
      );

      if (eventDto.exhibitorIds) {
        const newExhibitorIdsArray = eventDto.exhibitorIds.split(',');

        // Create set of new exhibitor IDs for comparison
        const newExhibitorIdSet = new Set(
          newExhibitorIdsArray.map((id) => id.trim()),
        );

        // Process each exhibitor ID
        await Promise.all(
          newExhibitorIdsArray.map(async (exhibitorId) => {
            const trimmedExhibitorId = exhibitorId.trim();
            const isNewExhibitor =
              !existingExhibitorIdSet.has(trimmedExhibitorId);

            // Get exhibitor details
            const exhibitor = await this.exhibitorRepository.findOne({
              where: { id: trimmedExhibitorId },
            });

            if (isNewExhibitor) {
              // Create new EventExhibitor record
              const eventExhibitor = new EventExhibitor();
              eventExhibitor.eventId = eventId;
              eventExhibitor.exhibitorId = trimmedExhibitorId;
              await this.eventExhibitorRepository.save(eventExhibitor);

              // Check if EventBooth already exists (to avoid duplicate code generation)
              let eventBooth = await this.eventBoothRepository.findOne({
                where: {
                  eventId: eventId,
                  exhibitorId: trimmedExhibitorId,
                },
              });

              if (!eventBooth) {
                // Create new EventBooth record with unique code
                eventBooth = new EventBooth();
                eventBooth.eventId = eventId;
                eventBooth.exhibitorId = trimmedExhibitorId;
                eventBooth.uniqueCode = this.generateUniqueCode();
                await this.eventBoothRepository.save(eventBooth);

                // Send email only to new exhibitors (only for new booth codes)
                if (exhibitor && exhibitor.email && currentEvent) {
                  await this.sendBoothCodeEmail(
                    exhibitor.email,
                    eventBooth.uniqueCode,
                    currentEvent.name,
                    this.formatDateForEmail(currentEvent.startDate),
                    currentEvent.venue ||
                      currentEvent.location ||
                      'To be announced',
                  );
                }
              }
            }
            // If exhibitor already exists, no need to recreate booth or send email
          }),
        );

        // Remove exhibitors who are no longer in the list
        const exhibitorsToRemove = existingExhibitorIds.filter(
          (ee) => ee.exhibitorId && !newExhibitorIdSet.has(ee.exhibitorId),
        );

        if (exhibitorsToRemove.length > 0) {
          // Get booth details and exhibitor information for removal emails
          const boothsToRemove = await this.eventBoothRepository.find({
            where: {
              eventId,
              exhibitorId: In(
                exhibitorsToRemove
                  .map((ee) => ee.exhibitorId!)
                  .filter((id) => id !== undefined),
              ),
            },
            relations: ['exhibitor', 'exhibitor.boothBanners'],
          });

          const exhibitorIdsToRemove = exhibitorsToRemove
            .map((ee) => ee.exhibitorId)
            .filter((id): id is string => id !== undefined);

          if (exhibitorIdsToRemove.length > 0) {
            // Remove stamps for removed exhibitors
            await this.exhibitorService.removeStampsForExhibitorsFromEvent(
              eventId,
              exhibitorIdsToRemove,
            );

            // Delete EventBooth records for removed exhibitors
            await this.eventBoothRepository.delete({
              eventId,
              exhibitorId: In(exhibitorIdsToRemove),
            });

            // Delete EventExhibitor records for removed exhibitors
            await this.eventExhibitorRepository.delete({
              eventId,
              exhibitorId: In(exhibitorIdsToRemove),
            });
          }
        }
      } else {
        // If no exhibitor IDs provided, remove all existing exhibitors
        // Remove all exhibitor stamps from this event
        const allExhibitorIds = (
          await this.eventExhibitorRepository.find({
            where: { eventId },
            select: ['exhibitorId'],
          })
        )
          .map((ee) => ee.exhibitorId)
          .filter((id): id is string => !!id);
        if (allExhibitorIds.length > 0) {
          await this.exhibitorService.removeStampsForExhibitorsFromEvent(
            eventId,
            allExhibitorIds,
          );
        }

        // Delete all EventBooth and EventExhibitor records
        await this.eventBoothRepository.delete({ eventId });
        await this.eventExhibitorRepository.delete({ eventId });
      }
    }
  }

  private async validateEventReferences(eventDto: Partial<EventDto>) {
    await EventValidationUtils.validateEventReferences(eventDto, {
      validateCategory: async (id: string) => {
        const categoryExists = await this.categoryRepository.findOne({
          where: { id: id.trim() },
        });
        return !!categoryExists;
      },
      validateSpeaker: async (id: string) => {
        const speakerExists = await this.userRepository.findOne({
          where: { id: id.trim(), role: UserRole.Speaker },
        });
        return !!speakerExists;
      },
      validateExhibitor: async (id: string) => {
        const exhibitorExists = await this.exhibitorRepository.findOne({
          where: { id: id.trim() },
        });
        return !!exhibitorExists;
      },
    });
  }

  private validateEventDates(
    eventDto: Partial<EventDto>,
    existingEvent?: Event,
  ) {
    EventValidationUtils.validateEventDates(eventDto, existingEvent);
  }

  private async checkLocationConflict(
    eventDto: Partial<EventDto>,
    excludeId?: string,
  ) {
    await EventValidationUtils.validateLocationConflict(
      eventDto,
      async (
        location: string,
        startDate: string,
        endDate: string,
        excludeId?: string,
      ) => {
        const whereClause: any = {
          location: location,
          startDate: Between(new Date(startDate), new Date(endDate)),
          endDate: Between(new Date(startDate), new Date(endDate)),
        };

        if (excludeId) {
          whereClause.id = Not(excludeId);
        }

        const conflictingEvents = await this.eventRepository.find({
          where: whereClause,
        });
        return conflictingEvents.length > 0;
      },
      excludeId,
    );
  }

  private validateCoordinates(eventDto: Partial<EventDto>) {
    EventValidationUtils.validateCoordinates(eventDto);
  }

  private normalizeOptionalDateFields(eventDto: Partial<EventDto>) {
    const optionalDateFields = [
      'publishStartDate',
      'publishEndDate',
      'earlyBirdStartDate',
      'earlyBirdEndDate',
    ] as const;

    for (const field of optionalDateFields) {
      const value = eventDto[field];
      if (
        value === '' ||
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        (eventDto as any)[field] = null;
      }
    }
  }


  // Get event booths by event ID with search filter and pagination
  async getEventBooths(
    eventId: string,
    filters?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const search = filters?.search;
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder || 'DESC';

      // Build query builder
      const queryBuilder = this.eventBoothRepository
        .createQueryBuilder('eventBooth')
        .leftJoinAndSelect('eventBooth.exhibitor', 'exhibitor')
        .where('eventBooth.eventId = :eventId', { eventId })
        .andWhere('eventBooth.isActive = :isActive', { isActive: true });

      // Apply search filter - search in exhibitor company name, email, unique code
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.toLowerCase().trim()}%`;
        queryBuilder.andWhere(
          '(LOWER(exhibitor.companyName) LIKE :searchTerm OR ' +
          'LOWER(exhibitor.email) LIKE :searchTerm OR ' +
          'LOWER(eventBooth.uniqueCode) LIKE :searchTerm)',
          { searchTerm },
        );
      }

      // Apply sorting
      if (sortBy === 'companyName') {
        queryBuilder.orderBy('exhibitor.companyName', sortOrder);
      } else if (sortBy === 'uniqueCode') {
        queryBuilder.orderBy('eventBooth.uniqueCode', sortOrder);
      } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        queryBuilder.orderBy(`eventBooth.${sortBy}`, sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('eventBooth.createdAt', sortOrder);
      }

      // Get total count before pagination
      const total = await queryBuilder.getCount();

      // Apply pagination
      const skip = (page - 1) * limit;
      const eventBooths = await queryBuilder.skip(skip).take(limit).getMany();

      // Format the response to include exhibitor details
      const formattedBooths = eventBooths.map((eventBooth) => ({
        id: eventBooth.id,
        eventId: eventBooth.eventId,
        exhibitorId: eventBooth.exhibitorId,
        uniqueCode: eventBooth.uniqueCode,
        isActive: eventBooth.isActive,
        createdAt: eventBooth.createdAt,
        updatedAt: eventBooth.updatedAt,
        exhibitor: eventBooth.exhibitor
          ? {
              ...ExhibitorUtils.getBasicExhibitorInfo(eventBooth.exhibitor),
            }
          : null,
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: formattedBooths,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      throw this.errorHandler.handleDatabaseError(error, 'Event booths retrieval');
    }
  }

  //----------------------------------Email Utils----------------------------------

  // Send booth code email to exhibitor
  private async sendBoothCodeEmail(
    exhibitorEmail: string,
    uniqueCode: string,
    eventName: string,
    eventStartDate: string,
    eventVenue: string,
  ): Promise<void> {
    await EmailUtils.sendBoothCodeEmail(
      this.emailService,
      this.errorHandler,
      exhibitorEmail,
      uniqueCode,
      eventName,
      eventStartDate,
      eventVenue,
    );
  }

  // Generate unique code for event booth
  private generateUniqueCode(): string {
    return EmailUtils.generateUniqueCode();
  }

  // Format date for email display - handles both Date objects and string dates
  private formatDateForEmail(date: Date | string): string {
    return EmailUtils.formatDateForEmail(date);
  }

  private async deleteEventFiles(event: Event) {
    try {
      // Delete multiple images if they exist (skip external URLs e.g. Salesforce)
      if (event.images && event.images.length > 0) {
        event.images.forEach((imagePath) => {
          if (
            typeof imagePath === 'string' &&
            !imagePath.startsWith('http://') &&
            !imagePath.startsWith('https://')
          ) {
            const filePath = path.resolve(imagePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
      }

      // Delete multiple documents if they exist
      if (event.documents && event.documents.length > 0) {
        event.documents.forEach((docPath) => {
          const filePath = path.resolve(docPath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete floor plan if it exists
      if (event.floorPlan) {
        const filePath = path.resolve(event.floorPlan);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete background image if it exists
      if (event.backgroundImage) {
        const filePath = path.resolve(event.backgroundImage);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete event stamp associations (stamps themselves are not deleted, only associations)
      await this.eventStampEventRepository.delete({ eventId: event.id });
    } catch (fileError) {
      this.errorHandler.logError(fileError, 'Event file deletion', event.id);
      // Continue with event deletion even if file deletion fails
    }
  }

  /**
   * Normalize event price for API: always a number (never string).
   * Set EVENT_PRICE_IN_CENTS=true if price is stored in cents (e.g. 12000 → 120.00 SGD).
   * Then 9000 in DB → 90, 12000 in DB → 120.
   */
  /** Ensure price and earlyBirdPrice are numbers in API responses (TypeORM decimal can return string). */
  private normalizeEventPrices<T extends { price?: unknown; earlyBirdPrice?: unknown; earlyBirdStartDate?: Date | string; earlyBirdEndDate?: Date | string }>(event: T): T & { isEarlyBirdActive: boolean } {
    if (!event) return { isEarlyBirdActive: false } as T & { isEarlyBirdActive: boolean };
    return {
      ...event,
      price: toDisplayPrice(event.price),
      earlyBirdPrice: toDisplayPrice(event.earlyBirdPrice),
      isEarlyBirdActive: this.getIsEarlyBirdActive(event),
    } as T & { isEarlyBirdActive: boolean };
  }

  /** True when today (date only) is within earlyBirdStartDate..earlyBirdEndDate and earlyBirdPrice is set. */
  private getIsEarlyBirdActive(event: { earlyBirdPrice?: unknown; earlyBirdStartDate?: Date | string; earlyBirdEndDate?: Date | string }): boolean {
    const price = Number(event.earlyBirdPrice ?? 0);
    if (!event.earlyBirdStartDate || !event.earlyBirdEndDate || Number.isNaN(price) || price < 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(event.earlyBirdStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(event.earlyBirdEndDate);
    end.setHours(0, 0, 0, 0);
    return today >= start && today <= end;
  }

  /** Price to use for cart/checkout/order: early bird when active, otherwise regular price. */
  getEffectivePrice(event: { price?: unknown; earlyBirdPrice?: unknown; earlyBirdStartDate?: Date | string; earlyBirdEndDate?: Date | string }): number {
    if (!event) return 0;
    const regular = Number(event.price ?? 0);
    if (this.getIsEarlyBirdActive(event)) {
      const early = Number(event.earlyBirdPrice ?? 0);
      return Number.isNaN(early) || early < 0 ? regular : early;
    }
    return regular;
  }

  private checkGlobalSearchMatch(event: any, keyword: string): {
    hasMatch: boolean;
    matchedEvent: boolean;
    matchedSpeakers: any[];
    matchedCategories: any[];
    matchedExhibitors: any[];
    matchedSurveySessions: any[];
  } {
    const keywordLower = keyword.toLowerCase();
    const result: {
      hasMatch: boolean;
      matchedEvent: boolean;
      matchedSpeakers: any[];
      matchedCategories: any[];
      matchedExhibitors: any[];
      matchedSurveySessions: any[];
    } = {
      hasMatch: false,
      matchedEvent: false,
      matchedSpeakers: [],
      matchedCategories: [],
      matchedExhibitors: [],
      matchedSurveySessions: []
    };

    // Check basic event fields
    const basicFields = [
      'name', 'description', 'venue', 'location', 'country', 'type', 
      'price', 'currency', 'latitude', 'longitude', 'startTime', 'endTime'
    ];

    for (const field of basicFields) {
      if (event[field] && event[field].toString().toLowerCase().includes(keywordLower)) {
        result.matchedEvent = true;
        result.hasMatch = true;
        break;
      }
    }

    // Check speakers
    if (event.speakersData && Array.isArray(event.speakersData)) {
      for (const speaker of event.speakersData) {
        if (speaker.name?.toLowerCase().includes(keywordLower) ||
            speaker.companyName?.toLowerCase().includes(keywordLower) ||
            speaker.position?.toLowerCase().includes(keywordLower) ||
            speaker.email?.toLowerCase().includes(keywordLower) ||
            speaker.description?.toLowerCase().includes(keywordLower) ||
            speaker.location?.toLowerCase().includes(keywordLower)) {
          result.matchedSpeakers.push({
            ...speaker,
            eventId: event.id,
            eventName: event.name
          });
          result.hasMatch = true;
        }
      }
    }

    // Check categories
    if (event.categoriesData && Array.isArray(event.categoriesData)) {
      for (const category of event.categoriesData) {
        if (category.name?.toLowerCase().includes(keywordLower) ||
            category.description?.toLowerCase().includes(keywordLower)) {
          result.matchedCategories.push({
            ...category,
            eventId: event.id,
            eventName: event.name
          });
          result.hasMatch = true;
        }
      }
    }

    // Check exhibitors
    if (event.exhibitorsData?.exhibitors && Array.isArray(event.exhibitorsData.exhibitors)) {
      for (const exhibitor of event.exhibitorsData.exhibitors) {
        const companyMatch =
          exhibitor.companyName?.toLowerCase().includes(keywordLower) ||
          exhibitor.companyDescription?.toLowerCase().includes(keywordLower) ||
          exhibitor.email?.toLowerCase().includes(keywordLower) ||
          exhibitor.mobile?.toLowerCase().includes(keywordLower) ||
          exhibitor.website?.toLowerCase().includes(keywordLower) ||
          (exhibitor.boothNumber && exhibitor.boothNumber.toString().toLowerCase().includes(keywordLower));
        let staffMatch = false;
        if (exhibitor.eventStaff && Array.isArray(exhibitor.eventStaff)) {
          for (const staff of exhibitor.eventStaff) {
            if (
              staff.firstName?.toLowerCase().includes(keywordLower) ||
              staff.lastName?.toLowerCase().includes(keywordLower) ||
              staff.email?.toLowerCase().includes(keywordLower) ||
              staff.mobile?.toLowerCase().includes(keywordLower)
            ) {
              staffMatch = true;
              break;
            }
          }
        }
        if (companyMatch || staffMatch) {
          result.matchedExhibitors.push({
            ...exhibitor,
            eventId: event.id,
            eventName: event.name
          });
          result.hasMatch = true;
        }
      }
    }

           // Check survey sessions
      if (event.surveyDetails) {
        if (event.surveyDetails.title?.toLowerCase().includes(keywordLower) ||
            event.surveyDetails.description?.toLowerCase().includes(keywordLower)) {
          result.matchedSurveySessions.push({
            ...event.surveyDetails,
            eventId: event.id,
            eventName: event.name
          });
          result.hasMatch = true;
        }
        
        // Check individual survey sessions
        if (event.surveyDetails.sessions && Array.isArray(event.surveyDetails.sessions)) {
          for (const session of event.surveyDetails.sessions) {
            if (session.name?.toLowerCase().includes(keywordLower) ||
                session.description?.toLowerCase().includes(keywordLower)) {
              result.matchedSurveySessions.push({
                ...session,
                surveyId: event.surveyDetails.id,
                surveyTitle: event.surveyDetails.title,
                eventId: event.id,
                eventName: event.name
              });
              result.hasMatch = true;
            }
          }
        }
      }

     return result;
  }

}
