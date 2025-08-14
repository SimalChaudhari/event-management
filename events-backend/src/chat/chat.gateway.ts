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
import { MarkReadDto, DeleteMessageDto, DeleteAllMessagesDto, EditMessageDto } from './chat.dto';
import { MessageType } from './chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatParticipant } from './chat.entity';

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


  constructor(
    private readonly jwt: JwtService,
    private readonly chatService: ChatService,
    @InjectRepository(ChatParticipant) private participantRepo: Repository<ChatParticipant>
  ) {
    // Set gateway reference in service for online status checking
    this.chatService.setGateway(this);
  }

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
      
      // Update lastSeen for all threads where this user is a participant
      await this.participantRepo.update(
        { userID: userId },
        { lastSeen: new Date() }
      );
      
      client.emit('connected', { userId, timestamp: new Date() });

      // Broadcast user online status
      this.server.emit('user_online', { 
        userId,
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
      // Update lastSeen for all threads where this user is a participant
      await this.participantRepo.update(
        { userID: userId },
        { lastSeen: new Date() }
      );
      
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
      
      // Broadcast offline status
      this.server.emit('user_offline', { 
        userId,
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

  // Get all connected user IDs
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Get user's status (only online/offline)
  @SubscribeMessage('get_user_status')
  async getUserStatus(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    try {
      const isOnline = this.isUserOnline(data.userId);
      
      client.emit('user_status', {
        userId: data.userId,
        isOnline,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to get user status for ${data.userId}:`, error);
      
      const isOnline = this.isUserOnline(data.userId);
      
      client.emit('user_status', {
        userId: data.userId,
        isOnline,
        timestamp: new Date(),
        error: 'Status fetch failed'
      });
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(@ConnectedSocket() client: Socket, @MessageBody() data: DeleteMessageDto) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      const result = await this.chatService.deleteMessage(userId, data);

      // Notify users based on delete type
      if (result.deleteType === 'both') {
        // Own message deleted - notify both users
        this.server.to(`thread:${data.threadID}`).emit('message_deleted', {
          msgID: data.msgID,
          threadID: data.threadID,
          deletedBy: userId,
          deleteType: result.deleteType,
          timestamp: new Date()
        });
      } else {
        // Other's message deleted - only notify current user
        client.emit('message_deleted', {
          msgID: data.msgID,
          threadID: data.threadID,
          deletedBy: userId,
          deleteType: result.deleteType,
          timestamp: new Date()
        });
      }

      client.emit('delete_success', result);

    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('delete_all_messages')
  async handleDeleteAllMessages(@ConnectedSocket() client: Socket, @MessageBody() data: DeleteAllMessagesDto) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      const result = await this.chatService.deleteAllMessages(userId, data);

      // For delete all - only notify current user since it's only their side
      client.emit('all_messages_deleted', {
        threadID: data.threadID,
        receiverID: data.receiverID,
        deletedBy: userId,
        messagesDeleted: result.messagesDeleted,
        deleteType: result.deleteType,
        timestamp: new Date()
      });

      client.emit('delete_all_success', result);

    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(@ConnectedSocket() client: Socket, @MessageBody() data: EditMessageDto) {
    try {
      const userId = this.userSockets.get(client.id);
      if (!userId) return;

      const result = await this.chatService.editMessage(userId, data);

      // Notify both users in the thread about message edit (WhatsApp style)
      this.server.to(`thread:${data.threadID}`).emit('message_edited', {
        msgID: data.msgID,
        threadID: data.threadID,
        newMsg: result.msg,
        isEdited: result.isEdited,
        editedAt: result.editedAt,
        editedBy: userId,
        timestamp: new Date()
      });

      // Also notify both participants directly
      const participants = await this.chatService.getThreadParticipants(data.threadID);
      participants.forEach(participant => {
        this.server.to(`user:${participant.userID}`).emit('message_edited', {
          msgID: data.msgID,
          threadID: data.threadID,
          newMsg: result.msg,
          isEdited: result.isEdited,
          editedAt: result.editedAt,
          editedBy: userId,
          timestamp: new Date()
        });
      });

      client.emit('edit_success', result);

    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

}