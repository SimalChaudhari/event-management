// src/controllers/qa.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QAService } from './qa.service';
import { CreateQuestionDto } from './qa.dto';
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

@Controller('api/events/surveys/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QAController {
  constructor(
    private readonly qaService: QAService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // CREATE - Admin creates question
  @Post()
  @Roles(UserRole.Admin)
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.qaService.createQuestion(createQuestionDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question created successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          createdBy: req.user?.id,
          surveyId: createQuestionDto.surveyId,
          questionType: createQuestionDto.questionType,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Question creation', req.user?.id);
      throw error;
    }
  }

  // READ - Get all questions for a specific survey
  @Get('survey/:surveyId')
  async getQuestionsBySurveyId(
    @Param('surveyId') surveyId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const questions = await this.qaService.getQuestionsBySurveyId(surveyId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Questions retrieved successfully',
        data: questions,
        metadata: {
          timestamp: new Date().toISOString(),
          surveyId,
          requestedBy: req.user?.id,
          userRole: req.user?.role,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Get questions by survey ID',
        req.user?.id,
      );
      throw error;
    }
  }

}

@Controller('api/events/surveys/answers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QAAnswerController {
  constructor(
    private readonly qaService: QAService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // SUBMIT - User submits an answer to a question
  @Post()
  async submitAnswer(
    @Body() submitAnswerDto: any,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const answer = await this.qaService.submitAnswer(
        submitAnswerDto,
        req.user.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Answer submitted successfully',
        data: answer,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          questionId: submitAnswerDto.questionId,
          surveyId: submitAnswerDto.surveyId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Submit answer', req.user?.id);
      throw error;
    }
  }

  // BULK SUBMIT - User submits all answers at once
  @Post('bulk')
  async submitBulkAnswers(
    @Body() bulkSubmitDto: any,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.qaService.submitBulkAnswers(
        bulkSubmitDto,
        req.user.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'All answers submitted successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          surveyId: bulkSubmitDto.surveyId,
          totalAnswers: bulkSubmitDto.answers.length,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Bulk submit answers', req.user?.id);
      throw error;
    }
  }

  // GET - User's survey completion summary
  @Get('survey/:surveyId/user/summary')
  async getUserSurveySummary(
    @Param('surveyId') surveyId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const summary = await this.qaService.getUserSurveySummary(
        surveyId,
        req.user.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User survey summary retrieved successfully',
        data: summary,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          surveyId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Get user survey summary',
        req.user?.id,
      );
      throw error;
    }
  }
}