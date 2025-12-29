import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from 'event/event.entity';
import { Gallery } from './gallery.entity';
import { GalleryDto } from './gallery.dto';
import * as fs from 'fs';
import path from 'path';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { FilterService } from '../service/filter.service';
import { 
  ResourceNotFoundException, 
  ValidationException 
} from '../utils/exceptions/custom-exceptions';

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

    @InjectRepository(Gallery)
    private galleryRepository: Repository<Gallery>,

    private errorHandler: ErrorHandlerService,
    private filterService: FilterService,
  ) {}

  async getAllGalleryItems(filters: {
    keyword?: string;
    type?: 'images' | 'documents' | 'all';
    eventId?: string;
  }): Promise<EventGallery[]> {
    try {
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
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Gallery items retrieval');
    }
  }

  async getGalleryByEvent(
    eventId: string,
    filters: {
      type?: 'images' | 'documents' | 'all';
    },
  ): Promise<EventGallery> {
    try {
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
        select: ['id', 'name', 'images', 'documents', 'createdAt', 'updatedAt'],
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
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
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Gallery retrieval by event');
    }
  }

  async createOrUpdateGallery(eventId: string, galleryDto: GalleryDto) {
    try {
      // Check if event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if gallery already exists for this event
      const existingGallery = await this.galleryRepository.findOne({
        where: { eventId: eventId },
      });
      
      if (existingGallery) {
        // Check if user is updating images or just title
        const hasNewImages = galleryDto.galleryImages && galleryDto.galleryImages.length > 0;
        
        if (hasNewImages) {
          // Instead of replacing, ADD new images to existing ones
          const existingImages = existingGallery.galleryImages || [];
          const newImages = galleryDto.galleryImages || [];
          
          // Combine existing and new images
          existingGallery.galleryImages = [...existingImages, ...newImages];
          
        } else {
          // If no new images, preserve existing images from originalImages field
          if (galleryDto.originalImages && galleryDto.originalImages.length > 0) {
            existingGallery.galleryImages = galleryDto.originalImages;
          }
        }
        // Always update title
        existingGallery.title = galleryDto.title;
        
        const result = await this.galleryRepository.save(existingGallery);
        return { 
          message: hasNewImages ? 'Gallery updated successfully with new images added' : 'Gallery title updated successfully', 
          data: result,
          isNew: false 
        };
      }

      // Create new gallery if none exists
      const gallery = this.galleryRepository.create({
        ...galleryDto,
        eventId: eventId
      });
      const result = await this.galleryRepository.save(gallery);
      return { 
        message: 'Gallery created successfully', 
        data: result,
        isNew: true 
      };
      
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Gallery creation/update');
    }
  }

  async getAllGalleries(filters?: {
    keyword?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    data: Gallery[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      // Check if pagination parameters are provided
      const hasPagination = filters?.page !== undefined || filters?.limit !== undefined;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder || 'DESC';

      // Build query builder
      const queryBuilder = this.galleryRepository
        .createQueryBuilder('gallery')
        .leftJoinAndSelect('gallery.event', 'event');

      // Track if WHERE clause has been set
      let whereClauseSet = false;

      // Filter by keyword if provided - search in gallery title and event name
      if (filters?.keyword && filters.keyword.trim() !== '') {
        const keyword = filters.keyword.toLowerCase().trim();
        queryBuilder.where(
          '(LOWER(gallery.title) LIKE :keyword OR LOWER(event.name) LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
        whereClauseSet = true;
      }

      // Apply sorting
      if (sortBy === 'title') {
        queryBuilder.orderBy('gallery.title', sortOrder);
      } else if (sortBy === 'eventName' || sortBy === 'event.name') {
        queryBuilder.orderBy('event.name', sortOrder);
      } else if (sortBy === 'createdAt') {
        queryBuilder.orderBy('gallery.createdAt', sortOrder);
      } else if (sortBy === 'updatedAt') {
        queryBuilder.orderBy('gallery.updatedAt', sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('gallery.createdAt', sortOrder);
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination only if pagination parameters are provided
      let galleries: Gallery[];
      if (hasPagination) {
        const skip = (page - 1) * limit;
        galleries = await queryBuilder.skip(skip).take(limit).getMany();
        
        return {
          data: galleries,
          pagination: this.filterService.calculatePaginationMetadata(total, page, limit),
        };
      } else {
        // Return all galleries if no pagination parameters
        galleries = await queryBuilder.getMany();
        return {
          data: galleries,
        };
      }
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Galleries retrieval');
    }
  }

  async getGalleryById(id: string) {
    try {
      const gallery = await this.galleryRepository.findOne({
        where: { id },
        relations: ['event'],
      });
      if (!gallery) {
        throw new ResourceNotFoundException('Gallery', id);
      }
      return gallery;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Gallery retrieval by ID');
    }
  }

  async deleteGallery(id: string) {
    try {
      const gallery = await this.galleryRepository.findOne({ 
        where: { id },
        relations: ['event']
      });
      if (!gallery) {
        throw new ResourceNotFoundException('Gallery', id);
      }

      // Delete all images from filesystem
      if (gallery.galleryImages && gallery.galleryImages.length > 0) {
        await this.deleteFilesFromFolder(gallery.galleryImages);
      }

      // Delete gallery from database
      await this.galleryRepository.remove(gallery);
      return { message: 'Gallery deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Gallery deletion');
    }
  }

  async deleteSpecificGalleryImage(galleryId: string, imagePath: string): Promise<{ message: string; data: Gallery }> {
    try {
      const gallery = await this.galleryRepository.findOne({ where: { id: galleryId } });
      if (!gallery) {
        throw new ResourceNotFoundException('Gallery', galleryId);
      }

      if (!gallery.galleryImages || !gallery.galleryImages.includes(imagePath)) {
        throw new ResourceNotFoundException('Image', 'in this gallery');
      }

      // Delete file from filesystem
      await this.deleteFileFromFolder(imagePath);

      // Remove from database
      const updatedImages = gallery.galleryImages.filter(img => img !== imagePath);
      gallery.galleryImages = updatedImages;
      const result = await this.galleryRepository.save(gallery);

      return { message: 'Gallery image deleted successfully', data: result };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Gallery image deletion');
    }
  }

  async clearAllGalleryImages(galleryId: string): Promise<{ message: string; data: Gallery }> {
    try {
      const gallery = await this.galleryRepository.findOne({ where: { id: galleryId } });
      if (!gallery) {
        throw new ResourceNotFoundException('Gallery', galleryId);
      }

      // Delete all files from filesystem
      if (gallery.galleryImages && gallery.galleryImages.length > 0) {
        await this.deleteFilesFromFolder(gallery.galleryImages);
      }

      // Clear all images in database
      gallery.galleryImages = [];
      const result = await this.galleryRepository.save(gallery);

      return { message: 'All gallery images cleared successfully', data: result };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Gallery images clearing');
    }
  }

  // HELPER METHODS FOR FILE DELETION
  private async deleteFileFromFolder(imagePath: string): Promise<void> {
    try {
      if (!imagePath) return;
      const filePath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      this.errorHandler.logError(error, 'File deletion', imagePath);
    }
  }

  private async deleteFilesFromFolder(imagePaths: string[]): Promise<void> {
    try {
      for (const imagePath of imagePaths) {
        await this.deleteFileFromFolder(imagePath);
      }
    } catch (error) {
      this.errorHandler.logError(error, 'Files deletion');
    }
  }
}