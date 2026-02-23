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
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/registration-share',
})
@Injectable()
export class AttendanceGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly attendanceService: AttendanceService) {}

  onModuleInit() {
    this.attendanceService.setAttendanceGateway(this);
  }

  async handleConnection(client: Socket) {
    try {
      client.emit('connected', {
        message: 'Connected to registration list updates',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // Room membership is cleared automatically by Socket.IO
  }

  @SubscribeMessage('join_event')
  handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string },
  ) {
    try {
      if (!data?.eventId) {
        client.emit('error', { message: 'eventId is required' });
        return;
      }
      const room = `registration_list:${data.eventId}`;
      client.join(room);
      client.emit('joined_event', {
        eventId: data.eventId,
        message: 'Joined registration list updates for this event',
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to join event room' });
    }
  }

  @SubscribeMessage('leave_event')
  handleLeaveEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string },
  ) {
    if (data?.eventId) {
      client.leave(`registration_list:${data.eventId}`);
    }
    client.emit('left_event', { message: 'Left event room' });
  }

  /**
   * Emit attendance update to all clients watching this event's registration list.
   * Payload allows real-time state update without API refetch (like Q&A share link).
   */
  emitAttendanceUpdate(
    eventId: string,
    payload?: {
      userId: string;
      attendanceStatus: 'Attended' | 'Not Attended';
      checkInTime?: string;
      checkInMethod?: string;
    },
  ): void {
    this.server.to(`registration_list:${eventId}`).emit('attendance_updated', {
      eventId,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }

  /**
   * Emit participants list update (e.g. new registration). Share page should refetch list.
   * Call this from RegisterEventService when a new user registers.
   */
  emitParticipantsUpdate(eventId: string): void {
    this.server.to(`registration_list:${eventId}`).emit('participants_updated', {
      eventId,
      timestamp: new Date().toISOString(),
    });
  }
}
