import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ChatThread, ChatMessage, ChatParticipant, MessageType } from './chat.entity';
import { UserEntity } from 'user/users.entity';
import { SendMessageDto, GetChatDto, CreateThreadDto, MarkReadDto, DeleteMessageDto, DeleteAllMessagesDto, EditMessageDto, GetChatListDto } from './chat.dto';
import { ChatNotificationService } from './chat-notification.service';
import { RegisterEventService } from '../registerEvent/registerEvent.service';

@Injectable()
export class ChatService {
  private chatGateway: any; // Will be injected by the gateway

  constructor(
    @InjectRepository(ChatThread) private threadRepo: Repository<ChatThread>,
    @InjectRepository(ChatMessage) private messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatParticipant) private participantRepo: Repository<ChatParticipant>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private chatNotificationService: ChatNotificationService,
    @Inject(forwardRef(() => RegisterEventService))
    private registerEventService: RegisterEventService,
  ) {}

  // Method to set gateway reference (called from gateway)
  setGateway(gateway: any) {
    this.chatGateway = gateway;
  }

  // Create or get thread between user and speaker
  async createOrGetThread(userID: string, dto: CreateThreadDto): Promise<any> {

    // Validate input
    if (!dto.receiverID ) {
      throw new BadRequestException(' ReceiverID are required');
    }

    if (userID === dto.receiverID) {
      throw new BadRequestException('Cannot create thread with yourself');
    }

    // Check if receiver exists
    const receiver = await this.userRepo.findOne({ where: { id: dto.receiverID } });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Check if thread already exists (bidirectional)
    let thread = await this.threadRepo
      .createQueryBuilder('thread')
      .where(
        '(thread.userID = :userID AND thread.receiverID = :receiverID) OR (thread.userID = :receiverID AND thread.receiverID = :userID)',
        { userID, receiverID: dto.receiverID }
      )
      .leftJoinAndSelect('thread.user', 'user')
      .leftJoinAndSelect('thread.receiver', 'receiver')
      .getOne();

    if (!thread) {
      try {
        // Create new thread with explicit values (optional eventId for event chatroom)
        const newThread = this.threadRepo.create({
          userID: userID,
          receiverID: dto.receiverID,
          ...(dto.eventId && { eventId: dto.eventId }),
        });
        
        thread = await this.threadRepo.save(newThread);

        // Create participants
        const participants = [
          this.participantRepo.create({ threadID: thread.threadID, userID: userID }),
          this.participantRepo.create({ threadID: thread.threadID, userID: dto.receiverID })
        ];
        
        await this.participantRepo.save(participants);

        // Reload with relations
        thread = await this.threadRepo.findOne({
          where: { threadID: thread.threadID },
          relations: ['user', 'receiver']
        });

      } catch (error) {
        throw new BadRequestException('Failed to create thread');
      }
    } else if (dto.eventId) {
      // When sending from register/event chatroom: always tag thread with this eventId so last chat shows in that event's list
      await this.threadRepo.update(thread!.threadID, { eventId: dto.eventId });
      thread!.eventId = dto.eventId;
    }

    return {
      threadID: thread!.threadID,
      receiverID: dto.receiverID,
      receiverName: receiver.firstName || 'Unknown',
      createdAt: thread!.createdAt
    };
  }

  // Send message
  async sendMessage(senderID: string, receiverID: string, dto: Omit<SendMessageDto, 'threadID'>): Promise<any> {
    // Validate input
    if (!receiverID || !dto.msg || !senderID) {
      throw new BadRequestException('ReceiverID, message, and senderID are required');
    }

    if (senderID === receiverID) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Find or create thread automatically (optional eventId for event chatroom)
    const threadData = await this.createOrGetThread(senderID, {
      receiverID,
      ...(dto.eventId && { eventId: dto.eventId }),
    });
    const threadID = threadData.threadID;

    // Verify both users are participants
    const participants = await this.participantRepo.find({
      where: { threadID }
    });

    const otherParticipant = participants.find(p => p.userID === receiverID);
    if (!otherParticipant) {
      throw new BadRequestException('Receiver not found in thread');
    }

    // Validate reply message if provided
    let replyToMessage = null;
    if (dto.reply) {
      replyToMessage = await this.messageRepo.findOne({
        where: { msgID: dto.reply, threadID }
      });
      if (!replyToMessage) {
        throw new BadRequestException('Reply message not found');
      }
    }

    try {
      // Create message
      const newMessage = this.messageRepo.create({
        threadID,
        senderID: senderID,
        receiverID: receiverID,
        msg: dto.msg.trim(),
        msgType: dto.msgType || MessageType.TEXT,
        msgJson: dto.msgJson,
        reply: dto.reply,
        isRead: false,
        isDelivered: true
      });

      const message = await this.messageRepo.save(newMessage);

      // Update thread last message
      await this.threadRepo.update(threadID, {
        lastMessage: dto.msg.substring(0, 100),
        updatedAt: new Date()
      });

      // Update receiver's unread count
      await this.participantRepo.increment(
        { threadID, userID: receiverID },
        'unreadCount',
        1
      );

      // Send push notification to receiver
      try {
        await this.chatNotificationService.sendChatNotification(
          senderID,
          receiverID,
          dto.msg,
          dto.msgType || MessageType.TEXT,
          dto.eventId
        );
      } catch (error) {
        console.error('❌ Error sending chat notification:', error);
        // Don't fail the message sending if notification fails
      }

      // Load complete message with relations
      const savedMessage = await this.messageRepo.findOne({
        where: { msgID: message.msgID },
        relations: ['sender', 'receiver', 'replyToMessage', 'replyToMessage.sender']
      });

      const result = {
        msgID: savedMessage!.msgID,
        threadID: savedMessage!.threadID,
        msg: savedMessage!.msg,
        msgType: savedMessage!.msgType,
        msgJson: savedMessage!.msgJson,
        reply: savedMessage!.reply,
        senderID: savedMessage!.senderID,
        senderNick: savedMessage!.sender?.firstName || 'Unknown',
        receiverID: savedMessage!.receiverID,
        isRead: savedMessage!.isRead,
        isDelivered: savedMessage!.isDelivered,
        msgDateUTC: savedMessage!.msgDateUTC,
        replyToMessage: savedMessage!.replyToMessage ? {
          msgID: savedMessage!.replyToMessage.msgID,
          msg: savedMessage!.replyToMessage.msg,
          senderNick: savedMessage!.replyToMessage.sender?.firstName || 'Unknown'
        } : null
      };

      // Emit to receiver in real-time (works when message sent via REST or socket)
      if (this.chatGateway?.server) {
        this.chatGateway.server.to(`user:${receiverID}`).emit('new_message', result);
      }

      // Store last chat in register chatroom: notify so UI updates immediately (and thread already has eventId + lastMessage saved above)
      if (dto.eventId && this.chatGateway?.emitRegisterChatroomUpdate) {
        this.chatGateway.emitRegisterChatroomUpdate(dto.eventId, senderID, {
          threadID: result.threadID,
          receiverID: result.receiverID,
          lastMessage: result.msg,
          lastMessageTime: result.msgDateUTC,
          lastMessageType: result.msgType || 'text',
          lastMessageSender: result.senderNick,
          isLastMessageFromMe: true,
        });
      }

      return result;

    } catch (error) {
      throw new BadRequestException('Failed to send message');
    }
  }

  // Get chat messages with pagination
  async getChat(userID: string, dto: GetChatDto): Promise<any> {
    // Validate input
    if (!dto.receiverID || !userID) {
      throw new BadRequestException('UserID and ReceiverID are required');
    }

    // Find or create thread (optional eventId for event chatroom)
    const threadData = await this.createOrGetThread(userID, {
      receiverID: dto.receiverID,
      ...(dto.eventId && { eventId: dto.eventId }),
    });
    const threadID = threadData.threadID;

    const limit = Math.min(dto.paginationCount || 20, 100); // Max 100 messages per page
    const page = Math.max(dto.paginationCurrentPage || 1, 1);
    const skip = (page - 1) * limit;

    try {
      // Get messages with pagination (only visible messages for current user)
      const queryBuilder = this.messageRepo
        .createQueryBuilder('msg')
        .leftJoinAndSelect('msg.sender', 'sender')
        .leftJoinAndSelect('msg.receiver', 'receiver')
        .leftJoinAndSelect('msg.replyToMessage', 'replyToMessage')
        .leftJoinAndSelect('replyToMessage.sender', 'replyToMessageSender')
        .where('msg.threadID = :threadID', { threadID })
        .andWhere(
          '((msg.senderID = :userID AND msg.receiverID = :receiverID AND msg.visibleToSender = true) OR (msg.senderID = :receiverID AND msg.receiverID = :userID AND msg.visibleToReceiver = true))',
          { userID, receiverID: dto.receiverID }
        )
        .orderBy('msg.msgDateUTC', 'DESC')
        .take(limit)
        .skip(skip);

      const [messages, total] = await queryBuilder.getManyAndCount();



      // Mark messages as delivered for current user
      await this.messageRepo.update(
        { threadID, senderID: dto.receiverID, receiverID: userID, isDelivered: false },
        { isDelivered: true }
      );

      // Format messages (reverse to get chronological order)
      const aChatOpen = messages.reverse().map(msg => ({
        msgID: msg.msgID,
        threadID: msg.threadID,
        msg: msg.msg,
        msgType: msg.msgType,
        msgJson: msg.msgJson,
        reply: msg.reply,
        senderID: msg.senderID,
        senderNick: msg.sender?.firstName || 'Unknown',
        receiverID: msg.receiverID,
        isRead: msg.isRead,
        isDelivered: msg.isDelivered,
        isEdited: msg.isEdited,
        editedAt: msg.editedAt,
        msgDateUTC: msg.msgDateUTC,
        replyToMessage: msg.replyToMessage ? {
          msgID: msg.replyToMessage.msgID,
          msg: msg.replyToMessage.msg,
          senderNick: msg.replyToMessage.sender?.firstName || 'Unknown'
        } : null
      }));

      // Get receiver's participant data for lastSeen
      const receiverParticipant = await this.participantRepo.findOne({
        where: { threadID, userID: dto.receiverID }
      });

      // Check if receiver is currently online via gateway
      const isReceiverOnline = this.chatGateway?.isUserOnline(dto.receiverID) || false;
      
      let lastSeen: string | null = null;
      if (isReceiverOnline) {
        lastSeen = 'online';
      } else if (receiverParticipant?.lastSeen) {
        lastSeen = receiverParticipant.lastSeen.toISOString();
      }

      return {
        threadID,
        receiverID: dto.receiverID,
        receiverName: threadData.receiverName,
        lastSeen,
        paginationCount: limit,
        paginationCurrentPage: page,
        totalMessages: total,
        totalPages: Math.ceil(total / limit),
        aChatOpen
      };

    } catch (error) {
      throw new BadRequestException('Failed to get chat messages');
    }
  }

  // Mark messages as read
  async markAsRead(userID: string, dto: MarkReadDto): Promise<any> {
    const participant = await this.participantRepo.findOne({
      where: { threadID: dto.threadID, userID }
    });

    if (!participant) {
      throw new BadRequestException('You are not a participant of this thread');
    }

    try {
      let updated = 0;
      if (dto.msgID) {
        // Mark specific message as read
        const result = await this.messageRepo.update(
          { msgID: dto.msgID, receiverID: userID, isRead: false },
          { isRead: true }
        );
        updated = result.affected || 0;
      } else {
        // Mark all unread messages as read
        const result = await this.messageRepo.update(
          { threadID: dto.threadID, receiverID: userID, isRead: false },
          { isRead: true }
        );
        updated = result.affected || 0;
      }

      // Reset unread count
      await this.participantRepo.update(
        { threadID: dto.threadID, userID },
        { unreadCount: 0 }
      );

      return {
        success: true,
        messagesRead: updated,
        threadID: dto.threadID
      };

    } catch (error) {
      throw new BadRequestException('Failed to mark messages as read');
    }
  }






  // Get thread participants
  async getThreadParticipants(threadID: string): Promise<any[]> {
    try {
      const participants = await this.participantRepo.find({
        where: { threadID },
        relations: ['user']
      });

      return participants.map(p => ({
        userID: p.userID,
        threadID: p.threadID,
        unreadCount: p.unreadCount,
        userName: p.user?.firstName || 'Unknown'
      }));

    } catch (error) {
      throw new BadRequestException('Failed to get thread participants');
    }
  }

  // Delete specific message (WhatsApp style)
  async deleteMessage(userID: string, dto: DeleteMessageDto): Promise<any> {
    try {
      // Verify user is participant of this thread
      const participant = await this.participantRepo.findOne({
        where: { threadID: dto.threadID, userID }
      });

      if (!participant) {
        throw new BadRequestException('You are not a participant of this thread');
      }

      // Find the message
      const message = await this.messageRepo.findOne({
        where: { msgID: dto.msgID, threadID: dto.threadID }
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      let deleteType: 'both' | 'sender_only' | 'receiver_only' = 'sender_only';

      if (message.senderID === userID) {
        // User is deleting their own message - delete from both sides
        deleteType = 'both';
        await this.messageRepo.update(
          { msgID: dto.msgID },
          { 
            visibleToSender: false,
            visibleToReceiver: false
          }
        );
      } else if (message.receiverID === userID) {
        // User is deleting someone else's message - delete only from their side
        deleteType = 'receiver_only';
        await this.messageRepo.update(
          { msgID: dto.msgID },
          { visibleToReceiver: false }
        );
      } else {
        throw new BadRequestException('You can only delete messages in your conversation');
      }

      // Update thread's last message if this message was visible and was the latest
      const latestVisibleMessage = await this.messageRepo
        .createQueryBuilder('msg')
        .where('msg.threadID = :threadID', { threadID: dto.threadID })
        .andWhere('(msg.visibleToSender = true OR msg.visibleToReceiver = true)')
        .orderBy('msg.msgDateUTC', 'DESC')
        .getOne();

      if (latestVisibleMessage) {
        await this.threadRepo.update(dto.threadID, {
          lastMessage: latestVisibleMessage.msg.substring(0, 100),
          updatedAt: new Date()
        });
      } else {
        // No visible messages left in thread
        await this.threadRepo.update(dto.threadID, {
          lastMessage: '',
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        msgID: dto.msgID,
        threadID: dto.threadID,
        deleteType,
        deletedAt: new Date()
      };

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete message');
    }
  }

  // Delete all messages from current user's side only (WhatsApp style)
  async deleteAllMessages(userID: string, dto: DeleteAllMessagesDto): Promise<any> {
    try {
      // Find or create thread to ensure it exists
      const threadData = await this.createOrGetThread(userID, { receiverID: dto.receiverID });
      const threadID = threadData.threadID;

      if (threadID !== dto.threadID) {
        throw new BadRequestException('Thread ID mismatch');
      }

      // Verify user is participant
      const participant = await this.participantRepo.findOne({
        where: { threadID: dto.threadID, userID }
      });

      if (!participant) {
        throw new BadRequestException('You are not a participant of this thread');
      }

      // Count messages visible to user before deletion
      const messageCount = await this.messageRepo
        .createQueryBuilder('msg')
        .where('msg.threadID = :threadID', { threadID: dto.threadID })
        .andWhere(
          '(msg.senderID = :userID AND msg.visibleToSender = true) OR (msg.receiverID = :userID AND msg.visibleToReceiver = true)',
          { userID }
        )
        .getCount();

      // Hide all messages from current user's perspective
      // For messages sent by user - hide from sender side
      await this.messageRepo.update(
        { threadID: dto.threadID, senderID: userID },
        { visibleToSender: false }
      );

      // For messages received by user - hide from receiver side
      await this.messageRepo.update(
        { threadID: dto.threadID, receiverID: userID },
        { visibleToReceiver: false }
      );

      // Reset unread count for current user only
      await this.participantRepo.update(
        { threadID: dto.threadID, userID },
        { unreadCount: 0 }
      );

      // Update thread's last message based on what's still visible to either user
      const latestVisibleMessage = await this.messageRepo
        .createQueryBuilder('msg')
        .where('msg.threadID = :threadID', { threadID: dto.threadID })
        .andWhere('(msg.visibleToSender = true OR msg.visibleToReceiver = true)')
        .orderBy('msg.msgDateUTC', 'DESC')
        .getOne();

      if (latestVisibleMessage) {
        await this.threadRepo.update(dto.threadID, {
          lastMessage: latestVisibleMessage.msg.substring(0, 100),
          updatedAt: new Date()
        });
      } else {
        // No visible messages left for anyone
        await this.threadRepo.update(dto.threadID, {
          lastMessage: '',
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        threadID: dto.threadID,
        messagesDeleted: messageCount,
        deletedAt: new Date(),
        deleteType: 'current_user_side_only'
      };

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete all messages');
    }
  }

  // Edit message (WhatsApp style - only sender can edit, visible to both)
  async editMessage(userID: string, dto: EditMessageDto): Promise<any> {
    try {
      // Verify user is participant of this thread
      const participant = await this.participantRepo.findOne({
        where: { threadID: dto.threadID, userID }
      });

      if (!participant) {
        throw new BadRequestException('You are not a participant of this thread');
      }

      // Find the message
      const message = await this.messageRepo.findOne({
        where: { msgID: dto.msgID, threadID: dto.threadID },
        relations: ['sender', 'receiver']
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Check if user is the sender (only sender can edit)
      if (message.senderID !== userID) {
        throw new BadRequestException('You can only edit your own messages');
      }

      // Check if message is still visible to sender
      if (!message.visibleToSender) {
        throw new BadRequestException('Cannot edit deleted message');
      }

      // Update the message
      await this.messageRepo.update(
        { msgID: dto.msgID },
        { 
          msg: dto.newMsg.trim(),
          isEdited: true,
          editedAt: new Date()
        }
      );

      // Update thread's last message if this was the latest message
      const latestMessage = await this.messageRepo.findOne({
        where: { threadID: dto.threadID },
        order: { msgDateUTC: 'DESC' }
      });

      if (latestMessage && latestMessage.msgID === dto.msgID) {
        await this.threadRepo.update(dto.threadID, {
          lastMessage: dto.newMsg.substring(0, 100),
          updatedAt: new Date()
        });
      }

      // Return updated message data
      const updatedMessage = await this.messageRepo.findOne({
        where: { msgID: dto.msgID },
        relations: ['sender', 'receiver', 'replyToMessage', 'replyToMessage.sender']
      });

      return {
        success: true,
        msgID: dto.msgID,
        threadID: dto.threadID,
        msg: updatedMessage!.msg,
        isEdited: updatedMessage!.isEdited,
        editedAt: updatedMessage!.editedAt,
        senderID: updatedMessage!.senderID,
        receiverID: updatedMessage!.receiverID,
        senderNick: updatedMessage!.sender?.firstName || 'Unknown',
        msgDateUTC: updatedMessage!.msgDateUTC,
        replyToMessage: updatedMessage!.replyToMessage ? {
          msgID: updatedMessage!.replyToMessage.msgID,
          msg: updatedMessage!.replyToMessage.msg,
          senderNick: updatedMessage!.replyToMessage.sender?.firstName || 'Unknown'
        } : null
      };

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to edit message');
    }
  }

  // Get chat list (WhatsApp style contact list). Optional eventId: only threads with other registered attendees of that event.
  async getChatList(userID: string, dto: GetChatListDto): Promise<any> {
    try {
      const limit = Math.min(dto.paginationCount || 20, 100);
      const page = Math.max(dto.paginationCurrentPage || 1, 1);
      const skip = (page - 1) * limit;

      // When eventId is provided, get allowed attendee IDs for event chatroom (only chat with other registered users)
      let eventAttendeeIds: Set<string> | null = null;
      if (dto.eventId) {
        const ids = await this.registerEventService.getRegisteredUserIdsForEvent(dto.eventId, userID);
        eventAttendeeIds = new Set(ids);
      }

      // First, get all threads where user is a participant
      const participants = await this.participantRepo.find({
        where: { userID },
        relations: ['thread', 'thread.user', 'thread.receiver']
      });

      if (participants.length === 0) {
        return {
          success: true,
          paginationCount: limit,
          paginationCurrentPage: page,
          totalChats: 0,
          totalPages: 0,
          chatList: []
        };
      }

      const threadIds = participants.map((p) => p.thread?.threadID).filter(Boolean) as string[];
      let threadIdsWithMessagesInDb: Set<string> = new Set();
      let threadIdsVisibleToUser: Set<string> = new Set();
      if (threadIds.length > 0) {
        const rows = await this.messageRepo
          .createQueryBuilder('m')
          .select('DISTINCT m.threadID')
          .where('m.threadID IN (:...threadIds)', { threadIds })
          .getRawMany();
        rows.forEach((r: any) => {
          const id = r.m_threadID ?? r.threadID ?? Object.values(r)[0];
          if (id) threadIdsWithMessagesInDb.add(String(id));
        });
        // Only show threads where current user has at least one visible message (after delete-all, hide thread so kisi aur ka message na dikhe)
        const visibleRows = await this.messageRepo
          .createQueryBuilder('m')
          .select('DISTINCT m.threadID')
          .where('m.threadID IN (:...threadIds)', { threadIds })
          .andWhere(
            '(m.senderID = :userID AND m.visibleToSender = true) OR (m.receiverID = :userID AND m.visibleToReceiver = true)',
            { userID }
          )
          .getRawMany();
        visibleRows.forEach((r: any) => {
          const id = r.m_threadID ?? r.threadID ?? Object.values(r)[0];
          if (id) threadIdsVisibleToUser.add(String(id));
        });
      }

      // Filter threads that have messages AND at least one message visible to current user (exclude deleted chats)
      let threadsWithMessages = participants.filter((p) => {
        if (!p.thread) return false;
        const hasMessagesInDb = threadIdsWithMessagesInDb.has(p.thread.threadID);
        const hasVisibleToUser = threadIdsVisibleToUser.has(p.thread.threadID);
        return hasMessagesInDb && hasVisibleToUser;
      });

      // When eventId provided: show threads where other user is event attendee; include if thread has this eventId OR no eventId yet (so send with eventId stores last chat here)
      if (eventAttendeeIds !== null) {
        threadsWithMessages = threadsWithMessages.filter(p => {
          const otherUser = p.thread!.userID === userID ? p.thread!.receiver : p.thread!.user;
          const otherIsAttendee = otherUser && eventAttendeeIds!.has(otherUser.id);
          const threadBelongsToEvent = p.thread!.eventId === dto.eventId;
          const threadUntagged = !p.thread!.eventId;
          return otherIsAttendee && (threadBelongsToEvent || threadUntagged);
        });
      }

      // Apply search filter if provided
      let filteredThreads = threadsWithMessages;
      if (dto.search && dto.search.trim()) {
        const searchTerm = dto.search.trim().toLowerCase();
        filteredThreads = threadsWithMessages.filter(p => {
          const otherUser = p.thread.userID === userID ? p.thread.receiver : p.thread.user;
          return (
            otherUser.firstName?.toLowerCase().includes(searchTerm) ||
            otherUser.lastName?.toLowerCase().includes(searchTerm) ||
            p.thread.lastMessage?.toLowerCase().includes(searchTerm)
          );
        });
      }

      // Sort by updated time
      filteredThreads.sort((a, b) => 
        new Date(b.thread.updatedAt).getTime() - new Date(a.thread.updatedAt).getTime()
      );

      // Apply pagination
      const total = filteredThreads.length;
      const paginatedThreads = filteredThreads.slice(skip, skip + limit);

      // Build chat list – last message from DB (visible to user) so register chatroom always shows it
      const chatList = await Promise.all(
        paginatedThreads.map(async (participant) => {
          const thread = participant.thread;
          const otherUser = thread.userID === userID ? thread.receiver : thread.user;
          
          const lastMessage = await this.messageRepo
            .createQueryBuilder('msg')
            .leftJoinAndSelect('msg.sender', 'sender')
            .where('msg.threadID = :threadID', { threadID: thread.threadID })
            .andWhere(
              '(msg.senderID = :userID AND msg.visibleToSender = true) OR (msg.receiverID = :userID AND msg.visibleToReceiver = true)',
              { userID }
            )
            .orderBy('msg.msgDateUTC', 'DESC')
            .getOne();

          // Only show last message that current user can see. After delete, do not show thread.lastMessage (it may be other user's message).
          const lastMessageText = lastMessage?.msg ?? '';
          const lastMessageTime = lastMessage?.msgDateUTC ?? thread.updatedAt;

          const isOnline = this.chatGateway?.isUserOnline(otherUser.id) || false;
          const otherParticipant = await this.participantRepo.findOne({
            where: { threadID: thread.threadID, userID: otherUser.id }
          });
          let lastSeen: string | null = null;
          if (isOnline) lastSeen = 'online';
          else if (otherParticipant?.lastSeen) lastSeen = otherParticipant.lastSeen.toISOString();

          return {
            threadID: thread.threadID,
            userID: otherUser.id,
            userName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'Unknown User',
            firstName: otherUser.firstName || '',
            lastName: otherUser.lastName || '',
            userImage: otherUser.profilePicture || null,
            lastMessage: lastMessageText,
            lastMessageTime,
            unreadCount: participant.unreadCount || 0,
            isOnline,
            lastSeen,
            lastMessageSender: lastMessage?.sender?.firstName || 'Unknown',
            isLastMessageFromMe: lastMessage?.senderID === userID,
            lastMessageType: lastMessage?.msgType || MessageType.TEXT
          };
        })
      );

      return {
        success: true,
        paginationCount: limit,
        paginationCurrentPage: page,
        totalChats: total,
        totalPages: Math.ceil(total / limit),
        chatList
      };

    } catch (error) {
      console.error('Chat list error:', error);
      throw new BadRequestException('Failed to get chat list');
    }
  }

  /**
   * Get all event chats for the current user in one response (for mobile app / Postman).
   * Returns every conversation with that user's other attendees and full message thread.
   */
  async getEventChats(userID: string, eventId: string): Promise<any> {
    if (!eventId) {
      throw new BadRequestException('EventID is required');
    }
    const listResult = await this.getChatList(userID, {
      eventId,
      paginationCount: 50,
      paginationCurrentPage: 1,
    });
    const chatList = listResult?.chatList || [];
    const conversations = await Promise.all(
      chatList.map(async (c: any) => {
        const chatData = await this.getChat(userID, {
          receiverID: c.userID,
          paginationCount: 100,
          paginationCurrentPage: 1,
        });
        return {
          threadID: c.threadID,
          userID: c.userID,
          userName: c.userName,
          userImage: c.userImage,
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageTime,
          unreadCount: c.unreadCount || 0,
          messages: chatData?.aChatOpen || [],
        };
      }),
    );
    return {
      success: true,
      eventId,
      conversations,
      totalConversations: conversations.length,
    };
  }

}