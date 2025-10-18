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
} from '@nestjs/common';
import { Response } from 'express';
import { ModeratorService } from './moderator.service';
import { CreateModeratorDto, UpdateModeratorDto, AssignModeratorToEventDto, AssignMultipleEventsDto } from './moderator.dto';
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
}

