// src/gallery/gallery.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Post,
  UseInterceptors,
  Body,
  UploadedFiles,
  Delete,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { GalleryService } from './gallery.service';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GalleryDto } from './gallery.dto';
import path from 'path';
import * as fs from 'fs';
import { EventService } from 'event/event.service';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { ResourceNotFoundException, ValidationException } from '../utils/exceptions/custom-exceptions';

@Controller('api/gallery')
@UseGuards(JwtAuthGuard)
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService, 
    private readonly eventService: EventService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Fot Events
  @Get()
  async getAllGalleryItems(
    @Query()
    filters: {
      keyword?: string;
      type?: 'images' | 'documents' | 'all';
      eventId?: string;
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const galleryItems = await this.galleryService.getAllGalleryItems(filters);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Gallery items retrieved successfully',
        data: galleryItems,
        metadata: {
          total: galleryItems.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery items retrieval', req.user?.id);
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
    @Request() req: any,
  ) {
    try {
      const galleryItems = await this.galleryService.getGalleryByEvent(eventId, filters);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event gallery retrieved successfully',
        data: {
          // eventId: eventId,
          ...galleryItems,
        },
        metadata: {
          total: galleryItems.images.length + galleryItems.documents.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery retrieval by event', req.user?.id);
      throw error;
    }
  }


  // For Event Gallery
  
  @Post('create-or-update/:eventId')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'galleryImages', maxCount: 500 },
    ], {
      storage: diskStorage({
        destination: './uploads/gallery/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (file.fieldname === 'galleryImages' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed types for images: JPEG, JPG, PNG, GIF.`), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async createOrUpdateGallery(
    @Param('eventId') eventId: string,
    @Body() galleryDto: GalleryDto,
    @UploadedFiles() files: { galleryImages?: Express.Multer.File[] },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (files.galleryImages && files.galleryImages.length > 0) {
        galleryDto.galleryImages = files.galleryImages.map(
          (img) => `uploads/gallery/images/${img.filename}`,
        );
      }
      
      // Check if event exists
      const event = await this.eventService.getEventEntityById(eventId);
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      const gallery = await this.galleryService.createOrUpdateGallery(eventId, galleryDto);

      // Check if gallery was created or updated
      const isNewGallery = !gallery.data.id || gallery.data.createdAt === gallery.data.updatedAt;

      const successResponse: SuccessResponse = {
        success: true,
        message: isNewGallery ? 'Gallery created successfully' : 'Gallery updated successfully',
        data: {
          ...gallery,
          action: isNewGallery ? 'created' : 'updated',
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      if (files.galleryImages && files.galleryImages.length > 0) {
        files.galleryImages.forEach((file) => {
          const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'gallery', 'images', file.filename);
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Gallery Images Upload');
      }
      
      this.errorHandler.logError(error, 'Gallery creation/update', req.user?.id);
      throw error;
    }
  }

  @Get('get-all')
  async getAllGalleries(@Res() response: Response, @Request() req: any) {
    try {
      const galleries = await this.galleryService.getAllGalleries();
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Galleries retrieved successfully',
        data: galleries,
        metadata: {
          total: galleries.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Galleries retrieval', req.user?.id);
      throw error;
    }
  }

  @Get(':id')
  async getGalleryById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const gallery = await this.galleryService.getGalleryById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Gallery retrieved successfully',
        data: gallery,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery retrieval by ID', req.user?.id);
      throw error;
    }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteGallery(@Param('id') id: string, @Res() response: Response, @Request() req: any) {
    try {
      const result = await this.galleryService.deleteGallery(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery deletion', req.user?.id);
      throw error;
    }
  }

  @Delete('delete-image/:galleryId')
  @Roles(UserRole.Admin)
  async deleteSpecificGalleryImage(
    @Param('galleryId') galleryId: string,
    @Body() body: { imagePath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!body.imagePath) {
        throw new ValidationException('Image path is required');
      }

      const result = await this.galleryService.deleteSpecificGalleryImage(galleryId, body.imagePath);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery image deletion', req.user?.id);
      throw error;
    }
  }

  @Delete('clear/:galleryId')
  @Roles(UserRole.Admin)
  async clearAllGalleryImages(
    @Param('galleryId') galleryId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.galleryService.clearAllGalleryImages(galleryId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Gallery images clearing', req.user?.id);
      throw error;
    }
  }
}