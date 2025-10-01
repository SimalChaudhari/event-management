// src/polling/polling.controller.ts
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
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { PollingService } from './polling.service';
import { CreatePollDto, UpdatePollDto, VoteDto } from './polling.dto';
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

@Controller('api/events/polls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PollingController {
  constructor(
    private readonly pollingService: PollingService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // =============== TIMER-BASED POLLING APIs ===============

  // Get or Create Session with Current Question - Single API
  @Get('session/:eventId/:speakerId')
  async getOrCreateSession(
    @Param('eventId') eventId: string,
    @Param('speakerId') speakerId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.getOrCreateSession(
        req.user?.id,
        eventId,
        speakerId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'isCompleted' in result && result.isCompleted
          ? 'Session already completed. Here are your results:' 
          : 'Session retrieved successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          eventId: eventId,
          speakerId: speakerId,
          isCompleted: 'isCompleted' in result ? result.isCompleted : false,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get or create session', req.user?.id);
      throw error;
    }
  }

  // Submit Answer and Advance to Next Question - Updated to use eventId instead of sessionId
  @Post('session/submit-answer/:eventId/:speakerId')
  async submitAnswerAndAdvance(
    @Param('eventId') eventId: string,
    @Param('speakerId') speakerId: string,
    @Body() body: { pollId: string; optionId: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.submitAnswerAndAdvance(
        req.user?.id,
        eventId,
        speakerId,
        body.pollId,
        body.optionId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: result.isCompleted ? 'Session completed' : 'Answer submitted successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          eventId: eventId,
          speakerId: speakerId,
          isCompleted: result.isCompleted,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Submit answer and advance', req.user?.id);
      throw error;
    }
  }

  
    // Get All Votes by Event ID - Enhanced response
    @Get('votes/:eventId')
    async getAllVotesByEventId(
      @Param('eventId') eventId: string,
      @Res() response: Response,
      @Request() req: any,
    ) {
      try {
        const isAdmin = req.user?.role === UserRole.Admin;
        const result = await this.pollingService.getAllVotesByEventId(
          eventId,
          isAdmin,
        );
  
        const successResponse: SuccessResponse = {
          success: true,
          message: result.message,
          data: result.data,
          metadata: {
            ...result.metadata,
            userId: req.user?.id,
          },
        };
  
        return response.status(HttpStatus.OK).json(successResponse);
      } catch (error: any) {
        this.errorHandler.logError(error, 'Get votes by event ID', req.user?.id);
        throw error;
      }
    }

  // =============== POLL MANAGEMENT APIs ===============

  // Create Poll (Admin only)
  @Post()
  @Roles(UserRole.Admin)
  async createPoll(
    @Body() createDto: CreatePollDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const poll = await this.pollingService.createPoll(
        createDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Poll created successfully',
        data: poll,
        metadata: {
          timestamp: new Date().toISOString(),
          createdBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Poll creation', req.user?.id);
      throw error;
    }
  }

  // Get All Questions List (Public)
  @Get('questions/list')
  async getAllQuestionsList(
    @Res() response: Response,
    @Request() req: any,
    @Query('eventId') eventId?: string,
    @Query('speakerId') speakerId?: string,
  ) {
    try {
      const isAdmin = req.user?.role === UserRole.Admin;
      const questions = await this.pollingService.getAllQuestionsList(
        eventId,
        speakerId,
        isAdmin,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Questions list retrieved successfully',
        data: questions,
        metadata: {
          total: questions.data.length,
          eventId: eventId,
          speakerId: speakerId,
          isAdmin: isAdmin,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get questions list', req.user?.id);
      throw error;
    }
  }

  // Get All Polls for Admin (No filters required)
  @Get('admin/all')
  @Roles(UserRole.Admin)
  async getAllPollsForAdmin(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const polls = await this.pollingService.getAllPollsForAdmin();

      const successResponse: SuccessResponse = {
        success: true,
        message: 'All polls retrieved successfully',
        data: polls,
        metadata: {
          total: polls.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all polls for admin', req.user?.id);
      throw error;
    }
  }

  // Get Poll by ID
  @Get(':id')
  async getPollById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const poll = await this.pollingService.getPollById(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Poll retrieved successfully',
        data: poll,
        metadata: {
          timestamp: new Date().toISOString(),
          pollId: id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get poll by ID', req.user?.id);
      throw error;
    }
  }

  // Update Poll (Admin only)
  @Put(':id')
  @Roles(UserRole.Admin)
  async updatePoll(
    @Param('id') id: string,
    @Body() updateDto: UpdatePollDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const poll = await this.pollingService.updatePoll(id, updateDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Poll updated successfully',
        data: poll,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Poll update', req.user?.id);
      throw error;
    }
  }

  // Toggle Poll Live Status (Admin only)
  @Put(':id/toggle-live')
  @Roles(UserRole.Admin)
  async togglePollLive(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.togglePollLive(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Toggle poll live status',
        req.user?.id,
      );
      throw error;
    }
  }

  // Delete Poll (Admin only)
  @Delete(':id')
  @Roles(UserRole.Admin)
  async deletePoll(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.deletePoll(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Poll deletion', req.user?.id);
      throw error;
    }
  }

}
