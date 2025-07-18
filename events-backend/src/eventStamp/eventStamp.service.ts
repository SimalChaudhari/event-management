// src/services/eventStamp.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventStamp } from './eventStamp.entity';
import { CreateEventStampDto, CreateOrUpdateEventStampDto, UpdateEventStampDto } from './eventStamp.dto';
import { Event } from 'event/event.entity';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class EventStampService {
  constructor(
    @InjectRepository(EventStamp)
    private eventStampRepository: Repository<EventStamp>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

 

  async getAllEventStamps() {
    return await this.eventStampRepository.find({
      relations: ['event'],
    });
  }

  async getEventStampsByEventId(eventId: string) {
    const eventStamps = await this.eventStampRepository.find({
      where: { eventId },
      relations: ['event'],
    });
    
    if (!eventStamps || eventStamps.length === 0) {
      throw new NotFoundException('No event stamps found for this event');
    }
    
    return eventStamps;
  }

  async getEventStampById(id: string) {
    const eventStamp = await this.eventStampRepository.findOne({
      where: { id },
      relations: ['event'],
    });
    
    if (!eventStamp) {
      throw new NotFoundException('Event stamp not found');
    }
    
    return eventStamp;
  }


  async deleteEventStamp(id: string) {
    const eventStamp = await this.eventStampRepository.findOne({
      where: { id },
    });
    
    if (!eventStamp) {
      throw new NotFoundException('Event stamp not found');
    }

    // Delete images from filesystem
    if (eventStamp.images && eventStamp.images.length > 0) {
      eventStamp.images.forEach((imagePath) => {
        const filePath = path.resolve(imagePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await this.eventStampRepository.remove(eventStamp);
    return { message: 'Event stamp deleted successfully' };
  }

  async updateEventStampImages(id: string, images: string[]) {
    const eventStamp = await this.eventStampRepository.findOne({
      where: { id },
    });
    
    if (!eventStamp) {
      throw new NotFoundException('Event stamp not found');
    }

    eventStamp.images = images;
    return await this.eventStampRepository.save(eventStamp);
  }

  async removeEventStampImage(id: string, imagePath: string) {
    const eventStamp = await this.eventStampRepository.findOne({
      where: { id },
    });
    
    if (!eventStamp) {
      throw new NotFoundException('Event stamp not found');
    }

    // Check if image exists in event stamp
    if (!eventStamp.images || !eventStamp.images.includes(imagePath)) {
      throw new NotFoundException('Image not found in this event stamp');
    }

    // Remove image from filesystem
    const fullPath = path.resolve(imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Remove image from database
    const updatedImages = eventStamp.images.filter(img => img !== imagePath);
    eventStamp.images = updatedImages;
    await this.eventStampRepository.save(eventStamp);

    return { message: 'Image removed successfully', images: updatedImages };
  }

  async createOrUpdateEventStamp(createOrUpdateEventStampDto: CreateOrUpdateEventStampDto) {
    // Validate if event exists
    const event = await this.eventRepository.findOne({
      where: { id: createOrUpdateEventStampDto.eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event stamp already exists for this event
    const existingEventStamp = await this.eventStampRepository.findOne({
      where: { eventId: createOrUpdateEventStampDto.eventId },
    });

    if (existingEventStamp) {
      // If new images are being uploaded, delete old images from filesystem
      if (createOrUpdateEventStampDto.images && createOrUpdateEventStampDto.images.length > 0) {
        // Delete old images from filesystem
        if (existingEventStamp.images && existingEventStamp.images.length > 0) {
          existingEventStamp.images.forEach((imagePath) => {
            const filePath = path.resolve(imagePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        }
      }

      // Update existing event stamp
      Object.assign(existingEventStamp, {
        description: createOrUpdateEventStampDto.description,
        images: createOrUpdateEventStampDto.images,
      });
      return await this.eventStampRepository.save(existingEventStamp);
    } else {
      // Create new event stamp
      const eventStamp = this.eventStampRepository.create(createOrUpdateEventStampDto);
      return await this.eventStampRepository.save(eventStamp);
    }
  }
} 