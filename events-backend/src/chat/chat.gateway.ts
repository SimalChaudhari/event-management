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
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MarkReadDto, UpdateLastSeenDto } from './chat.dto';
import { MessageType } from './chat.entity';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, string>(); // socketId -> userId
  private typingUsers = new Map<string, NodeJS.Timeout>(); // threadID:userId -> timeout
  private typingStatus = new Map<string, boolean>(); // threadID:userId -> isTyping
  private userLastSeen = new Map<string, Date>(); // userId -> last seen timestamp

  constructor(
    private readonly jwt: JwtService,
    private readonly chatService: ChatService
  ) {}

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

      // Update last seen to now (user is online)
      this.userLastSeen.set(userId, new Date());

      // Broadcast user online status with last seen
      this.server.emit('user_online', { 
        userId,
        lastSeen: new Date(),
        isOnline: true 
      });
      
      // Send list of online users to new user
      const onlineUsers = Array.from(this.connectedUsers.keys());
      client.emit('online_users', onlineUsers);

    } catch (error) {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.userSockets.get(client.id);
    if (userId) {
      // Clear any typing status for this user
      for (const [typingKey, timeout] of this.typingUsers.entries()) {
        if (typingKey.endsWith(`:${userId}`)) {
          clearTimeout(timeout);
          this.typingUsers.delete(typingKey);
          
          const threadID = typingKey.split(':')[0];
          this.stopTyping(threadID, userId);
        }
      }
      
      this.connectedUsers.delete(userId);
      this.userSockets.delete(client.id);
      
      // Update last seen timestamp when user goes offline
      const lastSeenTime = new Date();
      this.userLastSeen.set(userId, lastSeenTime);
      
      // Broadcast offline status with last seen
      this.server.emit('user_offline', { 
        userId,
        lastSeen: lastSeenTime,
        isOnline: false
      });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverID: string; msg: string; reply?: string; msgType?: string; msgJson?: any }) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      const message = await this.chatService.sendMessage(userId, data.receiverID, {
        msg: data.msg,
        reply: data.reply,
        msgType: data.msgType as MessageType,
        msgJson: data.msgJson
      });

      // Auto-join sender to thread room if not already joined
      await client.join(`thread:${message.threadID}`);

      // Stop typing indicator when message is sent (WhatsApp behavior)
      this.stopTyping(message.threadID, userId);

      // Send to receiver
      this.server.to(`user:${message.receiverID}`).emit('new_message', message);

      // Send delivery confirmation immediately if receiver is online
      const receiverSocketId = this.connectedUsers.get(message.receiverID);
      if (receiverSocketId) {
        // Message delivered - notify sender
        this.server.to(`user:${message.senderID}`).emit('message_delivered', {
          threadID: message.threadID,
          msgID: message.msgID,
          deliveredTo: message.receiverID,
          timestamp: new Date()
        });
      }

      // Send confirmation to sender with full message data
      client.emit('message_sent', {
        ...message,
        success: true,
        msg: data.msg // Include original message for matching
      });

    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(@ConnectedSocket() client: Socket, @MessageBody() data: MarkReadDto) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      const result = await this.chatService.markAsRead(userId, data);

      // Notify ALL users in the thread about read receipt (especially sender)
      this.server.to(`thread:${data.threadID}`).emit('message_read', {
        threadID: data.threadID,
        readBy: userId,
        timestamp: new Date(),
        messagesRead: result.messagesRead
      });

      // Also notify sender's user room directly
      const participants = await this.chatService.getThreadParticipants(data.threadID);
      participants.forEach(participant => {
        if (participant.userID !== userId) {
          this.server.to(`user:${participant.userID}`).emit('message_read', {
            threadID: data.threadID,
            readBy: userId,
            timestamp: new Date(),
            messagesRead: result.messagesRead
          });
        }
      });

      client.emit('read_success', result);

    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('update_last_seen')
  async handleLastSeen(@ConnectedSocket() client: Socket, @MessageBody() data: UpdateLastSeenDto) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      const result = await this.chatService.updateLastSeen(userId, data);

      // Notify thread participants
      this.server.to(`thread:${data.threadID}`).emit('user_seen', {
        threadID: data.threadID,
        userId,
        lastSeen: result.lastSeen
      });

    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('join_thread')
  async handleJoinThread(@ConnectedSocket() client: Socket, @MessageBody() data: { threadID: string }) {
    await client.join(`thread:${data.threadID}`);
    client.emit('thread_joined', { threadID: data.threadID });
  }

  @SubscribeMessage('user_entered_chat')
  async handleUserEnteredChat(@ConnectedSocket() client: Socket, @MessageBody() data: { threadID: string; userId: string }) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      // Auto-join user to thread room when entering chat
      await client.join(`thread:${data.threadID}`);

      // Auto-mark unread messages as read when user actually sees the chat
      const result = await this.chatService.markAsRead(userId, { threadID: data.threadID });

      // Only emit read receipt if there were messages to mark as read
      if (result.messagesRead && result.messagesRead > 0) {
        // Notify sender about messages being read (with blue double ticks)
        this.server.to(`thread:${data.threadID}`).emit('message_read', {
          threadID: data.threadID,
          readBy: userId,
          timestamp: new Date(),
          messagesRead: result.messagesRead,
          userSawChat: true
        });
      }

    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { threadID: string; isTyping: boolean }) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) {
        return;
      }

      const typingKey = `${data.threadID}:${userId}`;
      
      // Auto-join user to thread if not already joined
      await client.join(`thread:${data.threadID}`);

      // Only handle typing=true events, ignore typing=false (let timeout handle it)
      if (data.isTyping) {
        // User is actively typing
        const isCurrentlyTyping = this.typingStatus.get(typingKey);
        
        if (!isCurrentlyTyping) {
          this.typingStatus.set(typingKey, true);
          
          // EMIT 1: Broadcast typing STARTED to ALL OTHER users in thread
          client.to(`thread:${data.threadID}`).emit('typing_start', {
            threadID: data.threadID,
            userId,
            isTyping: true,
            timestamp: new Date().toISOString()
          });
        }

        // Clear existing timeout and set new one (restart the 2-second timer)
        const existingTimeout = this.typingUsers.get(typingKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Auto-stop typing after 1 seconds of inactivity
        const timeout = setTimeout(() => {
          this.stopTyping(data.threadID, userId);
        }, 1000);
        
        this.typingUsers.set(typingKey, timeout);
      }
      // Ignore isTyping: false events - let the timeout handle stopping

    } catch (error) {
      client.emit('error', { message: 'Typing event failed' });
    }
  }

  private stopTyping(threadID: string, userId: string) {
    const typingKey = `${threadID}:${userId}`;
    
    // Clear timeout
    const timeout = this.typingUsers.get(typingKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingUsers.delete(typingKey);
    }

    // Check if user was actually typing
    const wasTyping = this.typingStatus.get(typingKey);
    if (wasTyping) {
      this.typingStatus.delete(typingKey);
      
      // EMIT 2: Broadcast typing STOPPED to ALL users in thread (after 2 seconds)
      this.server.to(`thread:${threadID}`).emit('typing_stop', {
        threadID,
        userId,
        isTyping: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get user's last seen status
  @SubscribeMessage('get_user_status')
  async getUserStatus(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    const isOnline = this.isUserOnline(data.userId);
    const lastSeen = this.userLastSeen.get(data.userId) || new Date();
    
    client.emit('user_status', {
      userId: data.userId,
      isOnline,
      lastSeen,
      timestamp: new Date()
    });
  }

}