// src/services/event.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventDto, EventType } from './event.dto';
import { Event, EventExhibitor } from './event.entity';
import { EventBooth } from './event-booth.entity';
import { EventAgenda } from '../agenda/agenda.entity';
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
import { Survey } from '../survey/survey.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
  ForeignKeyConstraintException,
} from '../utils/exceptions/custom-exceptions';
import { SurveyUtils } from '../utils/survey-utils';
import { UserUtils } from '../utils/user.utils';
import { ExhibitorUtils } from '../utils/exhibitor.utils';
import { EmailService } from '../service/email.service';
import { EmailTemplateUtils } from '../utils/email-templates.utils';
import { EmailUtils } from '../utils/email.utils';
import { EventValidationUtils } from '../utils/validateEvents';
import {
  EventQueryBuilderUtils,
  GlobalSearchUtils,
} from '../utils/searchEvent';
import { SpeakerTimeUtils } from '../utils';
import { QnaUtils } from '../utils/qna.utils';

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
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(EventAgenda)
    private eventAgendaRepository: Repository<EventAgenda>,
    private readonly errorHandler: ErrorHandlerService,
    private readonly surveyUtils: SurveyUtils,
    private readonly emailService: EmailService,
    private readonly qnaUtils: QnaUtils,
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

      // Validate speaker times
      this.validateSpeakerTimes(eventDto);

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
        
        // Parse speaker time information
        const speakerStartTimes = eventDto.speakerStartTimes ? eventDto.speakerStartTimes.split(',') : [];
        const speakerEndTimes = eventDto.speakerEndTimes ? eventDto.speakerEndTimes.split(',') : [];

        await Promise.all(
          speakerIdsArray.map(async (speakerId, index) => {
            const eventSpeaker = new EventSpeaker();
            eventSpeaker.eventId = savedEvent.id;
            eventSpeaker.speakerId = speakerId.trim();
            
            // Set speaker time information if available
            if (speakerStartTimes[index]) {
              eventSpeaker.speakingStartTime = speakerStartTimes[index].trim();
            }
            if (speakerEndTimes[index]) {
              eventSpeaker.speakingEndTime = speakerEndTimes[index].trim();
            }
            
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
                savedEvent.venue || savedEvent.location || 'To be announced',
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
      throw error;
    }
  }

  async getAllEvents(
    filters: {
      keyword?: string;
      globalSearch?: string;
      startDate?: string;
      endDate?: string;
      type?: EventType;
      upcoming?: boolean;
      category?: string;
      eventName?: string;
    },
    userId?: string,
    userRole?: string,
  ) {
    try {
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

      // If globalSearch is provided, get all events for comprehensive search
      // If keyword is provided, use basic event field search
      if (filters.globalSearch) {
        // For global search, we'll get all events and then filter by comprehensive search
        // No WHERE clause needed here - we'll filter after getting all events
      } else if (filters.keyword) {
        // Use basic event field search for keyword
        const keyword = filters.keyword.toLowerCase();
        queryBuilder.where(
          'LOWER(event.name) LIKE :keyword OR LOWER(event.description) LIKE :keyword OR LOWER(event.venue) LIKE :keyword OR LOWER(event.location) LIKE :keyword OR LOWER(event.country) LIKE :keyword OR LOWER(CAST(event.price AS TEXT)) LIKE :keyword OR LOWER(event.currency) LIKE :keyword OR LOWER(CAST(event.latitude AS TEXT)) LIKE :keyword OR LOWER(CAST(event.longitude AS TEXT)) LIKE :keyword',
          { keyword: `%${keyword}%` },
        );
      }

      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere(
          'event.startDate >= :startDate AND event.endDate <= :endDate',
          { startDate: filters.startDate, endDate: filters.endDate },
        );
      }

      if (filters.type) {
        queryBuilder.andWhere('event.type = :type', { type: filters.type });
      }

      if (filters.category) {
        const categoryName = filters.category.toLowerCase();
        queryBuilder.andWhere('LOWER(category.name) LIKE :categoryName', {
          categoryName: `%${categoryName}%`,
        });
      }

      if (filters.upcoming) {
        const today = new Date();
        queryBuilder.andWhere('event.startDate >= :today', { today });
      }

      if (filters.eventName) {
        // Exact name match for dropdown filter
        queryBuilder.andWhere('event.name = :eventName', {
          eventName: filters.eventName,
        });
      }

      const events = await queryBuilder.getMany();

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

          const speakers =
          event?.eventSpeakers?.map((es) => ({
            ...UserUtils.getBasicSpeakerInfo(es.speaker),
            speakingStartTime: es.speakingStartTime,
            speakingEndTime: es.speakingEndTime,
          })) || [];
          

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

          // Check if user has registered for this event and get registration ID
          let isRegistered = false;
          let registerEventId = null;
          if (userId) {
            const registration = await this.registerEventRepository.findOne({
              where: {
                userId: userId,
                eventId: event.id,
                isRegister: true, // Only count active registrations
              },
            });
            isRegistered = !!registration;
            registerEventId = registration?.id || null;
          }

          const { exhibitorDescription, surveys, programmeTracks, ...eventFilteredData } = eventData;
          

          // Format programme tracks with basic speaker info
          const formattedProgrammeTracks = event?.programmeTracks?.map(track => ({
            ...track,
            sessions: track.sessions?.map(session => ({
              ...session,
              speakers: session.speakers?.map((speaker: any) => 
                UserUtils.getBasicSpeakerInfo(speaker)
              ) || []
            })) || []
          })) || [];
         

          // Build the complete event object
          const completeEvent = {
            ...eventFilteredData,
            color: getEventColor(event.type),
            documents: formattedDocuments,
            eventStamps: {
              description: event.eventStampDescription,
              images: event.eventStampImages,
            },
            attendanceCount: attendanceCount,
            surveyDetails: surveyDetails,
            hasSurvey: !!surveyDetails,
            isFavorite: isFavorite,
            isRegistered: isRegistered,
            registerEventId: registerEventId,
            speakersData: speakers,
            categoriesData: category?.map((ec) => ec.category) || [],
            programmeTracks: formattedProgrammeTracks,

            exhibitorsData: {
              exhibitorDescription: exhibitorDescription || '',
              exhibitors:
                event?.eventExhibitors
                  ?.filter((ee) => ee.exhibitor.isActive)
                  ?.map((ee) => {
                    return {
                      ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
                      promotionalOffers: ee.exhibitor.promotionalOffers || [],
                    };
                  }) || [],
            },
          };

          // Add Q&A data for admin users
          if (userRole === UserRole.Admin) {
            try {
              const qnaData = await this.qnaUtils.getAllQuestionsForEvent(event.id);
              (completeEvent as any).qnaData = qnaData.data;
            } catch (error) {
              // If Q&A data fails to load, continue without it
              console.warn(`Failed to load Q&A data for event ${event.id}:`, error);
              (completeEvent as any).qnaData = null;
            }
          }

          // For global search, we still return the complete event structure
          // but mark it as having a global match if search terms are found
          if (filters.globalSearch) {
            // Get detailed search match information
            const searchResult = this.checkGlobalSearchMatch(completeEvent, filters.globalSearch);
            
            return {
              ...completeEvent,
              hasGlobalMatch: searchResult.hasMatch,
              searchResult: searchResult
            };
          }

          // Regular response - include all data
          return {
            ...completeEvent,
            hasGlobalMatch: false
          };
        }),
      );

      // If globalSearch is active, filter events that have global matches and aggregate results
      if (filters.globalSearch) {
        const eventsWithGlobalMatches = eventsWithAttendance.filter(event => event.hasGlobalMatch);
        
        // Aggregate all search results into separate arrays
        const allSpeakers: any[] = [];
        const allCategories: any[] = [];
        const allExhibitors: any[] = [];
        const allPromotionalOffers: any[] = [];
        const allSurveySessions: any[] = [];
        
        eventsWithGlobalMatches.forEach(event => {
          // Type assertion to handle the searchResult property
          const eventWithSearch = event as any;
          if (eventWithSearch.searchResult) {
            allSpeakers.push(...eventWithSearch.searchResult.matchedSpeakers);
            allCategories.push(...eventWithSearch.searchResult.matchedCategories);
            allExhibitors.push(...eventWithSearch.searchResult.matchedExhibitors);
            allPromotionalOffers.push(...eventWithSearch.searchResult.matchedPromotionalOffers);
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

        return {
          events: completeEvents,
          speakers: allSpeakers,
          categories: allCategories,
          exhibitors: allExhibitors,
          promotionalOffers: allPromotionalOffers,
          surveySessions: allSurveySessions,
          metadata: {
            total: completeEvents.length,
            totalSpeakers: allSpeakers.length,
            totalCategories: allCategories.length,
            totalExhibitors: allExhibitors.length,
            totalPromotionalOffers: allPromotionalOffers.length,
            totalSurveySessions: allSurveySessions.length,
            timestamp: new Date().toISOString(),
            globalSearch: true,
            searchKeyword: filters.globalSearch,
            totalMatches: completeEvents.length
          }
        };
      }

      return {
        events: eventsWithAttendance,
        metadata: {
          total: eventsWithAttendance.length,
          timestamp: new Date().toISOString(),
          globalSearch: false
        }
      };
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

      const { eventSpeakers, category, eventExhibitors, ...eventData } = event;
      const attendanceCount = await this.getEventAttendanceCount(id);

      // Get survey details for this event
      const surveyDetails =
        await this.surveyUtils.getSurveyDetailsByEventId(id);

      // Check if event is favorited by user
      let isFavorite = false;
      if (userId) {
        const favorite = await this.favoriteEventRepository.findOne({
          where: { userId, eventId: id },
        });
        isFavorite = !!favorite;
      }

      // Check if user has registered for this event and get registration ID
      let isRegistered = false;
      let registerEventId = null;
      if (userId) {
        const registration = await this.registerEventRepository.findOne({
          where: {
            userId: userId,
            eventId: id,
            isRegister: true, // Only count active registrations
          },
        });
        isRegistered = !!registration;
        registerEventId = registration?.id || null;
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
        surveys,
        documents, // Remove original documents
        documentNames, // Remove original documentNames
        programmeTracks, // Remove original programmeTracks
        ...eventFilteredData
      } = eventData;

      // Format programme tracks with basic speaker info
      const formattedProgrammeTracks = event?.programmeTracks?.map(track => ({
        ...track,
        sessions: track.sessions?.map(session => ({
          ...session,
          speakers: session.speakers?.map((speaker: any) => 
            UserUtils.getBasicSpeakerInfo(speaker)
          ) || []
        })) || []
      })) || [];

      const eventResponse = {
        ...eventFilteredData,
        color: getEventColor(event.type),
        speakers: eventSpeakers.map((es) => ({
          ...UserUtils.getBasicSpeakerInfo(es.speaker),
          speakingStartTime: es.speakingStartTime,
          speakingEndTime: es.speakingEndTime,
        })),
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
              ...ExhibitorUtils.getBasicExhibitorInfo(ee.exhibitor),
              promotionalOffers: ee.exhibitor.promotionalOffers || [],
            };
          }),
        },
        attendanceCount: attendanceCount,
        surveyDetails: surveyDetails,
        hasSurvey: !!surveyDetails,
        isFavorite: isFavorite,
        isRegistered: isRegistered,
        registerEventId: registerEventId,
        programmeTracks: formattedProgrammeTracks,
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

      // Validate speaker times
      this.validateSpeakerTimes(eventDto, event);

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
      throw this.errorHandler.handleDatabaseError(error, 'Event update');
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
      throw this.errorHandler.handleDatabaseError(error, 'Event stamp images update');
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
      // Validate speaker times before updating
      if (eventDto.speakerIds && eventDto.speakerStartTimes && eventDto.speakerEndTimes) {
        // Get current event for time validation
        const currentEvent = await this.eventRepository.findOne({ where: { id: eventId } });
        if (currentEvent) {
          // Create a temporary DTO with event times for validation
          const tempDto = {
            ...eventDto,
            startTime: currentEvent.startTime,
            endTime: currentEvent.endTime,
          };
          this.validateSpeakerTimes(tempDto, currentEvent);
        }
      }

      await this.eventSpeakerRepository.delete({ eventId });
      if (eventDto.speakerIds) {
        const speakerIdsArray = eventDto.speakerIds.split(',');
        
        // Parse speaker time information
        const speakerStartTimes = eventDto.speakerStartTimes ? eventDto.speakerStartTimes.split(',') : [];
        const speakerEndTimes = eventDto.speakerEndTimes ? eventDto.speakerEndTimes.split(',') : [];

        await Promise.all(
          speakerIdsArray.map(async (speakerId, index) => {
            const eventSpeaker = new EventSpeaker();
            eventSpeaker.eventId = eventId;
            eventSpeaker.speakerId = speakerId.trim();
            
            // Set speaker time information if available
            if (speakerStartTimes[index]) {
              eventSpeaker.speakingStartTime = speakerStartTimes[index].trim();
            }
            if (speakerEndTimes[index]) {
              eventSpeaker.speakingEndTime = speakerEndTimes[index].trim();
            }
            
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
                  currentEvent.venue ||
                    currentEvent.location ||
                    'To be announced',
                );
              }
            }
            // If exhibitor already exists, no need to recreate booth or send email
          }),
        );

        // Remove exhibitors who are no longer in the list
        const newExhibitorIdSet = new Set(
          newExhibitorIdsArray.map((id) => id.trim()),
        );
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
                  currentEvent.venue ||
                    currentEvent.location ||
                    'To be announced',
                );
              }
            }),
          );

          const exhibitorIdsToRemove = exhibitorsToRemove
            .map((ee) => ee.exhibitorId)
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
                currentEvent.venue ||
                  currentEvent.location ||
                  'To be announced',
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

  // Validate speaker times against event times and check for overlaps
  private validateSpeakerTimes(
    eventDto: Partial<EventDto>,
    existingEvent?: Event,
  ) {
    if (!eventDto.speakerIds || !eventDto.speakerStartTimes || !eventDto.speakerEndTimes) {
      return; // No speaker times to validate
    }

    const speakerIds = eventDto.speakerIds.split(',');
    const speakerStartTimes = eventDto.speakerStartTimes.split(',');
    const speakerEndTimes = eventDto.speakerEndTimes.split(',');

    // Use the utility for validation
    SpeakerTimeUtils.validateSpeakerTimes(
      { speakerIds, speakerStartTimes, speakerEndTimes },
      { startTime: eventDto.startTime || '', endTime: eventDto.endTime || '' },
      existingEvent ? { startTime: existingEvent.startTime, endTime: existingEvent.endTime } : undefined,
    );
  }

  // Get event booths by event ID
  async getEventBooths(eventId: string): Promise<any[]> {
    try {
      const eventBooths = await this.eventBoothRepository.find({
        where: { eventId, isActive: true },
        relations: ['exhibitor'],
      });

      // Format the response to include exhibitor details
      return eventBooths.map((eventBooth) => ({
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

  // Send booth removal email to exhibitor
  private async sendBoothRemovalEmail(
    exhibitorEmail: string,
    uniqueCode: string,
    eventName: string,
    eventStartDate: string,
    eventVenue: string,
  ): Promise<void> {
    await EmailUtils.sendBoothRemovalEmail(
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


  private checkGlobalSearchMatch(event: any, keyword: string): {
    hasMatch: boolean;
    matchedEvent: boolean;
    matchedSpeakers: any[];
    matchedCategories: any[];
    matchedExhibitors: any[];
    matchedPromotionalOffers: any[];
    matchedSurveySessions: any[];
  } {
    const keywordLower = keyword.toLowerCase();
    const result: {
      hasMatch: boolean;
      matchedEvent: boolean;
      matchedSpeakers: any[];
      matchedCategories: any[];
      matchedExhibitors: any[];
      matchedPromotionalOffers: any[];
      matchedSurveySessions: any[];
    } = {
      hasMatch: false,
      matchedEvent: false,
      matchedSpeakers: [],
      matchedCategories: [],
      matchedExhibitors: [],
      matchedPromotionalOffers: [],
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
        if (exhibitor.companyName?.toLowerCase().includes(keywordLower) ||
            exhibitor.companyDescription?.toLowerCase().includes(keywordLower) ||
            exhibitor.email?.toLowerCase().includes(keywordLower)) {
          result.matchedExhibitors.push({
            ...exhibitor,
            eventId: event.id,
            eventName: event.name
          });
          result.hasMatch = true;
        }
      }
    }

         // Check promotional offers
     if (event.exhibitorsData?.exhibitors) {
       for (const exhibitor of event.exhibitorsData.exhibitors) {
         if (exhibitor.promotionalOffers && Array.isArray(exhibitor.promotionalOffers)) {
           for (const offer of exhibitor.promotionalOffers) {
             if (offer.title?.toLowerCase().includes(keywordLower) ||
                 offer.description?.toLowerCase().includes(keywordLower)) {
               result.matchedPromotionalOffers.push({
                 ...offer,
                 exhibitorId: exhibitor.id,
                 exhibitorName: exhibitor.companyName,
                 eventId: event.id,
                 eventName: event.name
               });
               result.hasMatch = true;
             }
           }
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
