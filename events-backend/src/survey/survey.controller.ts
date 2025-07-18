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
} from '@nestjs/common';
import { Response } from 'express';
import { SurveyService } from './survey.service';
import { CreateSurveyDto, UpdateSurveyDto, SurveyResponseDto, CreateSessionDto } from './survey.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';

@Controller('api/events/surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  // Get event suggestions by event ID (Simple API)
  @Get('suggestions/:eventId')
  @Roles(UserRole.Admin)
  async getEventSuggestionsByEventId(
    @Param('eventId') eventId: string,
    @Res() response: Response
  ) {
    const suggestions = await this.surveyService.getEventSuggestionsByEventId(eventId);
    return response.status(200).json({
      success: true,
      message: 'Event suggestions generated successfully',
      data: suggestions,
    });
  }

  // CREATE - Admin creates survey
  @Post()
  @Roles(UserRole.Admin)
  async createSurvey(
    @Body() createSurveyDto: CreateSurveyDto,
    @Res() response: Response
  ) {
    const survey = await this.surveyService.createSurvey(createSurveyDto);
    return response.status(201).json({
      success: true,
      message: 'Survey created successfully',
      data: survey,
    });
  }



  // READ - Get all surveys with sessions (Admin only)
  @Get('admin/all')
  @Roles(UserRole.Admin)
  async getAllSurveysWithSessions(@Res() response: Response) {
    const surveys = await this.surveyService.getAllSurveysWithSessions();
    return response.status(200).json({
      success: true,
      message: 'Surveys with sessions retrieved successfully',
      data: surveys,
    });
  }



  // READ - Get current time surveys with sessions (For users)
  @Get('current')
  async getCurrentTimeSurveysWithSessions(@Res() response: Response) {
    const surveys = await this.surveyService.getCurrentTimeSurveysWithSessions();
    return response.status(200).json({
      success: true,
      message: 'Current time surveys with sessions retrieved successfully',
      data: surveys,
    });
  }

  // Get survey sessions
  @Get(':surveyId/sessions')
  async getSurveySessions(
    @Param('surveyId') surveyId: string,
    @Res() response: Response
  ) {
    const sessions = await this.surveyService.getSurveySessions(surveyId);
    return response.status(200).json({
      success: true,
      message: 'Survey sessions retrieved successfully',
      data: sessions,
    });
  }

  // Get single survey with all sessions (Admin only)
  @Get('admin/:surveyId')
  @Roles(UserRole.Admin)
  async getSurveyWithAllSessions(
    @Param('surveyId') surveyId: string,
    @Res() response: Response
  ) {
    const survey = await this.surveyService.getSurveyWithAllSessions(surveyId);
    return response.status(200).json({
      success: true,
      message: 'Survey with all sessions retrieved successfully',
      data: survey,
    });
  }

  // Get single survey with current sessions (For users)
  @Get(':surveyId')
  async getSurveyWithCurrentSessions(
    @Param('surveyId') surveyId: string,
    @Res() response: Response
  ) {
    const survey = await this.surveyService.getSurveyWithCurrentSessions(surveyId);
    return response.status(200).json({
      success: true,
      message: 'Survey with current sessions retrieved successfully',
      data: survey,
    });
  }

  // Add session to survey
  @Post(':surveyId/sessions')
  @Roles(UserRole.Admin)
  async addSession(
    @Param('surveyId') surveyId: string,
    @Body() sessionDto: CreateSessionDto,
    @Res() response: Response
  ) {
    const session = await this.surveyService.addSession(surveyId, sessionDto);
    return response.status(201).json({
      success: true,
      message: 'Session added successfully',
      data: session,
    });
  }

  // User submits feedback
  @Post('feedback/:surveyId')
  async submitFeedback(
    @Param('surveyId') surveyId: string,
    @Body() feedbackDto: SurveyResponseDto,
    @Request() req: any,
    @Res() response: Response
  ) {
    const userId = req.user?.id;

    const survey = await this.surveyService.getSurveyById(surveyId);
    
    if (!survey) {
      return response.status(404).json({
        success: false,
        message: 'Survey not found',
      });
    }

    const feedback = await this.surveyService.submitFeedback(
      surveyId,
      survey.eventId,
      userId,
      feedbackDto
    );

    return response.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  }

  // Get survey detail based on user role
  @Get('detail/:surveyId')
  async getSurveyDetailByRole(
    @Param('surveyId') surveyId: string,
    @Request() req: any,
    @Res() response: Response
  ) {
    const userRole = req.user?.role || 'user';
    
    const survey = await this.surveyService.getSurveyDetailByRole(surveyId, userRole);
    
    return response.status(200).json({
      success: true,
      message: 'Survey detail retrieved successfully',
      data: survey,
    });
  }
}