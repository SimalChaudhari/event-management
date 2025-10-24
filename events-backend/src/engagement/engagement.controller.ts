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
import { EngagementService } from './engagement.service';
import { CreateEngagementDto, UpdateEngagementDto } from './engagement.dto';

import { UserRole } from '../user/users.entity';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { Public } from 'jwt/public.decorator';

@Controller('api/engagements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  /**
   * Create a new engagement
   */
  @Post()
  @Roles(UserRole.Admin)
  async createEngagement(
    @Body() createEngagementDto: CreateEngagementDto,
    @Res() response: Response,
  ) {
    try {
      const engagement = await this.engagementService.createEngagement(createEngagementDto);
      return response.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Engagement created successfully',
        data: engagement,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create engagement',
      });
    }
  }

  /**
   * Get all engagements
   */
  @Get()
  @Roles(UserRole.Admin, UserRole.Moderator)
  async getAllEngagements(@Res() response: Response) {
    try {
      const engagements = await this.engagementService.getAllEngagements();
      return response.status(HttpStatus.OK).json({
        success: true,
        data: engagements,
        total: engagements.length,
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch engagements',
      });
    }
  }

  /**
   * Get active engagements only
   */
  @Get('active')
  async getActiveEngagements(@Res() response: Response) {
    try {
      const engagements = await this.engagementService.getActiveEngagements();
      return response.status(HttpStatus.OK).json({
        success: true,
        data: engagements,
        total: engagements.length,
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch active engagements',
      });
    }
  }

  /**
   * Get all engagements for a specific event (Public - for moderator access)
   */
  @Public()
  @Get('event/:eventId')
  async getEngagementsByEvent(
    @Param('eventId') eventId: string,
    @Res() response: Response,
  ) {
    try {
      const engagements = await this.engagementService.getEngagementsByEvent(eventId);
      return response.status(HttpStatus.OK).json({
        success: true,
        data: engagements,
        total: engagements.length,
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch engagements for event',
      });
    }
  }

  /**
   * Get engagement data for moderator with sessionId filter (Moderator and Admin access only)
   */
  @Get('moderator/:engagementId')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async getEngagementForModerator(
    @Param('engagementId') engagementId: string,
    @Query('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    try {
      const engagementData = await this.engagementService.getEngagementForModerator(engagementId, sessionId);
      return response.status(HttpStatus.OK).json({
        success: true,
        data: engagementData,
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch engagement data for moderator',
      });
    }
  }


  /**
   * Get engagement by ID
   */
  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async getEngagementById(@Param('id') id: string, @Res() response: Response) {
    try {
      const engagement = await this.engagementService.getEngagementById(id);
      return response.status(HttpStatus.OK).json({
        success: true,
        data: engagement,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch engagement',
      });
    }
  }

  /**
   * Get engagements by track ID
   */
  @Get('track/:trackId')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async getEngagementsByTrackId(
    @Param('trackId') trackId: string,
    @Res() response: Response,
  ) {
    try {
      const engagements = await this.engagementService.getEngagementsByTrackId(trackId);
      return response.status(HttpStatus.OK).json({
        success: true,
        data: engagements,
        total: engagements.length,
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch engagements for track',
      });
    }
  }

  /**
   * Update an engagement
   */
  @Put(':id')
  @Roles(UserRole.Admin)
  async updateEngagement(
    @Param('id') id: string,
    @Body() updateEngagementDto: UpdateEngagementDto,
    @Res() response: Response,
  ) {
    try {
      const engagement = await this.engagementService.updateEngagement(id, updateEngagementDto);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Engagement updated successfully',
        data: engagement,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update engagement',
      });
    }
  }

  /**
   * Toggle engagement active status
   */
  @Put(':id/toggle-status')
  @Roles(UserRole.Admin)
  async toggleEngagementStatus(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const engagement = await this.engagementService.toggleEngagementStatus(id);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: `Engagement ${engagement.isActive ? 'activated' : 'deactivated'} successfully`,
        data: engagement,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to toggle engagement status',
      });
    }
  }

  /**
   * Delete an engagement
   */
  @Delete(':id')
  @Roles(UserRole.Admin)
  async deleteEngagement(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await this.engagementService.deleteEngagement(id);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete engagement',
      });
    }
  }
}

