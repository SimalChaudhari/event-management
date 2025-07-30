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
} from '@nestjs/common';
import { Response } from 'express';
import { PollingService } from './polling.service';
import { CreateQuizQuestionDto, UpdateQuizQuestionDto, StartQuizDto, SubmitQuizDto } from './polling.dto';
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

@Controller('api/events/quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PollingController {
  constructor(
    private readonly pollingService: PollingService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // =============== ADMIN QUESTION MANAGEMENT ===============

  @Post('questions')
  @Roles(UserRole.Admin)
  async createQuizQuestion(
    @Body() createDto: CreateQuizQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.pollingService.createQuizQuestion(createDto, req.user?.id);
      
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

  @Get('questions')
  @Roles(UserRole.Admin)
  async getAllQuizQuestions(@Res() response: Response, @Request() req: any) {
    try {
      const questions = await this.pollingService.getAllQuizQuestions();
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz questions retrieved successfully',
        data: questions,
        metadata: {
          total: questions.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz questions retrieval', req.user?.id);
      throw error;
    }
  }

  @Get('questions/:id')
  @Roles(UserRole.Admin)
  async getQuizQuestionById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.pollingService.getQuizQuestionById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz question retrieved successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz question retrieval', req.user?.id);
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
      const question = await this.pollingService.updateQuizQuestion(id, updateDto);
      
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

  // =============== USER QUIZ FUNCTIONALITY ===============

  @Post('start')
  async startQuiz(
    @Body() startQuizDto: StartQuizDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const quiz = await this.pollingService.startQuiz(startQuizDto, req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz started successfully',
        data: quiz,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz start', req.user?.id);
      throw error;
    }
  }

  @Post('submit')
  async submitQuiz(
    @Body() submitQuizDto: SubmitQuizDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const results = await this.pollingService.submitQuiz(submitQuizDto, req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz submitted successfully',
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz submission', req.user?.id);
      throw error;
    }
  }

  @Get('results/:attemptId')
  async getQuizResults(
    @Param('attemptId') attemptId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const results = await this.pollingService.getQuizResults(attemptId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Quiz results retrieved successfully',
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Quiz results retrieval', req.user?.id);
      throw error;
    }
  }

  @Get('questions/event/:eventId')
  async getQuizQuestionsByEvent(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const questions = await this.pollingService.getQuizQuestionsByEvent(eventId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event quiz questions retrieved successfully',
        data: questions,
        metadata: {
          eventId,
          total: questions.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Event quiz questions retrieval', req.user?.id);
      throw error;
    }
  }

  // Additional endpoint: Delete all questions for an event
  @Delete('questions/event/:eventId')
  @Roles(UserRole.Admin)
  async deleteAllQuizQuestionsForEvent(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.pollingService.deleteAllQuizQuestionsForEvent(eventId);
      
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
      this.errorHandler.logError(error, 'Bulk quiz question deletion', req.user?.id);
      throw error;
    }
  }
} 