import { EmailTemplateUtils } from './email-templates.utils';
import { EmailService } from '../service/email.service';
import { ErrorHandlerService } from './services/error-handler.service';

export class EmailUtils {
  /**
   * Send booth code email to exhibitor
   */
  static async sendBoothCodeEmail(
    emailService: EmailService,
    errorHandler: ErrorHandlerService,
    exhibitorEmail: string,
    uniqueCode: string,
    eventName: string,
    eventStartDate: string,
    eventVenue: string,
  ): Promise<void> {
    try {
      const subject = 'Your Event Booth Access Code';
      const html = EmailTemplateUtils.generateBoothCodeEmail(
        uniqueCode,
        eventName,
        eventStartDate,
        eventVenue,
      );

      await emailService.sendEmail(exhibitorEmail, subject, html);
    
    } catch (error) {
      console.error('Failed to send booth code email:', error);
      // Don't throw error as email sending failure shouldn't break the main flow
      errorHandler.logError(error, 'Booth code email sending', undefined);
    }
  }

  /**
   * Send booth removal email to exhibitor
   */
  static async sendBoothRemovalEmail(
    emailService: EmailService,
    errorHandler: ErrorHandlerService,
    exhibitorEmail: string,
    uniqueCode: string,
    eventName: string,
    eventStartDate: string,
    eventVenue: string,
  ): Promise<void> {
    try {
      const subject = 'Booth Access Revoked - Event Update';
      const html = EmailTemplateUtils.generateBoothRemovalEmail(
        eventName,
        eventStartDate,
        eventVenue,
        uniqueCode,
      );

      await emailService.sendEmail(exhibitorEmail, subject, html);
    
    } catch (error) {
      console.error('Failed to send booth removal email:', error);
      // Don't throw error as email sending failure shouldn't break the main flow
      errorHandler.logError(error, 'Booth removal email sending', undefined);
    }
  }

  /**
   * Generate unique code for event booth
   */
  static generateUniqueCode(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `EB${timestamp}${randomStr}`.toUpperCase();
  }

  /**
   * Format date for email display - handles both Date objects and string dates
   */
  static formatDateForEmail(date: Date | string): string {
    if (date instanceof Date) {
      return date.toDateString();
    }
    
    // If it's a string, try to parse it and format it
    if (typeof date === 'string') {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toDateString();
        }
      } catch (error) {
        // If parsing fails, return the original string
        console.warn('Failed to parse date string:', date);
      }
      return date; // Return original string if parsing fails
    }
    
    return 'Date not available';
  }
}
