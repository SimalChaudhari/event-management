// src/services/event.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventDto, EventType } from './event.dto';
import { Event, EventExhibitor } from './event.entity';
import { EventBooth } from './event-booth.entity';
import { Between, Not, In } from 'typeorm';
import { UserEntity, UserRole } from '../user/users.entity';
import { EventSpeaker, EventCategory } from './event-speaker.entity';
import { Category } from 'category/category.entity';
import path from 'path';
import * as fs from 'fs';
import { getEventColor } from 'utils/event-color.util';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
  ForeignKeyConstraintException,
} from '../utils/exceptions/custom-exceptions';
import { SurveyUtils } from '../utils/survey-utils';
import { UserUtils } from '../utils/user.utils';
import { EmailService } from '../service/email.service';
import { EmailTemplateUtils } from '../utils/email-templates.utils';

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
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(FavoriteEvent)
    private favoriteEventRepository: Repository<FavoriteEvent>,
    private readonly errorHandler: ErrorHandlerService,
    private readonly surveyUtils: SurveyUtils,
    private readonly emailService: EmailService,
  ) {}

  async createEvent(eventDto: EventDto) {
    try {
      // Check if event name already exists
      const existingEvent = await this.eventRepository.findOne({
        where: { name: eventDto.name },
      });
      if (existingEvent) {
        throw new DuplicateResourceException(`Event ${eventDto.name}`);
      }

      // Validate all IDs before creating the event
      const validationErrors = [];

      // Validate category IDs if provided
      if (eventDto.categoryIds) {
        const categoryIdsArray = eventDto.categoryIds.split(',');
        for (const categoryId of categoryIdsArray) {
          const categoryExists = await this.categoryRepository.findOne({
            where: { id: categoryId.trim() },
          });
          if (!categoryExists) {
            validationErrors.push(
              `Category with ID "${categoryId}" does not exist`,
            );
          }
        }
      }

      // Validate speaker IDs if provided
      if (eventDto.speakerIds) {
        const speakerIdsArray = eventDto.speakerIds.split(',');
        for (const speakerId of speakerIdsArray) {
          const speakerExists = await this.userRepository.findOne({
            where: { id: speakerId.trim(), role: UserRole.Speaker },
          });
          if (!speakerExists) {
            validationErrors.push(
              `Speaker with ID "${speakerId}" does not exist`,
            );
          }
        }
      }

      // Validate exhibitor IDs if provided
      if (eventDto.exhibitorIds) {
        const exhibitorIdsArray = eventDto.exhibitorIds.split(',');
        for (const exhibitorId of exhibitorIdsArray) {
          const exhibitorExists = await this.exhibitorRepository.findOne({
            where: { id: exhibitorId.trim() },
          });
          if (!exhibitorExists) {
            validationErrors.push(
              `Exhibitor with ID "${exhibitorId}" does not exist`,
            );
          }
        }
      }

      // If there are validation errors, throw them
      if (validationErrors.length > 0) {
        throw new ValidationException(
          'Invalid Category, Speaker, or Exhibitor references',
          validationErrors,
        );
      }

      const today = new Date();
      const startDateTime = new Date(`${eventDto.startDate}T${eventDto.startTime}`);
      const endDateTime = new Date(`${eventDto.endDate}T${eventDto.endTime}`);

      if (startDateTime < today)
        throw new ValidationException('Start date and time cannot be in the past');

      if (endDateTime <= startDateTime)
        throw new ValidationException('End date and time must be after start date and time');

      // Additional validation for same day events
      const startDateOnly = new Date(startDateTime.toDateString());
      const endDateOnly = new Date(endDateTime.toDateString());

      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        const startTimeInMinutes = startDateTime.getHours() * 60 + startDateTime.getMinutes();
        const endTimeInMinutes = endDateTime.getHours() * 60 + endDateTime.getMinutes();
        
        if (endTimeInMinutes <= startTimeInMinutes) {
          throw new ValidationException(
            'For events on the same day, end time must be after start time. ' +
            'If you want the event to end the next day, please set the end date to the next day.'
          );
        }
      }

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

      if (
        eventDto.latitude &&
        (eventDto.latitude < -90 || eventDto.latitude > 90)
      ) {
        throw new ValidationException('Invalid latitude value');
      }
      if (
        eventDto.longitude &&
        (eventDto.longitude < -180 || eventDto.longitude > 180)
      ) {
        throw new ValidationException('Invalid longitude value');
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

            // Create EventExhibitor record
            const eventExhibitor = new EventExhibitor();
            eventExhibitor.eventId = savedEvent.id;
            eventExhibitor.exhibitorId = exhibitorId.trim();
            await this.eventExhibitorRepository.save(eventExhibitor);

            // Create EventBooth record with unique code
            const eventBooth = new EventBooth();
            eventBooth.eventId = savedEvent.id;
            eventBooth.exhibitorId = exhibitorId.trim();
            eventBooth.uniqueCode = this.generateUniqueCode();
            await this.eventBoothRepository.save(eventBooth);

                         // Send email to exhibitor if email exists
             if (exhibitor && exhibitor.email) {
               await this.sendBoothCodeEmail(
                 exhibitor.email,
                 eventBooth.uniqueCode,
                 savedEvent.name,
                 this.formatDateForEmail(savedEvent.startDate),
                 (savedEvent.venue || savedEvent.location) || 'To be announced',
               );
             }
          }),
        );
      }

      return savedEvent;
    } catch (error) {
      if (
        error instanceof DuplicateResourceException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event creation');
    }
  }


  async getAllEvents(
    filters: {
      keyword?: string;
      startDate?: string;
      endDate?: string;
      type?: EventType;
      upcoming?: boolean;
      category?: string;
      location?: string;
      venue?: string;
      country?: string;
      minPrice?: number;
      maxPrice?: number;
      currency?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      include?: string;
    },
    userId?: string,
    userRole?: string,
  ) {
    try {
      // Validate EventType enum if provided
      if (filters.type) {
        const validTypes = Object.values(EventType);
        if (!validTypes.includes(filters.type)) {
          throw new ValidationException(
            `Invalid event type. Valid types are: ${validTypes.join(', ')}`,
          );
        }
      }

      const queryBuilder = this.eventRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.eventSpeakers', 'eventSpeaker')
        .leftJoinAndSelect('eventSpeaker.speaker', 'speaker')
        .leftJoinAndSelect('event.category', 'eventCategory')
        .leftJoinAndSelect('eventCategory.category', 'category')
        .leftJoinAndSelect('event.eventExhibitors', 'eventExhibitor')
        .leftJoinAndSelect('eventExhibitor.exhibitor', 'exhibitor')
        .leftJoinAndSelect('exhibitor.promotionalOffers', 'promotionalOffers')
        .leftJoinAndSelect('event.galleries', 'galleries');

      // Enhanced keyword search with multiple strategies
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase().trim();
        const searchTerms = this.generateSearchTerms(keyword);
        
        // Build complex search query with multiple strategies
        const searchConditions: string[] = [];
        const searchParams: { [key: string]: string } = {};
        
        // Exact match (highest priority)
        searchConditions.push(
          'LOWER(event.name) = :exactName OR LOWER(event.venue) = :exactVenue OR LOWER(event.location) = :exactLocation'
        );
        searchParams.exactName = keyword;
        searchParams.exactVenue = keyword;
        searchParams.exactLocation = keyword;
        
        // Starts with (high priority)
        searchConditions.push(
          'LOWER(event.name) LIKE :startsWithName OR LOWER(event.venue) LIKE :startsWithVenue OR LOWER(event.location) LIKE :startsWithLocation'
        );
        searchParams.startsWithName = `${keyword}%`;
        searchParams.startsWithVenue = `${keyword}%`;
        searchParams.startsWithLocation = `${keyword}%`;
        
        // Contains (medium priority)
        searchConditions.push(
          'LOWER(event.name) LIKE :containsName OR LOWER(event.description) LIKE :containsDesc OR LOWER(event.venue) LIKE :containsVenue OR LOWER(event.location) LIKE :containsLocation OR LOWER(event.country) LIKE :containsCountry'
        );
        searchParams.containsName = `%${keyword}%`;
        searchParams.containsDesc = `%${keyword}%`;
        searchParams.containsVenue = `%${keyword}%`;
        searchParams.containsLocation = `%${keyword}%`;
        searchParams.containsCountry = `%${keyword}%`;
        
        // Price search (if keyword looks like a number)
        if (!isNaN(Number(keyword))) {
          searchConditions.push('CAST(event.price AS TEXT) LIKE :priceMatch');
          searchParams.priceMatch = `%${keyword}%`;
        }
        
        // Category search
        searchConditions.push('LOWER(category.name) LIKE :categoryMatch');
        searchParams.categoryMatch = `%${keyword}%`;
        
        // Speaker name search
        searchConditions.push('LOWER(speaker.firstName) LIKE :speakerMatch OR LOWER(speaker.lastName) LIKE :speakerMatch');
        searchParams.speakerMatch = `%${keyword}%`;
        
        // Exhibitor company search
        searchConditions.push('LOWER(exhibitor.companyName) LIKE :exhibitorMatch');
        searchParams.exhibitorMatch = `%${keyword}%`;
        
        // Combine all search conditions with OR
        queryBuilder.where(`(${searchConditions.join(' OR ')})`, searchParams);
      }

      // Enhanced location-based search
      if (filters.location || filters.venue || filters.country) {
        const locationConditions: string[] = [];
        const locationParams: { [key: string]: string } = {};
        
        if (filters.location) {
          locationConditions.push('LOWER(event.location) LIKE :locationMatch');
          locationParams.locationMatch = `%${filters.location.toLowerCase()}%`;
        }
        
        if (filters.venue) {
          locationConditions.push('LOWER(event.venue) LIKE :venueMatch');
          locationParams.venueMatch = `%${filters.venue.toLowerCase()}%`;
        }
        
        if (filters.country) {
          locationConditions.push('LOWER(event.country) LIKE :countryMatch');
          locationParams.countryMatch = `%${filters.country.toLowerCase()}%`;
        }
        
        if (locationConditions.length > 0) {
          queryBuilder.andWhere(`(${locationConditions.join(' OR ')})`, locationParams);
        }
      }

      // Date range filter - enhanced to handle various date formats
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere(
          'event.startDate >= :startDate AND event.endDate <= :endDate',
          {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        );
      } else if (filters.startDate) {
        queryBuilder.andWhere('event.startDate >= :startDate', {
          startDate: filters.startDate,
        });
      } else if (filters.endDate) {
        queryBuilder.andWhere('event.endDate <= :endDate', {
          endDate: filters.endDate,
        });
      }

      // Type filter
      if (filters.type) {
        queryBuilder.andWhere('event.type = :type', { type: filters.type });
      }

      // Category filter - using TypeORM's built-in join approach
      if (filters.category) {
        const categoryName = filters.category.toLowerCase();
        queryBuilder.andWhere('LOWER(category.name) LIKE :categoryName', {
          categoryName: `%${categoryName}%`,
        });
      }

      // Price range filter
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
          queryBuilder.andWhere('event.price BETWEEN :minPrice AND :maxPrice', {
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
          });
        } else if (filters.minPrice !== undefined) {
          queryBuilder.andWhere('event.price >= :minPrice', { minPrice: filters.minPrice });
        } else if (filters.maxPrice !== undefined) {
          queryBuilder.andWhere('event.price <= :maxPrice', { maxPrice: filters.maxPrice });
        }
      }

      // Currency filter
      if (filters.currency) {
        queryBuilder.andWhere('LOWER(event.currency) = :currency', {
          currency: filters.currency.toLowerCase(),
        });
      }

      // Upcoming events filter
      if (filters.upcoming) {
        const today = new Date();
        queryBuilder.andWhere('event.startDate >= :today', { today: today });
      }

      // First, always filter for upcoming events if category is provided
      if (filters.category) {
        const today = new Date();
        queryBuilder.andWhere('event.startDate >= :today', { today: today });
      }

      // Apply sorting
      if (filters.sortBy) {
        const validSortFields = ['name', 'startDate', 'endDate', 'price', 'createdAt', 'updatedAt'];
        if (validSortFields.includes(filters.sortBy)) {
          const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';
          queryBuilder.orderBy(`event.${filters.sortBy}`, sortOrder);
        }
      } else {
        // Default sorting by start date
        queryBuilder.orderBy('event.startDate', 'ASC');
      }

      // Apply pagination
      if (filters.page && filters.limit) {
        const offset = (filters.page - 1) * filters.limit;
        queryBuilder.offset(offset).limit(filters.limit);
      }

      let events = await queryBuilder.getMany();

      // If no results with current filters, try fallback search
      if (events.length === 0 && filters.keyword) {
        events = await this.fallbackSearch(filters.keyword, userId, userRole);
      }

      // Add attendance count, favorite status, and matched fields to each event
      const eventsWithAttendance = await Promise.all(
        events.map(async (event) => {
          const attendanceCount = await this.getEventAttendanceCount(event.id);
          const surveyDetails = await this.surveyUtils.getSurveyDetailsByEventId(event.id);

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

          const {
            eventSpeakers,
            category,
            eventExhibitors,
            eventStampDescription,
            eventStampImages,
            documents, // Remove original documents
            documentNames, // Remove original documentNames
            ...eventData
          } = event;

          // Check if event is favorited by user
          let isFavorite = false;
          if (userId) {
            const favorite = await this.favoriteEventRepository.findOne({
              where: { userId, eventId: event.id },
            });
            isFavorite = !!favorite;
          }

          // Check if user has registered for this event
          let isRegistered = false;
          if (userId) {
            const registration = await this.registerEventRepository.findOne({
              where: {
                userId: userId,
                eventId: event.id,
                isRegister: true, // Only count active registrations
              },
            });
            isRegistered = !!registration;
          }

          // Find which fields matched the keyword search with relevance scoring
          let matchedFields: string[] = [];
          let searchRelevance = 0;
          if (filters.keyword) {
            const searchResult = this.findMatchedFieldsWithRelevance(event, filters.keyword);
            matchedFields = searchResult.fields;
            searchRelevance = searchResult.relevance;
          }

          const { exhibitorDescription, ...eventFiltered } = eventData;
          // Convert eventStamps array to single object
          return {
            ...eventFiltered,
            color: getEventColor(event.type),
            speakersData: eventSpeakers.map((es) => UserUtils.getBasicSpeakerInfo(es.speaker)),
            categoriesData: category?.map((ec) => ec.category) || [],
            documents: formattedDocuments,
            eventStamps: {
              description: event.eventStampDescription,
              images: event.eventStampImages,
            },
            exhibitorsData: {
              exhibitorDescription: exhibitorDescription || '',
              exhibitors: eventExhibitors.map((ee) => {
                return {
                  ...ee.exhibitor,
                  promotionalOffers: ee.exhibitor.promotionalOffers || [],
                };
              }),
            },
            attendanceCount: attendanceCount,
            surveyDetails: surveyDetails,
            hasSurvey: !!surveyDetails,
            isFavorite: isFavorite,
            isRegistered: isRegistered,
            searchFields: matchedFields, // Add matched fields to response
            searchRelevance: searchRelevance, // Add relevance score
          };
        }),
      );

      // Sort by relevance if keyword search was used
      if (filters.keyword) {
        eventsWithAttendance.sort((a, b) => (b.searchRelevance || 0) - (a.searchRelevance || 0));
      }

      return eventsWithAttendance;
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Events retrieval');
    }
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
      this.errorHandler.handleDatabaseError(error, 'Event retrieval by ID');
    }
  }

  async getEventById(id: string, userId?: string, userRole?: string) {
    try {
      const event = await this.eventRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.eventSpeakers', 'eventSpeaker')
        .leftJoinAndSelect('eventSpeaker.speaker', 'speaker')
        .leftJoinAndSelect('event.category', 'eventCategory')
        .leftJoinAndSelect('eventCategory.category', 'category')
        .leftJoinAndSelect('event.eventExhibitors', 'eventExhibitor')
        .leftJoinAndSelect('eventExhibitor.exhibitor', 'exhibitor')

        .leftJoinAndSelect('event.galleries', 'galleries')
        .leftJoinAndSelect('exhibitor.promotionalOffers', 'promotionalOffers')
        .where('event.id = :id', { id })
        .getOne();

      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      const { eventSpeakers, category, eventExhibitors, ...eventData } = event;
      const attendanceCount = await this.getEventAttendanceCount(id);

      // Get survey details for this event
      const surveyDetails = await this.surveyUtils.getSurveyDetailsByEventId(id);

      // Check if event is favorited by user
      let isFavorite = false;
      if (userId) {
        const favorite = await this.favoriteEventRepository.findOne({
          where: { userId, eventId: id },
        });
        isFavorite = !!favorite;
      }

 
      // Check if user has registered for this event
      let isRegistered = false;
      if (userId) {
        const registration = await this.registerEventRepository.findOne({
          where: {
            userId: userId,
            eventId: id,
            isRegister: true, // Only count active registrations
          },
        });
        isRegistered = !!registration;
      }

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

      const {
        exhibitorDescription,
        eventStampDescription,
        eventStampImages,
        documents, // Remove original documents
        documentNames, // Remove original documentNames
        ...eventFiltered
      } = eventData;

      return {
        ...eventFiltered,
        color: getEventColor(event.type),
        speakers: eventSpeakers.map((es) => UserUtils.getPublicSpeakerInfo(es.speaker)),
        categories: category?.map((ec) => ec.category) || [],
        documents: formattedDocuments, // New formatted documents
        eventStamps: {
          description: event.eventStampDescription,
          images: event.eventStampImages,
        },
        exhibitors: {
          exhibitorDescription: exhibitorDescription || '',
          exhibitors: eventExhibitors.map((ee) => {
            return {
              ...ee.exhibitor,
              promotionalOffers: ee.exhibitor.promotionalOffers || [],
            };
          }),
        },
        attendanceCount: attendanceCount,
        surveyDetails: surveyDetails,
        hasSurvey: !!surveyDetails,
        isFavorite: isFavorite,
        isRegistered: isRegistered,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event retrieval by ID');
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
        const existingEvent = await this.eventRepository.findOne({
          where: { name: eventDto.name, id: Not(id) },
        });
        if (existingEvent) {
          throw new DuplicateResourceException(`Event ${eventDto.name}`);
        }
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

      Object.assign(event, eventDto);
      const updatedEvent = await this.eventRepository.save(event);

      // Update associations if provided
      await this.updateEventAssociations(id, eventDto);

      return updatedEvent;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event update');
    }
  }

  async deleteEvent(id: string) {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Check if event has registrations
      const registrationCount = await this.errorHandler.getRelatedDataCount(
        this.registerEventRepository,
        { eventId: id },
        'Event Registrations',
      );

      // Delete associated EventBooth records
      await this.eventBoothRepository.delete({ eventId: id });

      if (registrationCount > 0) {
        throw new ForeignKeyConstraintException(
          'Event',
          'Registration',
          registrationCount,
          'delete',
        );
      }

      // Delete associated files
      this.deleteEventFiles(event);

      await this.eventRepository.remove(event);
      return { message: 'Event deleted successfully' };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForeignKeyConstraintException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event deletion');
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
      this.errorHandler.handleDatabaseError(error, 'Event images update');
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
      this.errorHandler.handleDatabaseError(error, 'Event documents update');
    }
  }

  async updateEventStampImages(
    id: string,
    eventStampImages: string[],
  ): Promise<Partial<Event>> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      if (!event) {
        throw new ResourceNotFoundException('Event', id);
      }

      event.eventStampImages = eventStampImages;
      return await this.eventRepository.save(event);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event stamp images update');
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
      this.errorHandler.handleDatabaseError(error, 'Event floor plan update');
    }
  }

  // Helper methods
  private findMatchedFields(event: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();

    const fieldsToCheck = [
      'name',
      'description',
      'venue',
      'location',
      'country',
      'type',
      'price',
      'currency',
      'latitude',
      'longitude',
    ];

    fieldsToCheck.forEach((field) => {
      if (
        event[field] &&
        event[field].toString().toLowerCase().includes(keywordLower)
      ) {
        matchedFields.push(field);
      }
    });

    return matchedFields;
  }

  private findMatchedFieldsWithRelevance(event: any, keyword: string): { fields: string[], relevance: number } {
    const matchedFields: string[] = [];
    let relevance = 0;
    const keywordLower = keyword.toLowerCase();

    // Define field weights for relevance scoring
    const fieldWeights: { [key: string]: number } = {
      name: 100,           // Event name is most important
      venue: 80,           // Venue is very important
      location: 80,        // Location is very important
      description: 60,     // Description is moderately important
      country: 50,         // Country is somewhat important
      type: 40,            // Event type is less important
      price: 30,           // Price is less important
      currency: 20,        // Currency is least important
    };

    // Check each field and calculate relevance
    Object.keys(fieldWeights).forEach((field) => {
      if (event[field]) {
        const fieldValue = event[field].toString().toLowerCase();
        
        // Exact match gets highest score
        if (fieldValue === keywordLower) {
          matchedFields.push(field);
          relevance += fieldWeights[field] * 2;
        }
        // Starts with gets high score
        else if (fieldValue.startsWith(keywordLower)) {
          matchedFields.push(field);
          relevance += fieldWeights[field] * 1.5;
        }
        // Contains gets medium score
        else if (fieldValue.includes(keywordLower)) {
          matchedFields.push(field);
          relevance += fieldWeights[field];
        }
        // Partial word match gets lower score
        else if (this.hasPartialWordMatch(fieldValue, keywordLower)) {
          matchedFields.push(field);
          relevance += fieldWeights[field] * 0.7;
        }
      }
    });

    // Check category names
    if (event.categoriesData && event.categoriesData.length > 0) {
      event.categoriesData.forEach((cat: any) => {
        if (cat.name && cat.name.toLowerCase().includes(keywordLower)) {
          if (!matchedFields.includes('category')) {
            matchedFields.push('category');
            relevance += 70; // Category matches are important
          }
        }
      });
    }

    // Check speaker names
    if (event.speakersData && event.speakersData.length > 0) {
      event.speakersData.forEach((speaker: any) => {
        const speakerName = `${speaker.firstName || ''} ${speaker.lastName || ''}`.toLowerCase();
        if (speakerName.includes(keywordLower)) {
          if (!matchedFields.includes('speaker')) {
            matchedFields.push('speaker');
            relevance += 60; // Speaker matches are important
          }
        }
      });
    }

    // Check exhibitor company names
    if (event.exhibitorsData && event.exhibitorsData.exhibitors && event.exhibitorsData.exhibitors.length > 0) {
      event.exhibitorsData.exhibitors.forEach((exhibitor: any) => {
        if (exhibitor.companyName && exhibitor.companyName.toLowerCase().includes(keywordLower)) {
          if (!matchedFields.includes('exhibitor')) {
            matchedFields.push('exhibitor');
            relevance += 65; // Exhibitor matches are important
          }
        }
      });
    }

    return { fields: matchedFields, relevance: Math.round(relevance) };
  }

  private hasPartialWordMatch(text: string, keyword: string): boolean {
    const words = text.split(/\s+/);
    const keywordWords = keyword.split(/\s+/);
    
    return keywordWords.some(kw => 
      words.some(word => word.includes(kw) || kw.includes(word))
    );
  }

  private generateSearchTerms(keyword: string): string[] {
    const terms: string[] = [];
    const keywordLower = keyword.toLowerCase().trim();

    // Add original keyword
    terms.push(keywordLower);

    // Remove common words and generate variations
    const commonWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
    const keywordWords = keywordLower.split(/\s+/).filter(word => 
      word.length > 2 && !commonWords.includes(word)
    );

    // Add variations without common words
    if (keywordWords.length > 1) {
      terms.push(keywordWords.join(' '));
    }

    // Add partial matches for longer keywords
    if (keywordLower.length > 3) {
      for (let i = 3; i <= keywordLower.length; i++) {
        terms.push(keywordLower.substring(0, i));
      }
    }

    // Add phonetic variations (simple implementation)
    const phoneticVariations = this.generatePhoneticVariations(keywordLower);
    terms.push(...phoneticVariations);

    return [...new Set(terms)]; // Remove duplicates
  }

  private generatePhoneticVariations(keyword: string): string[] {
    const variations: string[] = [];
    
    // Common phonetic substitutions
    const phoneticMap: { [key: string]: string[] } = {
      'c': ['k', 's'],
      'k': ['c'],
      's': ['c', 'z'],
      'z': ['s'],
      'f': ['ph'],
      'ph': ['f'],
      'j': ['g'],
      'g': ['j'],
      'q': ['kw'],
      'x': ['ks'],
      'w': ['u'],
      'u': ['w'],
    };

    // Generate variations with phonetic substitutions
    for (let i = 0; i < keyword.length; i++) {
      const char = keyword[i];
      if (phoneticMap[char]) {
        phoneticMap[char].forEach(substitution => {
          const variation = keyword.substring(0, i) + substitution + keyword.substring(i + 1);
          variations.push(variation);
        });
      }
    }

    return variations;
  }

  private async fallbackSearch(keyword: string, userId?: string, userRole?: string): Promise<Event[]> {
    try {
      // Try broader search with relaxed criteria
      const queryBuilder = this.eventRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.eventSpeakers', 'eventSpeaker')
        .leftJoinAndSelect('eventSpeaker.speaker', 'speaker')
        .leftJoinAndSelect('event.category', 'eventCategory')
        .leftJoinAndSelect('eventCategory.category', 'category')
        .leftJoinAndSelect('event.eventExhibitors', 'eventExhibitor')
        .leftJoinAndSelect('eventExhibitor.exhibitor', 'exhibitor')
        .leftJoinAndSelect('exhibitor.promotionalOffers', 'promotionalOffers')
        .leftJoinAndSelect('event.galleries', 'galleries');

      // Generate multiple search terms for broader matching
      const searchTerms = this.generateSearchTerms(keyword);
      const searchConditions: string[] = [];
      const searchParams: { [key: string]: string } = {};

      // Build broader search conditions
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        searchConditions.push(
          `LOWER(event.name) LIKE :${paramName} OR ` +
          `LOWER(event.description) LIKE :${paramName} OR ` +
          `LOWER(event.venue) LIKE :${paramName} OR ` +
          `LOWER(event.location) LIKE :${paramName} OR ` +
          `LOWER(event.country) LIKE :${paramName} OR ` +
          `LOWER(category.name) LIKE :${paramName} OR ` +
          `LOWER(speaker.firstName) LIKE :${paramName} OR ` +
          `LOWER(speaker.lastName) LIKE :${paramName} OR ` +
          `LOWER(exhibitor.companyName) LIKE :${paramName}`
        );
        searchParams[paramName] = `%${term}%`;
      });

      if (searchConditions.length > 0) {
        queryBuilder.where(`(${searchConditions.join(' OR ')})`, searchParams);
      }

      // Limit results for fallback search
      queryBuilder.limit(20);
      queryBuilder.orderBy('event.startDate', 'ASC');

      return await queryBuilder.getMany();
    } catch (error) {
      console.error('Fallback search failed:', error);
      return [];
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
      const currentEvent = await this.eventRepository.findOne({ where: { id: eventId } });
      
      // Get existing exhibitor IDs for this event
      const existingExhibitorIds = await this.eventExhibitorRepository.find({
        where: { eventId },
        select: ['exhibitorId'],
      });
      const existingExhibitorIdSet = new Set(existingExhibitorIds.map(ee => ee.exhibitorId));
      
      if (eventDto.exhibitorIds) {
        const newExhibitorIdsArray = eventDto.exhibitorIds.split(',');
        
        // Process each exhibitor ID
        await Promise.all(
          newExhibitorIdsArray.map(async (exhibitorId) => {
            const trimmedExhibitorId = exhibitorId.trim();
            const isNewExhibitor = !existingExhibitorIdSet.has(trimmedExhibitorId);
            
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

              // Create new EventBooth record with unique code
              const eventBooth = new EventBooth();
              eventBooth.eventId = eventId;
              eventBooth.exhibitorId = trimmedExhibitorId;
              eventBooth.uniqueCode = this.generateUniqueCode();
              await this.eventBoothRepository.save(eventBooth);

              // Send email only to new exhibitors
              if (exhibitor && exhibitor.email && currentEvent) {
                await this.sendBoothCodeEmail(
                  exhibitor.email,
                  eventBooth.uniqueCode,
                  currentEvent.name,
                  this.formatDateForEmail(currentEvent.startDate),
                  (currentEvent.venue || currentEvent.location) || 'To be announced',
                );
              }
            }
            // If exhibitor already exists, no need to recreate booth or send email
          }),
        );
        
                 // Remove exhibitors who are no longer in the list
         const newExhibitorIdSet = new Set(newExhibitorIdsArray.map(id => id.trim()));
         const exhibitorsToRemove = existingExhibitorIds.filter(
           ee => ee.exhibitorId && !newExhibitorIdSet.has(ee.exhibitorId)
         );
         
         if (exhibitorsToRemove.length > 0) {
           // Get booth details and exhibitor information for removal emails
           const boothsToRemove = await this.eventBoothRepository.find({
             where: {
               eventId,
               exhibitorId: In(exhibitorsToRemove.map(ee => ee.exhibitorId!).filter(id => id !== undefined)),
             },
             relations: ['exhibitor'],
           });

           // Send removal emails before deleting records
           await Promise.all(
             boothsToRemove.map(async (booth) => {
               if (booth.exhibitor && booth.exhibitor.email && currentEvent) {
                 await this.sendBoothRemovalEmail(
                   booth.exhibitor.email,
                   booth.uniqueCode,
                   currentEvent.name,
                   this.formatDateForEmail(currentEvent.startDate),
                   (currentEvent.venue || currentEvent.location) || 'To be announced',
                 );
               }
             }),
           );

           const exhibitorIdsToRemove = exhibitorsToRemove
             .map(ee => ee.exhibitorId)
             .filter((id): id is string => id !== undefined);
           
           if (exhibitorIdsToRemove.length > 0) {
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
         // Get booth details and exhibitor information for removal emails
         const allBoothsToRemove = await this.eventBoothRepository.find({
           where: { eventId },
           relations: ['exhibitor'],
         });

         // Send removal emails before deleting records
         await Promise.all(
           allBoothsToRemove.map(async (booth) => {
             if (booth.exhibitor && booth.exhibitor.email && currentEvent) {
               await this.sendBoothRemovalEmail(
                 booth.exhibitor.email,
                 booth.uniqueCode,
                 currentEvent.name,
                 this.formatDateForEmail(currentEvent.startDate),
                 (currentEvent.venue || currentEvent.location) || 'To be announced',
               );
             }
           }),
         );

         // Delete all EventBooth and EventExhibitor records
         await this.eventBoothRepository.delete({ eventId });
         await this.eventExhibitorRepository.delete({ eventId });
       }
    }
  }

  private async validateEventReferences(eventDto: Partial<EventDto>) {
    const validationErrors = [];

    // Validate category IDs if provided
    if (eventDto.categoryIds) {
      const categoryIdsArray = eventDto.categoryIds.split(',');
      for (const categoryId of categoryIdsArray) {
        const categoryExists = await this.categoryRepository.findOne({
          where: { id: categoryId.trim() },
        });
        if (!categoryExists) {
          validationErrors.push(
            `Category with ID "${categoryId}" does not exist`,
          );
        }
      }
    }

    // Similar validations for speakers and exhibitors...
    if (validationErrors.length > 0) {
      throw new ValidationException('Invalid references', validationErrors);
    }
  }

  private validateEventDates(
    eventDto: Partial<EventDto>,
    existingEvent?: Event,
  ) {
    const today = new Date();
    
    // Get start and end dates with times
    const startDateTime = eventDto.startDate && eventDto.startTime
      ? new Date(`${eventDto.startDate}T${eventDto.startTime}`)
      : existingEvent
        ? new Date(`${existingEvent.startDate}T${existingEvent.startTime}`)
        : null;
        
    const endDateTime = eventDto.endDate && eventDto.endTime
      ? new Date(`${eventDto.endDate}T${eventDto.endTime}`)
      : existingEvent
        ? new Date(`${existingEvent.endDate}T${existingEvent.endTime}`)
        : null;

    if (startDateTime && startDateTime < today) {
      throw new ValidationException('Start date and time cannot be in the past');
    }
    
    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      throw new ValidationException('End date and time must be after start date and time');
    }
    
    // Additional validation for same day events with AM/PM time conflicts
    if (startDateTime && endDateTime) {
      const startDateOnly = new Date(startDateTime.toDateString());
      const endDateOnly = new Date(endDateTime.toDateString());
      
      // If dates are the same, check if end time is before start time
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        const startTimeInMinutes = startDateTime.getHours() * 60 + startDateTime.getMinutes();
        const endTimeInMinutes = endDateTime.getHours() * 60 + endDateTime.getMinutes();
        
        if (endTimeInMinutes <= startTimeInMinutes) {
          throw new ValidationException(
            'For events on the same day, end time must be after start time. ' +
            'If you want the event to end the next day, please set the end date to the next day.'
          );
        }
      }
    }
  }

  private async checkLocationConflict(
    eventDto: Partial<EventDto>,
    excludeId?: string,
  ) {
    if (!eventDto.startDate || !eventDto.endDate) {
      throw new ValidationException('Start date and end date must be provided');
    }

    const whereClause: any = {
      location: eventDto.location,
      startDate: Between(
        new Date(eventDto.startDate),
        new Date(eventDto.endDate),
      ),
      endDate: Between(
        new Date(eventDto.startDate),
        new Date(eventDto.endDate),
      ),
    };

    if (excludeId) {
      whereClause.id = Not(excludeId);
    }

    const conflictingEvents = await this.eventRepository.find({
      where: whereClause,
    });
    if (conflictingEvents.length > 0) {
      throw new ValidationException(
        'Another event is already scheduled at this location during these dates and times',
      );
    }
  }

  private validateCoordinates(eventDto: Partial<EventDto>) {
    if (
      eventDto.latitude &&
      (eventDto.latitude < -90 || eventDto.latitude > 90)
    ) {
      throw new ValidationException('Invalid latitude value');
    }
    if (
      eventDto.longitude &&
      (eventDto.longitude < -180 || eventDto.longitude > 180)
    ) {
      throw new ValidationException('Invalid longitude value');
    }
  }

  // Get event booths by event ID
  async getEventBooths(eventId: string): Promise<any[]> {
    try {
      const eventBooths = await this.eventBoothRepository.find({
        where: { eventId, isActive: true },
        relations: ['exhibitor'],
      });

      // Format the response to include exhibitor details
      return eventBooths.map(eventBooth => ({
        id: eventBooth.id,
        eventId: eventBooth.eventId,
        exhibitorId: eventBooth.exhibitorId,
        uniqueCode: eventBooth.uniqueCode,
        isActive: eventBooth.isActive,
        createdAt: eventBooth.createdAt,
        updatedAt: eventBooth.updatedAt,
        exhibitor: eventBooth.exhibitor ? {
          id: eventBooth.exhibitor.id,
          companyName: eventBooth.exhibitor.companyName,
          companyDescription: eventBooth.exhibitor.companyDescription,
          logo: eventBooth.exhibitor.logo,
          email: eventBooth.exhibitor.email,
          mobile: eventBooth.exhibitor.mobile,
          uen: eventBooth.exhibitor.uen,
        } : null,
      }));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Event booths retrieval');
    }
  }

  // Send booth code email to exhibitor
  private async sendBoothCodeEmail(
    exhibitorEmail: string,
    uniqueCode: string,
    eventName: string,
    eventStartDate: string,
    eventVenue: string,
  ): Promise<void> {
    try {
      const subject = 'Your Event Booth Access Code';
      const html = EmailTemplateUtils.generateBoothCodeEmail(
        uniqueCode,
        eventName,
        eventStartDate,
        eventVenue,
      );

      await this.emailService.sendEmail(exhibitorEmail, subject, html);
      console.log(`Booth code email sent to ${exhibitorEmail} for event: ${eventName}`);
    } catch (error) {
      console.error('Failed to send booth code email:', error);
      // Don't throw error as email sending failure shouldn't break the main flow
      this.errorHandler.logError(error, 'Booth code email sending', undefined);
    }
  }

  // Send booth removal email to exhibitor
  private async sendBoothRemovalEmail(
    exhibitorEmail: string,
    uniqueCode: string,
    eventName: string,
    eventStartDate: string,
    eventVenue: string,
  ): Promise<void> {
    try {
      const subject = 'Booth Access Revoked - Event Update';
      const html = EmailTemplateUtils.generateBoothRemovalEmail(
        eventName,
        eventStartDate,
        eventVenue,
        uniqueCode,
      );

      await this.emailService.sendEmail(exhibitorEmail, subject, html);
      console.log(`Booth removal email sent to ${exhibitorEmail} for event: ${eventName}`);
    } catch (error) {
      console.error('Failed to send booth removal email:', error);
      // Don't throw error as email sending failure shouldn't break the main flow
      this.errorHandler.logError(error, 'Booth removal email sending', undefined);
    }
  }

  // Generate unique code for event booth
  private generateUniqueCode(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `EB${timestamp}${randomStr}`.toUpperCase();
  }

  // Format date for email display - handles both Date objects and string dates
  private formatDateForEmail(date: Date | string): string {
    if (date instanceof Date) {
      return date.toDateString();
    }
    
    // If it's a string, try to parse it and format it
    if (typeof date === 'string') {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toDateString();
        }
      } catch (error) {
        // If parsing fails, return the original string
        console.warn('Failed to parse date string:', date);
      }
      return date; // Return original string if parsing fails
    }
    
    return 'Date not available';
  }

  private deleteEventFiles(event: Event) {
    try {
      // Delete multiple images if they exist
      if (event.images && event.images.length > 0) {
        event.images.forEach((imagePath) => {
          const filePath = path.resolve(imagePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
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

      // Delete event stamp images if they exist
      if (event.eventStampImages && event.eventStampImages.length > 0) {
        event.eventStampImages.forEach((imagePath) => {
          const filePath = path.resolve(imagePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    } catch (fileError) {
      this.errorHandler.logError(fileError, 'Event file deletion', event.id);
      // Continue with event deletion even if file deletion fails
    }
  }


}
