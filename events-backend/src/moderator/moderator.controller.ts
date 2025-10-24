import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ModeratorService } from './moderator.service';
import { CreateModeratorDto, UpdateModeratorDto, AssignModeratorToEventDto, AssignModeratorToSessionDto, AssignMultipleEventsDto } from './moderator.dto';
import { UserRole } from '../user/users.entity';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { Public } from 'jwt/public.decorator';

@Controller('api/moderators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class ModeratorController {
  constructor(private readonly moderatorService: ModeratorService) {}

  // Create a new moderator
  @Post()
  async createModerator(
    @Body() createModeratorDto: CreateModeratorDto,
    @Res() response: Response,
  ) {
    try {
      const moderator = await this.moderatorService.createModerator(createModeratorDto);
      return response.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Moderator created successfully',
        data: moderator,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create moderator',
      });
    }
  }

  // Get all moderators
  @Get()
  async getAllModerators(@Res() response: Response) {
    try {
      const moderators = await this.moderatorService.getAllModerators();
      return response.status(HttpStatus.OK).json({
        success: true,
        data: moderators,
        total: moderators.length,
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch moderators',
      });
    }
  }

  // Get moderator by ID (Public - for moderator landing page)
  @Public()
  @Get(':id')
  async getModeratorById(@Param('id') id: string, @Res() response: Response) {
    try {
      const moderator = await this.moderatorService.getModeratorById(id);
      return response.status(HttpStatus.OK).json({
        success: true,
        data: moderator,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch moderator',
      });
    }
  }

  // Update a moderator
  @Put(':id')
  async updateModerator(
    @Param('id') id: string,
    @Body() updateModeratorDto: UpdateModeratorDto,
    @Res() response: Response,
  ) {
    try {
      const moderator = await this.moderatorService.updateModerator(id, updateModeratorDto);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Moderator updated successfully',
        data: moderator,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update moderator',
      });
    }
  }

  // Delete a moderator
  @Delete(':id')
  async deleteModerator(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await this.moderatorService.deleteModerator(id);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete moderator',
      });
    }
  }

  // Assign moderator to event
  @Post('assign-event')
  async assignModeratorToEvent(
    @Body() assignDto: AssignModeratorToEventDto,
    @Res() response: Response,
  ) {
    try {
      const assignment = await this.moderatorService.assignModeratorToEvent(assignDto);
      return response.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Moderator assigned to event successfully',
        data: assignment,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to assign moderator to event',
      });
    }
  }

  // Assign moderator to specific session
  @Post('assign-session')
  async assignModeratorToSession(
    @Body() assignDto: AssignModeratorToSessionDto,
    @Res() response: Response,
  ) {
    try {
      const assignment = await this.moderatorService.assignModeratorToSession(assignDto);
      return response.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Moderator assigned to session successfully',
        data: assignment,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to assign moderator to session',
      });
    }
  }

  // Assign moderator to multiple events
  @Post('assign-multiple-events')
  async assignModeratorToMultipleEvents(
    @Body() assignDto: AssignMultipleEventsDto,
    @Res() response: Response,
  ) {
    try {
      const assignments = await this.moderatorService.assignModeratorToMultipleEvents(assignDto);
      return response.status(HttpStatus.CREATED).json({
        success: true,
        message: `Moderator assigned to ${assignments.length} events successfully`,
        data: assignments,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to assign moderator to events',
      });
    }
  }

  // Remove moderator from event
  @Delete('remove-event/:moderatorId/:eventId')
  async removeModeratorFromEvent(
    @Param('moderatorId') moderatorId: string,
    @Param('eventId') eventId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.moderatorService.removeModeratorFromEvent(moderatorId, eventId);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove moderator from event',
      });
    }
  }

  // Get all events for a moderator (Public - for moderator landing page)
  @Public()
  @Get(':moderatorId/events')
  async getModeratorEvents(
    @Param('moderatorId') moderatorId: string,
    @Res() response: Response,
  ) {
    try {
      const events = await this.moderatorService.getModeratorEvents(moderatorId);
      return response.status(HttpStatus.OK).json({
        success: true,
        data: events,
        total: events.length,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch moderator events',
      });
    }
  }

  // Get all moderators for an event
  @Get('event/:eventId/moderators')
  async getEventModerators(
    @Param('eventId') eventId: string,
    @Res() response: Response,
  ) {
    try {
      const moderators = await this.moderatorService.getEventModerators(eventId);
      return response.status(HttpStatus.OK).json({
        success: true,
        data: moderators,
        total: moderators.length,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch event moderators',
      });
    }
  }

  // Get session questions for moderator assignment
  @Get('session/:sessionId/questions')
  async getSessionQuestions(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    try {
      const questions = await this.moderatorService.getSessionQuestions(sessionId);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Session questions retrieved successfully',
        data: questions,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch session questions',
      });
    }
  }

  // Get session-specific moderator landing page data
  @Public()
  @Get('session/:sessionId/landing')
  async getSessionLandingData(
    @Param('sessionId') sessionId: string,
    @Query('token') token: string,
    @Res() response: Response,
  ) {
    try {
      const data = await this.moderatorService.getSessionModeratorData(sessionId, token);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Session moderator data retrieved successfully',
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch session moderator data',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get comprehensive session dashboard data
  @Public()
  @Get('session/:sessionId/dashboard')
  async getSessionDashboardData(
    @Param('sessionId') sessionId: string,
    @Query('token') token: string,
    @Res() response: Response,
  ) {
    try {
      const data = await this.moderatorService.getSessionModeratorData(sessionId, token);
      
      // Add additional dashboard-specific data
      const dashboardData = {
        ...data,
        dashboard: {
          quickStats: {
            questionsPending: data.statistics.unansweredQuestions,
            questionsAnswered: data.statistics.answeredQuestions,
            totalModerators: data.statistics.totalModerators,
            sessionActive: data.sessionDetails.isActive,
          },
          recentActivity: data.questions.questions?.slice(0, 10) || [],
          upcomingTasks: [
            ...(data.statistics.unansweredQuestions > 0 ? [{
              type: 'answer_questions',
              count: data.statistics.unansweredQuestions,
              priority: 'high',
              description: `${data.statistics.unansweredQuestions} questions need answers`
            }] : []),
            ...(data.statistics.pinnedQuestions > 0 ? [{
              type: 'review_pinned',
              count: data.statistics.pinnedQuestions,
              priority: 'medium',
              description: `${data.statistics.pinnedQuestions} pinned questions to review`
            }] : []),
          ],
          sessionTimeline: {
            startTime: data.sessionDetails.startTime,
            endTime: data.sessionDetails.endTime,
            duration: this.calculateDuration(data.sessionDetails.startTime, data.sessionDetails.endTime),
            status: this.getSessionStatus(data.sessionDetails.sessionDate, data.sessionDetails.startTime, data.sessionDetails.endTime),
          },
        },
      };

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Session dashboard data retrieved successfully',
        data: dashboardData,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch session dashboard data',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private calculateDuration(startTime: string, endTime: string): string {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return 'Unknown';
    }
  }

  private getSessionStatus(sessionDate: Date, startTime: string, endTime: string): string {
    try {
      const now = new Date();
      const sessionStart = new Date(`${sessionDate.toISOString().split('T')[0]}T${startTime}`);
      const sessionEnd = new Date(`${sessionDate.toISOString().split('T')[0]}T${endTime}`);
      
      if (now < sessionStart) return 'upcoming';
      if (now >= sessionStart && now <= sessionEnd) return 'live';
      return 'completed';
    } catch {
      return 'unknown';
    }
  }

  // Update question status (Public - for moderator actions)
  @Public()
  @Put('question/:questionId/status')
  async updateQuestionStatus(
    @Param('questionId') questionId: string,
    @Body() body: { action: 'cancel' | 'answer'; answer?: string },
    @Res() response: Response,
  ) {
    try {
      const result = await this.moderatorService.updateQuestionStatus(questionId, body.action, body.answer);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: `Question ${body.action === 'cancel' ? 'cancelled' : 'answered'} successfully`,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update question status',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

