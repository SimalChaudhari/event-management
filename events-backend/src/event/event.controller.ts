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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/event', // Directory to save the uploaded files
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname); // Generate a unique filename
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  async createEvent(
    @Body() eventDto: EventDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
  ) {
    if (file) {
      eventDto.image = `uploads/event/${file.filename}`;
    }
    await this.eventService.createEvent(eventDto);
    return response.status(201).json({
      success: true,
      message: 'Event created successfully',
    });
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
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/event',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  async updateEvent(
    @Param('id') id: string,
    @Body() eventDto: EventDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
  ) {
    // First get the event
    const existingEvent = await this.eventService.getEventEntityById(id).catch(err => null);
  
    // If event not found, delete the just-uploaded image
    if (!existingEvent) {
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      throw new NotFoundException('Event not found');
    }
  
    if (file) {
      // Delete old file if it exists
      if (existingEvent.image) {
        const oldPath = path.join(__dirname, '..', '..', existingEvent.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      eventDto.image = `uploads/event/${file.filename}`;
    }
  
    try {
        const updatedEvent = await this.eventService.updateEvent(id, eventDto);
    
        // ✅ Delete old image only after successful validation & update
        if (file && existingEvent.image) {
          const oldPath = path.join(__dirname, '..', '..', existingEvent.image);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
    
        return response.status(200).json({
          success: true,
          message: 'Event updated successfully',
          data: updatedEvent,
        });
      } catch (error) {
        // ❌ If any error occurs, delete the newly uploaded file
        if (file) {
          const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'event', file.filename);
          if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
        }
        throw error; // Re-throw the error for global handler or client
      }
    }
  
  

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteEvent(@Param('id') id: string) {
    return await this.eventService.deleteEvent(id);
  }
}
