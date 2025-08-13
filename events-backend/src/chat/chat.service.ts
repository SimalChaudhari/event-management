import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ChatThread, ChatMessage, ChatParticipant, MessageType } from './chat.entity';
import { UserEntity } from 'user/users.entity';
import { SendMessageDto, GetChatDto, CreateThreadDto, MarkReadDto, UpdateLastSeenDto } from './chat.dto';

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
      // Get messages with pagination
      const [messages, total] = await this.messageRepo.findAndCount({
        where: { threadID },
        relations: ['sender', 'receiver', 'replyToMessage', 'replyToMessage.sender'],
        order: { msgDateUTC: 'DESC' },
        take: limit,
        skip
      });

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



}