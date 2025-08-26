import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { AgendaService } from './agenda.service';
import { 
  CreateMeetingRequestDto,
  RespondToMeetingRequestDto,
  RescheduleMeetingDto
} from './agenda.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';

@Controller('api/agendas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(
    private readonly agendaService: AgendaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Get incoming meeting requests (for recipient)
  @Get('meeting-requests/incoming')
  async getIncomingMeetingRequests(
    @Request() req: any,
    @Res() response: Response,
    @Query('eventId') eventId?: string,
  ) {
    try {
      const requests = await this.agendaService.getIncomingMeetingRequests(req.user.id, eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Incoming meeting requests retrieved successfully',
        data: requests,
        metadata: {
          total: requests.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Incoming meeting requests retrieval', req.user?.id);
      throw error;
    }
  }

  // Get sent meeting requests (for sender)
  @Get('meeting-requests/sent')
  async getSentMeetingRequests(
    @Request() req: any,
    @Res() response: Response,
    @Query('eventId') eventId?: string,
  ) {
    try {
      const requests = await this.agendaService.getSentMeetingRequests(req.user.id, eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Sent meeting requests retrieved successfully',
        data: requests,
        metadata: {
          total: requests.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Sent meeting requests retrieval', req.user?.id);
      throw error;
    }
  }

  // Get all my meetings (confirmed, pending, etc.)
  @Get('meetings/my')
  async getMyMeetings(
    @Request() req: any,
    @Res() response: Response,
    @Query('eventId') eventId?: string,
    @Query('status') status?: string,
  ) {
    try {
      const meetings = await this.agendaService.getMyMeetings(req.user.id, eventId, status);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'My meetings retrieved successfully',
        data: meetings,
        metadata: {
          total: meetings.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'My meetings retrieval', req.user?.id);
      throw error;
    }
  }

  // Create meeting request
  @Post('meeting-request')
  async createMeetingRequest(
    @Body() createMeetingDto: CreateMeetingRequestDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const meeting = await this.agendaService.createMeetingRequest(createMeetingDto, req.user);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Meeting request sent successfully',
        data: meeting,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Meeting request creation', req.user?.id);
      throw error;
    }
  }

  // Respond to meeting request
  @Put('meeting-request/:id/respond')
  async respondToMeetingRequest(
    @Param('id') id: string,
    @Body() responseDto: RespondToMeetingRequestDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const meeting = await this.agendaService.respondToMeetingRequest(id, responseDto, req.user);

      const successResponse: SuccessResponse = {
        success: true,
        message: `Meeting request ${responseDto.response} successfully`,
        data: meeting,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Meeting request response', req.user?.id);
      throw error;
    }
  }

  // Reschedule meeting
  @Put('meeting/:id/reschedule')
  async rescheduleMeeting(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleMeetingDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const meeting = await this.agendaService.rescheduleMeeting(id, rescheduleDto, req.user);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Meeting rescheduled successfully',
        data: meeting,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Meeting rescheduling', req.user?.id);
      throw error;
    }
  }

  // Get meeting by ID
  @Get('meeting/:id')
  async getMeetingById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const meeting = await this.agendaService.getMeetingById(id, req.user);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Meeting retrieved successfully',
        data: meeting,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Meeting retrieval', req.user?.id);
      throw error;
    }
  }

  // Delete a specific meeting
  @Delete('meeting/:id')
  async deleteMeeting(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.agendaService.deleteMeeting(id, req.user);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Meeting deletion', req.user?.id);
      throw error;
    }
  }

  // Delete all meetings for a user
  @Delete('meetings')
  async deleteAllMeetings(
    @Body() body: { userId: string; eventId?: string },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.agendaService.deleteAllMeetings(body.userId, body.eventId, req.user);

      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Bulk meeting deletion', req.user?.id);
      throw error;
    }
  }

}
