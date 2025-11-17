import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AppGateway } from '../app.gateway';
import { UserPushNotificationResponseDto } from './scheduled-push-notification.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    // methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/push-notifications',
  transports: ['websocket'],
  allowEIO3: true,
})
@Injectable()
export class PushNotificationGateway
  extends AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly pushLogger = new Logger(PushNotificationGateway.name);

  constructor(protected readonly jwtService: JwtService) {
    super(jwtService);
  }

  async handleConnection(client: Socket): Promise<void> {
    const userId = await this.establishConnection(client);
    if (userId) {
      this.pushLogger.debug(
        `User ${userId} connected to /push-notifications namespace`,
      );
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = await this.releaseConnection(client);
    if (userId) {
      this.pushLogger.debug(
        `User ${userId} disconnected from /push-notifications namespace`,
      );
    }
  }

  sendScheduledNotification(userId: string, payload: Record<string, any>) {
    this.server.to(`user:${userId}`).emit('scheduled_push_notification:send', {
      userId,
      ...payload,
      timestamp: new Date(),
    });
  }

  sendScheduledNotifications(userIds: string[], payload: Record<string, any>) {
    userIds.forEach((userId) =>
      this.sendScheduledNotification(userId, payload),
    );
  }

  emitNotificationList(
    userId: string,
    notifications: UserPushNotificationResponseDto[],
  ) {
    this.server.to(`user:${userId}`).emit('scheduled_push_notification:list', {
      userId,
      notifications,
      timestamp: new Date(),
    });
  }

  emitNotificationRead(userId: string, deliveryId: string) {
    this.server.to(`user:${userId}`).emit('scheduled_push_notification:read', {
      userId,
      deliveryId,
      timestamp: new Date(),
    });
  }

  emitAllNotificationsRead(userId: string) {
    this.server
      .to(`user:${userId}`)
      .emit('scheduled_push_notification:read_all', {
        userId,
        timestamp: new Date(),
      });
  }

  emitNotificationDeleted(userId: string, notificationId: string) {
    this.server
      .to(`user:${userId}`)
      .emit('scheduled_push_notification:delete', {
        userId,
        notificationId,
        timestamp: new Date(),
      });
  }

  checkUserOnline(userId: string): boolean {
    // Access protected method from parent class
    return this.isUserOnline(userId);
  }
}
