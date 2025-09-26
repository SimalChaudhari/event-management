// src/qna/qna.controller.ts
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
import { QnaService } from './qna.service';
import { 
  CreateQuestionDto, 
  UpdateQuestionDto, 
  AnswerQuestionDto, 
  LikeQuestionDto,
  GetQuestionsDto,
  PinQuestionDto,
  UpdateQuestionStatusDto,
  GetEventQuestionsDto
} from './qna.dto';
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

@Controller('api/events/qna')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QnaController {
  constructor(
    private readonly qnaService: QnaService,
    private readonly errorHandler: ErrorHandlerService,

  ) {}

  // Create Question (Always for a specific speaker)
  @Post()
  async createQuestion(
    @Body() createDto: CreateQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.qnaService.createQuestion(
        createDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question created successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          askedBy: req.user?.id,
          speakerId: createDto.speakerId,
          isAnonymous: createDto.isAnonymous,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Create Q&A question', req.user?.id);
      throw error;
    }
  }

  // Get Questions (All users can see all questions) - Updated to require both eventId and speakerId
  @Get()
  async getQuestions(
    @Query() query: GetQuestionsDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Validate that both eventId and speakerId are provided
      if (!query.eventId || !query.speakerId) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Both eventId and speakerId are required',
          data: null,
          metadata: {
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
          },
        });
      }

      const result = await this.qnaService.getQuestions(query, req.user?.id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          ...result.metadata,
          userId: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get Q&A questions', req.user?.id);
      throw error;
    }
  }

  // Get All Questions List (Public) - Updated to require both eventId and speakerId
  @Get('questions/list')
  async getAllQuestionsList(
    @Res() response: Response,
    @Request() req: any,
    @Query('eventId') eventId?: string,
    @Query('speakerId') speakerId?: string,
  ) {
    try {
      // Validate that both eventId and speakerId are provided
      if (!eventId || !speakerId) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Both eventId and speakerId are required',
          data: null,
          metadata: {
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
          },
        });
      }

      const isAdmin = req.user?.role === UserRole.Admin;
      const getDto: GetQuestionsDto = {
        eventId,
        speakerId,
        status: undefined,
        sortBy: undefined,
      };

      const result = await this.qnaService.getQuestions(getDto, req.user?.id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          ...result.metadata,
          isAdmin: isAdmin,
          userId: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get questions list', req.user?.id);
      throw error;
    }
  }

  // Get Question by ID
  @Get(':id')
  async getQuestionById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.qnaService.getQuestionById(id, req.user?.id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question retrieved successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          questionId: id,
          userId: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get question by ID', req.user?.id);
      throw error;
    }
  }

  // Answer Question (Admin only)
  @Put(':id/answer')
  @Roles(UserRole.Admin) // Only Admin can answer
  async answerQuestion(
    @Param('id') id: string,
    @Body() answerDto: AnswerQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.answerQuestion(
        id,
        answerDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          answeredBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Answer question', req.user?.id);
      throw error;
    }
  }

  // Like/Unlike Question
  @Post('like')
  async toggleLike(
    @Body() likeDto: LikeQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.toggleLike(likeDto, req.user?.id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Toggle question like', req.user?.id);
      throw error;
    }
  }

  // Pin/Unpin Question (Admin only)
  @Put(':id/pin')
  @Roles(UserRole.Admin)
  async togglePin(
    @Param('id') id: string,
    @Body() pinDto: PinQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.togglePin({
        ...pinDto,
        questionId: id,
      });

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Toggle question pin', req.user?.id);
      throw error;
    }
  }

  // Update Question
  @Put(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.updateQuestion(
        id,
        updateDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update question', req.user?.id);
      throw error;
    }
  }

  // Delete Question
  @Delete(':id')
  async deleteQuestion(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.deleteQuestion(id, req.user?.id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete question', req.user?.id);
      throw error;
    }
  }

  // Admin: Get all events with Q&A questions
  @Get('admin/events')
  @Roles(UserRole.Admin)
  async getEventsWithQuestions(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.getEventsWithQuestions();

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          ...result.metadata,
          requestedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get events with Q&A questions', req.user?.id);
      throw error;
    }
  }

  // Admin: Get all questions for an event (consolidated view)
  @Get('admin/event-questions')
  @Roles(UserRole.Admin)
  async getEventQuestions(
    @Query() query: GetEventQuestionsDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.getEventQuestions(query);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          ...result.metadata,
          requestedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get event questions', req.user?.id);
      throw error;
    }
  }

  // Admin: Update question status
  @Put('admin/update-status')
  @Roles(UserRole.Admin)
  async updateQuestionStatus(
    @Body() updateDto: UpdateQuestionStatusDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.updateQuestionStatus(updateDto);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update question status', req.user?.id);
      throw error;
    }
  }

  // Admin: Delete question
  @Delete('admin/:id')
  @Roles(UserRole.Admin)
  async adminDeleteQuestion(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qnaService.adminDeleteQuestion(id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Admin delete question', req.user?.id);
      throw error;
    }
  }

  // Public: Get question for slideshow (answering status)
  @Get('slideshow/:id')
  async getSlideshowQuestion(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.qnaService.getSlideshowQuestion(id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          questionId: id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get slideshow question');
      throw error;
    }
  }
} 