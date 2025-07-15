import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.Admin)
  async getDashboardStats(@Res() response: Response) {
    try {
      const stats = await this.dashboardService.getDashboardStats();
      return response.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: stats,
      });
    } catch (error:any) {
        console.log(error);
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: error.message,
      });
    }
  }

  @Get('activities')
  @Roles(UserRole.Admin)
  async getRecentActivities(@Res() response: Response) {
    try {
      const activities = await this.dashboardService.getRecentActivities();
      return response.status(200).json({
        success: true,
        message: 'Recent activities retrieved successfully',
        data: activities,
      });
    } catch (error:any) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve recent activities',
        error: error.message,
      });
    }
  }

  @Get('health')
  @Roles(UserRole.Admin)
  async getSystemHealth(@Res() response: Response) {
    try {
      const health = await this.dashboardService.getSystemHealth();
      return response.status(200).json({
        success: true,
        message: 'System health retrieved successfully',
        data: health,
      });
    } catch (error:any) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve system health',
        error: error.message,
      });
    }
  }

  @Get('top-events')
  @Roles(UserRole.Admin)
  async getTopEvents(@Res() response: Response) {
    try {
      const topEvents = await this.dashboardService.getTopEvents();
      return response.status(200).json({
        success: true,
        message: 'Top events retrieved successfully',
        data: topEvents,
      });
    } catch (error:any) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve top events',
        error: error.message,
      });
    }
  }
} 