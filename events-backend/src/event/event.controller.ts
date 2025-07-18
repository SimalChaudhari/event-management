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

@Controller('api/events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('create')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'images') {
            cb(null, './uploads/event/images');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/event/documents');
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
        if (file.fieldname === 'images' && file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type for field'), false);
        }
      },
    }),
  )
  async createEvent(
    @Body() eventDto: EventDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], documents?: Express.Multer.File[] },
    @Res() response: Response,
  ) {
    try {
      if (files.images && files.images.length > 0) {
        eventDto.images = files.images.map(
          (img) => `uploads/event/images/${img.filename}`,
        );
      }

      if (files.documents && files.documents.length > 0) {
        eventDto.documents = files.documents.map(
          (doc) => `uploads/event/documents/${doc.filename}`,
        );
      }

      await this.eventService.createEvent(eventDto);

      return response.status(201).json({
        success: true,
        message: 'Event created successfully',
      });
    } catch (error) {
      console.log(error);
      // Clean up uploaded files if error occurs
      if (files.images && files.images.length > 0) {
        files.images.forEach((file) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'event',
            'images',
            file.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }
      if (files.documents && files.documents.length > 0) {
        files.documents.forEach((file) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'event',
            'documents',
            file.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }

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
    const userId = req.user?.id; // Get user ID from JWT token
    const events = await this.eventService.getAllEvents(filters, userId);
    return response.status(200).json({
      success: true,
      total: events.length,
      
      message: 'Events retrieved successfully',
      events: events,
    });
  }

  @Get(':id')
  async getEventById(
    @Param('id') id: string, 
    @Request() req: any,
    @Res() response: Response
  ) {
    const userId = req.user?.id; // Get user ID from JWT token
    const event = await this.eventService.getEventById(id, userId);
    return response.status(200).json({
      success: true,
      message: 'Event retrieved successfully',
      data: event,
    });
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'images') {
            cb(null, './uploads/event/images');
          } else if (file.fieldname === 'documents') {
            cb(null, './uploads/event/documents');
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
        if (file.fieldname === 'images' && file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else if (file.fieldname === 'documents' && file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type for field'), false);
        }
      },
    }),
  )
  async updateEvent(
    @Param('id') id: string,
    @Body() eventDto: EventDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], documents?: Express.Multer.File[] },
    @Res() response: Response,
  ) {
    // First get the event
    const existingEvent = await this.eventService
      .getEventEntityById(id)
      .catch((err) => null);

    // If event not found, delete the just-uploaded files
    if (!existingEvent) {
      if (files.images) {
        files.images.forEach((img) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'event',
            'images',
            img.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }
      if (files.documents) {
        files.documents.forEach((doc) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'event',
            'documents',
            doc.filename,
          );
          if (fs.existsSync(uploadedPath)) {
            fs.unlinkSync(uploadedPath);
          }
        });
      }
      throw new NotFoundException('Event not found');
    }

    try {
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

      const updatedEvent = await this.eventService.updateEvent(id, eventDto);

      return response.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
      });
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (files.images) {
        files.images.forEach((img) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'event',
            'images',
            img.filename,
          );
          if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
        });
      }
      if (files.documents) {
        files.documents.forEach((doc) => {
          const uploadedPath = path.join(
            __dirname,
            '..',
            '..',
            'uploads',
            'event',
            'documents',
            doc.filename,
          );
          if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
        });
      }
      throw error;
    }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteEvent(@Param('id') id: string) {
    return await this.eventService.deleteEvent(id);
  }

  // Remove individual image
  @Delete('images/:id')
  @Roles(UserRole.Admin)
  async removeEventImage(
    @Param('id') id: string,
    @Body() body: { imagePath: string },
    @Res() response: Response,
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const { imagePath } = body;

      // Check if image exists in event
      if (!event.images || !event.images.includes(imagePath)) {
        throw new NotFoundException('Image not found in this event');
      }

      // Remove image from filesystem
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Remove image from database using new method
      const updatedImages = event.images.filter(img => img !== imagePath);
      await this.eventService.updateEventImages(id, updatedImages);

      return response.status(200).json({
        success: true,
        message: 'Image removed successfully',
        data: { images: updatedImages }
      });
    } catch (error) {
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
  ) {
    try {
      const event = await this.eventService.getEventEntityById(id);
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const { documentPath } = body;

      // Check if document exists in event
      if (!event.documents || !event.documents.includes(documentPath)) {
        throw new NotFoundException('Document not found in this event');
      }

      // Remove document from filesystem
      const fullPath = path.join(__dirname, '..', '..', documentPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Remove document from database using new method
      const updatedDocuments = event.documents.filter(doc => doc !== documentPath);
      await this.eventService.updateEventDocuments(id, updatedDocuments);

      return response.status(200).json({
        success: true,
        message: 'Document removed successfully',
        data: { documents: updatedDocuments }
      });
    } catch (error) {
      throw error;
    }
  }


}
