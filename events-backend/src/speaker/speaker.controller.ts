// src/controllers/speaker.controller.ts
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
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { Response } from 'express';
import { SpeakerService } from './speaker.service';
import { SpeakerDto } from './speaker.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
@Controller('api/speakers')
export class SpeakerController {
  constructor(private readonly speakerService: SpeakerService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('speakerProfile', {
      storage: diskStorage({
        destination: './uploads/speakerProfile',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname); // Generate a unique filename
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  async createSpeaker(
    @Body() speakerDto: SpeakerDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
  ) {
    if (file) {
        speakerDto.speakerProfile = `uploads/speakerProfile/${file.filename}`;
      }

    const speaker = await this.speakerService.createSpeaker(speakerDto);
    return response.status(201).json({
      success: true,
      message: 'Speaker created successfully',
      data: speaker,
    });
  }

  @Get('get')
  async getAllSpeakers(@Res() response: Response) {
    const speakers = await this.speakerService.getAllSpeakers();
    return response.status(200).json({
      success: true,
      message: 'Speakers retrieved successfully',
      data: speakers,
    });
  }

  @Get(':id')
  async getSpeakerById(@Param('id') id: string, @Res() response: Response) {
    const speaker = await this.speakerService.getSpeakerById(id);
    return response.status(200).json({
      success: true,
      message: 'Speaker retrieved successfully',
      data: speaker,
    });
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
    }),
  )
  async updateSpeaker(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() speakerDto: SpeakerDto,
    @Res() response: Response,
  ) {
    // ✅ Get existing speaker first
    const existingSpeaker = await this.speakerService.getSpeakerById(id).catch(() => null);
  
    // ❌ If speaker not found, delete newly uploaded file
    if (!existingSpeaker) {
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'speakerProfile', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      throw new NotFoundException('Speaker not found');
    }
  
    // ✅ Delete old file if it exists
    if (file) {
      if (existingSpeaker.speakerProfile) {
        const oldPath = path.join(__dirname, '..', '..', existingSpeaker.speakerProfile);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      speakerDto.speakerProfile = `uploads/speakerProfile/${file.filename}`;
    }
  
    const updatedSpeaker = await this.speakerService.updateSpeaker(id, speakerDto);
  
    return response.status(200).json({
      success: true,
      message: 'Speaker updated successfully',
      data: updatedSpeaker,
    });
  }
  
  

  @Delete('delete/:id')
  async deleteSpeaker(@Param('id') id: string, @Res() response: Response) {
    const result = await this.speakerService.deleteSpeaker(id);
    return response.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }
}
