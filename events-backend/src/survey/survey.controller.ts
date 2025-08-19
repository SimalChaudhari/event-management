// src/controllers/survey.controller.ts
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
  Query,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { SurveyService } from './survey.service';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  SurveyResponseDto,
  CreateSessionDto,
  UpdateSessionDto,
} from './survey.dto';
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

@Controller('api/events/surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Get event suggestions by event ID (Simple API)
  @Get('suggestions/:eventId')
  @Roles(UserRole.Admin)
  async getEventSuggestionsByEventId(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const suggestions =
        await this.surveyService.getEventSuggestionsByEventId(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event suggestions generated successfully',
        data: suggestions,
        metadata: {
          timestamp: new Date().toISOString(),
          eventId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get event suggestions', req.user?.id);
      throw error;
    }
  }

  // CREATE - Admin creates survey
  @Post()
  @Roles(UserRole.Admin)
  async createSurvey(
    @Body() createSurveyDto: CreateSurveyDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const survey = await this.surveyService.createSurvey(createSurveyDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Survey created successfully',
        data: survey,
        metadata: {
          timestamp: new Date().toISOString(),
          createdBy: req.user?.id,
          eventId: createSurveyDto.eventId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Survey creation', req.user?.id);
      throw error;
    }
  }

  // READ - Get all surveys with sessions (Admin only)
  @Get('current')
  async getAllSurveysWithSessions(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const surveys = await this.surveyService.getAllSurveysWithSessions();

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Surveys with sessions retrieved successfully',
        data: surveys,
        metadata: {
          timestamp: new Date().toISOString(),
          totalCount: surveys.length,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Get all surveys with sessions',
        req.user?.id,
      );
      throw error;
    }
  }

    // Get single survey with all sessions (Admin only)
  @Get(':surveyId')
    async getSurveyWithAllSessions(
      @Param('surveyId') surveyId: string,
      @Res() response: Response,
      @Request() req: any,
    ) {
      try {
        const survey =
          await this.surveyService.getSurveyWithAllSessions(surveyId);
  
        const successResponse: SuccessResponse = {
          success: true,
          message: 'Survey with all sessions retrieved successfully',
          data: survey,
          metadata: {
            timestamp: new Date().toISOString(),
            surveyId,
            requestedBy: req.user?.id,
          },
        };
  
        return response.status(HttpStatus.OK).json(successResponse);
      } catch (error: any) {
        this.errorHandler.logError(
          error,
          'Get survey with all sessions',
          req.user?.id,
        );
        throw error;
      }
    }

  // Get survey detail based on user role - ENHANCED
  @Get('detail/:surveyId')
  async getSurveyDetailByRole(
    @Param('surveyId') surveyId: string,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userRole = req.user?.role || 'user';

      const survey = await this.surveyService.getSurveyDetailByRole(
        surveyId,
        userRole,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Survey detail retrieved successfully',
        data: survey,
        metadata: {
          timestamp: new Date().toISOString(),
          userRole,
          surveyId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Get survey detail by role',
        req.user?.id,
      );
      throw error;
    }
  }

  // Add session to survey
  @Post(':surveyId/sessions')
  @Roles(UserRole.Admin)
  async addSession(
    @Param('surveyId') surveyId: string,
    @Body() sessionDto: CreateSessionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const session = await this.surveyService.addSession(surveyId, sessionDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Session added successfully',
        data: session,
        metadata: {
          timestamp: new Date().toISOString(),
          createdBy: req.user?.id,
          surveyId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Add session to survey', req.user?.id);
      throw error;
    }
  }


  // FEED BACK ENDPOINTS

  // User submits feedback - SIMPLIFIED
  @Post('feedback/:surveyId')
  async submitFeedback(
    @Param('surveyId') surveyId: string,
    @Body() feedbackDto: SurveyResponseDto,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;

      const survey = await this.surveyService.getFeedbackSurveyById(surveyId);

      if (!survey) {
        const successResponse: SuccessResponse = {
          success: false,
          message: 'Survey not found',
        };
        return response.status(HttpStatus.NOT_FOUND).json(successResponse);
      }

      const feedback = await this.surveyService.submitFeedback(
        surveyId,
        survey.eventId,
        userId,
        feedbackDto,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Feedback created successfully',
        data: {
          feedbackId: feedback.feedbackId,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId,
          surveyId,
          sessionId: feedbackDto.sessionId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Submit feedback', req.user?.id);
      
      // Handle duplicate feedback with specific error response
      if (error.constructor.name === 'DuplicateResourceException') {
        const errorResponse = {
          success: false,
          message: error.message,
          error: 'DUPLICATE_FEEDBACK',
          metadata: {
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
            surveyId,
            sessionId: feedbackDto.sessionId,
          },
        };
        return response.status(HttpStatus.CONFLICT).json(errorResponse);
      }
      
      throw error;
    }
  }

  // Get all feedbacks - Admin only
  @Get('feedback/get-all')
  @Roles(UserRole.Admin)
  async getAllFeedbacks(@Res() response: Response, @Request() req: any) {
    try {
      const feedbacks = await this.surveyService.getAllFeedbacks();

      const successResponse: SuccessResponse = {
        success: true,
        message: 'All feedbacks retrieved successfully',
        data: feedbacks,
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all feedbacks', req.user?.id);
      throw error;
    }
  }

  // Get user's own feedbacks
  @Get('feedback/my-feedbacks')
  async getMyFeedbacks(@Res() response: Response, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const feedbacks = await this.surveyService.getFeedbacksByUserId(userId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User feedbacks retrieved successfully',
        data: feedbacks,
        metadata: {
          timestamp: new Date().toISOString(),
          userId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get user feedbacks', req.user?.id);
      throw error;
    }
  }

  //  endpoint - Get feedback details by ID
  @Get('feedback/:feedbackId')
  async getFeedbackDetails(
    @Param('feedbackId') feedbackId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const feedbackDetails =
        await this.surveyService.getFeedbackById(feedbackId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Feedback details retrieved successfully',
        data: feedbackDetails,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get feedback details', req.user?.id);
      throw error;
    }
  }

  // DELETE ENDPOINTS

  // Delete single survey
  @Delete(':surveyId')
  @Roles(UserRole.Admin)
  async deleteSurvey(
    @Param('surveyId') surveyId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.surveyService.deleteSurvey(surveyId);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
          surveyId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete survey', req.user?.id);
      throw error;
    }
  }

  // Delete all surveys (Admin only)
  @Delete()
  @Roles(UserRole.Admin)
  async deleteAllSurveys(
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.surveyService.deleteAllSurveys();

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete all surveys', req.user?.id);
      throw error;
    }
  }

  // Delete single session
  @Delete(':surveyId/sessions/:sessionId')
  @Roles(UserRole.Admin)
  async deleteSession(
    @Param('surveyId') surveyId: string,
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.surveyService.deleteSession(surveyId, sessionId);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
          surveyId,
          sessionId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete session', req.user?.id);
      throw error;
    }
  }

  // UPDATE ENDPOINTS

  // Update survey
  @Put(':surveyId')
  @Roles(UserRole.Admin)
  async updateSurvey(
    @Param('surveyId') surveyId: string,
    @Body() updateSurveyDto: UpdateSurveyDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.surveyService.updateSurvey(surveyId, updateSurveyDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
          surveyId,
          updatedFields: result.updatedFields,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update survey', req.user?.id);
      throw error;
    }
  }

  // Update session
  @Put(':surveyId/sessions/:sessionId')
  @Roles(UserRole.Admin)
  async updateSession(
    @Param('surveyId') surveyId: string,
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.surveyService.updateSession(
        surveyId,
        sessionId,
        updateSessionDto,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
          surveyId,
          sessionId,
          updatedFields: result.updatedFields,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update session', req.user?.id);
      throw error;
    }
  }
}
