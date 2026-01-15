import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStamp } from './event-stamp.entity';
import { EventStampEvent } from './event-stamp-event.entity';
import { CreateEventStampDto, UpdateEventStampDto } from './event-stamp.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EventStampService {
  constructor(
    @InjectRepository(EventStamp)
    private readonly eventStampRepository: Repository<EventStamp>,
    @InjectRepository(EventStampEvent)
    private readonly eventStampEventRepository: Repository<EventStampEvent>,
  ) {}

  async create(createEventStampDto: CreateEventStampDto): Promise<EventStamp> {
    // Set default isVisited to false if not provided
    const stampData = {
      ...createEventStampDto,
      isVisited: createEventStampDto.isVisited ?? false,
    };
    const eventStamp = this.eventStampRepository.create(stampData);
    return await this.eventStampRepository.save(eventStamp);
  }

  async createMultiple(createEventStampDtos: CreateEventStampDto[]): Promise<EventStamp[]> {
    // Set default values for each stamp
    const stampsWithDefaults = createEventStampDtos.map(dto => ({
      ...dto,
      isVisited: dto.isVisited ?? false,
      // exhibitorId is optional, so keep it as is (can be null/undefined)
    }));
    const eventStamps = this.eventStampRepository.create(stampsWithDefaults);
    return await this.eventStampRepository.save(eventStamps);
  }

  async findAll(): Promise<EventStamp[]> {
    return await this.eventStampRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<EventStamp> {
    const eventStamp = await this.eventStampRepository.findOne({
      where: { id },
      relations: ['eventStampEvents', 'eventStampEvents.event'],
    });
    if (!eventStamp) {
      throw new NotFoundException(`Event stamp with ID ${id} not found`);
    }
    return eventStamp;
  }

  async update(id: string, updateEventStampDto: UpdateEventStampDto): Promise<EventStamp> {
    const eventStamp = await this.findOne(id);
    
    // If image is being updated, delete old image file
    if (updateEventStampDto.image && eventStamp.image && eventStamp.image !== updateEventStampDto.image) {
      try {
        // Only delete if it's a file path (starts with uploads/), not a URL
        if (eventStamp.image.startsWith('uploads/')) {
          const fullPath = path.join(__dirname, '..', '..', eventStamp.image);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted old event stamp image file: ${eventStamp.image}`);
          }
        }
      } catch (fileError) {
        // Log error but continue with update
        console.error(`❌ Failed to delete old event stamp image file: ${eventStamp.image}`, fileError);
        // Don't throw - continue with update even if file deletion fails
      }
    }
    
    Object.assign(eventStamp, updateEventStampDto);
    return await this.eventStampRepository.save(eventStamp);
  }

  async remove(id: string): Promise<void> {
    const eventStamp = await this.findOne(id);
    
    // Delete image file from filesystem if it exists
    if (eventStamp.image) {
      try {
        // Only delete if it's a file path (starts with uploads/), not a URL
        if (eventStamp.image.startsWith('uploads/')) {
          const fullPath = path.join(__dirname, '..', '..', eventStamp.image);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted event stamp image file: ${eventStamp.image}`);
          } else {
            console.warn(`⚠️ Event stamp image file not found: ${fullPath}`);
          }
        } else {
          console.log(`ℹ️ Skipping file deletion for URL: ${eventStamp.image}`);
        }
      } catch (fileError) {
        // Log error but continue with database deletion
        console.error(`❌ Failed to delete event stamp image file: ${eventStamp.image}`, fileError);
        // Don't throw - continue with database deletion even if file deletion fails
      }
    }
    
    // Delete from database
    await this.eventStampRepository.remove(eventStamp);
  }

  async associateStampsToEvent(eventId: string, stampIds: string[]): Promise<void> {
    // Remove existing associations
    await this.eventStampEventRepository.delete({ eventId });

    // Create new associations
    if (stampIds && Array.isArray(stampIds) && stampIds.length > 0) {
      // Filter out any null, undefined, or empty string values
      const validStampIds = stampIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
      
      if (validStampIds.length > 0) {
        const associations = validStampIds.map((stampId) =>
          this.eventStampEventRepository.create({
            eventId,
            eventStampId: stampId.trim(),
          }),
        );
        await this.eventStampEventRepository.save(associations);
      }
    }
  }

  async getStampsByEventId(eventId: string): Promise<EventStamp[]> {
    const associations = await this.eventStampEventRepository.find({
      where: { eventId },
      relations: ['eventStamp'],
    });
    return associations.map((assoc) => assoc.eventStamp);
  }
}
