import { Controller, Get, Param, UseGuards, Delete, Res, Query, Request, HttpStatus } from '@nestjs/common';
import { CsvUploadLogService } from './csv-upload-log.service';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Response } from 'express';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Controller('api/logs/csv-upload')
@UseGuards(JwtAuthGuard)
export class CsvUploadLogController {
  constructor(
    private readonly csvUploadLogService: CsvUploadLogService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Get all CSV upload logs with pagination, filters, and sorting
   */
  @Get()
  async getLogs(
    @Query()
    filters: {
      keyword?: string;
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      adminId?: string;
      fileName?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      // Process filter parameters
      const processedFilters = {
        keyword: filters.keyword?.trim() || undefined,
        dateFrom: filters.dateFrom?.trim() || undefined,
        dateTo: filters.dateTo?.trim() || undefined,
        status: filters.status?.trim() || undefined,
        adminId: filters.adminId?.trim() || undefined,
        fileName: filters.fileName?.trim() || undefined,
        page: filters.page ? Number(filters.page) : undefined,
        limit: filters.limit ? Number(filters.limit) : undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined,
      };

      const result = await this.csvUploadLogService.getLogs(processedFilters);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Logs retrieved successfully',
        data: result.data,
        metadata: {
          ...(result.pagination || {}),
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Logs retrieval', req.user?.id);
      throw error;
    }
  }

  /**
   * Get specific log by session ID
   */
  @Get('session/:sessionId')
  async getLogBySessionId(@Param('sessionId') sessionId: string) {
    return await this.csvUploadLogService.getLogBySessionId(sessionId);
  }

  /**
   * Export email recipients for a specific session
   */
  @Get('session/:sessionId/recipients/export')
  async exportRecipients(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    const csvContent = await this.csvUploadLogService.exportEmailRecipients(sessionId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="csv-upload-recipients-${sessionId}.csv"`,
    );

    return res.send(csvContent);
  }

  /**
   * Get logs by admin ID
   */
  @Get('admin/:adminId')
  async getLogsByAdmin(@Param('adminId') adminId: string) {
    return await this.csvUploadLogService.getLogsByAdmin(adminId);
  }

  /**
   * Get statistics
   */
  @Get('statistics')
  async getStatistics() {
    return await this.csvUploadLogService.getStatistics();
  }

  /**
   * Cleanup old logs
   */
  @Get('cleanup')
  async cleanupOldLogs(@Query('days') days: string = '30') {
    const daysNum = parseInt(days, 10) || 30;
    const deletedCount = await this.csvUploadLogService.deleteOldLogs(daysNum);
    
    return {
      message: `Cleaned up ${deletedCount} log entries older than ${daysNum} days`,
      deletedCount,
    };
  }

  /**
   * Delete all logs
   */
  @Delete()
  async deleteAllLogs() {
    const deletedCount = await this.csvUploadLogService.deleteAllLogs();

    return {
      message: `Deleted ${deletedCount} log entries`,
      deletedCount,
    };
  }

  /**
   * Export logs to CSV
   */
  @Get('export')
  async exportLogs(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: string,
    @Query('adminId') adminId?: string,
  ) {
    return this.csvUploadLogService.exportLogs({
      dateFrom,
      dateTo,
      status,
      adminId,
    });
  }

  /**
   * Create sample logs for testing
   */
  @Get('create-sample')
  async createSampleLogs() {
    return this.csvUploadLogService.createSampleLogs();
  }
}
