import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ScheduledPushNotification,
  NotificationStatus,
  RedirectType,
} from './scheduled-push-notification.entity';
import {
  CreateScheduledPushNotificationDto,
  UpdateScheduledPushNotificationDto,
  ScheduledPushNotificationResponseDto,
  FilterScheduledPushNotificationDto,
  UserPushNotificationFilterDto,
  UserPushNotificationResponseDto,
} from './scheduled-push-notification.dto';
import { Event } from '../event/event.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { UserEntity } from '../user/users.entity';
import { PushNotification } from '../settings/setting.entity';
import { NotificationUtil } from '../utils/notification.util';
import { FirebaseUtil } from '../utils/firebase.util';
import {
  ScheduledPushNotificationDelivery,
  DeliveryStatus,
} from './scheduled-push-notification-delivery.entity';

@Injectable()
export class ScheduledPushNotificationService {
  private readonly logger = new Logger(ScheduledPushNotificationService.name);

  constructor(
    @InjectRepository(ScheduledPushNotification)
    private readonly scheduledNotificationRepository: Repository<ScheduledPushNotification>,
    @InjectRepository(ScheduledPushNotificationDelivery)
    private readonly deliveryRepository: Repository<ScheduledPushNotificationDelivery>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(ProgrammeTrack)
    private readonly trackRepository: Repository<ProgrammeTrack>,
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PushNotification)
    private readonly pushNotificationRepository: Repository<PushNotification>,
    private readonly notificationUtil: NotificationUtil,
  ) {}

  async create(
    dto: CreateScheduledPushNotificationDto,
  ): Promise<ScheduledPushNotificationResponseDto> {
    try {
      // Validate event if not sending to all users
      if (!dto.sendToAllUsers && !dto.eventId) {
        throw new BadRequestException(
          'Event ID is required when not sending to all users',
        );
      }

      if (dto.eventId) {
        const event = await this.eventRepository.findOne({
          where: { id: dto.eventId },
        });
        if (!event) {
          throw new NotFoundException('Event not found');
        }
      }

      // Validate tracks if provided
      if (dto.trackIds && dto.trackIds.length > 0) {
        const tracks = await this.trackRepository.find({
          where: { id: In(dto.trackIds), eventId: dto.eventId },
        });
        if (tracks.length !== dto.trackIds.length) {
          throw new BadRequestException('One or more tracks not found');
        }
      }

      // Create notification
      const notification = this.scheduledNotificationRepository.create({
        message: dto.message,
        sendToAllUsers: dto.sendToAllUsers,
        eventId: dto.eventId,
        trackIds: dto.trackIds,
        redirectType: dto.redirectType || RedirectType.NONE,
        redirectUrl: dto.redirectUrl,
        appPageRoute: dto.appPageRoute,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        status: NotificationStatus.SCHEDULED,
      });

      const saved = await this.scheduledNotificationRepository.save(notification);

      const savedWithRelations = await this.scheduledNotificationRepository.findOne({
        where: { id: saved.id },
        relations: ['event'],
      });

      // If no scheduled time, send immediately
      if (!dto.scheduledAt) {
        await this.sendNotification(saved.id);
      }

      const response = this.mapToResponseDto(savedWithRelations ?? saved);

      if (response.trackIds && response.trackIds.length > 0) {
        const tracks = await this.trackRepository.find({
          where: { id: In(response.trackIds) },
          select: ['id', 'title'],
        });
        response.tracks = tracks;
      }

      return response;
    } catch (error) {
      this.logger.error('Error creating scheduled notification:', error);
      throw error;
    }
  }

  async findAll(
    filters?: FilterScheduledPushNotificationDto,
  ): Promise<ScheduledPushNotificationResponseDto[]> {
    try {
      const queryBuilder =
        this.scheduledNotificationRepository.createQueryBuilder('notification');

      if (filters?.status) {
        queryBuilder.andWhere('notification.status = :status', {
          status: filters.status,
        });
      }

      if (filters?.eventId) {
        queryBuilder.andWhere('notification.eventId = :eventId', {
          eventId: filters.eventId,
        });
      }

      if (filters?.sendToAllUsers !== undefined) {
        queryBuilder.andWhere('notification.sendToAllUsers = :sendToAllUsers', {
          sendToAllUsers: filters.sendToAllUsers,
        });
      }

      if (filters?.search) {
        queryBuilder.andWhere('notification.message ILIKE :search', {
          search: `%${filters.search}%`,
        });
      }

      queryBuilder
        .leftJoinAndSelect('notification.event', 'event')
        .orderBy('notification.createdAt', 'DESC');

      const notifications = await queryBuilder.getMany();

      // Load tracks for each notification
      const result = await Promise.all(
        notifications.map(async (notification) => {
          const dto = this.mapToResponseDto(notification);
          if (notification.trackIds && notification.trackIds.length > 0) {
            const tracks = await this.trackRepository.find({
              where: { id: In(notification.trackIds) },
              select: ['id', 'title'],
            });
            dto.tracks = tracks;
          }
          return dto;
        }),
      );

      return result;
    } catch (error) {
      this.logger.error('Error fetching scheduled notifications:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<ScheduledPushNotificationResponseDto> {
    try {
      const notification = await this.scheduledNotificationRepository.findOne({
        where: { id },
        relations: ['event'],
      });

      if (!notification) {
        throw new NotFoundException('Scheduled notification not found');
      }

      const dto = this.mapToResponseDto(notification);

      // Load tracks if available
      if (notification.trackIds && notification.trackIds.length > 0) {
        const tracks = await this.trackRepository.find({
          where: { id: In(notification.trackIds) },
          select: ['id', 'title'],
        });
        dto.tracks = tracks;
      }

      return dto;
    } catch (error) {
      this.logger.error('Error fetching scheduled notification:', error);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateScheduledPushNotificationDto,
  ): Promise<ScheduledPushNotificationResponseDto> {
    try {
      const notification = await this.scheduledNotificationRepository.findOne({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException('Scheduled notification not found');
      }

      // Don't allow editing if already sent
      if (notification.status === NotificationStatus.SENT) {
        throw new BadRequestException('Cannot edit a notification that has already been sent');
      }

      // Validate event if updating
      if (dto.eventId) {
        const event = await this.eventRepository.findOne({
          where: { id: dto.eventId },
        });
        if (!event) {
          throw new NotFoundException('Event not found');
        }
      }

      // Validate tracks if updating
      if (dto.trackIds && dto.trackIds.length > 0 && dto.eventId) {
        const tracks = await this.trackRepository.find({
          where: { id: In(dto.trackIds), eventId: dto.eventId },
        });
        if (tracks.length !== dto.trackIds.length) {
          throw new BadRequestException('One or more tracks not found');
        }
      }

      // Update fields
      if (dto.message !== undefined) notification.message = dto.message;
      if (dto.sendToAllUsers !== undefined)
        notification.sendToAllUsers = dto.sendToAllUsers;
      if (dto.eventId !== undefined) notification.eventId = dto.eventId;
      if (dto.trackIds !== undefined) notification.trackIds = dto.trackIds;
      if (dto.redirectType !== undefined)
        notification.redirectType = dto.redirectType;
      if (dto.redirectUrl !== undefined)
        notification.redirectUrl = dto.redirectUrl;
      if (dto.appPageRoute !== undefined)
        notification.appPageRoute = dto.appPageRoute;
      if (dto.scheduledAt !== undefined)
        notification.scheduledAt = dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : undefined;
      if (dto.status !== undefined) notification.status = dto.status;

      const updated = await this.scheduledNotificationRepository.save(
        notification,
      );

      const updatedWithRelations = await this.scheduledNotificationRepository.findOne({
        where: { id: updated.id },
        relations: ['event'],
      });

      const response = this.mapToResponseDto(updatedWithRelations ?? updated);

      if (response.trackIds && response.trackIds.length > 0) {
        const tracks = await this.trackRepository.find({
          where: { id: In(response.trackIds) },
          select: ['id', 'title'],
        });
        response.tracks = tracks;
      }

      return response;
    } catch (error) {
      this.logger.error('Error updating scheduled notification:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const notification = await this.scheduledNotificationRepository.findOne({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException('Scheduled notification not found');
      }

      await this.scheduledNotificationRepository.remove(notification);
    } catch (error) {
      this.logger.error('Error deleting scheduled notification:', error);
      throw error;
    }
  }

  async sendNotification(id: string): Promise<void> {
    try {
      const notification = await this.scheduledNotificationRepository.findOne({
        where: { id },
        relations: ['event'],
      });

      if (!notification) {
        throw new NotFoundException('Scheduled notification not found');
      }

      if (notification.status === NotificationStatus.SENT) {
        this.logger.warn(`Notification ${id} already sent`);
        return;
      }

      // Update status to processing
      notification.status = NotificationStatus.SENT;
      await this.scheduledNotificationRepository.save(notification);

      // Get target users
      let targetUserIds: string[] = [];

      if (notification.sendToAllUsers) {
        // Get all users
        const allUsers = await this.userRepository.find({
          select: ['id'],
        });
        targetUserIds = allUsers.map((user) => user.id);
      } else if (notification.eventId) {
        if (notification.trackIds && notification.trackIds.length > 0) {
          // Get users registered for specific tracks
          // This requires getting sessions in those tracks, then users registered for those sessions
          // For now, we'll get users registered for the event
          const registrations = await this.registerEventRepository.find({
            where: { eventId: notification.eventId },
            select: ['userId'],
          });
          targetUserIds = [
            ...new Set(
              registrations
                .map((r) => r.userId)
                .filter((id): id is string => id !== undefined && id !== null),
            ),
          ];
        } else {
          // Get users registered for the event
          const registrations = await this.registerEventRepository.find({
            where: { eventId: notification.eventId },
            select: ['userId'],
          });
          targetUserIds = [
            ...new Set(
              registrations
                .map((r) => r.userId)
                .filter((id): id is string => id !== undefined && id !== null),
            ),
          ];
        }
      }

      if (targetUserIds.length === 0) {
        this.logger.warn(`No target users found for notification ${id}`);
        notification.status = NotificationStatus.FAILED;
        notification.errorMessage = 'No target users found';
        await this.scheduledNotificationRepository.save(notification);
        await this.deliveryRepository.delete({
          notificationId: notification.id,
        });
        return;
      }

      const deliveryMap = new Map<string, ScheduledPushNotificationDelivery>();

      if (targetUserIds.length > 0) {
        const existingDeliveries = await this.deliveryRepository.find({
          where: {
            notificationId: notification.id,
            userId: In(targetUserIds),
          },
        });
        existingDeliveries.forEach((delivery) => {
          deliveryMap.set(delivery.userId, delivery);
        });

        const deliveriesToCreate = targetUserIds
          .filter((userId) => !deliveryMap.has(userId))
          .map((userId) =>
            this.deliveryRepository.create({
              notificationId: notification.id,
              userId,
              status: DeliveryStatus.PENDING,
              isRead: false,
            }),
          );

        if (deliveriesToCreate.length > 0) {
          const createdDeliveries =
            await this.deliveryRepository.save(deliveriesToCreate);
          createdDeliveries.forEach((delivery) => {
            deliveryMap.set(delivery.userId, delivery);
          });
        }
      }

      const deliveryUpdates: ScheduledPushNotificationDelivery[] = [];

      // Prepare notification data
      const notificationData: any = {
        title: 'Notification',
        body: notification.message,
        type: 'scheduled_push',
        notificationId: notification.id,
      };

      // Add redirect data
      if (notification.redirectType === RedirectType.URL && notification.redirectUrl) {
        notificationData.redirectUrl = notification.redirectUrl;
        notificationData.redirectType = 'url';
      } else if (
        notification.redirectType === RedirectType.APP_PAGE &&
        notification.appPageRoute
      ) {
        notificationData.appPageRoute = notification.appPageRoute;
        notificationData.redirectType = 'app_page';
        if (notification.eventId) {
          // Replace :eventId placeholder if exists
          notificationData.appPageRoute = notification.appPageRoute.replace(
            ':eventId',
            notification.eventId,
          );
        }
      }

      // Send notifications using NotificationUtil
      let sentCount = 0;
      let failedCount = 0;

      try {
        // Prepare notification data with redirect information
        const notificationPayload: any = {
          title: 'Notification',
          description: notification.message,
          type: 'general',
        };

        // Add redirect data to notification
        if (notification.redirectType === RedirectType.URL && notification.redirectUrl) {
          notificationPayload.redirectUrl = notification.redirectUrl;
          notificationPayload.redirectType = 'url';
        } else if (
          notification.redirectType === RedirectType.APP_PAGE &&
          notification.appPageRoute
        ) {
          let appRoute = notification.appPageRoute;
          if (notification.eventId) {
            appRoute = appRoute.replace(':eventId', notification.eventId);
          }
          notificationPayload.appPageRoute = appRoute;
          notificationPayload.redirectType = 'app_page';
        }

        // Use NotificationUtil to send notifications (handles both push and socket)
        // Note: We'll need to send directly to ensure redirect data is included
        for (const userId of targetUserIds) {
          const deliveryRecord = deliveryMap.get(userId);
          let userSuccess = false;
          let userErrorMessage: string | undefined;

          try {
            const deviceTokens = await this.pushNotificationRepository.find({
              where: { userId, isActive: true },
            });

            for (const deviceToken of deviceTokens) {
              try {
                await FirebaseUtil.sendPushNotification(
                  deviceToken.deviceToken,
                  {
                    title: notificationPayload.title,
                    body: notificationPayload.description,
                    data: {
                      ...notificationPayload,
                      notificationId: notification.id,
                      timestamp: new Date().toISOString(),
                    },
                  },
                  deviceToken.platform,
                );
                sentCount++;
                userSuccess = true;
              } catch (error) {
                this.logger.error(
                  `Failed to send push notification to device ${deviceToken.id}:`,
                  error,
                );
                failedCount++;
                userErrorMessage =
                  error instanceof Error ? error.message : String(error);
              }
            }

            if (!userSuccess && !userErrorMessage) {
              userErrorMessage = 'No active device tokens found for user';
            }
          } catch (error) {
            this.logger.error(`Failed to send notification to user ${userId}:`, error);
            failedCount++;
            if (!userErrorMessage) {
              userErrorMessage =
                error instanceof Error ? error.message : String(error);
            }
          }

          if (deliveryRecord) {
            if (userSuccess) {
              deliveryRecord.status = DeliveryStatus.SENT;
              deliveryRecord.deliveredAt = new Date();
              deliveryRecord.failedAt = undefined;
              deliveryRecord.errorMessage = undefined;
            } else {
              deliveryRecord.status = DeliveryStatus.FAILED;
              deliveryRecord.failedAt = new Date();
              deliveryRecord.errorMessage = userErrorMessage;
            }
            deliveryUpdates.push(deliveryRecord);
          }
        }

        if (deliveryUpdates.length > 0) {
          await this.deliveryRepository.save(deliveryUpdates);
        }
      } catch (error) {
        this.logger.error('Error sending notifications:', error);
        failedCount = targetUserIds.length;

        const failedDeliveries = await this.deliveryRepository.find({
          where: {
            notificationId: notification.id,
            userId: In(targetUserIds),
          },
        });

        const failureTimestamp = new Date();
        failedDeliveries.forEach((delivery) => {
          delivery.status = DeliveryStatus.FAILED;
          delivery.failedAt = failureTimestamp;
          delivery.errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
        });

        if (failedDeliveries.length > 0) {
          await this.deliveryRepository.save(failedDeliveries);
        }
      }

      // Update notification status
      notification.sentAt = new Date();
      notification.sentCount = sentCount;
      notification.failedCount = failedCount;
      if (failedCount > 0) {
        notification.errorMessage = `${failedCount} notifications failed to send`;
      }
      await this.scheduledNotificationRepository.save(notification);

      this.logger.log(
        `Notification ${id} sent: ${sentCount} successful, ${failedCount} failed`,
      );
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      const notification = await this.scheduledNotificationRepository.findOne({
        where: { id },
      });
      if (notification) {
        notification.status = NotificationStatus.FAILED;
        notification.errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        await this.scheduledNotificationRepository.save(notification);
      }
      throw error;
    }
  }

  // Cron job to check for scheduled notifications
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const notifications = await this.scheduledNotificationRepository.find({
        where: {
          status: NotificationStatus.SCHEDULED,
        },
      });

      for (const notification of notifications) {
        if (
          notification.scheduledAt &&
          notification.scheduledAt <= now
        ) {
          this.logger.log(
            `Processing scheduled notification ${notification.id}`,
          );
          // Send notification asynchronously
          this.sendNotification(notification.id).catch((error) => {
            this.logger.error(
              `Error processing scheduled notification ${notification.id}:`,
              error,
            );
          });
        }
      }
    } catch (error) {
      this.logger.error('Error in scheduled notification cron job:', error);
    }
  }

  async getUserNotifications(
    userId: string,
    filters?: UserPushNotificationFilterDto,
  ): Promise<UserPushNotificationResponseDto[]> {
    const queryBuilder = this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.notification', 'notification')
      .leftJoinAndSelect('notification.event', 'event')
      .where('delivery.userId = :userId', { userId })
      .orderBy('delivery.createdAt', 'DESC');

    if (filters?.status) {
      queryBuilder.andWhere('delivery.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.isRead !== undefined) {
      queryBuilder.andWhere('delivery.isRead = :isRead', {
        isRead: filters.isRead,
      });
    }

    const deliveries = await queryBuilder.getMany();

    return deliveries.map((delivery) => ({
      id: delivery.id,
      message: delivery.notification?.message ?? '',
      sendToAllUsers: delivery.notification?.sendToAllUsers ?? false,
      eventId: delivery.notification?.eventId,
      eventName: delivery.notification?.event?.name,
      redirectType: delivery.notification?.redirectType ?? RedirectType.NONE,
      redirectUrl: delivery.notification?.redirectUrl ?? undefined,
      appPageRoute: delivery.notification?.appPageRoute ?? undefined,
      scheduledAt: delivery.notification?.scheduledAt,
      deliveredAt: delivery.deliveredAt,
      failedAt: delivery.failedAt,
      status: delivery.status,
      isRead: delivery.isRead,
      readAt: delivery.readAt,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    }));
  }

  async markUserNotificationRead(
    deliveryId: string,
    userId: string,
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId, userId },
    });

    if (!delivery) {
      throw new NotFoundException('Notification not found');
    }

    if (!delivery.isRead) {
      delivery.isRead = true;
      delivery.readAt = new Date();
      await this.deliveryRepository.save(delivery);
    }
  }

  async markAllUserNotificationsRead(userId: string): Promise<void> {
    await this.deliveryRepository
      .createQueryBuilder()
      .update(ScheduledPushNotificationDelivery)
      .set({ isRead: true, readAt: () => 'CURRENT_TIMESTAMP' })
      .where('userId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();
  }

  private mapToResponseDto(
    notification: ScheduledPushNotification,
  ): ScheduledPushNotificationResponseDto {
    return {
      id: notification.id,
      message: notification.message,
      sendToAllUsers: notification.sendToAllUsers,
      eventId: notification.eventId,
      event: notification.event
        ? {
            id: notification.event.id,
            name: notification.event.name,
          }
        : undefined,
      trackIds: notification.trackIds,
      redirectType: notification.redirectType,
      redirectUrl: notification.redirectUrl,
      appPageRoute: notification.appPageRoute,
      scheduledAt: notification.scheduledAt,
      status: notification.status,
      sentAt: notification.sentAt,
      sentCount: notification.sentCount,
      failedCount: notification.failedCount,
      errorMessage: notification.errorMessage,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}

