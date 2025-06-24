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
    },
    @Res() response: Response,
  ) {
    const events = await this.eventService.getAllEvents(filters);
    return response.status(200).json({
      success: true,
      total: events.length,
      message: 'Events retrieved successfully',
      events: events,
    });
  }

  @Get(':id')
  async getEventById(@Param('id') id: string, @Res() response: Response) {
    const event = await this.eventService.getEventById(id);
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
      if (files.images && files.images.length > 0) {
        // Delete old images if they exist
        if (existingEvent.images && existingEvent.images.length > 0) {
          existingEvent.images.forEach((oldImg) => {
            const oldPath = path.join(__dirname, '..', '..', oldImg);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          });
        }
        eventDto.images = files.images.map(
          (img) => `uploads/event/images/${img.filename}`,
        );
      }

      if (files.documents && files.documents.length > 0) {
        // Delete old documents if they exist
        if (existingEvent.documents && existingEvent.documents.length > 0) {
          existingEvent.documents.forEach((oldDoc) => {
            const oldPath = path.join(__dirname, '..', '..', oldDoc);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          });
        }
        eventDto.documents = files.documents.map(
          (doc) => `uploads/event/documents/${doc.filename}`,
        );
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
}
