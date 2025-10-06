import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { CsvUploadLogService } from './csv-upload-log.service';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

@Controller('api/logs/csv-upload')
@UseGuards(JwtAuthGuard)
export class CsvUploadLogController {
  constructor(private readonly csvUploadLogService: CsvUploadLogService) {}

  /**
   * Get all CSV upload logs with pagination
   */
  @Get()
  async getLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    
    return await this.csvUploadLogService.getLogs(pageNum, limitNum);
  }

  /**
   * Get specific log by session ID
   */
  @Get('session/:sessionId')
  async getLogBySessionId(@Param('sessionId') sessionId: string) {
    return await this.csvUploadLogService.getLogBySessionId(sessionId);
  }

  /**
   * Get logs by admin ID
   */
  @Get('admin/:adminId')
  async getLogsByAdmin(
    @Param('adminId') adminId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    
    return await this.csvUploadLogService.getLogsByAdmin(adminId, pageNum, limitNum);
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
