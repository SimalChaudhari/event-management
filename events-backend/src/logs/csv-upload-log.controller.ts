import { Controller, Get, Param, UseGuards, Delete, Res, Query } from '@nestjs/common';
import { CsvUploadLogService } from './csv-upload-log.service';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Response } from 'express';

@Controller('api/logs/csv-upload')
@UseGuards(JwtAuthGuard)
export class CsvUploadLogController {
  constructor(private readonly csvUploadLogService: CsvUploadLogService) {}

  /**
   * Get all CSV upload logs ordered by creation date
   */
  @Get()
  async getLogs() {
    return await this.csvUploadLogService.getLogs();
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
