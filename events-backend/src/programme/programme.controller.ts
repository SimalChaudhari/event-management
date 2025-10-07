import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ProgrammeService } from './programme.service';
import {
  CreateProgrammeTrackDto,
  UpdateProgrammeTrackDto,
  CreateProgrammeSessionDto,
  UpdateProgrammeSessionDto,
} from './programme.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';

@Controller('api/programme')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgrammeController {
  constructor(
    private readonly programmeService: ProgrammeService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Track Management Endpoints
  @Post('events/:eventId/tracks')
  @Roles(UserRole.Admin)
  async createTrack(
    @Param('eventId') eventId: string,
    @Body() createTrackDto: CreateProgrammeTrackDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const track = await this.programmeService.createTrack(eventId, createTrackDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme track created successfully',
        data: track,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Create Programme Track', req.user?.id);
      throw error;
    }
  }

  @Get('events/:eventId/tracks')
  async getTracksByEvent(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const tracks = await this.programmeService.getTracksByEvent(eventId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme tracks retrieved successfully',
        data: tracks,
        metadata: {
          total: tracks.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Tracks', req.user?.id);
      throw error;
    }
  }

  @Put('tracks/:trackId')
  @Roles(UserRole.Admin)
  async updateTrack(
    @Param('trackId') trackId: string,
    @Body() updateTrackDto: UpdateProgrammeTrackDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const track = await this.programmeService.updateTrack(trackId, updateTrackDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme track updated successfully',
        data: track,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Update Programme Track', req.user?.id);
      throw error;
    }
  }

  @Delete('tracks/:trackId')
  @Roles(UserRole.Admin)
  async deleteTrack(
    @Param('trackId') trackId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      await this.programmeService.deleteTrack(trackId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme track deleted successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Delete Programme Track', req.user?.id);
      throw error;
    }
  }

  // Session Management Endpoints
  @Post('sessions')
  @Roles(UserRole.Admin)
  async createSession(
    @Body() createSessionDto: CreateProgrammeSessionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const session = await this.programmeService.createSession(createSessionDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme session created successfully',
        data: session,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Create Programme Session', req.user?.id);
      throw error;
    }
  }

  @Get('tracks/:trackId/sessions')
  async getSessionsByTrack(
    @Param('trackId') trackId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const sessions = await this.programmeService.getSessionsByTrack(trackId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme sessions retrieved successfully',
        data: sessions,
        metadata: {
          total: sessions.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Sessions', req.user?.id);
      throw error;
    }
  }

  @Get('events/:eventId/sessions')
  async getSessionsByEvent(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const sessions = await this.programmeService.getSessionsByEvent(eventId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme sessions retrieved successfully',
        data: sessions,
        metadata: {
          total: sessions.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Sessions by Event', req.user?.id);
      throw error;
    }
  }

  @Put('sessions/:sessionId')
  @Roles(UserRole.Admin)
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdateProgrammeSessionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const session = await this.programmeService.updateSession(sessionId, updateSessionDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme session updated successfully',
        data: session,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Update Programme Session', req.user?.id);
      throw error;
    }
  }

  @Delete('sessions/:sessionId')
  @Roles(UserRole.Admin)
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      await this.programmeService.deleteSession(sessionId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Programme session deleted successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Delete Programme Session', req.user?.id);
      throw error;
    }
  }
}
