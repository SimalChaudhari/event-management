// src/controllers/eventStamp.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EventStampService } from './eventStamp.service';
import { CreateEventStampDto, UpdateEventStampDto, CreateOrUpdateEventStampDto } from './eventStamp.dto';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import * as fs from 'fs';

@Controller('api/events/event-stamps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventStampController {
  constructor(private readonly eventStampService: EventStampService) {}

  @Post('create-or-update')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, './uploads/eventStamps/images');
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images are allowed.'), false);
        }
      },
    }),
  )
  async createOrUpdateEventStamp(
    @Body() createOrUpdateEventStampDto: CreateOrUpdateEventStampDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Res() response: Response,
  ) {
    try {
      // Handle images
      if (files.images && files.images.length > 0) {
        createOrUpdateEventStampDto.images = files.images.map(
          (img) => `uploads/eventStamps/images/${img.filename}`,
        );
      }

      const eventStamp = await this.eventStampService.createOrUpdateEventStamp(createOrUpdateEventStampDto);

      return response.status(200).json({
        success: true,
        message: 'Event stamp created/updated successfully',
        data: eventStamp,
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
            'eventStamps',
            'images',
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
  async getAllEventStamps(@Res() response: Response) {
    const eventStamps = await this.eventStampService.getAllEventStamps();
    return response.status(200).json({
      success: true,
      total: eventStamps.length,
      message: 'Event stamps retrieved successfully',
      data: eventStamps,
    });
  }

  @Get('event/:eventId')
  async getEventStampsByEventId(
    @Param('eventId') eventId: string,
    @Res() response: Response,
  ) {
    const eventStamps = await this.eventStampService.getEventStampsByEventId(eventId);
    return response.status(200).json({
      success: true,
      total: eventStamps.length,
      message: 'Event stamps retrieved successfully',
      data: eventStamps,
    });
  }

  @Get(':id')
  async getEventStampById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const eventStamp = await this.eventStampService.getEventStampById(id);
    return response.status(200).json({
      success: true,
      message: 'Event stamp retrieved successfully',
      data: eventStamp,
    });
  }


  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteEventStamp(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const result = await this.eventStampService.deleteEventStamp(id);
    return response.status(200).json({
      success: true,
      message: result.message,
    });
  }

  @Delete('images/:id')
  @Roles(UserRole.Admin)
  async removeEventStampImage(
    @Param('id') id: string,
    @Body() body: { imagePath: string },
    @Res() response: Response,
  ) {
    const result = await this.eventStampService.removeEventStampImage(id, body.imagePath);
    return response.status(200).json({
      success: true,
      message: result.message,
      data: { images: result.images }
    });
  }
} 