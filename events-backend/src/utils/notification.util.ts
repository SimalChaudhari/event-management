import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventNotification, EventNotificationRead } from '../settings/event-notification.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { PushNotification } from '../settings/setting.entity';
import { FirebaseUtil } from './firebase.util';
import { ErrorHandlerUtil } from './error-handler.util';
import { EventNotificationType, GeneralNotificationType } from '../types/notification.types';

export interface SendNotificationData {
  eventId: string;
  title: string;
  description: string;
  type?: EventNotificationType;
}

export interface SendTargetedNotificationData {
  eventId: string;
  title: string;
  description: string;
  type?: EventNotificationType;
  targetUserIds: string[]; // Specific user IDs to send notification to
}

export interface SendGeneralNotificationData {
  title: string;
  description: string;
  type?: GeneralNotificationType;
}

export interface SendTargetedGeneralNotificationData {
  title: string;
  description: string;
  type?: GeneralNotificationType;
  targetUserIds: string[]; // Specific user IDs to send notification to
}

export interface NotificationResult {
  message: string;
  sentCount: number;
  notificationId: string;
}

@Injectable()
export class NotificationUtil {
  private notificationGateway: any = null;

  constructor(
    @InjectRepository(EventNotification)
    private eventNotificationRepository: Repository<EventNotification>,
    @InjectRepository(EventNotificationRead)
    private eventNotificationReadRepository: Repository<EventNotificationRead>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(PushNotification)
    private pushNotificationRepository: Repository<PushNotification>,
  ) {}

  // Set notification gateway reference
  setNotificationGateway(gateway: any) {
    this.notificationGateway = gateway;
  }


  /**
   * Send event notification to specific users only
   */
  async sendTargetedEventNotification(notificationData: SendTargetedNotificationData): Promise<NotificationResult> {
    try {
      const { eventId, title, description, type, targetUserIds } = notificationData;

      // 1. Create event notification record
      const eventNotification = this.eventNotificationRepository.create({
        eventId,
        title,
        description,
        type: type || EventNotificationType.EVENT_UPDATE,
        isSent: false
      });

      const savedEventNotification = await this.eventNotificationRepository.save(eventNotification);

      let sentCount = 0;

      // 2. Send notification to each target user
      if (targetUserIds.length > 0) {
        for (const userId of targetUserIds) {
          try {
            // Send push notification
            await this.sendPushNotificationToUser(userId, {
              title,
              body: description,
              data: {
                eventId,
                notificationId: savedEventNotification.id,
                type: type || EventNotificationType.EVENT_UPDATE
              }
            });

            // Send socket notification (if gateway is available) - don't block on this
            this.sendSocketNotificationToUser(userId, {
              id: savedEventNotification.id,
              eventId,
              title,
              description,
              type: type || EventNotificationType.EVENT_UPDATE,
              createdAt: savedEventNotification.createdAt
            }).catch(socketError => {
              console.error(`Socket notification failed for user ${userId}:`, socketError);
            });

            // Create read record for this user
            const readRecord = this.eventNotificationReadRepository.create({
              eventNotificationId: savedEventNotification.id,
              userId: userId,
              isRead: false
            });
            await this.eventNotificationReadRepository.save(readRecord);

            sentCount++;
          } catch (userError) {
            console.error(`Failed to send notification to user ${userId}:`, userError);
          }
        }
      }

      // 3. Mark notification as sent
      savedEventNotification.isSent = true;
      await this.eventNotificationRepository.save(savedEventNotification);

      return {
        message: `Notification sent to ${sentCount} specific user(s)`,
        sentCount,
        notificationId: savedEventNotification.id
      };

    } catch (error) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  /**
   * Send event notification to all registered users
   */
  async sendEventNotification(notificationData: SendNotificationData): Promise<NotificationResult> {
    try {
      const { eventId, title, description, type } = notificationData;

    
      // 1. Create event notification record
      const eventNotification = this.eventNotificationRepository.create({
        eventId,
        title,
        description,
        type: type || EventNotificationType.EVENT_UPDATE,
        isSent: false
      });


      const savedEventNotification = await this.eventNotificationRepository.save(eventNotification);
     
      // 2. Get all registered users for this event
      const registeredUsers = await this.getEventRegisteredUsers(eventId);
    
      
      let sentCount = 0;

      // 3. Send notification to each registered user (if any)
      if (registeredUsers.length > 0) {
        for (const user of registeredUsers) {
          try {
          
            
            // Send push notification
            await this.sendPushNotificationToUser(user.id, {
              title,
              body: description,
              data: {
                eventId,
                notificationId: savedEventNotification.id,
                type: type || EventNotificationType.EVENT_UPDATE
              }
            }).catch(pushError => {
              console.error(`Push notification failed for user ${user.id}:`, pushError);
            });

            // Send socket notification (if gateway is available) - don't block on this
            this.sendSocketNotificationToUser(user.id, {
              id: savedEventNotification.id,
              eventId,
              title,
              description,
              type: type || EventNotificationType.EVENT_UPDATE,
              createdAt: savedEventNotification.createdAt
            }).catch(socketError => {
              console.error(`Socket notification failed for user ${user.id}:`, socketError);
            });

            // Create read record for this user (CRITICAL: This was missing!)
            const readRecord = this.eventNotificationReadRepository.create({
              eventNotificationId: savedEventNotification.id,
              userId: user.id,
              isRead: false
            });
            await this.eventNotificationReadRepository.save(readRecord);

            sentCount++;
          } catch (userError) {
            console.error(`❌ Failed to send notification to user ${user.id}:`, userError);
            // Continue with other users even if one fails
          }
        }
      } else {
        console.log(`⚠️ No registered users found for event ${eventId}`);
      }

      // 4. Mark event notification as sent (regardless of whether users were found)
      try {
        savedEventNotification.isSent = true;
        await this.eventNotificationRepository.save(savedEventNotification);
      } catch (saveError) {
        console.error('❌ Failed to mark notification as sent:', saveError);
      }

      const result = { 
        message: `Event notification sent to ${sentCount} users`, 
        sentCount,
        notificationId: savedEventNotification.id
      };
      
      return result;
    } catch (error: any) {
      console.error(`❌ Error in sendEventNotification:`, error);
      ErrorHandlerUtil.handleError(error);
    }
  }

  /**
   * Send notification to specific users
   */
  async sendNotificationToUsers(userIds: string[], notificationData: SendGeneralNotificationData): Promise<NotificationResult> {
    try {
      const { title, description, type } = notificationData;

      let sentCount = 0;

      for (const userId of userIds) {
        try {
          // Send push notification
          await this.sendPushNotificationToUser(userId, {
            title,
            body: description,
            data: {
              notificationId: `user_${Date.now()}`,
              type: type || GeneralNotificationType.GENERAL
            }
          });

          // Send socket notification - don't block on this
          this.sendSocketNotificationToUser(userId, {
            id: `user_${Date.now()}`,
            title,
            description,
            type: type || GeneralNotificationType.GENERAL,
            createdAt: new Date()
          }).catch(socketError => {
            console.error(`Socket notification failed for user ${userId}:`, socketError);
          });

          sentCount++;
        } catch (userError) {
          console.error(`Failed to send notification to user ${userId}:`, userError);
        }
      }

      return { 
        message: `Notification sent to ${sentCount} users`, 
        sentCount,
        notificationId: `user_${Date.now()}`
      };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  /**
   * Send broadcast notification to all users
   */
  async sendBroadcastNotification(notificationData: SendGeneralNotificationData): Promise<NotificationResult> {
    try {
      const { title, description, type } = notificationData;

      // Get all users with device tokens
      const usersWithTokens = await this.pushNotificationRepository
        .createQueryBuilder('pushNotification')
        .leftJoinAndSelect('pushNotification.user', 'user')
        .where('pushNotification.isActive = :isActive', { isActive: true })
        .getMany();

      let sentCount = 0;

      for (const pushNotification of usersWithTokens) {
        try {
          await this.sendPushNotificationToUser(pushNotification.userId, {
            title,
            body: description,
            data: {
              notificationId: `broadcast_${Date.now()}`,
              type: type || GeneralNotificationType.BROADCAST
            }
          });

          sentCount++;
        } catch (userError) {
          console.error(`Failed to send broadcast to user ${pushNotification.userId}:`, userError);
        }
      }

      return { 
        message: `Broadcast notification sent to ${sentCount} users`, 
        sentCount,
        notificationId: `broadcast_${Date.now()}`
      };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  /**
   * Get event registered users
   */
  private async getEventRegisteredUsers(eventId: string): Promise<any[]> {
    try {
      const registeredUsers = await this.registerEventRepository
        .createQueryBuilder('registerEvent')
        .leftJoinAndSelect('registerEvent.user', 'user')
        .where('registerEvent.eventId = :eventId', { eventId })
        .andWhere('registerEvent.isRegister = :isRegister', { isRegister: true })
        .andWhere('registerEvent.status = :status', { status: 'Sucesss' })
        .select([
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.email',
          'user.mobile',
          'registerEvent.type',
          'registerEvent.createdAt'
        ])
        .getMany();

      return registeredUsers.map(registration => ({
        id: registration.user?.id,
        firstName: registration.user?.firstName,
        lastName: registration.user?.lastName,
        email: registration.user?.email,
        mobile: registration.user?.mobile,
        registrationType: registration.type,
        registeredAt: registration.createdAt
      }));
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  /**
   * Send push notification to user
   */
  private async sendPushNotificationToUser(userId: string, notification: any): Promise<void> {
    try {
      const deviceTokens = await this.pushNotificationRepository.find({
        where: { userId, isActive: true }
      });


      if (deviceTokens.length === 0) {
        console.log(`❌ No device tokens found for user ${userId} - notification will not be sent`);
        return;
      }

      const seen = new Set<string>();
      for (const deviceToken of deviceTokens) {
        const token = deviceToken.deviceToken?.trim();
        if (!token || seen.has(token)) continue;
        seen.add(token);
        console.log(`📤 Sending push notification to ${deviceToken.platform} device`);
        await FirebaseUtil.sendPushNotification(deviceToken.deviceToken, notification, deviceToken.platform);
        console.log(`✅ Push notification sent successfully`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to send push notification to user ${userId}:`, error);
    }
  }

  /**
   * Send socket notification to user
   */
  private async sendSocketNotificationToUser(userId: string, notification: any): Promise<void> {
    try {
      if (this.notificationGateway) {
        // Send event notification via socket
        if (notification.type === 'event' || notification.eventId) {
          this.notificationGateway.sendEventNotification(notification.eventId, notification);
        }
        // Send advert notification via socket
        else if (notification.type === 'advert') {
          this.notificationGateway.sendAdvertNotificationToUser(userId, notification);
        }
        // Send general notification via socket
        else {
          this.notificationGateway.sendToUser(userId, notification);
        }
        console.log(`📡 Socket notification sent to user ${userId}`);
      } else {
        console.log(`⚠️ Notification gateway not available for user ${userId}`);
      }
    } catch (error: any) {
      console.error(`Failed to send socket notification to user ${userId}:`, error);
    }
  }

  /**
   * Send advert notification to specific users (similar to event notifications)
   */
  async sendAdvertNotification(advertData: {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
    userIds: string[];
  }): Promise<{ message: string; sentCount: number }> {
    try {
      let sentCount = 0;

      // Send notification to each user
      for (const userId of advertData.userIds) {
        try {
          // Send push notification
          await this.sendPushNotificationToUser(userId, {
            title: advertData.title,
            body: this.extractTextFromContent(advertData.content),
            data: {
              advertId: advertData.id,
              type: GeneralNotificationType.ADVERT,
              actionUrl: advertData.actionUrl,
              actionText: advertData.actionText,
            }
          }).catch(pushError => {
            console.error(`Push notification failed for user ${userId}:`, pushError);
          });

          // Send socket notification (if gateway is available) - don't block on this
          this.sendSocketNotificationToUser(userId, {
            id: advertData.id,
            title: advertData.title,
            content: advertData.content,
            imageUrl: advertData.imageUrl,
            actionUrl: advertData.actionUrl,
            actionText: advertData.actionText,
            type: GeneralNotificationType.ADVERT,
            createdAt: new Date()
          }).catch(socketError => {
            console.error(`Socket notification failed for user ${userId}:`, socketError);
          });

          sentCount++;
        } catch (userError) {
          console.error(`❌ Failed to send advert notification to user ${userId}:`, userError);
          // Continue with other users even if one fails
        }
      }

      return {
        message: `Advert notification sent to ${sentCount} users`,
        sentCount
      };
    } catch (error: any) {
      console.error('❌ Error sending advert notification:', error);
      return {
        message: 'Error sending advert notification',
        sentCount: 0
      };
    }
  }

  /**
   * Extract plain text from HTML content
   */
  private extractTextFromContent(content: string): string {
    return content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<{ message: string }> {
    try {
      let readRecord = await this.eventNotificationReadRepository.findOne({
        where: { eventNotificationId: notificationId, userId }
      });

      if (readRecord) {
        readRecord.isRead = true;
        readRecord.readAt = new Date();
        await this.eventNotificationReadRepository.save(readRecord);
      } else {
        readRecord = this.eventNotificationReadRepository.create({
          eventNotificationId: notificationId,
          userId,
          isRead: true,
          readAt: new Date()
        });
        await this.eventNotificationReadRepository.save(readRecord);
      }

      return { message: 'Notification marked as read' };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  /**
   * Get user's notification history - only notifications specifically sent to this user
   */
  async getUserNotificationHistory(userId: string, filters: any = {}): Promise<{ notifications: any[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Get only notifications that were specifically sent to this user
      const queryBuilder = this.eventNotificationRepository
        .createQueryBuilder('eventNotification')
        .innerJoin('eventNotification.eventNotificationReads', 'read')
        .where('read.userId = :userId', { userId })
        .orderBy('eventNotification.createdAt', 'DESC');

      if (filters.type) {
        queryBuilder.andWhere('eventNotification.type = :type', { type: filters.type });
      }

      if (filters.eventId) {
        queryBuilder.andWhere('eventNotification.eventId = :eventId', { eventId: filters.eventId });
      }

      queryBuilder.skip(skip).take(limit);

      const [eventNotifications, total] = await queryBuilder.getManyAndCount();

      // Get read status for these notifications
      const notificationIds = eventNotifications.map(n => n.id);
      
      let readStatuses: any[] = [];
      
      if (notificationIds.length > 0) {
        readStatuses = await this.eventNotificationReadRepository.find({
          where: { 
            eventNotificationId: In(notificationIds),
            userId 
          }
        });
      }

      const readStatusMap = new Map(readStatuses.map(rs => [rs.eventNotificationId, rs]));

      const notifications = eventNotifications.map(notification => {
        const readStatus = readStatusMap.get(notification.id);
        return {
          id: notification.id,
          eventId: notification.eventId,
          title: notification.title,
          description: notification.description,
          type: notification.type,
          isRead: readStatus?.isRead || false,
          readAt: readStatus?.readAt,
          createdAt: notification.createdAt,
        };
      });

      return { notifications, total };
    } catch (error: any) {
      // For notifications, if there's an error, return empty array instead of throwing
      console.error('Error getting user notification history:', error);
      return { notifications: [], total: 0 };
    }
  }
}
