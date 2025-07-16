import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from 'event/event.entity';
import { Like } from 'typeorm';

export interface GalleryItem {
  type: 'image' | 'document';
  path: string;
}

export interface EventGallery {
  eventId: string;
  eventName: string;
  images: GalleryItem[];
  documents: GalleryItem[];
}

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async getAllGalleryItems(filters: {
    keyword?: string;
    type?: 'images' | 'documents' | 'all';
    eventId?: string;
  }): Promise<EventGallery[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .select([
        'event.id',
        'event.name',
        'event.images',
        'event.documents',
        'event.createdAt',
        'event.updatedAt',
      ]);

    // Filter by event ID if provided
    if (filters.eventId) {
      queryBuilder.where('event.id = :eventId', { eventId: filters.eventId });
    }

    // Filter by keyword if provided
    if (filters.keyword) {
      queryBuilder.andWhere(
        'LOWER(event.name) LIKE :keyword',
        { keyword: `%${filters.keyword.toLowerCase()}%` }
      );
    }

    const events = await queryBuilder.getMany();
    const eventGalleries: EventGallery[] = [];

    events.forEach((event) => {
      const images: GalleryItem[] = [];
      const documents: GalleryItem[] = [];

      // Add images
      if (event.images && event.images.length > 0) {
        if (!filters.type || filters.type === 'images' || filters.type === 'all') {
          event.images.forEach((imagePath) => {
            images.push({
              type: 'image',
              path: imagePath,
            });
          });
        }
      }

      // Add documents
      if (event.documents && event.documents.length > 0) {
        if (!filters.type || filters.type === 'documents' || filters.type === 'all') {
          event.documents.forEach((documentPath) => {
            documents.push({
              type: 'document',
              path: documentPath,
            });
          });
        }
      }

      // Only add events that have images or documents
      if (images.length > 0 || documents.length > 0) {
        eventGalleries.push({
          eventId: event.id,
          eventName: event.name,
          images: images,
          documents: documents
        });
      }
    });

    return eventGalleries;
  }

  async getGalleryByEvent(
    eventId: string,
    filters: {
      type?: 'images' | 'documents' | 'all';
    },
  ): Promise<EventGallery> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      select: ['id', 'name', 'images', 'documents', 'createdAt', 'updatedAt'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const images: GalleryItem[] = [];
    const documents: GalleryItem[] = [];

    // Add images
    if (event.images && event.images.length > 0) {
      if (!filters.type || filters.type === 'images' || filters.type === 'all') {
        event.images.forEach((imagePath) => {
          images.push({
            type: 'image',
            path: imagePath,
          });
        });
      }
    }

    // Add documents
    if (event.documents && event.documents.length > 0) {
      if (!filters.type || filters.type === 'documents' || filters.type === 'all') {
        event.documents.forEach((documentPath) => {
          documents.push({
            type: 'document',
            path: documentPath,
          });
        });
      }
    }

    return {
      eventId: event.id,
      eventName: event.name,
      images: images,
      documents: documents
    };
  }


}