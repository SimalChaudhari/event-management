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
import { CreateEngagementDto, UpdateEngagementDto, UpdateEngagementOrderDto } from './engagement.dto';

import { UserRole } from '../user/users.entity';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { Public } from 'jwt/public.decorator';
import { 
  IsNotEmpty, IsString, IsUrl 
} from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

@Controller('api/engagements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  /**
   * Create a new engagement or add sessions to existing engagement
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
        message: 'Engagement created/updated successfully',
        data: engagement,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create/update engagement',
      });
    }
  }

  /**
   * Update engagement display order
   */
  @Put('reorder')
  @Roles(UserRole.Admin)
  async reorderEngagements(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) updateOrderDto: UpdateEngagementOrderDto,
    @Res() response: Response,
  ) {
    try {
      await this.engagementService.reorderEngagements(updateOrderDto.items);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Engagement order updated successfully',
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update engagement order',
      });
    }
  }

  /**
   * Create a simple polling link for an engagement
   */
  @Post('sessions/:sessionId/polling-link')
  @Roles(UserRole.Admin)
  async createPollingLink(
    @Param('sessionId') sessionId: string,
    @Body(new ValidationPipe({ transform: true })) body: { title: string; url: string },
    @Res() response: Response,
  ) {
    try {
      if (!body?.title || !body?.url) {
        return response.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'title and url are required' });
      }
      const link = await this.engagementService.upsertPollingLinkForSession(sessionId, body.title, body.url);
      return response.status(HttpStatus.CREATED).json({ success: true, data: link });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return response.status(statusCode).json({ success: false, message: error.message || 'Failed to create polling link' });
    }
  }

  /**
   * Get polling links for an engagement as [{ title, url }]
   */
  @Get('sessions/:sessionId/polling-link')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async getPollingLinks(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    try {
      const link = await this.engagementService.getPollingLinkForSession(sessionId);
      return response.status(HttpStatus.OK).json({ success: true, data: link });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch polling links' });
    }
  }

  /**
   * Delete a polling link by id
   */
  @Delete('polling-links/:linkId')
  @Roles(UserRole.Admin)
  async deletePollingLink(
    @Param('linkId') linkId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.engagementService.deletePollingLink(linkId);
      return response.status(HttpStatus.OK).json({ success: true, message: result.message });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return response.status(statusCode).json({ success: false, message: error.message || 'Failed to delete polling link' });
    }
  }

  /**
   * Get all engagements with search, filter, and pagination
   */
  @Get()
  @Roles(UserRole.Admin, UserRole.Moderator)
  async getAllEngagements(
    @Query('eventId') eventId: string,
    @Query()
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    @Res() response: Response,
  ) {
    try {
      // Process filter parameters
      const processedFilters = {
        page: filters.page ? Number(filters.page) : undefined,
        limit: filters.limit ? Number(filters.limit) : undefined,
        search: filters.search?.trim() || undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined,
        eventId: eventId || undefined,
      };

      const result = await this.engagementService.getAllEngagements(processedFilters);

      // If pagination is not provided, return the previous format (backward compatibility)
      const hasPagination = processedFilters.page !== undefined || processedFilters.limit !== undefined;
      
      if (!hasPagination) {
        // Return previous format: { success: true, data: ..., events: ..., total: ... }
        return response.status(HttpStatus.OK).json({
          success: true,
          data: result.data,
          events: result.events,
          total: result.data.length,
        });
      } else {
        // Return new format with pagination metadata
        return response.status(HttpStatus.OK).json({
          success: true,
          data: result.data,
          events: result.events,
          metadata: {
            ...(result.pagination || {}),
            timestamp: new Date().toISOString(),
          },
        });
      }
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
   * If pagination filters are provided, returns sessions with pagination
   * Otherwise returns engagements with sessions (backward compatibility)
   */
  @Get('track/:trackId')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async getEngagementsByTrackId(
    @Param('trackId') trackId: string,
    @Query()
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    @Res() response: Response,
  ) {
    try {
      // Process filter parameters
      const processedFilters = {
        page: filters.page ? Number(filters.page) : undefined,
        limit: filters.limit ? Number(filters.limit) : undefined,
        search: filters.search?.trim() || undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined,
      };

      const result = await this.engagementService.getEngagementsByTrackId(trackId, processedFilters);

      // Check if result is sessions (with pagination) or engagements (array)
      const hasPagination = processedFilters.page !== undefined || processedFilters.limit !== undefined;
      
      if (hasPagination && result && typeof result === 'object' && 'data' in result && 'pagination' in result) {
        // Return sessions with pagination
        return response.status(HttpStatus.OK).json({
          success: true,
          data: result.data,
          metadata: {
            ...(result.pagination || {}),
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Return engagements (backward compatibility)
        const engagements = Array.isArray(result) ? result : [];
        return response.status(HttpStatus.OK).json({
          success: true,
          data: engagements,
          total: engagements.length,
        });
      }
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
   * Toggle engagement session active status
   */
  @Put('sessions/:sessionId/toggle-status')
  @Roles(UserRole.Admin)
  async toggleEngagementSessionStatus(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    try {
      const session = await this.engagementService.toggleEngagementSessionStatus(sessionId);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: `Session ${session.isActive ? 'activated' : 'deactivated'} successfully`,
        data: session,
      });
    } catch (error: any) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return response.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to toggle session status',
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

