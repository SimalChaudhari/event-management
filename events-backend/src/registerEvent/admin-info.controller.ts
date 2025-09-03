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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminInfoService } from './admin-info.service';
import {
  CreateAdminInfoDto,
  UpdateAdminInfoDto,
  BulkUploadAdminInfoDto,
} from './admin-info.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { CsvUtils } from '../utils/csv-utils';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/admin-info')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminInfoController {
  constructor(
    private readonly adminInfoService: AdminInfoService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Create or update admin info for a registration
  @Post('create')
  @Roles(UserRole.Admin)
  async createAdminInfo(
    @Body() createAdminInfoDto: CreateAdminInfoDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const adminInfo =
        await this.adminInfoService.createOrUpdateAdminInfo(createAdminInfoDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin info created/updated successfully',
        data: adminInfo,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Admin info creation', req.user?.id);
      throw error;
    }
  }

  // Get admin info by registration ID
  @Get('registration/:id')
  @Roles(UserRole.Admin)
  async getAdminInfoByRegistrationId(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const adminInfo =
        await this.adminInfoService.getAdminInfoByRegistrationId(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin info retrieved successfully',
        data: adminInfo,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Admin info retrieval', req.user?.id);
      throw error;
    }
  }

  // Get admin info by event ID (for admin view)
  @Get('event/:eventId')
  @Roles(UserRole.Admin)
  async getAdminInfoByEventId(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const adminInfoList =
        await this.adminInfoService.getAdminInfoByEventId(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin info list retrieved successfully',
        data: adminInfoList,
        metadata: {
          total: adminInfoList.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(
        error,
        'Admin info list retrieval',
        req.user?.id,
      );
      throw error;
    }
  }

  // Delete admin info (soft delete)
  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteAdminInfo(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      await this.adminInfoService.deleteAdminInfo(id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin info deleted successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Admin info deletion', req.user?.id);
      throw error;
    }
  }

  // Bulk upload admin info via CSV
  @Post('bulk-upload')
  @Roles(UserRole.Admin)
  async bulkUploadAdminInfo(
    @Body() bulkUploadDto: BulkUploadAdminInfoDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result =
        await this.adminInfoService.bulkUploadAdminInfo(bulkUploadDto);

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
      this.errorHandler.logError(error, 'Admin info bulk upload', req.user?.id);
      throw error;
    }
  }

  // Get admin info statistics for an event
  @Get('stats/:eventId')
  @Roles(UserRole.Admin)
  async getAdminInfoStats(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const stats = await this.adminInfoService.getAdminInfoStats(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin info statistics retrieved successfully',
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Admin info statistics', req.user?.id);
      throw error;
    }
  }

  // Get admin info visibility status for an event
  @Get('visibility/:eventId')
  @Roles(UserRole.Admin)
  async getAdminInfoVisibility(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const visibility = await this.adminInfoService.getAdminInfoVisibility(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin info visibility status retrieved successfully',
        data: visibility,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Admin info visibility', req.user?.id);
      throw error;
    }
  }

  // Get lucky draw numbers for an event
  @Get('lucky-draw/:eventId')
  @Roles(UserRole.Admin)
  async getLuckyDrawNumbers(
    @Param('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const luckyDrawNumbers = await this.adminInfoService.getLuckyDrawNumbers(eventId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Lucky draw numbers retrieved successfully',
        data: luckyDrawNumbers,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Lucky draw numbers retrieval', req.user?.id);
      throw error;
    }
  }

  // Download CSV template for bulk upload
  @Get('csv-template')
  @Roles(UserRole.Admin)
  async downloadCsvTemplate(@Res() response: Response) {
    try {
      const csvTemplate = CsvUtils.generateCsvTemplate();

      response.setHeader('Content-Type', 'text/csv');
      response.setHeader(
        'Content-Disposition',
        'attachment; filename="admin-info-template.csv"',
      );
      response.send(csvTemplate);
    } catch (error: any) {
      this.errorHandler.logError(error, 'CSV template download');
      throw error;
    }
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('csvFile'))
  @Roles(UserRole.Admin)
  async uploadCsvFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('eventId') eventId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('CSV file is required');
      }

      if (!eventId) {
        throw new BadRequestException('Event ID is required');
      }

      // Validate file type
      if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
        throw new BadRequestException('File must be a CSV file');
      }

      const result = await this.adminInfoService.processCsvFile(file, eventId);

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
      this.errorHandler.logError(error, 'CSV file upload', req.user?.id);
      throw error;
    }
  }
}
