// src/gallery/gallery.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { GalleryService } from './gallery.service';

@Controller('api/gallery')
@UseGuards(JwtAuthGuard)
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  async getAllGalleryItems(
    @Query()
    filters: {
      keyword?: string;
      type?: 'images' | 'documents' | 'all';
      eventId?: string;
    },
    @Res() response: Response,
  ) {
    try {
      const galleryItems = await this.galleryService.getAllGalleryItems(filters);
      
      return response.status(200).json({
        success: true,
        message: 'Gallery items retrieved successfully',
        total: galleryItems.length,
        data: galleryItems,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get('event/:eventId')
  async getGalleryByEvent(
    @Param('eventId') eventId: string,
    @Query()
    filters: {
      type?: 'images' | 'documents' | 'all';
    },
    @Res() response: Response,
  ) {
    try {
      const galleryItems = await this.galleryService.getGalleryByEvent(eventId, filters);
      
      if (!galleryItems) {
        throw new NotFoundException('Event not found or no gallery items available');
      }

      return response.status(200).json({
        success: true,
        message: 'Event gallery retrieved successfully',
        eventId: eventId,
        total: galleryItems.images.length + galleryItems.documents.length,
        data: galleryItems,
      });
    } catch (error) {
      throw error;
    }
  }


} 