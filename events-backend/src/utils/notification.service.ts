import { Injectable } from '@nestjs/common';
import { NotificationUtil, SendNotificationData, SendGeneralNotificationData, NotificationResult } from './notification.util';
import { EventNotificationType, GeneralNotificationType } from '../types/notification.types';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationUtil: NotificationUtil) {}

  /**
   * Send event notification (for event-related notifications)
   */
  async sendEventNotification(data: SendNotificationData): Promise<NotificationResult> {
    return this.notificationUtil.sendEventNotification(data);
  }

  /**
   * Send notification to specific users (for user-specific notifications)
   */
  async sendToUsers(userIds: string[], title: string, description: string, type?: GeneralNotificationType): Promise<NotificationResult> {
    return this.notificationUtil.sendNotificationToUsers(userIds, {
      title,
      description,
      type
    });
  }

  /**
   * Send broadcast notification (for system-wide notifications)
   */
  async sendBroadcast(title: string, description: string, type?: GeneralNotificationType): Promise<NotificationResult> {
    return this.notificationUtil.sendBroadcastNotification({
      title,
      description,
      type
    });
  }

  /**
   * Send order notification (for order-related notifications)
   */
  async sendOrderNotification(userId: string, orderId: string, title: string, description: string, type?: GeneralNotificationType): Promise<NotificationResult> {
    return this.notificationUtil.sendNotificationToUsers([userId], {
      title,
      description,
      type: type || GeneralNotificationType.ORDER
    });
  }

  /**
   * Send payment notification (for payment-related notifications)
   */
  async sendPaymentNotification(userId: string, paymentId: string, title: string, description: string, type?: GeneralNotificationType): Promise<NotificationResult> {
    return this.notificationUtil.sendNotificationToUsers([userId], {
      title,
      description,
      type: type || GeneralNotificationType.PAYMENT
    });
  }

  /**
   * Send system maintenance notification
   */
  async sendMaintenanceNotification(title: string, description: string, maintenanceTime?: string): Promise<NotificationResult> {
    return this.notificationUtil.sendBroadcastNotification({
      title,
      description,
      type: GeneralNotificationType.MAINTENANCE
    });
  }

  /**
   * Send welcome notification to new user
   */
  async sendWelcomeNotification(userId: string, userName: string): Promise<NotificationResult> {
    return this.notificationUtil.sendNotificationToUsers([userId], {
      title: '🎉 Welcome to Event Platform!',
      description: `Hey ${userName}! Welcome aboard! 🚀 Get ready to discover amazing events!`,
      type: GeneralNotificationType.WELCOME
    });
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(userId: string, eventTitle: string, reminderTime: string): Promise<NotificationResult> {
    return this.notificationUtil.sendNotificationToUsers([userId], {
      title: '⏰ Event Reminder',
      description: `Don't miss out! "${eventTitle}" starts at ${reminderTime}. See you there! 🎯`,
      type: GeneralNotificationType.REMINDER
    });
  }
}
