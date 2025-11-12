import { Injectable } from '@nestjs/common';
import { EmailService } from '../service/email.service';
import { EmailTemplateUtils, EmailTemplatePayload } from './email-templates.utils';
import { CsvUploadLogService } from '../logs/csv-upload-log.service';
import {
  EmailLogDetails,
  EmailRecipientLog,
  EmailAttemptLog,
} from '../logs/csv-upload-log.types';

export interface EmailBatchConfig {
  batchSize: number;
  delayBetweenEmails: number;
  delayBetweenBatches: number;
  retryDelay: number;
  maxRetries: number;
}

export interface EmailBatchResult {
  totalEmails: number;
  emailsSent: number;
  emailsFailed: number;
  emailsRetried: number;
  emailsPending: number;
  processingTimeMs: number;
  recipients: EmailRecipientLog[];
  failedRecipients: EmailRecipientLog[];
  logDetails: EmailLogDetails;
  success: boolean;
  message: string;
}

interface FailedEmailRecord {
  index: number;
  payload: EmailTemplatePayload;
  errorMessage?: string;
}

export interface EmailProgress {
  currentBatch: number;
  totalBatches: number;
  currentEmail: number;
  totalEmails: number;
  emailsSent: number;
  emailsFailed: number;
  status: 'sending' | 'completed' | 'failed' | 'retrying';
  estimatedTimeRemaining: number;
}

@Injectable()
export class EmailBatchService {
  private readonly defaultConfig: EmailBatchConfig = {
    batchSize: 15,
    delayBetweenEmails: 1000, // 1 second
    delayBetweenBatches: 5000, // 5 seconds (changed from 30)
    retryDelay: 120000, // 2 minutes
    maxRetries: 1
  };

  constructor(
    private readonly emailService: EmailService,
    private readonly csvUploadLogService: CsvUploadLogService,
  ) {}

  private initializeRecipientLogs(emails: EmailTemplatePayload[]): EmailRecipientLog[] {
    return emails.map((payload) => ({
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      salutation: 'salutation' in payload ? payload.salutation : undefined,
      status: 'pending',
      success: false,
      attempts: [],
      retried: false,
    }));
  }

  private recordEmailAttempt(
    recipient: EmailRecipientLog,
    status: EmailAttemptLog['status'],
    errorMessage?: string,
  ): void {
    const timestamp = new Date().toISOString();
    const attemptIndex = recipient.attempts.length + 1;
    const attempt: EmailAttemptLog = {
      attempt: attemptIndex,
      status,
      timestamp,
      errorMessage,
    };

    recipient.attempts.push(attempt);
    recipient.lastUpdatedAt = timestamp;

    if (attemptIndex > 1) {
      recipient.retried = true;
    }

    if (status === 'sent') {
      recipient.status = attemptIndex > 1 ? 'retried' : 'sent';
      recipient.success = true;
    } else {
      recipient.status = 'failed';
      recipient.success = false;
    }
  }

  private calculateEmailTotals(
    recipientLogs: EmailRecipientLog[],
  ): { sent: number; failed: number; pending: number } {
    let sent = 0;
    let failed = 0;
    let pending = 0;

    recipientLogs.forEach((recipient) => {
      if (recipient.status === 'sent' || (recipient.status === 'retried' && recipient.success)) {
        sent += 1;
      } else if (recipient.status === 'failed') {
        failed += 1;
      } else if (recipient.status === 'pending' || recipient.status === 'retried') {
        // 'retried' but not successful yet counts as pending
        if (!recipient.success) {
          pending += 1;
        }
      }
    });

    return { sent, failed, pending };
  }

  /**
   * Send emails in professional batches with proper error handling
   */
  async sendEmailsInBatches(
    emailsToSend: EmailTemplatePayload[],
    sessionId: string,
    config: Partial<EmailBatchConfig> = {},
    onProgress?: (progress: EmailProgress) => void
  ): Promise<EmailBatchResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    const recipientLogs = this.initializeRecipientLogs(emailsToSend);

    let emailsSent = 0;
    let emailsFailed = 0;
    let emailsRetried = 0;

    try {
      console.log(`🚀 EMAIL BATCH SERVICE: Starting professional email sending`);
      console.log(`📧 Configuration: ${finalConfig.batchSize} emails/batch, ${finalConfig.delayBetweenEmails}ms delay, ${finalConfig.delayBetweenBatches/1000}s between batches`);

      // Send emails in batches
      const batchOutcome = await this.processEmailBatches(
        emailsToSend,
        finalConfig,
        recipientLogs,
        onProgress,
      );

      emailsSent = batchOutcome.sent;
      emailsFailed = batchOutcome.failed;

      // Retry failed emails if any
      if (batchOutcome.failedEmails.length > 0 && finalConfig.maxRetries > 0) {
        console.log(`🔄 Retrying ${batchOutcome.failedEmails.length} failed emails...`);
        const retryResult = await this.retryFailedEmails(batchOutcome.failedEmails, finalConfig, recipientLogs);
        emailsRetried = retryResult.retried;
        emailsSent += retryResult.sent;
        emailsFailed = retryResult.failed;
      }

      const processingTime = Date.now() - startTime;
      const pendingCount = recipientLogs.filter(recipient => recipient.status === 'pending').length;
      const failedRecipients = recipientLogs.filter(recipient => recipient.status === 'failed');
      emailsFailed = failedRecipients.length;

      const logDetails: EmailLogDetails = {
        totals: {
          total: emailsToSend.length,
          sent: emailsSent,
          failed: emailsFailed,
          pending: pendingCount,
          retried: emailsRetried,
        },
        processingTimeMs: processingTime,
        emailSendingEnabled: emailsToSend.length > 0,
        batchConfig: finalConfig,
        completedAt: new Date().toISOString(),
        recipients: recipientLogs,
      };
      
      const batchResult: EmailBatchResult = {
        totalEmails: emailsToSend.length,
        emailsSent,
        emailsFailed,
        emailsRetried,
        emailsPending: pendingCount,
        processingTimeMs: processingTime,
        recipients: recipientLogs,
        failedRecipients,
        logDetails,
        success: failedRecipients.length === 0 && pendingCount === 0,
        message: this.generateResultMessage(emailsSent, failedRecipients.length, emailsRetried, processingTime, pendingCount)
      };

      // Update logs with final result
      await this.updateEmailLogs(sessionId, batchResult);

      console.log(`🎉 EMAIL BATCH SERVICE COMPLETED: ${batchResult.message}`);
      return batchResult;

    } catch (error) {
      console.error('❌ Email batch service failed:', error);
      throw error;
    }
  }

  /**
   * Process emails in professional batches
   */
  private async processEmailBatches(
    emailsToSend: EmailTemplatePayload[],
    config: EmailBatchConfig,
    recipientLogs: EmailRecipientLog[],
    onProgress?: (progress: EmailProgress) => void,
  ): Promise<{ sent: number; failed: number; failedEmails: FailedEmailRecord[] }> {
    const totalBatches = Math.ceil(emailsToSend.length / config.batchSize);
    let totalSent = 0;
    let totalFailed = 0;
    const failedRecords: FailedEmailRecord[] = [];

    for (let i = 0; i < emailsToSend.length; i += config.batchSize) {
      const batch = emailsToSend.slice(i, i + config.batchSize);
      const batchNumber = Math.floor(i / config.batchSize) + 1;

      console.log(`📧 Processing batch ${batchNumber}/${totalBatches}: ${batch.length} emails`);

      // Process current batch
      const batchResult = await this.processBatch(
        batch,
        i,
        emailsToSend.length,
        config.delayBetweenEmails,
        config.batchSize,
        recipientLogs,
        onProgress
      );

      totalSent += batchResult.sent;
      totalFailed += batchResult.failed;
      failedRecords.push(...batchResult.failedEmails);

   

      // Delay between batches (except for the last batch)
      if (i + config.batchSize < emailsToSend.length) {
        console.log(`⏳ Waiting ${config.delayBetweenBatches / 1000}s before next batch...`);
        await this.delay(config.delayBetweenBatches);
      }
    }

    return {
      sent: totalSent,
      failed: totalFailed,
      failedEmails: failedRecords,
    };
  }

  /**
   * Process a single batch of emails
   */
  private async processBatch(
    batch: EmailTemplatePayload[],
    batchStartIndex: number,
    totalEmails: number,
    delayBetweenEmails: number,
    batchSize: number,
    recipientLogs: EmailRecipientLog[],
    onProgress?: (progress: EmailProgress) => void
  ): Promise<{ sent: number; failed: number; failedEmails: FailedEmailRecord[] }> {
    let sent = 0;
    let failed = 0;
    const failedEmails: FailedEmailRecord[] = [];

    for (let j = 0; j < batch.length; j++) {
      const emailData = batch[j];
      const overallIndex = batchStartIndex + j;
      const emailNumber = overallIndex + 1;
      const recipientLog = recipientLogs[overallIndex];

      try {
        const mailOptions = EmailTemplateUtils.getEmailOptions(emailData);
        await this.emailService['transporter'].sendMail(mailOptions);
        this.recordEmailAttempt(recipientLog, 'sent');
        sent++;
        console.log(`✅ Email ${emailNumber}/${totalEmails} sent to ${emailData.email}`);

        // Call progress callback
        if (onProgress) {
          const totals = this.calculateEmailTotals(recipientLogs);
          onProgress({
            currentBatch: Math.floor(overallIndex / batchSize) + 1,
            totalBatches: Math.ceil(totalEmails / batchSize),
            currentEmail: emailNumber,
            totalEmails,
            emailsSent: totals.sent,
            emailsFailed: totals.failed,
            status: 'sending',
            estimatedTimeRemaining: this.calculateEstimatedTime(totalEmails, emailNumber, delayBetweenEmails)
          });
        }

      } catch (error: any) {
        failed++;
        this.recordEmailAttempt(recipientLog, 'failed', error?.message);
        failedEmails.push({
          index: overallIndex,
          payload: emailData,
          errorMessage: error?.message,
        });
        console.error(`❌ Email ${emailNumber}/${totalEmails} failed for ${emailData.email}: ${error.message}`);
      }

      // Delay between emails (except for the last email in the batch)
      if (j < batch.length - 1) {
        await this.delay(delayBetweenEmails);
      }
    }

    return { sent, failed, failedEmails };
  }

  /**
   * Retry failed emails with proper error handling
   */
  private async retryFailedEmails(
    failedEmails: FailedEmailRecord[],
    config: EmailBatchConfig,
    recipientLogs: EmailRecipientLog[],
  ): Promise<{ sent: number; failed: number; retried: number; failedRecords: FailedEmailRecord[] }> {
    console.log(`🔄 Retrying ${failedEmails.length} failed emails after ${config.retryDelay / 1000} seconds...`);
    
    // Wait before retrying
    await this.delay(config.retryDelay);

    let retrySent = 0;
    let retryFailed = 0;
    const retryDelay = 2000; // 2 seconds between retry attempts
    const remainingFailed: FailedEmailRecord[] = [];

    for (const failedRecord of failedEmails) {
      const { payload, index } = failedRecord;
      const recipientLog = recipientLogs[index];

      try {
        const mailOptions = EmailTemplateUtils.getEmailOptions(payload);
        await this.emailService['transporter'].sendMail(mailOptions);
        this.recordEmailAttempt(recipientLog, 'sent');
        retrySent++;
        console.log(`✅ RETRY SUCCESS: Email sent to ${payload.email}`);
        
        // Delay between retry attempts
        await this.delay(retryDelay);
        
      } catch (error: any) {
        this.recordEmailAttempt(recipientLog, 'failed', error?.message);
        retryFailed++;
        console.error(`❌ RETRY FAILED: ${payload.email}: ${error.message}`);
        remainingFailed.push({
          index,
          payload,
          errorMessage: error?.message,
        });
        await this.delay(retryDelay);
      }
    }

    console.log(`🔄 RETRY COMPLETED: ${retrySent} additional emails sent, ${retryFailed} still failed`);
    
    return {
      sent: retrySent,
      failed: retryFailed,
      retried: failedEmails.length,
      failedRecords: remainingFailed,
    };
  }

  /**
   * Update email logs with professional formatting
   */
  private async updateEmailLogs(sessionId: string, result: EmailBatchResult): Promise<void> {
    try {
      const status = result.success
        ? 'completed'
        : result.emailsPending > 0
          ? 'processing'
          : result.emailsSent > 0
            ? 'partial'
            : 'failed';

      await this.csvUploadLogService.updateLogEntry(sessionId, {
        emailsSent: result.emailsSent,
        emailsFailed: result.emailsFailed,
        emailsPending: result.emailsPending,
        processingTimeMs: result.processingTimeMs,
        emailDetails: result.logDetails,
        summary: result.message,
        status,
      });
      
      console.log(`📝 Professional logs updated: ${result.emailsSent} sent, ${result.emailsFailed} failed, ${result.emailsPending} pending`);
    } catch (logError) {
      console.error(`❌ Failed to update professional logs:`, logError);
    }
  }

  /**
   * Generate professional result message
   */
  private generateResultMessage(
    sent: number,
    failed: number,
    retried: number,
    processingTime: number,
    pending: number,
  ): string {
    const minutes = Math.floor(processingTime / 60000);
    const seconds = Math.floor((processingTime % 60000) / 1000);
    
    let message = `PROFESSIONAL EMAIL BATCH COMPLETED: ${sent} emails sent successfully`;
    
    if (failed > 0) {
      message += `, ${failed} failed`;
    }
    
    if (retried > 0) {
      message += ` (${retried} retried)`;
    }
    
    if (pending > 0) {
      message += `, ${pending} pending`;
    }
    
    message += ` in ${minutes}m ${seconds}s using professional batch processing`;
    
    return message;
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(totalEmails: number, currentEmail: number, delayMs: number): number {
    const remainingEmails = totalEmails - currentEmail;
    const estimatedMs = remainingEmails * delayMs;
    return Math.floor(estimatedMs / 1000); // Return seconds
  }

  /**
   * Professional delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recommended configuration for different email providers
   */
  getRecommendedConfig(provider: 'gmail' | 'sendgrid' | 'mailgun' | 'ses'): EmailBatchConfig {
    const configs = {
      gmail: {
        batchSize: 15,
        delayBetweenEmails: 1000,
        delayBetweenBatches: 5000, // 5 seconds (changed from 30)
        retryDelay: 120000,
        maxRetries: 1
      },
      sendgrid: {
        batchSize: 50,
        delayBetweenEmails: 500,
        delayBetweenBatches: 10000,
        retryDelay: 60000,
        maxRetries: 2
      },
      mailgun: {
        batchSize: 40,
        delayBetweenEmails: 750,
        delayBetweenBatches: 15000,
        retryDelay: 90000,
        maxRetries: 2
      },
      ses: {
        batchSize: 100,
        delayBetweenEmails: 200,
        delayBetweenBatches: 5000,
        retryDelay: 30000,
        maxRetries: 3
      }
    };

    return configs[provider] || this.defaultConfig;
  }
}
