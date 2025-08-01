// src/chat/broadcast.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BroadcastService } from './broadcast.service';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
  metadata?: {
    timestamp: string;
    [key: string]: any;
  };
}

@Controller('api/events/broadcast')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BroadcastController {
  constructor(
    private readonly broadcastService: BroadcastService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // =============== SPEAKER CHAT SYSTEM ===============

  // Get all available speakers
  @Get('speakers')
  @Roles(UserRole.User, UserRole.Admin)
  async getAvailableSpeakers(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const speakers = await this.broadcastService.getAvailableSpeakers();
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Available speakers retrieved successfully',
        data: {
          speakers,
          totalSpeakers: speakers.length,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get speakers', req.user?.id);
      throw error;
    }
  }

  // Join specific speaker's chat room
  @Post('speaker/:speakerId/join')
  @Roles(UserRole.User, UserRole.Admin)
  async joinSpeakerChat(
    @Param('speakerId') speakerId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.broadcastService.joinSpeakerChat(speakerId, req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: `Successfully joined chat with ${result.speaker.name}`,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          speakerId,
          roomId: result.room.id,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Join speaker chat', req.user?.id);
      throw error;
    }
  }

  // Send message to specific speaker (must be joined first)
  @Post('speaker/:speakerId/message')
  @Roles(UserRole.User, UserRole.Admin)
  async sendMessageToSpeaker(
    @Param('speakerId') speakerId: string,
    @Body() messageData: { message: string; isAnonymous?: boolean },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.broadcastService.sendMessageToSpeaker(
        speakerId,
        messageData.message,
        req.user?.id,
        messageData.isAnonymous || false
      );
      
      const successResponse: SuccessResponse = {
        success: true,
        message: `Message sent to ${result.speaker.name} successfully`,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          speakerId,
          targetSpeaker: result.speaker.name,
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Send message to speaker', req.user?.id);
      throw error;
    }
  }

  // Get chat messages with specific speaker
  @Get('speaker/:speakerId/messages')
  @Roles(UserRole.User, UserRole.Admin)
  async getSpeakerChatMessages(
    @Param('speakerId') speakerId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 50;
      
      const result = await this.broadcastService.getSpeakerChatMessages(
        speakerId,
        req.user?.id,
        pageNum,
        limitNum
      );
      
      const successResponse: SuccessResponse = {
        success: true,
        message: `Chat messages with ${result.speaker.name} retrieved successfully`,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          speakerId,
          currentPage: pageNum,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get speaker messages', req.user?.id);
      throw error;
    }
  }

  // Get live updates from speaker chat
  @Get('speaker/:speakerId/live')
  @Roles(UserRole.User, UserRole.Admin)
  async getSpeakerLiveUpdates(
    @Res() response: Response,
    @Request() req: any,
    @Param('speakerId') speakerId: string,
    @Query('lastUpdate') lastUpdate?: string,
  
  ) {
    try {
      const result = await this.broadcastService.getSpeakerLiveUpdates(
        speakerId,
        req.user?.id,
        lastUpdate
      );
      
      const successResponse: SuccessResponse = {
        success: true,
        message: `Live updates from ${result.speaker.name} retrieved successfully`,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          speakerId,
          newMessages: result.newMessages,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get speaker live updates', req.user?.id);
      throw error;
    }
  }

  // Get user's joined speaker rooms
  @Get('my-rooms')
  @Roles(UserRole.User, UserRole.Admin)
  async getMyJoinedRooms(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const rooms = await this.broadcastService.getUserJoinedRooms(req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Your joined speaker rooms retrieved successfully',
        data: {
          joinedRooms: rooms,
          totalRooms: rooms.length,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get my rooms', req.user?.id);
      throw error;
    }
  }
} 