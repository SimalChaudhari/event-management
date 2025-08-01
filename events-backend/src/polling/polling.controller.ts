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
import {
  CreateQuizQuestionDto,
  UpdateQuizQuestionDto,
  StartQuizDto,
  SubmitQuizDto,
} from './polling.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { IsNotEmpty, IsUUID, IsArray, IsOptional } from 'class-validator';
import { ValidationException } from 'utils/exceptions/custom-exceptions';
import { PollType, ExternalPlatform } from './polling.entity';

interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
  metadata?: {
    timestamp: string;
    [key: string]: any;
  };
}

export class SubmitAnswerDto {
  @IsNotEmpty()
  @IsUUID()
  attemptId!: string;

  @IsNotEmpty()
  @IsUUID()
  questionId!: string;

  @IsNotEmpty()
  @IsArray()
  selectedOptions!: string[];
}

export class GetUserQuizResultDto {
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  speakerId?: string;
}

@Controller('api/events/quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PollingController {
  constructor(
    private readonly pollingService: PollingService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // =============== Internal Polls ADMIN QUESTION MANAGEMENT ===============

  @Post('questions')
  @Roles(UserRole.Admin)
  async createQuizQuestion(
    @Body() createDto: CreateQuizQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.pollingService.createQuizQuestion(
        createDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz question created successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          createdBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz question creation', req.user?.id);
      throw error;
    }
  }

  @Get('questions/speaker')
  @Roles(UserRole.Admin)
  async getQuestionsBySpeaker(
    @Query('eventId') eventId: string,
    @Query('speakerId') speakerId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const questions =
        await this.pollingService.getMixedPollsBySpeakerAndEvent(
          speakerId,
          eventId,
        );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speaker polls retrieved successfully',
        data: questions,
        metadata: {
          totalPolls: questions.totalPolls,
          internalPolls: questions.internalPolls,
          externalPolls: questions.externalPolls,
          speakerId: speakerId,
          eventId: eventId,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Speaker polls retrieval',
        req.user?.id,
      );
      throw error;
    }
  }

  @Put('questions/:id')
  @Roles(UserRole.Admin)
  async updateQuizQuestion(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuizQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.pollingService.updateQuizQuestion(
        id,
        updateDto,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz question updated successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz question update', req.user?.id);
      throw error;
    }
  }

  @Delete('questions/:id')
  @Roles(UserRole.Admin)
  async deleteQuizQuestion(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.deleteQuizQuestion(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result.deletedData, // Show what was deleted
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
          questionId: id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz question deletion', req.user?.id);
      throw error;
    }
  }

  @Delete('questions/event/:eventId')
  @Roles(UserRole.Admin)
  async deleteAllQuizQuestionsForEvent(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result =
        await this.pollingService.deleteAllQuizQuestionsForEvent(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result.deletedData,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
          eventId: eventId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Bulk quiz question deletion',
        req.user?.id,
      );
      throw error;
    }
  }

  // =============== EXTERNAL POLLS ===============

  // Create External Poll
  @Post('polls/external')
  @Roles(UserRole.Admin)
  async createExternalPoll(
    @Body()
    createDto: {
      question: string;
      description?: string;
      externalUrl: string;
      platform: string;
      eventId: string;
      speakerId?: string;
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const poll = await this.pollingService.createExternalPoll({
        ...createDto,
        platform: createDto.platform as any,
        createdById: req.user.id,
      });

      const successResponse: SuccessResponse = {
        success: true,
        message: 'External poll created successfully',
        data: poll,
        metadata: {
          timestamp: new Date().toISOString(),
          createdBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'External poll creation', req.user?.id);
      throw error;
    }
  }

  // Get Mixed Polls (Internal + External)
  @Get('polls/speaker')
  @Roles(UserRole.Admin)
  async getMixedPollsBySpeaker(
    @Query('eventId') eventId: string,
    @Query('speakerId') speakerId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const polls = await this.pollingService.getMixedPollsBySpeakerAndEvent(
        speakerId,
        eventId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Mixed polls retrieved successfully',
        data: polls,
        metadata: {
          totalPolls: polls.totalPolls,
          internalPolls: polls.internalPolls,
          externalPolls: polls.externalPolls,
          speakerId: speakerId,
          eventId: eventId,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Mixed polls retrieval', req.user?.id);
      throw error;
    }
  }

  // Toggle Poll Live Status
  @Put('polls/:pollId/toggle-live')
  @Roles(UserRole.Admin)
  async togglePollLive(
    @Param('pollId') pollId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.togglePollLive(pollId);

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

  // Get Live Polls
  @Get('polls/live')
  async getLivePolls(
    @Res() response: Response,
    @Request() req: any,
    @Query('eventId') eventId?: string,
    @Query('speakerId') speakerId?: string,
  ) {
    try {
      const livePolls = await this.pollingService.getLivePolls(
        eventId,
        speakerId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Live polls retrieved successfully',
        data: livePolls,
        metadata: {
          total: livePolls.length,
          eventId: eventId,
          speakerId: speakerId,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Live polls retrieval', req.user?.id);
      throw error;
    }
  }

  // =============== USER QUIZ FUNCTIONALITY ===============

  @Get('speaker/:speakerId')
  async getQuizForSpeaker(
    @Param('speakerId') speakerId: string,
    @Query('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!eventId) {
        throw new ValidationException('eventId query parameter is required');
      }

      const quiz = await this.pollingService.getQuizForSpeaker(
        speakerId,
        eventId,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz loaded successfully',
        data: quiz,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          speakerId,
          eventId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get quiz for speaker', req.user?.id);
      throw error;
    }
  }

  @Post('answer')
  async submitAnswer(
    @Body() submitDto: SubmitAnswerDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.submitAnswerAndGetNext(
        submitDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: result.completed
          ? 'Quiz completed successfully'
          : 'Answer saved, next question loaded',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          attemptId: submitDto.attemptId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Submit answer', req.user?.id);
      throw error;
    }
  }

  // =============== USER QUIZ RESULTS ENDPOINTS ===============

  @Get('results/user/:userId/speaker/:speakerId/event/:eventId')
  async getUserQuizResultBySpeakerAndEvent(
    @Param('userId') userId: string,
    @Param('speakerId') speakerId: string,
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result =
        await this.pollingService.getUserQuizResultBySpeakerAndEvent(
          userId,
          speakerId,
          eventId,
        );

      const successResponse: SuccessResponse = {
        success: true,
        message: result.hasAttempt
          ? 'Quiz result retrieved successfully'
          : 'No quiz attempt found',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId,
          speakerId,
          eventId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Get user quiz result by speaker and event',
        req.user?.id,
      );
      throw error;
    }
  }
  // Admin: Get All Users Quiz Results for Speaker and Event
  @Get('results/speaker/:speakerId/event/:eventId')
  @Roles(UserRole.Admin)
  async getAllUsersQuizResultsBySpeakerAndEvent(
    @Param('speakerId') speakerId: string,
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const results =
        await this.pollingService.getAllUsersQuizResultsBySpeakerAndEvent(
          speakerId,
          eventId,
        );

      const successResponse: SuccessResponse = {
        success: true,
        message: results.hasResults
          ? 'Quiz results retrieved successfully'
          : 'No quiz results found',
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          speakerId,
          eventId,
          requestedBy: req.user?.id,
          totalUsers: results.totalUsers,
          completedAttempts: results.completedAttempts,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Get all users quiz results by speaker and event',
        req.user?.id,
      );
      throw error;
    }
  }
}
