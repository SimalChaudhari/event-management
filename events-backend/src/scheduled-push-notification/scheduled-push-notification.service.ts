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
import { PushNotificationGateway } from './push-notification.gateway';
import { FirebaseUtil } from '../utils/firebase.util';
import {
  ScheduledPushNotificationDelivery,
  DeliveryStatus,
} from './scheduled-push-notification-delivery.entity';
import { FilterService } from '../service/filter.service';

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
    private readonly pushNotificationGateway: PushNotificationGateway,
    private readonly filterService: FilterService,
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
    filters?: FilterScheduledPushNotificationDto & {
      keyword?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{
    data: ScheduledPushNotificationResponseDto[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      // Check if pagination parameters are provided
      const hasPagination = filters?.page !== undefined || filters?.limit !== undefined;
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder || 'DESC';

      const queryBuilder =
        this.scheduledNotificationRepository.createQueryBuilder('notification')
          .leftJoinAndSelect('notification.event', 'event');

      // Track if WHERE clause has been set
      let whereClauseSet = false;

      // Filter by keyword if provided - search in message and event name
      if (filters?.keyword && filters.keyword.trim() !== '') {
        const keyword = filters.keyword.toLowerCase().trim();
        queryBuilder.where(
          '(LOWER(notification.message) LIKE :keyword OR LOWER(event.name) LIKE :keyword)',
          { keyword: `%${keyword}%` },
        );
        whereClauseSet = true;
      } else if (filters?.search && filters.search.trim() !== '') {
        // Backward compatibility: also check for 'search' parameter
        const search = filters.search.toLowerCase().trim();
        queryBuilder.where('LOWER(notification.message) LIKE :search', {
          search: `%${search}%`,
        });
        whereClauseSet = true;
      }

      if (filters?.status) {
        if (whereClauseSet) {
          queryBuilder.andWhere('notification.status = :status', {
            status: filters.status,
          });
        } else {
          queryBuilder.where('notification.status = :status', {
            status: filters.status,
          });
          whereClauseSet = true;
        }
      }

      if (filters?.eventId) {
        if (whereClauseSet) {
          queryBuilder.andWhere('notification.eventId = :eventId', {
            eventId: filters.eventId,
          });
        } else {
          queryBuilder.where('notification.eventId = :eventId', {
            eventId: filters.eventId,
          });
          whereClauseSet = true;
        }
      }

      if (filters?.sendToAllUsers !== undefined) {
        if (whereClauseSet) {
          queryBuilder.andWhere('notification.sendToAllUsers = :sendToAllUsers', {
            sendToAllUsers: filters.sendToAllUsers,
          });
        } else {
          queryBuilder.where('notification.sendToAllUsers = :sendToAllUsers', {
            sendToAllUsers: filters.sendToAllUsers,
          });
          whereClauseSet = true;
        }
      }

      // Apply sorting
      if (sortBy === 'message') {
        queryBuilder.orderBy('notification.message', sortOrder);
      } else if (sortBy === 'status') {
        queryBuilder.orderBy('notification.status', sortOrder);
      } else if (sortBy === 'scheduledAt') {
        queryBuilder.orderBy('notification.scheduledAt', sortOrder);
      } else if (sortBy === 'eventName' || sortBy === 'event.name') {
        queryBuilder.orderBy('event.name', sortOrder);
      } else if (sortBy === 'createdAt') {
        queryBuilder.orderBy('notification.createdAt', sortOrder);
      } else if (sortBy === 'updatedAt') {
        queryBuilder.orderBy('notification.updatedAt', sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('notification.createdAt', sortOrder);
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination only if pagination parameters are provided
      let notifications: ScheduledPushNotification[];
      if (hasPagination) {
        const skip = (page - 1) * limit;
        notifications = await queryBuilder.skip(skip).take(limit).getMany();
      } else {
        notifications = await queryBuilder.getMany();
      }

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

      if (hasPagination) {
        return {
          data: result,
          pagination: this.filterService.calculatePaginationMetadata(total, page, limit),
        };
      } else {
        return {
          data: result,
        };
      }
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

      const deliveries = await this.deliveryRepository.find({
        where: { notificationId: notification.id },
        select: ['userId'],
      });

      await this.deliveryRepository.delete({ notificationId: notification.id });
      await this.scheduledNotificationRepository.remove(notification);

      const affectedUserIds = [
        ...new Set(
          deliveries
            .map((delivery) => delivery.userId)
            .filter((userId): userId is string => !!userId),
        ),
      ];

      affectedUserIds.forEach((userId) =>
        this.pushNotificationGateway.emitNotificationDeleted(userId, id),
      );
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
          let pushSuccess = false;
          let pushFailed = false;
          let userErrorMessage: string | undefined;
          let hasDeviceTokens = false;

          try {
            const deviceTokens = await this.pushNotificationRepository.find({
              where: { userId, isActive: true },
            });

            hasDeviceTokens = deviceTokens.length > 0;

            if (hasDeviceTokens) {
              const seenTokens = new Set<string>();
              for (const deviceToken of deviceTokens) {
                const token = deviceToken.deviceToken?.trim();
                if (!token || seenTokens.has(token)) continue;
                seenTokens.add(token);
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
                  pushSuccess = true;
                } catch (error) {
                  this.logger.error(
                    `Failed to send push notification to device ${deviceToken.id}:`,
                    error,
                  );
                  failedCount++;
                  pushFailed = true;
                  userErrorMessage =
                    error instanceof Error ? error.message : String(error);
                }
              }
            }
          } catch (error) {
            this.logger.error(`Failed to send notification to user ${userId}:`, error);
            failedCount++;
            pushFailed = true;
            if (!userErrorMessage) {
              userErrorMessage =
                error instanceof Error ? error.message : String(error);
            }
          }

          // Always try to send via socket (delivery channel)
          let socketDelivered = false;
          if (deliveryRecord) {
            try {
              this.emitSocketNotification(
                userId,
                notification,
                deliveryRecord,
                pushSuccess ? DeliveryStatus.SENT : DeliveryStatus.PENDING,
              );
              // Check if user is online (socket delivery will work)
              const isUserOnline = this.pushNotificationGateway.checkUserOnline(userId);
              if (isUserOnline) {
                socketDelivered = true;
                // Only increment if push didn't succeed (avoid double counting)
                if (!pushSuccess) {
                  sentCount++;
                }
              }
            } catch (error) {
              this.logger.error(
                `Failed to send socket notification to user ${userId}:`,
                error,
              );
            }
          }

          // Determine final delivery status
          if (deliveryRecord) {
            if (pushSuccess || socketDelivered) {
              // Success if push worked OR socket delivery worked
              deliveryRecord.status = DeliveryStatus.SENT;
              deliveryRecord.deliveredAt = new Date();
              deliveryRecord.failedAt = undefined;
              deliveryRecord.errorMessage = undefined;
            } else if (!hasDeviceTokens && !socketDelivered) {
              // No device tokens and user not online - keep as PENDING (not failed)
              // They might come online later and receive it
              deliveryRecord.status = DeliveryStatus.PENDING;
              deliveryRecord.deliveredAt = undefined;
              deliveryRecord.failedAt = undefined;
              deliveryRecord.errorMessage = undefined;
            } else if (pushFailed && !socketDelivered) {
              // Push failed with actual error and socket didn't work - mark as FAILED
              deliveryRecord.status = DeliveryStatus.FAILED;
              deliveryRecord.failedAt = new Date();
              deliveryRecord.errorMessage = userErrorMessage || 'Failed to deliver notification';
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
    // First, update PENDING deliveries to SENT when user fetches notifications
    // This handles the case where user wasn't connected via socket but now sees the notification
    // Do this BEFORE applying filters, so we update all PENDING for this user
    const pendingDeliveriesToUpdate = await this.deliveryRepository.find({
      where: {
        userId,
        status: DeliveryStatus.PENDING,
      },
    });

    if (pendingDeliveriesToUpdate.length > 0) {
      const now = new Date();
      pendingDeliveriesToUpdate.forEach((delivery) => {
        delivery.status = DeliveryStatus.SENT;
        delivery.deliveredAt = now;
        delivery.failedAt = undefined;
        delivery.errorMessage = undefined;
      });

      // Bulk update PENDING to SENT
      await this.deliveryRepository.save(pendingDeliveriesToUpdate);

      this.logger.debug(
        `Marked ${pendingDeliveriesToUpdate.length} PENDING deliveries as SENT for user ${userId} (fetched via API)`,
      );
    }

    // Now fetch deliveries with filters applied
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

    const response = deliveries.map((delivery) => ({
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

    if (userId) {
      this.pushNotificationGateway.emitNotificationList(userId, response);
    }

    return response;
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

    if (userId) {
      this.pushNotificationGateway.emitNotificationRead(userId, delivery.id);
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

    this.pushNotificationGateway.emitAllNotificationsRead(userId);
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

  private emitSocketNotification(
    userId: string,
    notification: ScheduledPushNotification,
    delivery?: ScheduledPushNotificationDelivery,
    status?: DeliveryStatus,
  ): void {
    if (!this.pushNotificationGateway) {
      return;
    }

    const socketPayload = {
      type: 'scheduled_push',
      notificationId: notification.id,
      deliveryId: delivery?.id,
      message: notification.message,
      eventId: notification.eventId,
      redirectType: notification.redirectType,
      redirectUrl: notification.redirectUrl,
      appPageRoute:
        notification.appPageRoute && notification.eventId
          ? notification.appPageRoute.replace(':eventId', notification.eventId)
          : notification.appPageRoute,
      scheduledAt: notification.scheduledAt,
      sentAt: notification.sentAt ?? new Date(),
      status: status ?? NotificationStatus.SCHEDULED,
      timestamp: new Date(),
    };

    this.pushNotificationGateway.sendScheduledNotification(userId, socketPayload);
  }

  /**
   * Cleanup old delivery records to reduce database size
   * @param readRetentionDays - Days to keep read notifications (default: 30)
   * @param unreadRetentionDays - Days to keep unread notifications (default: 90)
   * @returns Number of deleted records
   */
  async cleanupOldDeliveryRecords(
    readRetentionDays: number = 30,
    unreadRetentionDays: number = 90,
  ): Promise<{
    readDeleted: number;
    unreadDeleted: number;
    totalDeleted: number;
  }> {
    try {
      const now = new Date();
      
      // Calculate cutoff dates
      const readCutoffDate = new Date(now);
      readCutoffDate.setDate(readCutoffDate.getDate() - readRetentionDays);
      
      const unreadCutoffDate = new Date(now);
      unreadCutoffDate.setDate(unreadCutoffDate.getDate() - unreadRetentionDays);

      // Delete old READ notifications
      const readResult = await this.deliveryRepository
        .createQueryBuilder()
        .delete()
        .where('isRead = :isRead', { isRead: true })
        .andWhere('readAt < :cutoffDate', { cutoffDate: readCutoffDate })
        .execute();

      const readDeleted = readResult.affected || 0;

      // Delete old UNREAD notifications (keep them longer)
      const unreadResult = await this.deliveryRepository
        .createQueryBuilder()
        .delete()
        .where('isRead = :isRead', { isRead: false })
        .andWhere('createdAt < :cutoffDate', { cutoffDate: unreadCutoffDate })
        .execute();

      const unreadDeleted = unreadResult.affected || 0;

      const totalDeleted = readDeleted + unreadDeleted;

      this.logger.log(
        `Cleanup completed: ${readDeleted} read + ${unreadDeleted} unread = ${totalDeleted} total delivery records deleted`,
      );

      return {
        readDeleted,
        unreadDeleted,
        totalDeleted,
      };
    } catch (error) {
      this.logger.error('Error cleaning up old delivery records:', error);
      throw error;
    }
  }

  /**
   * Cleanup old delivery records using environment variables for retention
   * Reads from: PUSH_NOTIFICATION_READ_RETENTION_DAYS (default: 30)
   *            PUSH_NOTIFICATION_UNREAD_RETENTION_DAYS (default: 90)
   */
  async cleanupOldDeliveryRecordsWithEnv(): Promise<{
    readDeleted: number;
    unreadDeleted: number;
    totalDeleted: number;
  }> {
    const readRetention = parseInt(
      process.env.PUSH_NOTIFICATION_READ_RETENTION_DAYS || '30',
      10,
    );
    const unreadRetention = parseInt(
      process.env.PUSH_NOTIFICATION_UNREAD_RETENTION_DAYS || '90',
      10,
    );

    return this.cleanupOldDeliveryRecords(readRetention, unreadRetention);
  }

  /**
   * Cron job to automatically clean up old delivery records daily at 2 AM
   * Runs every day at 2:00 AM (cron: '0 2 * * *')
   */
  @Cron('0 2 * * *')
  async scheduledCleanupOldDeliveryRecords() {
    try {
      this.logger.log('Starting scheduled cleanup of old delivery records...');
      const result = await this.cleanupOldDeliveryRecordsWithEnv();
      this.logger.log(
        `Scheduled cleanup completed: ${result.totalDeleted} records deleted (${result.readDeleted} read, ${result.unreadDeleted} unread)`,
      );
    } catch (error) {
      this.logger.error('Error in scheduled cleanup of delivery records:', error);
    }
  }
}

