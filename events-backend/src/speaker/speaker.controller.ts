// src/speaker/speaker.controller.ts
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
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { Response } from 'express';
import { SpeakerService } from './speaker.service';
import { SpeakerDto } from './speaker.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';

@Controller('api/speakers')
export class SpeakerController {
  constructor(
    private readonly speakerService: SpeakerService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('speakerProfile', {
      storage: diskStorage({
        destination: './uploads/speakerProfile',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async createSpeaker(
    @Body() speakerDto: SpeakerDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
  ) {
    try {
      if (file) {
        speakerDto.speakerProfile = `uploads/speakerProfile/${file.filename}`;
      }

      const speaker = await this.speakerService.createSpeaker(speakerDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speaker created successfully',
        data: speaker,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error:any) {
      // Delete uploaded file if speaker creation fails
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'speakerProfile', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Speaker Profile Upload');
      }
      
      this.errorHandler.logError(error, 'Speaker creation', (response as any).user?.id);
      throw error;
    }
  }

  @Get('get')
  async getAllSpeakers(@Res() response: Response) {
    try {
      const speakers = await this.speakerService.getAllSpeakers();
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speakers retrieved successfully',
        data: speakers,
        metadata: {
          total: speakers.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Speaker retrieval');
      throw error;
    }
  }

  @Get(':id')
  async getSpeakerById(@Param('id') id: string, @Res() response: Response) {
    try {
      const speaker = await this.speakerService.getSpeakerById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speaker retrieved successfully',
        data: speaker,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Speaker retrieval by ID');
      throw error;
    }
  }

  @Put('update/:id')
  @UseInterceptors(
    FileInterceptor('speakerProfile', {
      storage: diskStorage({
        destination: './uploads/speakerProfile',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async updateSpeaker(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() speakerDto: SpeakerDto,
    @Res() response: Response,
  ) {
    let existingSpeaker = null;
    
    try {
      // Get existing speaker first
      existingSpeaker = await this.speakerService.getSpeakerById(id);
      
      // Handle file upload
      if (file) {
        // Delete old file if it exists
        if (existingSpeaker.speakerProfile) {
          const oldPath = path.join(__dirname, '..', '..', existingSpeaker.speakerProfile);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        speakerDto.speakerProfile = `uploads/speakerProfile/${file.filename}`;
      }

      const updatedSpeaker = await this.speakerService.updateSpeaker(id, speakerDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speaker updated successfully',
        data: updatedSpeaker,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error:any) {
      // If speaker not found or update failed, delete newly uploaded file
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'speakerProfile', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Speaker Profile Upload');
      }
      
      this.errorHandler.logError(error, 'Speaker update', (response as any).user?.id);
      throw error;
    }
  }

  @Delete('delete/:id')
  async deleteSpeaker(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await this.speakerService.deleteSpeaker(id);
      
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
      this.errorHandler.logError(error, 'Speaker deletion', (response as any).user?.id);
      throw error;
    }
  }
}
