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
import { Event } from './event.entity';
import { Between, Not } from 'typeorm';
import { Speaker } from 'speaker/speaker.entity';
import { EventSpeaker, EventCategory } from './event-speaker.entity';
import { Category } from 'category/category.entity';
import path from 'path';
import * as fs from 'fs';
import { getEventColor } from 'utils/event-color.util';
import { RegisterEvent } from 'registerEvent/registerEvent.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventSpeaker)
    private eventSpeakerRepository: Repository<EventSpeaker>,
    @InjectRepository(EventCategory)
    private eventCategoryRepository: Repository<EventCategory>,
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(FavoriteEvent)
    private favoriteEventRepository: Repository<FavoriteEvent>,
  ) {}

  async createEvent(eventDto: EventDto) {
    const existingEvent = await this.eventRepository.findOne({
      where: { name: eventDto.name },
    });
    if (existingEvent) throw new ConflictException('Event name already exists');

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

    // If there are validation errors, throw them all at once
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid Category or Speaker',
        errors: validationErrors,
      });
    }

    const today = new Date();
    if (new Date(eventDto.startDate) < today)
      throw new BadRequestException('Start date cannot be in the past');
    if (new Date(eventDto.endDate) < new Date(eventDto.startDate))
      throw new BadRequestException('End date must be after start date');
    if (
      today.toDateString() === new Date(eventDto.startDate).toDateString() &&
      new Date(eventDto.endDate) <= today
    ) {
      throw new BadRequestException(
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
      if (conflictingEvents.length > 0)
        throw new ConflictException(
          'Another event is already scheduled at this location during these dates and times',
        );
    }

    if (
      eventDto.latitude &&
      (eventDto.latitude < -90 || eventDto.latitude > 90)
    ) {
      throw new BadRequestException('Invalid latitude value');
    }
    if (
      eventDto.longitude &&
      (eventDto.longitude < -180 || eventDto.longitude > 180)
    ) {
      throw new BadRequestException('Invalid longitude value');
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

    return savedEvent;
  }

  // Helper function to find which fields match the keyword
  private findMatchedFields(event: any, keyword: string): string[] {
    const matchedFields: string[] = [];
    const keywordLower = keyword.toLowerCase();

    // Check each field for keyword match
    if (event.name && event.name.toLowerCase().includes(keywordLower)) {
      matchedFields.push('name');
    }
    if (
      event.description &&
      event.description.toLowerCase().includes(keywordLower)
    ) {
      matchedFields.push('description');
    }
    if (event.venue && event.venue.toLowerCase().includes(keywordLower)) {
      matchedFields.push('venue');
    }
    if (event.location && event.location.toLowerCase().includes(keywordLower)) {
      matchedFields.push('location');
    }
    if (event.country && event.country.toLowerCase().includes(keywordLower)) {
      matchedFields.push('country');
    }
    if (event.type && event.type.toLowerCase().includes(keywordLower)) {
      matchedFields.push('type');
    }
    if (
      event.price &&
      event.price.toString().toLowerCase().includes(keywordLower)
    ) {
      matchedFields.push('price');
    }
    if (event.currency && event.currency.toLowerCase().includes(keywordLower)) {
      matchedFields.push('currency');
    }
    if (
      event.latitude &&
      event.latitude.toString().toLowerCase().includes(keywordLower)
    ) {
      matchedFields.push('latitude');
    }
    if (
      event.longitude &&
      event.longitude.toString().toLowerCase().includes(keywordLower)
    ) {
      matchedFields.push('longitude');
    }

    return matchedFields;
  }

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
    // Validate EventType enum if provided
    if (filters.type) {
      const validTypes = Object.values(EventType);
      if (!validTypes.includes(filters.type)) {
        throw new BadRequestException({
          message: 'Invalid enum',
          error: `Invalid event type. Valid types are: ${validTypes.join(', ')}`,
        });
      }
    }

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.eventSpeakers', 'eventSpeaker')
      .leftJoinAndSelect('eventSpeaker.speaker', 'speaker')
      .leftJoinAndSelect('event.category', 'eventCategory')
      .leftJoinAndSelect('eventCategory.category', 'category');

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
        const { eventSpeakers, category, ...eventData } = event;

        // Check if event is favorited by user
        let isFavorite = false;
        if (userId) {
          const favorite = await this.favoriteEventRepository.findOne({
            where: { userId, eventId: event.id },
          });
          isFavorite = !!favorite;
        }

        // Find which fields matched the keyword search
        let matchedFields: string[] = [];
        if (filters.keyword) {
          matchedFields = this.findMatchedFields(event, filters.keyword);
        }

        return {
          ...eventData,
          color: getEventColor(event.type),
          speakersData: eventSpeakers.map((es) => es.speaker),
          categoriesData: category?.map((ec) => ec.category) || [],
          attendanceCount: attendanceCount,
          isFavorite: isFavorite,
          searchFields: matchedFields, // Add matched fields to response
        };
      }),
    );

    return eventsWithAttendance;
  }

  // Get event attendance count
  async getEventAttendanceCount(eventId: string): Promise<number> {
    const count = await this.registerEventRepository.count({
      where: { eventId: eventId },
    });
    return count;
  }

  async getEventEntityById(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found!');
    return event;
  }

  async getEventById(id: string, userId?: string) {
    const event = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.eventSpeakers', 'eventSpeaker')
      .leftJoinAndSelect('eventSpeaker.speaker', 'speaker')
      .leftJoinAndSelect('event.category', 'eventCategory')
      .leftJoinAndSelect('eventCategory.category', 'category')
      .where('event.id = :id', { id })
      .getOne();

    if (!event) throw new NotFoundException('Event not found!');

    const { eventSpeakers, category, ...eventData } = event;

    const attendanceCount = await this.getEventAttendanceCount(id);

    // Check if event is favorited by user
    let isFavorite = false;
    if (userId) {
      const favorite = await this.favoriteEventRepository.findOne({
        where: { userId, eventId: id },
      });
      isFavorite = !!favorite;
    }

    return {
      ...eventData,
      color: getEventColor(event.type),
      speakers: eventSpeakers.map((es) => es.speaker),
      categories: category?.map((ec) => ec.category) || [],
      attendanceCount: attendanceCount,
      isFavorite: isFavorite,
    };
  }

  async updateEvent(
    id: string,
    eventDto: Partial<EventDto>,
  ): Promise<Partial<Event>> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event are not found!!');

    const existingEvent = await this.eventRepository.findOne({
      where: { name: eventDto.name, id: Not(id) },
    });
    if (existingEvent) throw new ConflictException('Event name already exists');

    // Validate all IDs before updating the event
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

    // If there are validation errors, throw them all at once
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid Category or Speaker',
        errors: validationErrors,
      });
    }

    const today = new Date();
    if (eventDto.startDate && new Date(eventDto.startDate) < today)
      throw new BadRequestException('Start date cannot be in the past');
    if (
      eventDto.startDate &&
      eventDto.endDate &&
      new Date(eventDto.endDate) < new Date(eventDto.startDate)
    ) {
      throw new BadRequestException('End date must be after start date');
    }
    if (
      eventDto.startDate &&
      today.toDateString() === new Date(eventDto.startDate).toDateString()
    ) {
      if (!eventDto.endDate || new Date(eventDto.endDate) <= today) {
        throw new BadRequestException(
          'If start date is today, end date must be at least tomorrow',
        );
      }
    }

    if (eventDto.location) {
      if (!eventDto.startDate || !eventDto.endDate) {
        throw new BadRequestException(
          'Start date and end date must be provided',
        );
      }

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
          id: Not(id),
        },
      });
      if (conflictingEvents.length > 0)
        throw new ConflictException(
          'Another event is already scheduled at this location during these dates and times',
        );
    }

    if (
      eventDto.latitude &&
      (eventDto.latitude < -90 || eventDto.latitude > 90)
    ) {
      throw new BadRequestException('Invalid latitude value');
    }
    if (
      eventDto.longitude &&
      (eventDto.longitude < -180 || eventDto.longitude > 180)
    ) {
      throw new BadRequestException('Invalid longitude value');
    }

    Object.assign(event, eventDto);
    const updatedEvent = await this.eventRepository.save(event);

    // Delete existing associations
    await this.eventSpeakerRepository.delete({ eventId: id });
    await this.eventCategoryRepository.delete({ eventId: id });

    // Create new category associations if categoryIds are provided
    if (eventDto.categoryIds) {
      const categoryIdsArray = eventDto.categoryIds.split(',');
      await Promise.all(
        categoryIdsArray.map(async (categoryId) => {
          const eventCategory = new EventCategory();
          eventCategory.eventId = id;
          eventCategory.categoryId = categoryId.trim();
          await this.eventCategoryRepository.save(eventCategory);
        }),
      );
    }

    // Create new speaker associations if speakerIds are provided
    if (eventDto.speakerIds) {
      const speakerIdsArray = eventDto.speakerIds.split(',');
      await Promise.all(
        speakerIdsArray.map(async (speakerId) => {
          const speakerExists = await this.speakerRepository.findOne({
            where: { id: speakerId.trim() },
          });

          if (!speakerExists) {
            throw new BadRequestException('Invalid speaker ID');
          }

          const eventSpeaker = new EventSpeaker();
          eventSpeaker.eventId = id;
          eventSpeaker.speakerId = speakerId.trim();
          await this.eventSpeakerRepository.save(eventSpeaker);
        }),
      );
    }

    return updatedEvent;
  }

  async deleteEvent(id: string) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

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

    await this.eventRepository.remove(event);
    return { message: 'Event deleted successfully' };
  }

  async updateEventImages(
    id: string,
    images: string[],
  ): Promise<Partial<Event>> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found!');

    event.images = images;
    return await this.eventRepository.save(event);
  }

  async updateEventDocuments(
    id: string,
    documents: string[],
  ): Promise<Partial<Event>> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found!');

    event.documents = documents;
    return await this.eventRepository.save(event);
  }
}
