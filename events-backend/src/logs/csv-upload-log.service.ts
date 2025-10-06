import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CsvUploadLogEntity } from './csv-upload-log.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CsvUploadLogData {
  sessionId?: string;
  adminId: string;
  fileName: string;
  totalRecords: number;
  recordsProcessed?: number;
  recordsFailed?: number;
  recordsSkipped?: number;
  newUsersCreated?: number;
  existingUsersUpdated?: number;
  passwordsGenerated?: number;
  emailsTotal?: number;
  emailsSent?: number;
  emailsFailed?: number;
  emailsPending?: number;
  status?: 'processing' | 'completed' | 'failed' | 'partial';
  processingTimeMs?: number;
  errorDetails?: any;
  skippedRecords?: any[];
  failedRecords?: any[];
  emailDetails?: any;
  emailSendingEnabled?: boolean;
  summary?: string;
}

@Injectable()
export class CsvUploadLogService {
  constructor(
    @InjectRepository(CsvUploadLogEntity)
    private csvUploadLogRepository: Repository<CsvUploadLogEntity>,
  ) {}

  /**
   * Create initial log entry when CSV upload starts
   */
  async createLogEntry(data: CsvUploadLogData): Promise<CsvUploadLogEntity> {
    const sessionId = data.sessionId || uuidv4();
    
    const logEntry = this.csvUploadLogRepository.create({
      sessionId,
      adminId: data.adminId,
      fileName: data.fileName,
      totalRecords: data.totalRecords,
      recordsProcessed: data.recordsProcessed || 0,
      recordsFailed: data.recordsFailed || 0,
      recordsSkipped: data.recordsSkipped || 0,
      newUsersCreated: data.newUsersCreated || 0,
      existingUsersUpdated: data.existingUsersUpdated || 0,
      passwordsGenerated: data.passwordsGenerated || 0,
      emailsTotal: data.emailsTotal || 0,
      emailsSent: data.emailsSent || 0,
      emailsFailed: data.emailsFailed || 0,
      emailsPending: data.emailsPending || 0,
      status: data.status || 'processing',
      processingTimeMs: data.processingTimeMs || 0,
      errorDetails: data.errorDetails ? JSON.stringify(data.errorDetails) : undefined,
      skippedRecords: data.skippedRecords ? JSON.stringify(data.skippedRecords) : undefined,
      failedRecords: data.failedRecords ? JSON.stringify(data.failedRecords) : undefined,
      emailDetails: data.emailDetails ? JSON.stringify(data.emailDetails) : undefined,
      emailSendingEnabled: data.emailSendingEnabled || false,
      summary: data.summary || undefined,
    });

    return await this.csvUploadLogRepository.save(logEntry);
  }

  /**
   * Update log entry with progress
   */
  async updateLogEntry(sessionId: string, updates: Partial<CsvUploadLogData>): Promise<CsvUploadLogEntity> {
    const logEntry = await this.csvUploadLogRepository.findOne({ where: { sessionId } });
    
    if (!logEntry) {
      throw new Error(`Log entry not found for session: ${sessionId}`);
    }

    // Update fields
    if (updates.recordsProcessed !== undefined) logEntry.recordsProcessed = updates.recordsProcessed;
    if (updates.recordsFailed !== undefined) logEntry.recordsFailed = updates.recordsFailed;
    if (updates.recordsSkipped !== undefined) logEntry.recordsSkipped = updates.recordsSkipped;
    if (updates.newUsersCreated !== undefined) logEntry.newUsersCreated = updates.newUsersCreated;
    if (updates.existingUsersUpdated !== undefined) logEntry.existingUsersUpdated = updates.existingUsersUpdated;
    if (updates.passwordsGenerated !== undefined) logEntry.passwordsGenerated = updates.passwordsGenerated;
    if (updates.emailsSent !== undefined) logEntry.emailsSent = updates.emailsSent;
    if (updates.emailsFailed !== undefined) logEntry.emailsFailed = updates.emailsFailed;
    if (updates.emailsPending !== undefined) logEntry.emailsPending = updates.emailsPending;
    if (updates.status !== undefined) logEntry.status = updates.status;
    if (updates.processingTimeMs !== undefined) logEntry.processingTimeMs = updates.processingTimeMs;
    if (updates.errorDetails !== undefined) logEntry.errorDetails = JSON.stringify(updates.errorDetails);
    if (updates.skippedRecords !== undefined) logEntry.skippedRecords = JSON.stringify(updates.skippedRecords);
    if (updates.failedRecords !== undefined) logEntry.failedRecords = JSON.stringify(updates.failedRecords);
    if (updates.emailDetails !== undefined) logEntry.emailDetails = JSON.stringify(updates.emailDetails);
    if (updates.summary !== undefined) logEntry.summary = updates.summary;

    return await this.csvUploadLogRepository.save(logEntry);
  }

  /**
   * Get all logs with pagination
   */
  async getLogs(page: number = 1, limit: number = 20): Promise<{
    logs: CsvUploadLogEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [logs, total] = await this.csvUploadLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get specific log by session ID
   */
  async getLogBySessionId(sessionId: string): Promise<CsvUploadLogEntity | null> {
    return await this.csvUploadLogRepository.findOne({ where: { sessionId } });
  }

  /**
   * Get logs by admin ID
   */
  async getLogsByAdmin(adminId: string, page: number = 1, limit: number = 20): Promise<{
    logs: CsvUploadLogEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [logs, total] = await this.csvUploadLogRepository.findAndCount({
      where: { adminId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete old logs (cleanup)
   */
  async deleteOldLogs(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.csvUploadLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalUploads: number;
    totalRecords: number;
    totalUsersCreated: number;
    totalEmailsSent: number;
    successRate: number;
    averageProcessingTime: number;
  }> {
    const logs = await this.csvUploadLogRepository.find();
    
    const totalUploads = logs.length;
    const totalRecords = logs.reduce((sum, log) => sum + log.totalRecords, 0);
    const totalUsersCreated = logs.reduce((sum, log) => sum + log.newUsersCreated, 0);
    const totalEmailsSent = logs.reduce((sum, log) => sum + log.emailsSent, 0);
    const successfulUploads = logs.filter(log => log.status === 'completed').length;
    const successRate = totalUploads > 0 ? (successfulUploads / totalUploads) * 100 : 0;
    const averageProcessingTime = totalUploads > 0 ? 
      logs.reduce((sum, log) => sum + log.processingTimeMs, 0) / totalUploads : 0;

    return {
      totalUploads,
      totalRecords,
      totalUsersCreated,
      totalEmailsSent,
      successRate,
      averageProcessingTime,
    };
  }

  /**
   * Export logs to CSV format
   */
  async exportLogs(filters: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    adminId?: string;
  }): Promise<string> {
    const queryBuilder = this.csvUploadLogRepository.createQueryBuilder('log');

    // Apply filters
    if (filters.dateFrom) {
      queryBuilder.andWhere('log.createdAt >= :dateFrom', { 
        dateFrom: new Date(filters.dateFrom) 
      });
    }
    if (filters.dateTo) {
      queryBuilder.andWhere('log.createdAt <= :dateTo', { 
        dateTo: new Date(filters.dateTo) 
      });
    }
    if (filters.status) {
      queryBuilder.andWhere('log.status = :status', { status: filters.status });
    }
    if (filters.adminId) {
      queryBuilder.andWhere('log.adminId = :adminId', { adminId: filters.adminId });
    }

    const logs = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .getMany();

    // Generate CSV content
    const headers = [
      'Session ID',
      'Admin ID',
      'File Name',
      'Total Records',
      'Records Processed',
      'Records Skipped',
      'Records Failed',
      'New Users Created',
      'Existing Users Updated',
      'Passwords Generated',
      'Emails Total',
      'Emails Sent',
      'Emails Failed',
      'Emails Pending',
      'Status',
      'Processing Time (ms)',
      'Email Sending Enabled',
      'Summary',
      'Created At',
      'Updated At'
    ];

    const csvRows = logs.map(log => [
      log.sessionId,
      log.adminId,
      log.fileName,
      log.totalRecords,
      log.recordsProcessed,
      log.recordsSkipped,
      log.recordsFailed,
      log.newUsersCreated,
      log.existingUsersUpdated,
      log.passwordsGenerated,
      log.emailsTotal,
      log.emailsSent,
      log.emailsFailed,
      log.emailsPending,
      log.status,
      log.processingTimeMs,
      log.emailSendingEnabled ? 'Yes' : 'No',
      log.summary || '',
      log.createdAt.toISOString(),
      log.updatedAt.toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Create sample logs for testing
   */
  async createSampleLogs(): Promise<{ message: string; created: number }> {
    const sampleLogs = [
      {
        sessionId: 'sample-session-1',
        adminId: 'admin-1',
        fileName: 'sample-users-1.csv',
        totalRecords: 10,
        recordsProcessed: 8,
        recordsSkipped: 2,
        recordsFailed: 0,
        newUsersCreated: 6,
        existingUsersUpdated: 2,
        passwordsGenerated: 6,
        emailsTotal: 6,
        emailsSent: 5,
        emailsFailed: 1,
        emailsPending: 0,
        status: 'completed' as const,
        processingTimeMs: 1500,
        emailSendingEnabled: true,
        summary: 'Successfully processed 8 out of 10 records. 6 new users created, 2 existing users updated.',
      },
      {
        sessionId: 'sample-session-2',
        adminId: 'admin-2',
        fileName: 'sample-users-2.csv',
        totalRecords: 25,
        recordsProcessed: 20,
        recordsSkipped: 5,
        recordsFailed: 0,
        newUsersCreated: 15,
        existingUsersUpdated: 5,
        passwordsGenerated: 15,
        emailsTotal: 15,
        emailsSent: 12,
        emailsFailed: 3,
        emailsPending: 0,
        status: 'completed' as const,
        processingTimeMs: 3200,
        emailSendingEnabled: true,
        summary: 'Successfully processed 20 out of 25 records. 15 new users created, 5 existing users updated.',
      },
      {
        sessionId: 'sample-session-3',
        adminId: 'admin-1',
        fileName: 'sample-users-3.csv',
        totalRecords: 5,
        recordsProcessed: 3,
        recordsSkipped: 2,
        recordsFailed: 0,
        newUsersCreated: 3,
        existingUsersUpdated: 0,
        passwordsGenerated: 3,
        emailsTotal: 3,
        emailsSent: 3,
        emailsFailed: 0,
        emailsPending: 0,
        status: 'completed' as const,
        processingTimeMs: 800,
        emailSendingEnabled: true,
        summary: 'Successfully processed 3 out of 5 records. 3 new users created.',
      },
      {
        sessionId: 'sample-session-4',
        adminId: 'admin-3',
        fileName: 'sample-users-4.csv',
        totalRecords: 50,
        recordsProcessed: 45,
        recordsSkipped: 5,
        recordsFailed: 0,
        newUsersCreated: 40,
        existingUsersUpdated: 5,
        passwordsGenerated: 40,
        emailsTotal: 40,
        emailsSent: 35,
        emailsFailed: 5,
        emailsPending: 0,
        status: 'completed' as const,
        processingTimeMs: 5500,
        emailSendingEnabled: true,
        summary: 'Successfully processed 45 out of 50 records. 40 new users created, 5 existing users updated.',
      },
      {
        sessionId: 'sample-session-5',
        adminId: 'admin-2',
        fileName: 'sample-users-5.csv',
        totalRecords: 15,
        recordsProcessed: 10,
        recordsSkipped: 5,
        recordsFailed: 0,
        newUsersCreated: 8,
        existingUsersUpdated: 2,
        passwordsGenerated: 8,
        emailsTotal: 8,
        emailsSent: 6,
        emailsFailed: 2,
        emailsPending: 0,
        status: 'partial' as const,
        processingTimeMs: 2100,
        emailSendingEnabled: true,
        summary: 'Partially processed 10 out of 15 records. 8 new users created, 2 existing users updated.',
      },
    ];

    let created = 0;
    for (const logData of sampleLogs) {
      try {
        await this.createLogEntry(logData);
        created++;
      } catch (error) {
        console.error('Error creating sample log:', error);
      }
    }

    return {
      message: `Created ${created} sample log entries`,
      created,
    };
  }
}
