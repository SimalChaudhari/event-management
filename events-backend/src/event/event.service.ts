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
import { Between, Not } from 'typeorm';
import { Speaker } from 'speaker/speaker.entity';
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
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(FavoriteEvent)
    private favoriteEventRepository: Repository<FavoriteEvent>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async createEvent(eventDto: EventDto) {
    try {
      // Check if event name already exists
      const existingEvent = await this.eventRepository.findOne({
        where: { name: eventDto.name },
      });
      if (existingEvent) {
        throw new DuplicateResourceException('Event', 'name', eventDto.name);
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
          const speakerExists = await this.speakerRepository.findOne({
            where: { id: speakerId.trim() },
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
      if (new Date(eventDto.startDate) < today)
        throw new ValidationException('Start date cannot be in the past');
      if (new Date(eventDto.endDate) < new Date(eventDto.startDate))
        throw new ValidationException('End date must be after start date');
      if (
        today.toDateString() === new Date(eventDto.startDate).toDateString() &&
        new Date(eventDto.endDate) <= today
      ) {
        throw new ValidationException(
          'If start date is today, end date must be at least tomorrow',
        );
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
            const eventExhibitor = new EventExhibitor();
            eventExhibitor.eventId = savedEvent.id;
            eventExhibitor.exhibitorId = exhibitorId.trim();
            await this.eventExhibitorRepository.save(eventExhibitor);
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

  // // Helper function to find which fields match the keyword
  // private findMatchedFields(event: any, keyword: string): string[] {
  //   const matchedFields: string[] = [];
  //   const keywordLower = keyword.toLowerCase();

  //   // Check each field for keyword match
  //   if (event.name && event.name.toLowerCase().includes(keywordLower)) {
  //     matchedFields.push('name');
  //   }
  //   if (
  //     event.description &&
  //     event.description.toLowerCase().includes(keywordLower)
  //   ) {
  //     matchedFields.push('description');
  //   }
  //   if (event.venue && event.venue.toLowerCase().includes(keywordLower)) {
  //     matchedFields.push('venue');
  //   }
  //   if (event.location && event.location.toLowerCase().includes(keywordLower)) {
  //     matchedFields.push('location');
  //   }
  //   if (event.country && event.country.toLowerCase().includes(keywordLower)) {
  //     matchedFields.push('country');
  //   }
  //   if (event.type && event.type.toLowerCase().includes(keywordLower)) {
  //     matchedFields.push('type');
  //   }
  //   if (
  //     event.price &&
  //     event.price.toString().toLowerCase().includes(keywordLower)
  //   ) {
  //     matchedFields.push('price');
  //   }
  //   if (event.currency && event.currency.toLowerCase().includes(keywordLower)) {
  //     matchedFields.push('currency');
  //   }
  //   if (
  //     event.latitude &&
  //     event.latitude.toString().toLowerCase().includes(keywordLower)
  //   ) {
  //     matchedFields.push('latitude');
  //   }
  //   if (
  //     event.longitude &&
  //     event.longitude.toString().toLowerCase().includes(keywordLower)
  //   ) {
  //     matchedFields.push('longitude');
  //   }

  //   return matchedFields;
  // }

  async getAllEvents(
    filters: {
      keyword?: string;
      startDate?: string;
      endDate?: string;
      type?: EventType;
      upcoming?: boolean;
      category?: string;
    },
    userId?: string,
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

      // First, always filter for upcoming events if category is provided
      if (filters.category) {
        const today = new Date();
        queryBuilder.andWhere('event.startDate >= :today', { today: today });
      }

      // Keyword search
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        queryBuilder.where(
          'LOWER(event.name) LIKE :keyword OR LOWER(event.description) LIKE :keyword OR LOWER(event.venue) LIKE :keyword OR LOWER(event.location) LIKE :keyword OR LOWER(event.country) LIKE :keyword OR LOWER(CAST(event.price AS TEXT)) LIKE :keyword OR LOWER(event.currency) LIKE :keyword OR LOWER(CAST(event.latitude AS TEXT)) LIKE :keyword OR LOWER(CAST(event.longitude AS TEXT)) LIKE :keyword',
          { keyword: `%${keyword}%` },
        );
      }

      // Date range filter - one line code to consider both start and end date
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere(
          'event.startDate >= :startDate AND event.endDate <= :endDate',
          {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        );
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

      if (filters.upcoming) {
        const today = new Date();
        queryBuilder.andWhere('event.startDate >= :today', { today: today });
      }

      const events = await queryBuilder.getMany();

      // Add attendance count, favorite status, and matched fields to each event
      const eventsWithAttendance = await Promise.all(
        events.map(async (event) => {
          const attendanceCount = await this.getEventAttendanceCount(event.id);

          let formattedDocuments: { name: string; document: string }[] = [];
          if (event.documents && event.documentNames) {
            formattedDocuments = event.documents.map((doc, index) => ({
              name: event.documentNames?.[index] || `Document ${index + 1}`,
              document: doc
            }));
          } else if (event.documents) {
            // Fallback if no names are provided
            formattedDocuments = event.documents.map((doc, index) => ({
              name: `Document ${index + 1}`,
              document: doc
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

          // Find which fields matched the keyword search
          let matchedFields: string[] = [];
          if (filters.keyword) {
            matchedFields = this.findMatchedFields(event, filters.keyword);
          }

          const { exhibitorDescription, ...eventFiltered } = eventData;
          // Convert eventStamps array to single object
          return {
            ...eventFiltered,
            color: getEventColor(event.type),
            speakersData: eventSpeakers.map((es) => es.speaker),
            categoriesData: category?.map((ec) => ec.category) || [],
            documents: formattedDocuments,
            eventStamps: {
              description: event.eventStampDescription,
              images: event.eventStampImages,
            },
            exhibitorsData: {
              exhibitorDescription: exhibitorDescription || '',
              exhibitors: eventExhibitors.map((ee) => ({
                ...ee.exhibitor,
                promotionalOffers: ee.exhibitor.promotionalOffers || [],
              })),
            },
            attendanceCount: attendanceCount,
            isFavorite: isFavorite,
            isRegistered: isRegistered,
            searchFields: matchedFields, // Add matched fields to response
          };
        }),
      );

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

  async getEventById(id: string, userId?: string) {
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
            isRegister: true // Only count active registrations
          },
        });
        isRegistered = !!registration;
      }

      // Format documents with names
      let formattedDocuments: { name: string; document: string }[] = [];
      if (event.documents && event.documentNames) {
        formattedDocuments = event.documents.map((doc, index) => ({
          name: event.documentNames?.[index] || `Document ${index + 1}`,
          document: doc
        }));
      } else if (event.documents) {
        // Fallback if no names are provided
        formattedDocuments = event.documents.map((doc, index) => ({
          name: `Document ${index + 1}`,
          document: doc
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
        speakers: eventSpeakers.map((es) => es.speaker),
        categories: category?.map((ec) => ec.category) || [],
        documents: formattedDocuments, // New formatted documents
        eventStamps: {
          description: event.eventStampDescription,
          images: event.eventStampImages,
        },
        exhibitors: {
          exhibitorDescription: exhibitorDescription || '',
          exhibitors: eventExhibitors.map((ee) => ({
            ...ee.exhibitor,
            promotionalOffers: ee.exhibitor.promotionalOffers || [],
          })),
        },
        attendanceCount: attendanceCount,
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
          throw new DuplicateResourceException('Event', 'name', eventDto.name);
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

  private async createEventAssociations(eventId: string, eventDto: EventDto) {
    // Create category associations
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

    // Create speaker associations
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

    // Create exhibitor associations
    if (eventDto.exhibitorIds) {
      const exhibitorIdsArray = eventDto.exhibitorIds.split(',');
      await Promise.all(
        exhibitorIdsArray.map(async (exhibitorId) => {
          const eventExhibitor = new EventExhibitor();
          eventExhibitor.eventId = eventId;
          eventExhibitor.exhibitorId = exhibitorId.trim();
          await this.eventExhibitorRepository.save(eventExhibitor);
        }),
      );
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
      await this.eventExhibitorRepository.delete({ eventId });
      if (eventDto.exhibitorIds) {
        const exhibitorIdsArray = eventDto.exhibitorIds.split(',');
        await Promise.all(
          exhibitorIdsArray.map(async (exhibitorId) => {
            const eventExhibitor = new EventExhibitor();
            eventExhibitor.eventId = eventId;
            eventExhibitor.exhibitorId = exhibitorId.trim();
            await this.eventExhibitorRepository.save(eventExhibitor);
          }),
        );
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
    const startDate = eventDto.startDate
      ? new Date(eventDto.startDate)
      : existingEvent
        ? new Date(existingEvent.startDate)
        : null;
    const endDate = eventDto.endDate
      ? new Date(eventDto.endDate)
      : existingEvent
        ? new Date(existingEvent.endDate)
        : null;

    if (startDate && startDate < today) {
      throw new ValidationException('Start date cannot be in the past');
    }
    if (startDate && endDate && endDate < startDate) {
      throw new ValidationException('End date must be after start date');
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
