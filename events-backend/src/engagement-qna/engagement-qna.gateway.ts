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
import { EngagementQnaService } from './engagement-qna.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/qna'
})
@Injectable()
export class EngagementQnaGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server!: Server;

  private connectedClients = new Map<string, string>(); // socketId -> shareToken
  private shareTokenRooms = new Map<string, Set<string>>(); // shareToken -> Set of socketIds

  constructor(private readonly engagementQnaService: EngagementQnaService) {}

  onModuleInit() {
    // Set gateway reference in service
    this.engagementQnaService.setGateway(this);
  }

  async handleConnection(client: Socket) {
    try {
      // For Q&A share links, we don't require authentication
      // Clients will join rooms based on shareToken
      client.emit('connected', { 
        message: 'Connected to Q&A updates',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in Q&A gateway connection:', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const shareToken = this.connectedClients.get(client.id);
    if (shareToken) {
      const room = this.shareTokenRooms.get(shareToken);
      if (room) {
        room.delete(client.id);
        if (room.size === 0) {
          this.shareTokenRooms.delete(shareToken);
        }
      }
      this.connectedClients.delete(client.id);
    }
  }

  @SubscribeMessage('join_share_token')
  handleJoinShareToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shareToken: string }
  ) {
    try {
      if (!data?.shareToken) {
        client.emit('error', { message: 'Share token is required' });
        return;
      }

      const shareToken = data.shareToken;
      
      // Join room for this share token
      client.join(`share:${shareToken}`);
      
      // Track this client
      this.connectedClients.set(client.id, shareToken);
      
      // Add to shareToken rooms map
      if (!this.shareTokenRooms.has(shareToken)) {
        this.shareTokenRooms.set(shareToken, new Set());
      }
      this.shareTokenRooms.get(shareToken)!.add(client.id);

      client.emit('joined', { 
        shareToken,
        message: 'Successfully joined Q&A updates room'
      });
    } catch (error) {
      console.error('Error joining share token room:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave_share_token')
  handleLeaveShareToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shareToken: string }
  ) {
    try {
      if (data?.shareToken) {
        client.leave(`share:${data.shareToken}`);
        
        const room = this.shareTokenRooms.get(data.shareToken);
        if (room) {
          room.delete(client.id);
          if (room.size === 0) {
            this.shareTokenRooms.delete(data.shareToken);
          }
        }
      }
      
      this.connectedClients.delete(client.id);
      client.emit('left', { message: 'Left Q&A updates room' });
    } catch (error) {
      console.error('Error leaving share token room:', error);
    }
  }

  // Method to emit question update to all clients in a share token room
  emitQuestionUpdate(shareToken: string, eventType: string, data: any) {
    this.server.to(`share:${shareToken}`).emit('question_update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Method to emit session update to all clients in a share token room
  emitSessionUpdate(shareToken: string, eventType: string, data: any) {
    this.server.to(`share:${shareToken}`).emit('session_update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

