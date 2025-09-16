import { Injectable } from '@nestjs/common';
import { NotificationUtil } from './notification.util';
import { EventNotificationType } from '../types/notification.types';
import { NotificationTextUtil } from './notification-text.util';

@Injectable()
export class EventNotificationService {
  constructor(private readonly notificationUtil: NotificationUtil) {}

  /**
   * Send notification when user registers for event
   */
  async sendEventRegistrationNotification(eventId: string, userId: string, eventTitle: string): Promise<void> {
    try {
      await this.notificationUtil.sendEventNotification({
        eventId,
        title: NotificationTextUtil.getEventRegistrationTitle(),
        description: NotificationTextUtil.getEventRegistrationDescription(eventTitle),
        type: EventNotificationType.EVENT_REGISTRATION
      });
    } catch (error) {
      console.error('Failed to send event registration notification:', error);
    }
  }

  /**
   * Send notification when admin updates event details
   */
  async sendEventUpdateNotification(eventId: string, eventTitle: string, changes: string[]): Promise<void> {
    try {
      // Create more attractive description based on what changed
      let description = '';
      let emoji = '📝';
      
      if (changes.length === 1) {
        const field = changes[0];
        if (field.includes('Name')) {
          emoji = '🏷️';
          description = `The event name has been updated. Check it out!`;
        } else if (field.includes('Description')) {
          emoji = '📄';
          description = `Event details have been refreshed with new information.`;
        } else if (field.includes('Time')) {
          emoji = '⏰';
          description = `The event timing has been updated. Don't miss it!`;
        } else if (field.includes('Location')) {
          emoji = '📍';
          description = `The venue has been changed. Check the new location!`;
        } else if (field.includes('Price')) {
          emoji = '💰';
          description = `The event pricing has been updated.`;
        } else {
          description = `${field} has been updated.`;
        }
      } else if (changes.length === 2) {
        emoji = '🔄';
        description = `${changes[0]} and ${changes[1]} have been updated. Check out the changes!`;
      } else {
        emoji = '✨';
        description = `Several updates have been made: ${changes.slice(0, -1).join(', ')}, and ${changes[changes.length - 1]}. Take a look!`;
      }

    
    const result = await this.notificationUtil.sendEventNotification({
        eventId,
        title: NotificationTextUtil.getEventUpdateTitle(),
        description: description,
        type: EventNotificationType.EVENT_UPDATE
      });
     
    } catch (error) {
      console.error('Failed to send event update notification:', error);
    }
  }

  /**
   * Send notification when event is cancelled
   */
  async sendEventCancellationNotification(eventId: string, eventTitle: string, reason?: string): Promise<void> {
    try {
      await this.notificationUtil.sendEventNotification({
        eventId,
        title: NotificationTextUtil.getEventCancelledTitle(),
        description: NotificationTextUtil.getEventCancelledDescription(eventTitle),
        type: EventNotificationType.EVENT_CANCELLED
      });
    } catch (error) {
      console.error('Failed to send event cancellation notification:', error);
    }
  }


}
