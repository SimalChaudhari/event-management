import { Injectable } from '@nestjs/common';
import { EmailService } from '../service/email.service';
import { EmailTemplateUtils, UserCredentialsData } from './email-templates.utils';
import { CsvUploadLogService } from '../logs/csv-upload-log.service';

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
  processingTimeMs: number;
  failedEmails: UserCredentialsData[];
  success: boolean;
  message: string;
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
    delayBetweenBatches: 30000, // 30 seconds
    retryDelay: 120000, // 2 minutes
    maxRetries: 1
  };

  constructor(
    private readonly emailService: EmailService,
    private readonly csvUploadLogService: CsvUploadLogService,
  ) {}

  /**
   * Send emails in professional batches with proper error handling
   */
  async sendEmailsInBatches(
    emailsToSend: UserCredentialsData[],
    sessionId: string,
    config: Partial<EmailBatchConfig> = {},
    onProgress?: (progress: EmailProgress) => void
  ): Promise<EmailBatchResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    
    let emailsSent = 0;
    let emailsFailed = 0;
    let emailsRetried = 0;
    const failedEmails: UserCredentialsData[] = [];

    try {
      console.log(`🚀 EMAIL BATCH SERVICE: Starting professional email sending`);
      console.log(`📧 Configuration: ${finalConfig.batchSize} emails/batch, ${finalConfig.delayBetweenEmails}ms delay, ${finalConfig.delayBetweenBatches/1000}s between batches`);

      // Send emails in batches
      const result = await this.processEmailBatches(
        emailsToSend,
        finalConfig,
        sessionId,
        onProgress,
        (sent, failed, failedList) => {
          emailsSent = sent;
          emailsFailed = failed;
          failedEmails.push(...failedList);
        }
      );

      // Retry failed emails if any
      if (failedEmails.length > 0 && finalConfig.maxRetries > 0) {
        console.log(`🔄 Retrying ${failedEmails.length} failed emails...`);
        const retryResult = await this.retryFailedEmails(failedEmails, finalConfig, sessionId);
        emailsRetried = retryResult.retried;
        emailsSent += retryResult.sent;
        emailsFailed = retryResult.failed;
      }

      const processingTime = Date.now() - startTime;
      
      const batchResult: EmailBatchResult = {
        totalEmails: emailsToSend.length,
        emailsSent,
        emailsFailed,
        emailsRetried,
        processingTimeMs: processingTime,
        failedEmails: emailsToSend.filter((_, index) => index >= emailsSent + emailsFailed),
        success: emailsFailed === 0,
        message: this.generateResultMessage(emailsSent, emailsFailed, emailsRetried, processingTime)
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
    emailsToSend: UserCredentialsData[],
    config: EmailBatchConfig,
    sessionId: string,
    onProgress?: (progress: EmailProgress) => void,
    onBatchComplete?: (sent: number, failed: number, failedList: UserCredentialsData[]) => void
  ): Promise<void> {
    const totalBatches = Math.ceil(emailsToSend.length / config.batchSize);
    let totalSent = 0;
    let totalFailed = 0;
    const allFailedEmails: UserCredentialsData[] = [];

    for (let i = 0; i < emailsToSend.length; i += config.batchSize) {
      const batch = emailsToSend.slice(i, i + config.batchSize);
      const batchNumber = Math.floor(i / config.batchSize) + 1;

      console.log(`📧 Processing batch ${batchNumber}/${totalBatches}: ${batch.length} emails`);

      // Process current batch
      const batchResult = await this.processBatch(
        batch,
        i + 1, // starting email number
        emailsToSend.length,
        config.delayBetweenEmails,
        onProgress
      );

      totalSent += batchResult.sent;
      totalFailed += batchResult.failed;
      allFailedEmails.push(...batchResult.failedEmails);

      console.log(`✅ Batch ${batchNumber}/${totalBatches} completed: ${totalSent} total sent, ${totalFailed} total failed`);

      // Call progress callback
      if (onBatchComplete) {
        onBatchComplete(totalSent, totalFailed, allFailedEmails);
      }

      // Delay between batches (except for the last batch)
      if (i + config.batchSize < emailsToSend.length) {
        console.log(`⏳ Waiting ${config.delayBetweenBatches / 1000}s before next batch...`);
        await this.delay(config.delayBetweenBatches);
      }
    }
  }

  /**
   * Process a single batch of emails
   */
  private async processBatch(
    batch: UserCredentialsData[],
    startEmailNumber: number,
    totalEmails: number,
    delayBetweenEmails: number,
    onProgress?: (progress: EmailProgress) => void
  ): Promise<{ sent: number; failed: number; failedEmails: UserCredentialsData[] }> {
    let sent = 0;
    let failed = 0;
    const failedEmails: UserCredentialsData[] = [];

    for (let j = 0; j < batch.length; j++) {
      const emailData = batch[j];
      const emailNumber = startEmailNumber + j;

      try {
        const mailOptions = EmailTemplateUtils.getUserCredentialsEmailOptions(emailData);
        await this.emailService['transporter'].sendMail(mailOptions);
        sent++;
        console.log(`✅ Email ${emailNumber}/${totalEmails} sent to ${emailData.email}`);

        // Call progress callback
        if (onProgress) {
          onProgress({
            currentBatch: Math.floor((emailNumber - 1) / 15) + 1,
            totalBatches: Math.ceil(totalEmails / 15),
            currentEmail: emailNumber,
            totalEmails,
            emailsSent: sent,
            emailsFailed: failed,
            status: 'sending',
            estimatedTimeRemaining: this.calculateEstimatedTime(totalEmails, emailNumber, delayBetweenEmails)
          });
        }

      } catch (error: any) {
        failed++;
        failedEmails.push(emailData);
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
    failedEmails: UserCredentialsData[],
    config: EmailBatchConfig,
    sessionId: string
  ): Promise<{ sent: number; failed: number; retried: number }> {
    console.log(`🔄 Retrying ${failedEmails.length} failed emails after ${config.retryDelay / 1000} seconds...`);
    
    // Wait before retrying
    await this.delay(config.retryDelay);

    let retrySent = 0;
    let retryFailed = 0;
    const retryDelay = 2000; // 2 seconds between retry attempts

    for (const emailData of failedEmails) {
      try {
        const mailOptions = EmailTemplateUtils.getUserCredentialsEmailOptions(emailData);
        await this.emailService['transporter'].sendMail(mailOptions);
        retrySent++;
        console.log(`✅ RETRY SUCCESS: Email sent to ${emailData.email}`);
        
        // Delay between retry attempts
        await this.delay(retryDelay);
        
      } catch (error: any) {
        retryFailed++;
        console.error(`❌ RETRY FAILED: ${emailData.email}: ${error.message}`);
        await this.delay(retryDelay);
      }
    }

    console.log(`🔄 RETRY COMPLETED: ${retrySent} additional emails sent, ${retryFailed} still failed`);
    
    return {
      sent: retrySent,
      failed: retryFailed,
      retried: failedEmails.length
    };
  }

  /**
   * Update email logs with professional formatting
   */
  private async updateEmailLogs(sessionId: string, result: EmailBatchResult): Promise<void> {
    try {
      await this.csvUploadLogService.updateLogEntry(sessionId, {
        emailsSent: result.emailsSent,
        emailsFailed: result.emailsFailed,
        emailsPending: 0,
        processingTimeMs: result.processingTimeMs,
        emailDetails: {
          totalEmails: result.totalEmails,
          emailsSent: result.emailsSent,
          emailsFailed: result.emailsFailed,
          emailsRetried: result.emailsRetried,
          processingTimeMs: result.processingTimeMs,
          success: result.success,
          status: 'completed'
        },
        summary: result.message,
        status: result.success ? 'completed' : 'partial'
      });
      
      console.log(`📝 Professional logs updated: ${result.emailsSent} sent, ${result.emailsFailed} failed`);
    } catch (logError) {
      console.error(`❌ Failed to update professional logs:`, logError);
    }
  }

  /**
   * Generate professional result message
   */
  private generateResultMessage(sent: number, failed: number, retried: number, processingTime: number): string {
    const minutes = Math.floor(processingTime / 60000);
    const seconds = Math.floor((processingTime % 60000) / 1000);
    
    let message = `PROFESSIONAL EMAIL BATCH COMPLETED: ${sent} emails sent successfully`;
    
    if (failed > 0) {
      message += `, ${failed} failed`;
    }
    
    if (retried > 0) {
      message += ` (${retried} retried)`;
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
        delayBetweenBatches: 30000,
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
