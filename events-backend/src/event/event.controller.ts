// src/controllers/event.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  NotFoundException,
  UploadedFiles,
  Request,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EventService } from './event.service';
import { EventDto, EventType } from './event.dto';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import * as fs from 'fs';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { ResourceNotFoundException } from '../utils/exceptions/custom-exceptions';

@Controller('api/events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'floorPlan', maxCount: 1 }, // Add floor plan field
      { name: 'eventStampImages', maxCount: 10 }, // Add event stamp images

    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'images') {
            cb(null, './uploads/event/images');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/event/documents');
          } else if (file.fieldname === 'floorPlan') {
            cb(null, './uploads/event/floorPlan'); // New directory for floor plan
          } else if (file.fieldname === 'eventStampImages') {
            cb(null, './uploads/eventStamps/images'); // Event stamp images
          } else {
            cb(null, './uploads/event/images'); // Default
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {

        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
     
        if (file.fieldname === 'images' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
          cb(null, true);
        } else if (file.fieldname === 'floorPlan' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else if (file.fieldname === 'eventStampImages' && allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed types for images: JPEG, JPG, PNG, GIF. For documents: PDF only.`), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async createEvent(
    @Body() eventDto: EventDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], documents?: Express.Multer.File[], 
      floorPlan?: Express.Multer.File[],
      eventStampImages?: Express.Multer.File[]
    
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (files.images && files.images.length > 0) {
        eventDto.images = files.images.map(
          (img) => `uploads/event/images/${img.filename}`,
        );
      }

      if (files.eventStampImages && files.eventStampImages.length > 0) {
        eventDto.eventStampImages = files.eventStampImages.map(
          (img) => `uploads/eventStamps/images/${img.filename}`,
        );
      }

      if (files.documents && files.documents.length > 0) {
        eventDto.documents = files.documents.map(
          (doc) => `uploads/event/documents/${doc.filename}`,
        );
      }

     // Handle floor plan
     if (files.floorPlan && files.floorPlan.length > 0) {
      eventDto.floorPlan = `uploads/event/floorPlan/${files.floorPlan[0].filename}`;
    }

    const savedEvent = await this.eventService.createEvent(eventDto);

    const successResponse: SuccessResponse = {
      success: true,
      message: 'Event created successfully',
      data: savedEvent,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      this.cleanupUploadedFiles(files);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Event File Upload');
      }
      
      this.errorHandler.logError(error, 'Event creation', req.user?.id);
      throw error;
    }
  }

  @Get()
  async getAllEvents(
    @Query()
    filters: {
      keyword?: string;
      startDate?: string;
      endDate?: string;
      type?: EventType;
      price?: number;
      location?: string;
      category?: string;
    },
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id; // Get user ID from JWT token
      const events = await this.eventService.getAllEvents(filters, userId);
      
      const successResponse: any = {
        success: true,
        message: 'Events retrieved successfully',
        events: events,
        metadata: {
          total: events.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Events retrieval', req.user?.id);
      throw error;
    }
  }

  @Get(':id')
  async getEventById(
    @Param('id') id: string, 
    @Request() req: any,
    @Res() response: Response
  ) {
    try {
      const userId = req.user?.id; // Get user ID from JWT token
      const event = await this.eventService.getEventById(id, userId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event retrieved successfully',
        data: event,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event retrieval by ID', req.user?.id);
      throw error;
    }
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
      { name: 'floorPlan', maxCount: 1 }, // Add floor plan field
      { name: 'eventStampImages', maxCount: 10 }, // Add event stamp images
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'images') {
            cb(null, './uploads/event/images');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/event/documents');
          } else if (file.fieldname === 'floorPlan') {
            cb(null, './uploads/event/floorPlan'); // New directory for floor plan
          } else if (file.fieldname === 'eventStampImages') {
            cb(null, './uploads/eventStamps/images'); // Event stamp images
          } else {
            cb(null, './uploads/event/images'); // Default
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {

      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
     
       if (file.fieldname === 'images' && allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
        cb(null, true);
      } else if (file.fieldname === 'floorPlan' && allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else if (file.fieldname === 'eventStampImages' && allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types for images: JPEG, JPG, PNG, GIF. For documents: PDF only.`), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }),
)
  async updateEvent(
    @Param('id') id: string,
    @Body() eventDto: EventDto,
    @UploadedFiles() files: { 
      images?: Express.Multer.File[], 
      documents?: Express.Multer.File[], 
      floorPlan?: Express.Multer.File[],
      eventStampImages?: Express.Multer.File[] // Add this
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    let existingEvent = null;
    
    try {
      // Get existing event first
      existingEvent = await this.eventService.getEventEntityById(id);
      
      // Handle images - combine existing and new images
      const allImages = [];
      
      // Add existing images from originalImages field
      if (eventDto.originalImages) {
        const originalImages = Array.isArray(eventDto.originalImages) 
          ? eventDto.originalImages 
          : [eventDto.originalImages];
        allImages.push(...originalImages);
      }
      
      // Add new uploaded images
      if (files.images && files.images.length > 0) {
        const newImages = files.images.map(
          (img) => `uploads/event/images/${img.filename}`,
        );
        allImages.push(...newImages);
      }
      
      // Set the combined images
      if (allImages.length > 0) {
        eventDto.images = allImages;
      }

      // Handle documents - combine existing and new documents
      const allDocuments = [];
      
      // Add existing documents from originalDocuments field
      if (eventDto.originalDocuments) {
        const originalDocuments = Array.isArray(eventDto.originalDocuments) 
          ? eventDto.originalDocuments 
          : [eventDto.originalDocuments];
        allDocuments.push(...originalDocuments);
      }
      
      // Add new uploaded documents
      if (files.documents && files.documents.length > 0) {
        const newDocuments = files.documents.map(
          (doc) => `uploads/event/documents/${doc.filename}`,
        );
        allDocuments.push(...newDocuments);
      }
      
      // Set the combined documents
      if (allDocuments.length > 0) {
        eventDto.documents = allDocuments;
      }

      // Handle floor plan - single image only
      if (files.floorPlan && files.floorPlan.length > 0) {
        // New floor plan uploaded - replace existing
        eventDto.floorPlan = `uploads/event/floorPlan/${files.floorPlan[0].filename}`;
      } else if (eventDto.originalFloorPlan) {
        // Keep existing floor plan if no new one uploaded
        eventDto.floorPlan = eventDto.originalFloorPlan;
      }
      // If neither new upload nor original, floorPlan will be null/undefined

      // Handle event stamp images - combine existing and new images
      const allEventStampImages = [];
      
      // Add existing event stamp images from originalEventStampImages field
      if (eventDto.originalEventStampImages) {
        const originalEventStampImages = Array.isArray(eventDto.originalEventStampImages) 
          ? eventDto.originalEventStampImages 
          : [eventDto.originalEventStampImages];
        allEventStampImages.push(...originalEventStampImages);
      }
      
      // Add new uploaded event stamp images
      if (files.eventStampImages && files.eventStampImages.length > 0) {
        const newEventStampImages = files.eventStampImages.map(
          (img) => `uploads/eventStamps/images/${img.filename}`,
        );
        allEventStampImages.push(...newEventStampImages);
      }
      
      // Set the combined event stamp images
      if (allEventStampImages.length > 0) {
        eventDto.eventStampImages = allEventStampImages;
      }

      const updatedEvent = await this.eventService.updateEvent(id, eventDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      this.cleanupUploadedFiles(files);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Event File Upload');
      }
      
      this.errorHandler.logError(error, 'Event update', req.user?.id);
      throw error;
    }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteEvent(@Param('id') id: string, @Res() response: Response, @Request() req: any) {
    try {
      const result = await this.eventService.deleteEvent(id);
      
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
      this.errorHandler.logError(error, 'Event deletion', req.user?.id);
      throw error;
    }
  }

  // Remove individual image
  @Delete('images/:id')
  @Roles(UserRole.Admin)
  async removeEventImage(
    @Param('id') id: string,
    @Body() body: { imagePath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);
      const { imagePath } = body;

      if (!event.images || !event.images.includes(imagePath)) {
        throw new ResourceNotFoundException('Image', 'in this event');
      }

      // Remove image from filesystem
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedImages = event.images.filter(img => img !== imagePath);
      await this.eventService.updateEventImages(id, updatedImages);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Image removed successfully',
        data: { images: updatedImages },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event image removal', req.user?.id);
      throw error;
    }
  }

  // Remove individual document
  @Delete('documents/:id')
  @Roles(UserRole.Admin)
  async removeEventDocument(
    @Param('id') id: string,
    @Body() body: { documentPath: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);
      const { documentPath } = body;

      if (!event.documents || !event.documents.includes(documentPath)) {
        throw new ResourceNotFoundException('Document', 'in this event');
      }

      // Remove document from filesystem
      const fullPath = path.join(__dirname, '..', '..', documentPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const updatedDocuments = event.documents.filter(doc => doc !== documentPath);
      await this.eventService.updateEventDocuments(id, updatedDocuments);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Document removed successfully',
        data: { documents: updatedDocuments },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Event document removal', req.user?.id);
      throw error;
    }
  }

    // Remove individual event stamp image
    @Delete('event-stamps/images/:id')
    @Roles(UserRole.Admin)
    async removeEventStampImage(
      @Param('id') id: string,
      @Body() body: { imagePath: string },
      @Res() response: Response,
      @Request() req: any,
    ) {
      try {
        const event = await this.eventService.getEventEntityById(id);
        const { imagePath } = body;

        if (!event.eventStampImages || !event.eventStampImages.includes(imagePath)) {
          throw new ResourceNotFoundException('Event stamp image', 'in this event');
        }

        // Remove image from filesystem
        const fullPath = path.join(__dirname, '..', '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }

        const updatedEventStampImages = event.eventStampImages.filter(img => img !== imagePath);
        await this.eventService.updateEventStampImages(id, updatedEventStampImages);

        const successResponse: SuccessResponse = {
          success: true,
          message: 'Event stamp image removed successfully',
          data: { eventStampImages: updatedEventStampImages },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };

        return response.status(HttpStatus.OK).json(successResponse);
      } catch (error) {
        this.errorHandler.logError(error, 'Event stamp image removal', req.user?.id);
        throw error;
      }
    }
  

    // Remove floor plan
    @Delete('floor-plan/:id')
    @Roles(UserRole.Admin)
    async removeEventFloorPlan(
      @Param('id') id: string,
      @Res() response: Response,
      @Request() req: any,
    ) {
      try {
        const event = await this.eventService.getEventEntityById(id);

        if (!event.floorPlan) {
          throw new ResourceNotFoundException('Floor plan', 'in this event');
        }

        // Delete floor plan from filesystem
        const fullPath = path.join(__dirname, '..', '..', event.floorPlan);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }

        await this.eventService.updateEventFloorPlan(id, null);

        const successResponse: SuccessResponse = {
          success: true,
          message: 'Floor plan removed successfully',
          data: { floorPlan: "" },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };

        return response.status(HttpStatus.OK).json(successResponse);
      } catch (error) {
        this.errorHandler.logError(error, 'Event floor plan removal', req.user?.id);
        throw error;
      }
    }

  // Helper method to clean up uploaded files
  private cleanupUploadedFiles(files: any) {
    if (files.images) {
      files.images.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', 'images', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.documents) {
      files.documents.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', 'documents', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.floorPlan) {
      files.floorPlan.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', 'floorPlan', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
    if (files.eventStampImages) {
      files.eventStampImages.forEach((file: any) => {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'eventStamps', 'images', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      });
    }
  }
}
