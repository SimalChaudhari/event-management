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
import { EngagementQnaService } from './engagement-qna.service';
import { 
  CreateEngagementQuestionDto, 
  UpdateEngagementQuestionDto, 
  AnswerEngagementQuestionDto, 
  LikeEngagementQuestionDto,
  GetEngagementQuestionsDto,
} from './engagement-qna.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { Public } from 'jwt/public.decorator';
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

@Controller('api/engagements/qna')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementQnaController {
  constructor(
    private readonly engagementQnaService: EngagementQnaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // 3. Like/Unlike Question (Registered users only)
  @Public()
  @Post('like')
  async toggleLike(
    @Body() likeDto: LikeEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.toggleLike(likeDto, req.user?.id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          voteCount: result.data?.likesCount || 0,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Toggle question like', req.user?.id);
      throw error;
    }
  }

  // 4. Get All Questions for Engagement (Users and Admin)
  @Public()
  @Get('questions')
  async getQuestions(
    @Query() query: GetEngagementQuestionsDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!query.engagementId) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Engagement ID is required',
          data: null,
          metadata: {
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
          },
        });
      }

      const result = await this.engagementQnaService.getQuestions(query, req.user?.id);

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
      this.errorHandler.logError(error, 'Get Engagement Q&A questions', req.user?.id);
      throw error;
    }
  }

  // 7. Get Vote Count for Question
  @Get(':id')
  async getQuestionById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.engagementQnaService.getQuestionById(id, req.user?.id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question retrieved successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          questionId: id,
          userId: req.user?.id,
          voteCount: question.likesCount,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get question by ID', req.user?.id);
      throw error;
    }
  }

  // 1. Create Question (Registered users only for the event)
  @Post()
  async createQuestion(
    @Body() createDto: CreateEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.createQuestion(
        createDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question created successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          askedBy: req.user?.id,
          engagementId: createDto.engagementId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Create Engagement Q&A question', req.user?.id);
      throw error;
    }
  }

  // 6. Update Question (Own question by user OR Admin can update any)
  @Put(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateDto: UpdateEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const isAdmin = req.user?.role === UserRole.Admin;
      const result = await this.engagementQnaService.updateQuestion(
        id,
        updateDto,
        req.user?.id,
        isAdmin,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
          isAdmin: isAdmin,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update question', req.user?.id);
      throw error;
    }
  }

  // 5. Delete Question (Own question by user OR Admin can delete any)
  @Public()
  @Delete(':id')
  async deleteQuestion(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const isAdmin = req.user?.role === UserRole.Admin;
      const result = await this.engagementQnaService.deleteQuestion(id, req.user?.id, isAdmin);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
          isAdmin: isAdmin,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete question', req.user?.id);
      throw error;
    }
  }

  // 2. Answer Question (Admin only)
  @Public()
  @Put(':id/answer')
  @Roles(UserRole.Admin)
  async answerQuestion(
    @Param('id') id: string,
    @Body() answerDto: AnswerEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.answerQuestion(
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
          isUpdated: result.data?.isUpdated || false,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Answer question', req.user?.id);
      throw error;
    }
  }
}

