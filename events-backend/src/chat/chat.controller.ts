// src/chat/chat.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { PostQuestionDto, LikeQuestionDto, PostAnswerDto } from './chat.dto';
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

@Controller('api/events/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // =============== USER Q&A ENDPOINTS ===============

  // Post a question
  @Post('questions')
  @Roles(UserRole.User, UserRole.Admin)
  async postQuestion(
    @Body() postQuestionDto: PostQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.chatService.postQuestion(postQuestionDto, req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question posted successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Post question', req.user?.id);
      throw error;
    }
  }

  // Like/Unlike a question
  @Post('questions/:questionId/like')
  @Roles(UserRole.User, UserRole.Admin)
  async likeQuestion(
    @Param('questionId') questionId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.chatService.likeQuestion({ questionId }, req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: {
          questionId,
          isLiked: result.isLiked,
          likesCount: result.likesCount
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Like question', req.user?.id);
      throw error;
    }
  }

  // Post an answer (any user can answer)
  @Post('answers')
  @Roles(UserRole.User, UserRole.Admin)
  async postAnswer(
    @Body() postAnswerDto: PostAnswerDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const answerData = await this.chatService.postAnswer(postAnswerDto, req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Answer posted successfully',
        data: answerData,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Post answer', req.user?.id);
      throw error;
    }
  }

  // Get questions for speaker (with pagination and sorting)
  @Get('questions/speaker/:speakerId/event/:eventId')
  async getQuestions(
    @Param('speakerId') speakerId: string,
    @Param('eventId') eventId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: 'likes' | 'recent' | 'answered' = 'likes',
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      
      const result = await this.chatService.getQuestions(
        eventId, 
        speakerId, 
        req.user?.id, 
        pageNum, 
        limitNum, 
        sortBy
      );
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Questions retrieved successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          totalQuestions: result.pagination.total,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get questions', req.user?.id);
      throw error;
    }
  }

  // Get question answers
  @Get('questions/:questionId/answers')
  async getQuestionAnswers(
    @Param('questionId') questionId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const answers = await this.chatService.getQuestionAnswers(questionId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question answers retrieved successfully',
        data: answers,
        metadata: {
          timestamp: new Date().toISOString(),
          questionId,
          totalAnswers: answers.length,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get question answers', req.user?.id);
      throw error;
    }
  }

  // =============== ADMIN ENDPOINTS ===============

  // Admin: Pin/Unpin question
  @Put('questions/:questionId/pin')
  @Roles(UserRole.Admin)
  async toggleQuestionPin(
    @Param('questionId') questionId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.chatService.toggleQuestionPin(questionId, req.user?.id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: {
          questionId: result.id,
          isPinned: result.isPinned
        },
        metadata: {
          timestamp: new Date().toISOString(),
          adminUserId: req.user?.id,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Toggle question pin', req.user?.id);
      throw error;
    }
  }

  // =============== LIVE FEED ENDPOINTS ===============

  // Get live Q&A feed (real-time like)
  @Get('live/speaker/:speakerId/event/:eventId')
  async getLiveQuestions(
    @Res() response: Response,
    @Request() req: any,
    @Param('speakerId') speakerId: string,
    @Param('eventId') eventId: string,
    @Query('lastUpdate') lastUpdate?: string,
  ) {
    try {
      // For live updates, get recent questions (last 5 minutes if lastUpdate provided)
      const result = await this.chatService.getQuestions(
        eventId, 
        speakerId, 
        req.user?.id, 
        1, 
        50, // More questions for live feed
        'recent'
      );
      
      // Filter by last update time if provided
      let filteredQuestions = result.questions;
      if (lastUpdate) {
        const lastUpdateTime = new Date(lastUpdate);
        filteredQuestions = result.questions.filter(q => 
          new Date(q.createdAt) > lastUpdateTime
        );
      }
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Live Q&A feed retrieved successfully',
        data: {
          ...result,
          questions: filteredQuestions,
          isLive: true,
          lastUpdate: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          newQuestions: filteredQuestions.length,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get live Q&A', req.user?.id);
      throw error;
    }
  }

  // =============== STATISTICS ENDPOINTS ===============

  // Get Q&A statistics for speaker/event
  @Get('statistics/speaker/:speakerId/event/:eventId')
  @Roles(UserRole.Admin)
  async getQAStatistics(
    @Param('speakerId') speakerId: string,
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.chatService.getQuestions(eventId, speakerId, req.user?.id, 1, 1000, 'recent');
      
      const totalQuestions = result.questions.length;
      const answeredQuestions = result.questions.filter(q => q.answersCount > 0).length;
      const totalLikes = result.questions.reduce((sum, q) => sum + q.likesCount, 0);
      const totalAnswers = result.questions.reduce((sum, q) => sum + q.answersCount, 0);
      const pinnedQuestions = result.questions.filter(q => q.isPinned).length;
      
      const statistics = {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions: totalQuestions - answeredQuestions,
        totalLikes,
        totalAnswers,
        pinnedQuestions,
        averageLikesPerQuestion: totalQuestions > 0 ? Math.round(totalLikes / totalQuestions) : 0,
        averageAnswersPerQuestion: totalQuestions > 0 ? Math.round(totalAnswers / totalQuestions) : 0,
        answerRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      };
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Q&A statistics retrieved successfully',
        data: {
          statistics,
          speaker: result.speaker,
          event: result.event
        },
        metadata: {
          timestamp: new Date().toISOString(),
          speakerId,
          eventId,
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get Q&A statistics', req.user?.id);
      throw error;
    }
  }
} 