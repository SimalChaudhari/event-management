import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ChatThread, ChatMessage, ChatParticipant, MessageType } from './chat.entity';
import { UserEntity } from 'user/users.entity';
import { SendMessageDto, GetChatDto, CreateThreadDto, MarkReadDto, UpdateLastSeenDto, DeleteMessageDto, DeleteAllMessagesDto, EditMessageDto } from './chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatThread) private threadRepo: Repository<ChatThread>,
    @InjectRepository(ChatMessage) private messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatParticipant) private participantRepo: Repository<ChatParticipant>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {}

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
        // Create new thread with explicit values
        const newThread = this.threadRepo.create({
          userID: userID,
          receiverID: dto.receiverID
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

    // Find or create thread automatically
    const threadData = await this.createOrGetThread(senderID, { receiverID });
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

      // Load complete message with relations
      const savedMessage = await this.messageRepo.findOne({
        where: { msgID: message.msgID },
        relations: ['sender', 'receiver', 'replyToMessage', 'replyToMessage.sender']
      });

      return {
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

    // Find or create thread
    const threadData = await this.createOrGetThread(userID, { receiverID: dto.receiverID });
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
          '(msg.senderID = :userID AND msg.visibleToSender = true) OR (msg.receiverID = :userID AND msg.visibleToReceiver = true)',
          { userID }
        )
        .orderBy('msg.msgDateUTC', 'DESC')
        .take(limit)
        .skip(skip);

      const [messages, total] = await queryBuilder.getManyAndCount();

      // Get participant info for last seen
      const participant = await this.participantRepo.findOne({
        where: { threadID, userID: dto.receiverID }
      });

      // Mark messages as delivered for current user
      await this.messageRepo.update(
        { threadID, receiverID: userID, isDelivered: false },
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

      return {
        threadID,
        receiverID: dto.receiverID,
        receiverName: threadData.receiverName,
        lastSeen: participant?.lastSeen || null,
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

  // Update last seen
  async updateLastSeen(userID: string, dto: UpdateLastSeenDto): Promise<any> {
    try {
      const result = await this.participantRepo.update(
        { threadID: dto.threadID, userID },
        { lastSeen: new Date() }
      );

      if (result.affected === 0) {
        throw new BadRequestException('You are not a participant of this thread');
      }

      return {
        success: true,
        lastSeen: new Date(),
        threadID: dto.threadID
      };

    } catch (error) {
      throw new BadRequestException('Failed to update last seen');
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
        lastSeen: p.lastSeen,
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

}