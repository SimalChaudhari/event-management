import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from 'event/event.entity';
import { Like } from 'typeorm';
import { Gallery } from './gallery.entity';
import { GalleryDto, UpdateGalleryDto } from './gallery.dto';
import * as fs from 'fs';
import path from 'path';

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

  // Events Gallery

  async createOrUpdateGallery(galleryDto: GalleryDto) {
    try {
      // Check if gallery already exists for this event
      const existingGallery = await this.galleryRepository.findOne({
        where: { eventId: galleryDto.eventId },
      });
      
      if (existingGallery) {
        // Delete previous images from upload folder
        if (existingGallery.galleryImages && existingGallery.galleryImages.length > 0) {
          await this.deleteFilesFromFolder(existingGallery.galleryImages);
        }
        
        // Update existing gallery with new data (replace old images)
        existingGallery.title = galleryDto.title;
        existingGallery.galleryImages = galleryDto.galleryImages || [];
        
        const result = await this.galleryRepository.save(existingGallery);
        return { message: 'Gallery updated successfully', data: result };
      }

      // Create new gallery if none exists
      const gallery = this.galleryRepository.create(galleryDto);
      const result = await this.galleryRepository.save(gallery);
      return { message: 'Gallery created successfully', data: result };
    } catch (error: any) {
      throw new InternalServerErrorException('Error creating or updating gallery', error.message);
    }
  }

  async getAllGalleries() {
    return await this.galleryRepository.find({
      relations: ['event'],
      order: { createdAt: 'DESC' },
    });
  }

  async getGalleryById(id: string) {
    const gallery = await this.galleryRepository.findOne({
      where: { id },
      relations: ['event'],
    });
    if (!gallery) {
      throw new NotFoundException('Gallery not found');
    }
    return gallery;
  }

  // DELETE GALLERY COMPLETELY
  async deleteGallery(id: string) {
    try {
      const gallery = await this.galleryRepository.findOne({ 
        where: { id },
        relations: ['event']
      });
      if (!gallery) {
        throw new NotFoundException('Gallery not found');
      }

      // Delete all images from filesystem
      if (gallery.galleryImages && gallery.galleryImages.length > 0) {
        await this.deleteFilesFromFolder(gallery.galleryImages);
      }

      // Delete gallery from database
      await this.galleryRepository.remove(gallery);
      return { message: 'Gallery deleted successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error deleting gallery', error.message);
    }
  }

  // DELETE SPECIFIC IMAGE FROM GALLERY
  async deleteSpecificGalleryImage(galleryId: string, imagePath: string): Promise<{ message: string; data: Gallery }> {
    try {
      const gallery = await this.galleryRepository.findOne({ where: { id: galleryId } });
      if (!gallery) {
        throw new NotFoundException('Gallery not found');
      }

      if (!gallery.galleryImages || !gallery.galleryImages.includes(imagePath)) {
        throw new NotFoundException('Image not found in this gallery');
      }

      // Delete file from filesystem
      await this.deleteFileFromFolder(imagePath);

      // Remove from database
      const updatedImages = gallery.galleryImages.filter(img => img !== imagePath);
      gallery.galleryImages = updatedImages;
      const result = await this.galleryRepository.save(gallery);

      return { message: 'Gallery image deleted successfully', data: result };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error deleting gallery image', error.message);
    }
  }



  // CLEAR ALL IMAGES FROM GALLERY
  async clearAllGalleryImages(galleryId: string): Promise<{ message: string; data: Gallery }> {
    try {
      const gallery = await this.galleryRepository.findOne({ where: { id: galleryId } });
      if (!gallery) {
        throw new NotFoundException('Gallery not found');
      }

      // Delete all files from filesystem
      if (gallery.galleryImages && gallery.galleryImages.length > 0) {
        await this.deleteFilesFromFolder(gallery.galleryImages);
      }

      // Clear all images in database
      gallery.galleryImages = [];
      const result = await this.galleryRepository.save(gallery);

      return { message: 'All gallery images cleared successfully', data: result };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error clearing gallery images', error.message);
    }
  }


  // HELPER METHODS FOR FILE DELETION
  private async deleteFileFromFolder(imagePath: string): Promise<void> {
    try {
      if (!imagePath) return;
      const filePath = path.join(process.cwd(), imagePath);
      console.log('Deleting file:', filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);
      } else {
        console.log(`File not found: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error deleting file ${imagePath}:`, error);
    }
  }

  private async deleteFilesFromFolder(imagePaths: string[]): Promise<void> {
    try {
      for (const imagePath of imagePaths) {
        await this.deleteFileFromFolder(imagePath);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  }

}