import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventNotificationType } from '../types/notification.types';
import { NotificationTextUtil } from '../utils/notification-text.util';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications'
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, string>(); // socketId -> userId

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect(true);
        return;
      }

      const decoded: any = this.jwt.verify(token.replace(/^Bearer\s+/i, ''), {
        secret: process.env.JWT_SECRET
      });

      if (!decoded?.sub) {
        client.disconnect(true);
        return;
      }

      const userId = decoded.sub;
      this.connectedUsers.set(userId, client.id);
      this.userSockets.set(client.id, userId);

      await client.join(`user:${userId}`);
      
      client.emit('connected', { userId, timestamp: new Date() });

  
    } catch (error) {
      console.error('❌ Notification gateway connection error:', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.userSockets.get(client.id);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(client.id);

    }
  }

  // Send notification to specific user
  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Send notification to multiple users
  sendToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.server.to(`user:${userId}`).emit('notification', notification);
    });
  }

  // Send event notification to all registered users of an event
  sendEventNotification(eventId: string, notification: any) {
    this.server.to(`event:${eventId}`).emit('event_notification', {
      eventId,
      ...notification
    });
  }

  // Send advert notification to specific user
  sendAdvertNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('advert_notification', {
      type: 'advert',
      ...notification
    });
  }

  // Send advert notification to multiple users
  sendAdvertNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.server.to(`user:${userId}`).emit('advert_notification', {
        type: 'advert',
        ...notification
      });
    });
  }

  // Join user to event room for event-specific notifications
  @SubscribeMessage('join_event')
  async handleJoinEvent(@ConnectedSocket() client: Socket, @MessageBody() data: { eventId: string }) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      await client.join(`event:${data.eventId}`);
      client.emit('event_joined', { eventId: data.eventId });
      
     
    } catch (error) {
      client.emit('error', { message: 'Failed to join event notifications' });
    }
  }

  // Leave event room
  @SubscribeMessage('leave_event')
  async handleLeaveEvent(@ConnectedSocket() client: Socket, @MessageBody() data: { eventId: string }) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      await client.leave(`event:${data.eventId}`);
      client.emit('event_left', { eventId: data.eventId });
      
    
    } catch (error) {
      client.emit('error', { message: 'Failed to leave event notifications' });
    }
  }

  // Mark notification as read
  @SubscribeMessage('mark_notification_read')
  async handleMarkNotificationRead(@ConnectedSocket() client: Socket, @MessageBody() data: { notificationId: string }) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      // Emit to user that notification was marked as read
      client.emit('notification_read', { 
        notificationId: data.notificationId,
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  // Get user's notification preferences
  @SubscribeMessage('get_notification_preferences')
  async handleGetNotificationPreferences(@ConnectedSocket() client: Socket) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      // This would typically fetch from database
      client.emit('notification_preferences', {
        eventUpdates: true,
        eventReminders: true,
        eventMaterials: true,
        eventCancellations: true,
        generalNotifications: true
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to get notification preferences' });
    }
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get all connected user IDs
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Send meeting request notification
  sendMeetingRequestNotification(userId: string, meetingData: any) {
    this.server.to(`user:${userId}`).emit('meeting_request', {
      type: EventNotificationType.MEETING_REQUEST,
      title: 'New Meeting Request',
      message: NotificationTextUtil.getSocketMeetingRequestMessage(meetingData.title),
      meetingId: meetingData.id,
      eventId: meetingData.eventId,
      from: meetingData.createdBy,
      meetingDate: meetingData.meetingDate,
      time: meetingData.time,
      location: meetingData.location,
      timestamp: new Date()
    });
  }

  // Send meeting response notification (accepted/rejected)
  sendMeetingResponseNotification(userId: string, responseData: any) {
    const isAccepted = responseData.response === 'accepted';
    this.server.to(`user:${userId}`).emit('meeting_response', {
      type: EventNotificationType.MEETING_RESPONSE,
      title: `Meeting Request ${isAccepted ? 'Accepted' : 'Rejected'}`,
      message: NotificationTextUtil.getSocketMeetingResponseMessage(responseData.meetingTitle, isAccepted),
      meetingId: responseData.meetingId,
      eventId: responseData.eventId,
      response: responseData.response,
      from: responseData.responderId,
      responseMessage: responseData.message,
      timestamp: new Date()
    });
  }

  // Send meeting reschedule notification
  sendMeetingRescheduleNotification(userId: string, rescheduleData: any) {
    this.server.to(`user:${userId}`).emit('meeting_reschedule', {
      type: EventNotificationType.MEETING_RESCHEDULE,
      title: 'Meeting Rescheduled',
      message: NotificationTextUtil.getSocketMeetingRescheduleMessage(rescheduleData.meetingTitle),
      meetingId: rescheduleData.meetingId,
      eventId: rescheduleData.eventId,
      from: rescheduleData.reschedulerId,
      originalDate: rescheduleData.originalDate,
      originalTime: rescheduleData.originalTime,
      newDate: rescheduleData.newDate,
      newTime: rescheduleData.newTime,
      newLocation: rescheduleData.newLocation,
      reason: rescheduleData.reason,
      timestamp: new Date()
    });
  }

  // Send meeting cancellation notification
  sendMeetingCancellationNotification(userId: string, cancellationData: any) {
    this.server.to(`user:${userId}`).emit('meeting_cancellation', {
      type: EventNotificationType.MEETING_CANCELLATION,
      title: 'Meeting Cancelled',
      message: NotificationTextUtil.getSocketMeetingCancellationMessage(cancellationData.meetingTitle),
      meetingId: cancellationData.meetingId,
      eventId: cancellationData.eventId,
      from: cancellationData.cancellerId,
      originalDate: cancellationData.originalDate,
      originalTime: cancellationData.originalTime,
      timestamp: new Date()
    });
  }

  // Send meeting reminder notification
  sendMeetingReminderNotification(userId: string, reminderData: any) {
    this.server.to(`user:${userId}`).emit('meeting_reminder', {
      type: EventNotificationType.MEETING_REMINDER,
      title: 'Meeting Reminder',
      message: NotificationTextUtil.getSocketMeetingReminderMessage(reminderData.meetingTitle),
      meetingId: reminderData.meetingId,
      eventId: reminderData.eventId,
      meetingDate: reminderData.meetingDate,
      time: reminderData.time,
      location: reminderData.location,
      minutesUntil: reminderData.minutesUntil,
      timestamp: new Date()
    });
  }

  // Send general meeting notification
  sendMeetingNotification(userId: string, notificationData: any) {
    this.server.to(`user:${userId}`).emit('meeting_notification', {
      ...notificationData,
      timestamp: new Date()
    });
  }

}
