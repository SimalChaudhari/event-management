import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CsvUploadLogEntity } from './csv-upload-log.entity';
import { v4 as uuidv4 } from 'uuid';
import { CsvUploadLogView, EmailLogDetails } from './csv-upload-log.types';

type JsonParsable = string | object | undefined | null;

export interface CsvUploadLogData {
  sessionId?: string;
  adminId: string;
  fileName: string;
  originalFileName?: string;
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
  errorDetails?: JsonParsable;
  skippedRecords?: JsonParsable;
  failedRecords?: JsonParsable;
  emailDetails?: EmailLogDetails | string;
  emailSendingEnabled?: boolean;
  summary?: string;
}

@Injectable()
export class CsvUploadLogService {
  constructor(
    @InjectRepository(CsvUploadLogEntity)
    private csvUploadLogRepository: Repository<CsvUploadLogEntity>,
  ) {}

  private safeParseJson<T = any>(value: JsonParsable): T | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'object') {
      return value as T;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.warn('[CsvUploadLogService] Failed to parse JSON field:', error);
        return null;
      }
    }

    return null;
  }

  private normalizeJsonField(value: JsonParsable): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('[CsvUploadLogService] Failed to stringify JSON field:', error);
      return undefined;
    }
  }

  private enhanceLog(log: CsvUploadLogEntity): CsvUploadLogView {
    const errorDetails = this.safeParseJson(log.errorDetails);
    const skippedRecords = this.safeParseJson<any[]>(log.skippedRecords) ?? [];
    const failedRecords = this.safeParseJson<any[]>(log.failedRecords) ?? [];
    const emailDetails = this.safeParseJson<EmailLogDetails>(log.emailDetails);

    const defaultEmailTotals = {
      total: log.emailsTotal,
      sent: log.emailsSent,
      failed: log.emailsFailed,
      pending: log.emailsPending,
      retried: emailDetails?.totals?.retried ?? 0,
      sendingEnabled: log.emailSendingEnabled,
    };

    return {
      id: log.id,
      sessionId: log.sessionId,
      adminId: log.adminId,
      fileName: log.fileName,
      totalRecords: log.totalRecords,
      recordsProcessed: log.recordsProcessed,
      recordsFailed: log.recordsFailed,
      recordsSkipped: log.recordsSkipped,
      newUsersCreated: log.newUsersCreated,
      existingUsersUpdated: log.existingUsersUpdated,
      passwordsGenerated: log.passwordsGenerated,
      emailsTotal: log.emailsTotal,
      emailsSent: log.emailsSent,
      emailsFailed: log.emailsFailed,
      emailsPending: log.emailsPending,
      status: log.status,
      processingTimeMs: log.processingTimeMs,
      emailSendingEnabled: log.emailSendingEnabled,
      summary: log.summary ?? undefined,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
      fileDetails: {
        originalName: log.fileName,
        totalRecords: log.totalRecords,
      },
      emailSummary: defaultEmailTotals,
      emailDetails: emailDetails ?? null,
      errorDetails,
      skippedRecords,
      failedRecords,
    };
  }

  /**
   * Create initial log entry when CSV upload starts
   */
  async createLogEntry(data: CsvUploadLogData): Promise<CsvUploadLogEntity> {
    const sessionId = data.sessionId || uuidv4();
    
    const logEntry = this.csvUploadLogRepository.create({
      sessionId,
      adminId: data.adminId,
      fileName: data.originalFileName || data.fileName,
     
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
      errorDetails: this.normalizeJsonField(data.errorDetails),
      skippedRecords: this.normalizeJsonField(data.skippedRecords),
      failedRecords: this.normalizeJsonField(data.failedRecords),
      emailDetails: this.normalizeJsonField(data.emailDetails),
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
    if (updates.fileName !== undefined) logEntry.fileName = updates.fileName;
    if (updates.originalFileName !== undefined) logEntry.fileName = updates.originalFileName;

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
    if (updates.errorDetails !== undefined) logEntry.errorDetails = this.normalizeJsonField(updates.errorDetails);
    if (updates.skippedRecords !== undefined) logEntry.skippedRecords = this.normalizeJsonField(updates.skippedRecords);
    if (updates.failedRecords !== undefined) logEntry.failedRecords = this.normalizeJsonField(updates.failedRecords);
    if (updates.emailDetails !== undefined) logEntry.emailDetails = this.normalizeJsonField(updates.emailDetails);
    if (updates.summary !== undefined) logEntry.summary = updates.summary;

    return await this.csvUploadLogRepository.save(logEntry);
  }

  /**
   * Get all logs sorted by creation date (most recent first)
   */
  async getLogs(): Promise<CsvUploadLogView[]> {
    const logs = await this.csvUploadLogRepository.find({
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.enhanceLog(log));
  }

  /**
   * Get specific log by session ID
   */
  async getLogBySessionId(sessionId: string): Promise<CsvUploadLogView | null> {
    const log = await this.csvUploadLogRepository.findOne({ where: { sessionId } });
    return log ? this.enhanceLog(log) : null;
  }

  /**
   * Get logs by admin ID sorted by creation date (most recent first)
   */
  async getLogsByAdmin(adminId: string): Promise<CsvUploadLogView[]> {
    const logs = await this.csvUploadLogRepository.find({
      where: { adminId },
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.enhanceLog(log));
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
   * Delete all logs
   */
  async deleteAllLogs(): Promise<number> {
    const result = await this.csvUploadLogRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return result.affected || 0;
  }

  /**
   * Export email recipient details for a specific session
   */
  async exportEmailRecipients(sessionId: string): Promise<string> {
    const log = await this.getLogBySessionId(sessionId);

    if (!log) {
      throw new Error(`Log entry not found for session: ${sessionId}`);
    }

    const recipients = log.emailDetails?.recipients ?? [];

    if (recipients.length === 0) {
      const headers = [
        'Session ID',
        'Message',
      ];

      return [headers, [log.sessionId, 'No email recipients recorded for this session']]
        .map((row) =>
          row
            .map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`)
            .join(','),
        )
        .join('\n');
    }

    const headers = [
      'Session ID',
      'Email',
      'First Name',
      'Last Name',
      'Salutation',
      'Status',
      'Success',
      'Retried',
      'Attempt Count',
      'Attempts Detail',
      'Last Updated At',
      'Notes',
    ];

    const csvRows = recipients.map((recipient) => {
      const attemptsDetail = recipient.attempts
        ?.map(
          (attempt) =>
            `#${attempt.attempt}: ${attempt.status} @ ${attempt.timestamp}${
              attempt.errorMessage ? ` (error: ${attempt.errorMessage})` : ''
            }`,
        )
        .join(' | ');

      return [
        log.sessionId,
        recipient.email,
        recipient.firstName ?? '',
        recipient.lastName ?? '',
        recipient.salutation ?? '',
        recipient.status,
        recipient.success ? 'Yes' : 'No',
        recipient.retried ? 'Yes' : 'No',
        recipient.attempts?.length ?? 0,
        attemptsDetail ?? '',
        recipient.lastUpdatedAt ?? '',
        recipient.notes ?? '',
      ];
    });

    const csvContent = [headers, ...csvRows]
      .map((row) =>
        row
          .map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    return csvContent;
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

    const enhancedLogs = logs.map((log) => this.enhanceLog(log));

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

    const csvRows = enhancedLogs.map(log => [
      log.sessionId,
      log.adminId,
      log.fileDetails.originalName,
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
      log.createdAt,
      log.updatedAt
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
        emailDetails: {
          totals: {
            total: 6,
            sent: 5,
            failed: 1,
            pending: 0,
            retried: 0,
          },
          processingTimeMs: 1500,
          emailSendingEnabled: true,
          recipients: [],
        } as EmailLogDetails,
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
        emailDetails: {
          totals: {
            total: 15,
            sent: 12,
            failed: 3,
            pending: 0,
            retried: 0,
          },
          processingTimeMs: 3200,
          emailSendingEnabled: true,
          recipients: [],
        } as EmailLogDetails,
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
        emailDetails: {
          totals: {
            total: 3,
            sent: 3,
            failed: 0,
            pending: 0,
            retried: 0,
          },
          processingTimeMs: 800,
          emailSendingEnabled: true,
          recipients: [],
        } as EmailLogDetails,
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
        emailDetails: {
          totals: {
            total: 40,
            sent: 35,
            failed: 5,
            pending: 0,
            retried: 0,
          },
          processingTimeMs: 5500,
          emailSendingEnabled: true,
          recipients: [],
        } as EmailLogDetails,
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
        emailDetails: {
          totals: {
            total: 8,
            sent: 6,
            failed: 2,
            pending: 0,
            retried: 0,
          },
          processingTimeMs: 2100,
          emailSendingEnabled: true,
          recipients: [],
        } as EmailLogDetails,
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
