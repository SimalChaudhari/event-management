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
import { EventSpeaker } from './event-speaker.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventSpeaker) // Inject the EventSpeaker repository
    private eventSpeakerRepository: Repository<EventSpeaker>,
    @InjectRepository(Speaker) // Inject the Speaker repository if needed
    private speakerRepository: Repository<Speaker>,
  ) {}

  async createEvent(eventDto: EventDto) {
    const existingEvent = await this.eventRepository.findOne({
      where: { name: eventDto.name },
    });
    if (existingEvent) throw new ConflictException('Event name already exists');

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
          ), // Convert to Date
          endDate: Between(
            new Date(eventDto.startDate),
            new Date(eventDto.endDate),
          ), // Convert to Date
        },
      });
      if (conflictingEvents.length > 0)
        throw new ConflictException(
          'Another event is already scheduled at this location during these dates and times',
        );
    }

    const event = await this.eventRepository.create(eventDto);

    // Handle speaker associations
    // if (eventDto.speakerIds) {
    //     const speakerIdsArray = eventDto.speakerIds.split(','); // Split the string into an array
    //     const speakers = await this.speakerRepository.findByIds(speakerIdsArray);
    //     await Promise.all(speakers.map(async (speaker) => {
    //         const eventSpeaker = new EventSpeaker();
    //         eventSpeaker.event = event;
    //         eventSpeaker.speaker = speaker;
    //         await this.eventSpeakerRepository.save(eventSpeaker);
    //     }));
    // }

    return await this.eventRepository.save(event);
  }

  async getAllEvents(filters: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    type?: EventType;
    price?: number;
    location?: string;
    upcoming?: boolean; // New filter for upcoming events
  }) {
    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    if (filters.keyword) {
      queryBuilder.where(
        'event.name LIKE :keyword OR event.description LIKE :keyword',
        { keyword: `%${filters.keyword}%` },
      );
    }

    if (filters.startDate) {
      queryBuilder.andWhere('event.startDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('event.endDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('event.type = :type', { type: filters.type });
    }

    if (filters.price) {
      queryBuilder.andWhere('event.price <= :price', { price: filters.price });
    }

    if (filters.location) {
      queryBuilder.andWhere('event.location = :location', {
        location: filters.location,
      });
    }

    // Filter for upcoming events
    if (filters.upcoming) {
      const today = new Date();
      queryBuilder.andWhere('event.startDate >= :today', { today: today });
    }

    return await queryBuilder.getMany();
  }

  async getEventById(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async updateEvent(
    id: string,
    eventDto: Partial<EventDto>,
  ): Promise<Partial<Event>> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const existingEvent = await this.eventRepository.findOne({
      where: { name: eventDto.name, id: Not(id) },
    });
    if (existingEvent) throw new ConflictException('Event name already exists');

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
          ), // Convert to Date
          endDate: Between(
            new Date(eventDto.startDate),
            new Date(eventDto.endDate),
          ), // Convert to Date
          id: Not(id),
        },
      });
      if (conflictingEvents.length > 0)
        throw new ConflictException(
          'Another event is already scheduled at this location during these dates and times',
        );
    }

    // Handle speaker associations
    // if (eventDto.speakerIds) {
    //   // Clear existing associations
    //   await this.eventSpeakerRepository.delete({ event: { id } });

    //   const speakers = await this.speakerRepository.findByIds(
    //     eventDto.speakerIds,
    //   );
    //   await Promise.all(
    //     speakers.map(async (speaker) => {
    //       const eventSpeaker = new EventSpeaker();
    //       eventSpeaker.event = event;
    //       eventSpeaker.speaker = speaker;
    //       await this.eventSpeakerRepository.save(eventSpeaker);
    //     }),
    //   );
    // }

    Object.assign(event, eventDto);
    const updatedEvent = await this.eventRepository.save(event);
    return updatedEvent;
  }

  async deleteEvent(id: string) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    await this.eventRepository.remove(event);
    return { message: 'Event deleted successfully' };
  }
}
