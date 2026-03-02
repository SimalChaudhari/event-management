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
      errorHandler.logError(error, 'Booth code email sending', undefined);
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
   * Format date for email display: "12 Dec 2026 (Sat)"
   */
  static formatDateForEmail(date: Date | string): string {
    const { formatEmailDate } = require('./email-templates.utils');
    return formatEmailDate(date);
  }

  /**
   * Format time for email display: "01:00 PM"
   */
  static formatTimeForEmail(time: string | Date): string {
    const { formatEmailTime } = require('./email-templates.utils');
    return formatEmailTime(time);
  }
}
