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
  cors: { 
    origin: '*',
    // methods: ['GET', 'POST'],
    credentials: true
  },
  namespace: '/qna',
  transports: ['websocket', 'polling'],
  allowEIO3: true
})
@Injectable()
export class EngagementQnaGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server!: Server;

  private connectedClients = new Map<string, string>(); // socketId -> shareToken
  private shareTokenRooms = new Map<string, Set<string>>(); // shareToken -> Set of socketIds
  private engagementRooms = new Map<string, Set<string>>(); // engagementId -> Set of socketIds
  private sessionRooms = new Map<string, Set<string>>(); // sessionId -> Set of socketIds

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

  @SubscribeMessage('join_engagement')
  handleJoinEngagement(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engagementId: string }
  ) {
    try {
      if (!data?.engagementId) {
        client.emit('error', { message: 'Engagement ID is required' });
        return;
      }

      const engagementId = data.engagementId;
      
      // Join room for this engagement
      client.join(`engagement:${engagementId}`);
      
      // Track this client
      if (!this.engagementRooms.has(engagementId)) {
        this.engagementRooms.set(engagementId, new Set());
      }
      this.engagementRooms.get(engagementId)!.add(client.id);

      client.emit('joined_engagement', { 
        engagementId,
        message: 'Successfully joined engagement Q&A updates room'
      });
    } catch (error) {
      console.error('Error joining engagement room:', error);
      client.emit('error', { message: 'Failed to join engagement room' });
    }
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      if (!data?.sessionId) {
        client.emit('error', { message: 'Session ID is required' });
        return;
      }

      const sessionId = data.sessionId;
      
      // Join room for this session
      client.join(`session:${sessionId}`);
      
      // Track this client
      if (!this.sessionRooms.has(sessionId)) {
        this.sessionRooms.set(sessionId, new Set());
      }
      this.sessionRooms.get(sessionId)!.add(client.id);

      client.emit('joined_session', { 
        sessionId,
        message: 'Successfully joined session Q&A updates room'
      });
    } catch (error) {
      console.error('Error joining session room:', error);
      client.emit('error', { message: 'Failed to join session room' });
    }
  }

  @SubscribeMessage('leave_engagement')
  handleLeaveEngagement(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engagementId: string }
  ) {
    try {
      if (data?.engagementId) {
        client.leave(`engagement:${data.engagementId}`);
        
        const room = this.engagementRooms.get(data.engagementId);
        if (room) {
          room.delete(client.id);
          if (room.size === 0) {
            this.engagementRooms.delete(data.engagementId);
          }
        }
      }
      
      client.emit('left_engagement', { message: 'Left engagement Q&A updates room' });
    } catch (error) {
      console.error('Error leaving engagement room:', error);
    }
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      if (data?.sessionId) {
        client.leave(`session:${data.sessionId}`);
        
        const room = this.sessionRooms.get(data.sessionId);
        if (room) {
          room.delete(client.id);
          if (room.size === 0) {
            this.sessionRooms.delete(data.sessionId);
          }
        }
      }
      
      client.emit('left_session', { message: 'Left session Q&A updates room' });
    } catch (error) {
      console.error('Error leaving session room:', error);
    }
  }

  @SubscribeMessage('modal_state_change')
  handleModalStateChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shareToken: string; modalType: string; action: string; questionData?: any }
  ) {
    try {
      if (!data?.shareToken || !data?.modalType || !data?.action) {
        client.emit('error', { message: 'Share token, modal type, and action are required' });
        return;
      }

      // Broadcast to all clients in the share token room (except the sender)
      this.server.to(`share:${data.shareToken}`).emit('modal_state_change', {
        modalType: data.modalType,
        action: data.action,
        questionData: data.questionData || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling modal state change:', error);
      client.emit('error', { message: 'Failed to broadcast modal state change' });
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

  // Method to emit question update to engagement room (for mobile app)
  emitQuestionUpdateToEngagement(engagementId: string, eventType: string, data: any) {
    this.server.to(`engagement:${engagementId}`).emit('question_update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Method to emit question update to session room (for mobile app)
  emitQuestionUpdateToSession(sessionId: string, eventType: string, data: any) {
    this.server.to(`session:${sessionId}`).emit('question_update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Method to emit session update to engagement room (for mobile app)
  emitSessionUpdateToEngagement(engagementId: string, eventType: string, data: any) {
    this.server.to(`engagement:${engagementId}`).emit('session_update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Method to emit session update to session room (for mobile app)
  emitSessionUpdateToSession(sessionId: string, eventType: string, data: any) {
    this.server.to(`session:${sessionId}`).emit('session_update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

