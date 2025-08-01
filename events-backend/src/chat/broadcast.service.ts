// src/chat/broadcast.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { BroadcastRoom, BroadcastMessage, RoomParticipant, MessageType } from './broadcast.entity';
import { CreateBroadcastRoomDto, JoinRoomDto, SendMessageDto, PinMessageDto } from './broadcast.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ResourceNotFoundException, ValidationException, DuplicateResourceException } from '../utils/exceptions/custom-exceptions';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { Speaker } from 'speaker/speaker.entity';
import { EventType } from 'event/event.entity';

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(BroadcastRoom)
    private broadcastRoomRepository: Repository<BroadcastRoom>,
    
    @InjectRepository(BroadcastMessage)
    private broadcastMessageRepository: Repository<BroadcastMessage>,
    
    @InjectRepository(RoomParticipant)
    private roomParticipantRepository: Repository<RoomParticipant>,
    
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
    
    private errorHandler: ErrorHandlerService,
  ) {}

  // Create or get broadcast room for speaker/event
  async createOrGetRoom(createRoomDto: CreateBroadcastRoomDto) {
    try {
      // Check if room already exists for this speaker/event
      let room = await this.broadcastRoomRepository.findOne({
        where: { 
          eventId: createRoomDto.eventId,
          speakerId: createRoomDto.speakerId 
        },
        relations: ['event', 'speaker']
      });

      if (room) {
        // Update room if needed
        room.name = createRoomDto.name;
        room.description = createRoomDto.description;
        room.isLive = true;
        await this.broadcastRoomRepository.save(room);
        return this.formatRoomResponse(room);
      }

      // Validate event and speaker exist
      const event = await this.eventRepository.findOne({
        where: { id: createRoomDto.eventId }
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', createRoomDto.eventId);
      }

      const speaker = await this.speakerRepository.findOne({
        where: { id: createRoomDto.speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', createRoomDto.speakerId);
      }

      // Create new room
      room = this.broadcastRoomRepository.create({
        name: createRoomDto.name,
        description: createRoomDto.description,
        eventId: createRoomDto.eventId,
        speakerId: createRoomDto.speakerId,
        isLive: true,
      });

      const savedRoom = await this.broadcastRoomRepository.save(room);

      // Add system message
      await this.sendSystemMessage(savedRoom.id, `${speaker.name} started the live broadcast!`);

      return this.formatRoomResponse(savedRoom, event, speaker);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Create broadcast room');
      this.errorHandler.handleDatabaseError(error, 'Broadcast room creation');
    }
  }

  // Join room
  async joinRoom(joinRoomDto: JoinRoomDto, userId: string) {
    try {
      // Validate room exists
      const room = await this.broadcastRoomRepository.findOne({
        where: { id: joinRoomDto.roomId },
        relations: ['event', 'speaker']
      });
      if (!room) {
        throw new ResourceNotFoundException('Broadcast Room', joinRoomDto.roomId);
      }

      // Validate user exists
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user already in room
      let participant = await this.roomParticipantRepository.findOne({
        where: { 
          roomId: joinRoomDto.roomId,
          userId: userId
        }
      });

      if (participant) {
        // Update existing participant
        participant.isOnline = true;
        participant.lastSeen = new Date();
        await this.roomParticipantRepository.save(participant);
      } else {
        // Create new participant
        participant = this.roomParticipantRepository.create({
          roomId: joinRoomDto.roomId,
          userId: userId,
          isOnline: true,
        });
        await this.roomParticipantRepository.save(participant);

        // Update room active users count
        await this.broadcastRoomRepository.update(
          { id: joinRoomDto.roomId },
          { activeUsers: () => 'activeUsers + 1' }
        );

        // Send system message
        const userName = user.firstName + ' ' + user.lastName;
        await this.sendSystemMessage(joinRoomDto.roomId, `${userName} joined the broadcast`);
      }

      return {
        room: this.formatRoomResponse(room),
        participant: {
          id: participant.id,
          isOnline: participant.isOnline,
          joinedAt: participant.joinedAt,
        },
        message: 'Successfully joined the broadcast room'
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Join room');
      this.errorHandler.handleDatabaseError(error, 'Room joining');
    }
  }

  // Leave room
  async leaveRoom(roomId: string, userId: string) {
    try {
      const participant = await this.roomParticipantRepository.findOne({
        where: { roomId, userId }
      });

      if (participant) {
        participant.isOnline = false;
        participant.lastSeen = new Date();
        await this.roomParticipantRepository.save(participant);

        // Update room active users count
        await this.broadcastRoomRepository.update(
          { id: roomId },
          { activeUsers: () => 'CASE WHEN activeUsers > 0 THEN activeUsers - 1 ELSE 0 END' }
        );
      }

      return { message: 'Successfully left the room' };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Leave room');
      return { message: 'Error leaving room' };
    }
  }

  // Send message
  async sendMessage(sendMessageDto: SendMessageDto, userId: string) {
    try {
      // Validate room exists
      const room = await this.broadcastRoomRepository.findOne({
        where: { id: sendMessageDto.roomId },
        relations: ['speaker']
      });
      if (!room) {
        throw new ResourceNotFoundException('Broadcast Room', sendMessageDto.roomId);
      }

      // Validate user exists
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is the speaker
      const isSpeaker = room.speakerId === userId;

      // Create message
      const message = this.broadcastMessageRepository.create({
        message: sendMessageDto.message,
        messageType: sendMessageDto.messageType || MessageType.TEXT,
        isAnonymous: sendMessageDto.isAnonymous || false,
        roomId: sendMessageDto.roomId,
        userId: userId,
        ...(isSpeaker && { speakerId: userId }),
      });

      const savedMessage = await this.broadcastMessageRepository.save(message);

      // Update room message count
      await this.broadcastRoomRepository.update(
        { id: sendMessageDto.roomId },
        { totalMessages: () => 'totalMessages + 1' }
      );

      return this.formatMessageResponse(savedMessage, user, isSpeaker ? room.speaker : undefined);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Send message');
      this.errorHandler.handleDatabaseError(error, 'Message sending');
    }
  }

  // Pin/Unpin message
  async pinMessage(pinMessageDto: PinMessageDto, adminUserId: string) {
    try {
      const message = await this.broadcastMessageRepository.findOne({
        where: { id: pinMessageDto.messageId },
        relations: ['user', 'speaker']
      });
      if (!message) {
        throw new ResourceNotFoundException('Message', pinMessageDto.messageId);
      }

      message.isPinned = !message.isPinned;
      message.pinnedAt = message.isPinned ? new Date() : undefined;
      message.pinnedById = message.isPinned ? adminUserId : undefined;

      await this.broadcastMessageRepository.save(message);

      return {
        messageId: message.id,
        isPinned: message.isPinned,
        pinnedAt: message.pinnedAt,
        message: message.isPinned ? 'Message pinned successfully' : 'Message unpinned successfully'
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Pin message');
      this.errorHandler.handleDatabaseError(error, 'Message pinning');
    }
  }

  // Get room messages with live updates
  async getRoomMessages(roomId: string, page: number = 1, limit: number = 50, lastUpdate?: string) {
    try {
      const room = await this.broadcastRoomRepository.findOne({
        where: { id: roomId },
        relations: ['event', 'speaker']
      });
      if (!room) {
        throw new ResourceNotFoundException('Broadcast Room', roomId);
      }

      const offset = (page - 1) * limit;

      // Build query
      const queryBuilder = this.broadcastMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user')
        .leftJoinAndSelect('message.speaker', 'speaker')
        .leftJoinAndSelect('message.pinnedBy', 'pinnedBy')
        .where('message.roomId = :roomId', { roomId })
        .andWhere('message.isActive = :isActive', { isActive: true });

      // Filter by last update if provided (for live updates)
      if (lastUpdate) {
        queryBuilder.andWhere('message.createdAt > :lastUpdate', { 
          lastUpdate: new Date(lastUpdate) 
        });
      }

      // Sort: Pinned messages first, then by time
      queryBuilder
        .orderBy('message.isPinned', 'DESC')
        .addOrderBy('message.createdAt', 'DESC');

      // Pagination (skip for live updates)
      if (!lastUpdate) {
        queryBuilder.skip(offset).take(limit);
      }

      const [messages, total] = await queryBuilder.getManyAndCount();

      // Get pinned messages separately
      const pinnedMessages = await this.broadcastMessageRepository.find({
        where: { 
          roomId, 
          isPinned: true,
          isActive: true 
        },
        relations: ['user', 'speaker', 'pinnedBy'],
        order: { pinnedAt: 'DESC' }
      });

      // Get active participants
      const activeParticipants = await this.getActiveParticipants(roomId);

      const formattedMessages = messages.map(msg => this.formatMessageResponse(msg));
      const formattedPinnedMessages = pinnedMessages.map(msg => this.formatMessageResponse(msg));

      return {
        room: this.formatRoomResponse(room),
        messages: formattedMessages,
        pinnedMessages: formattedPinnedMessages,
        activeParticipants,
        pagination: lastUpdate ? null : {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        isLive: room.isLive,
        lastUpdate: new Date().toISOString()
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get room messages');
      return {
        room: null,
        messages: [],
        pinnedMessages: [],
        activeParticipants: [],
        pagination: null,
        isLive: false,
        lastUpdate: new Date().toISOString()
      };
    }
  }

  // Get live updates for room
  async getLiveUpdates(roomId: string, lastUpdate?: string) {
    return this.getRoomMessages(roomId, 1, 100, lastUpdate);
  }

  // Get room by speaker and event
  async getRoomBySpeakerAndEvent(speakerId: string, eventId: string) {
    try {
      const room = await this.broadcastRoomRepository.findOne({
        where: { speakerId, eventId },
        relations: ['event', 'speaker']
      });

      if (!room) {
        return null;
      }

      return this.formatRoomResponse(room);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get room by speaker and event');
      return null;
    }
  }

  // Get or create general broadcast room
  async getOrCreateGeneralRoom(): Promise<BroadcastRoom> {
    try {
      // Get or create default event
      const defaultEvent = await this.getOrCreateDefaultEvent();

      // Create a dummy speaker for general room if needed
      const generalSpeaker = await this.getOrCreateGeneralSpeaker();

      // Look for existing general room
      let generalRoom = await this.broadcastRoomRepository.findOne({
        where: { 
          name: 'General Broadcast',
          eventId: defaultEvent.id,
          speakerId: generalSpeaker.id,
          isActive: true 
        },
        relations: ['event', 'speaker']
      });

      if (generalRoom) {
        // Ensure room is live
        if (!generalRoom.isLive) {
          generalRoom.isLive = true;
          await this.broadcastRoomRepository.save(generalRoom);
        }
        return generalRoom;
      }

      // Create new general room
      generalRoom = this.broadcastRoomRepository.create({
        name: 'General Broadcast',
        description: 'General broadcast room for all users to communicate with speakers',
        eventId: defaultEvent.id,
        speakerId: generalSpeaker.id,
        isLive: true,
        isActive: true,
        activeUsers: 0,
        totalMessages: 0,
      });

      const savedRoom = await this.broadcastRoomRepository.save(generalRoom);

      // Send initial system message
      await this.sendSystemMessage(
        savedRoom.id, 
        'Welcome to General Broadcast! Send your messages to speakers here.'
      );

      return savedRoom;
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get or create general room');
      this.errorHandler.handleDatabaseError(error, 'General room creation');
      throw error;
    }
  }

  // Override sendMessage for general room to handle null speaker
  async sendMessageToGeneral(messageData: { message: string; isAnonymous?: boolean; messageType?: MessageType }, userId: string) {
    try {
      // Get general room
      const generalRoom = await this.getOrCreateGeneralRoom();

      // Validate user exists
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Create message for general room
      const message = this.broadcastMessageRepository.create({
        message: messageData.message,
        messageType: messageData.messageType || MessageType.TEXT,
        isAnonymous: messageData.isAnonymous || false,
        roomId: generalRoom.id,
        userId: userId,
        // No speakerId for general room messages from users
      });

      const savedMessage = await this.broadcastMessageRepository.save(message);

      // Update room message count
      await this.broadcastRoomRepository.update(
        { id: generalRoom.id },
        { totalMessages: () => 'totalMessages + 1' }
      );

      return this.formatMessageResponse(savedMessage, user);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Send message to general');
      this.errorHandler.handleDatabaseError(error, 'General message sending');
      throw error;
    }
  }

  // =============== SPEAKER-SPECIFIC METHODS ===============

  // Get or create speaker-specific broadcast room
  async getOrCreateSpeakerRoom(speakerId: string): Promise<BroadcastRoom> {
    try {
      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', speakerId);
      }

      // Get or create a default "General Broadcast Event"
      const defaultEvent = await this.getOrCreateDefaultEvent();

      // Look for existing speaker room
      let speakerRoom = await this.broadcastRoomRepository.findOne({
        where: { 
          speakerId: speakerId,
          eventId: defaultEvent.id,
          isActive: true 
        },
        relations: ['speaker', 'event']
      });

      if (speakerRoom) {
        // Ensure room is live
        if (!speakerRoom.isLive) {
          speakerRoom.isLive = true;
          await this.broadcastRoomRepository.save(speakerRoom);
        }
        return speakerRoom;
      }

      // Create new speaker-specific room
      speakerRoom = this.broadcastRoomRepository.create({
        name: `${speaker.name} - Live Chat`,
        description: `Live chat with ${speaker.name} from ${speaker.companyName || 'Speaker'}`,
        eventId: defaultEvent.id,  // Use default event
        speakerId: speakerId,
        isLive: true,
        isActive: true,
        activeUsers: 0,
        totalMessages: 0,
      });

      const savedRoom = await this.broadcastRoomRepository.save(speakerRoom);

      // Send initial system message
      await this.sendSystemMessage(
        savedRoom.id, 
        `Welcome to ${speaker.name}'s live chat! Ask your questions here.`
      );

      // Reload with relations
      return await this.broadcastRoomRepository.findOne({
        where: { id: savedRoom.id },
        relations: ['speaker', 'event']
      }) || savedRoom;

    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get or create speaker room');
      this.errorHandler.handleDatabaseError(error, 'Speaker room creation');
      throw error;
    }
  }



  // Get active participants
  private async getActiveParticipants(roomId: string) {
    try {
      const participants = await this.roomParticipantRepository.find({
        where: { 
          roomId, 
          isOnline: true 
        },
        relations: ['user'],
        order: { joinedAt: 'ASC' },
        take: 20 // Limit to recent 20 active users
      });

      return participants.map(p => ({
        id: p.id,
        user: {
          id: p.user?.id,
          name: `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
        },
        joinedAt: p.joinedAt,
        lastSeen: p.lastSeen,
      }));
    } catch (error: any) {
      return [];
    }
  }

  // Send system message
  private async sendSystemMessage(roomId: string, messageText: string) {
    try {
      const systemMessage = this.broadcastMessageRepository.create({
        message: messageText,
        messageType: MessageType.SYSTEM,
        isAnonymous: false,
        roomId: roomId,
        userId: 'system', // Special system user ID
      });

      await this.broadcastMessageRepository.save(systemMessage);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Send system message');
    }
  }

  // Helper methods
  private formatRoomResponse(room: BroadcastRoom, event?: Event, speaker?: Speaker) {
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      isActive: room.isActive,
      isLive: room.isLive,
      activeUsers: room.activeUsers,
      totalMessages: room.totalMessages,
      event: event || room.event ? {
        id: (event || room.event)?.id,
        name: (event || room.event)?.name,
      } : null,
      speaker: speaker || room.speaker ? {
        id: (speaker || room.speaker)?.id,
        name: (speaker || room.speaker)?.name,
        companyName: (speaker || room.speaker)?.companyName,
        position: (speaker || room.speaker)?.position,
        speakerProfile: (speaker || room.speaker)?.speakerProfile,
      } : null,
      createdAt: room.createdAt,
    };
  }

  private formatMessageResponse(message: BroadcastMessage, user?: UserEntity, speaker?: Speaker) {
    const author = message.messageType === MessageType.SYSTEM ? 
      'System' :
      message.isAnonymous ? 
        'Anonymous' : 
        `${(user || message.user)?.firstName || ''} ${(user || message.user)?.lastName || ''}`.trim();

    return {
      id: message.id,
      message: message.message,
      messageType: message.messageType,
      isAnonymous: message.isAnonymous,
      author: author,
      isSpeaker: !!message.speakerId,
      isPinned: message.isPinned,
      pinnedAt: message.pinnedAt,
      pinnedBy: message.pinnedBy ? {
        id: message.pinnedBy.id,
        name: `${message.pinnedBy.firstName} ${message.pinnedBy.lastName}`,
      } : null,
      speakerInfo: (speaker || message.speaker) ? {
        id: (speaker || message.speaker)?.id,
        name: (speaker || message.speaker)?.name,
        companyName: (speaker || message.speaker)?.companyName,
        position: (speaker || message.speaker)?.position,
      } : null,
      createdAt: message.createdAt,
    };
  }

  // Get or create default event for general broadcast
  private async getOrCreateDefaultEvent(): Promise<Event> {
    try {
      // Look for existing default event
      let defaultEvent = await this.eventRepository.findOne({
        where: { name: 'General Broadcast Event' }
      });

      if (defaultEvent) {
        return defaultEvent;
      }

      // Create default event with correct properties
      defaultEvent = this.eventRepository.create({
        name: 'General Broadcast Event',
        description: 'Default event for general broadcast communications',
        startDate: new Date(),
        startTime: '00:00',
        endDate: new Date(),
        endTime: '23:59',
        location: 'Virtual',
        type: EventType.Virtual,
      });

      return await this.eventRepository.save(defaultEvent);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get or create default event');
      throw error;
    }
  }

  // Create a general speaker for system messages
  private async getOrCreateGeneralSpeaker(): Promise<Speaker> {
    try {
      // Look for existing general speaker
      let generalSpeaker = await this.speakerRepository.findOne({
        where: { name: 'General Moderator' }
      });

      if (generalSpeaker) {
        return generalSpeaker;
      }

      // Create general speaker (remove isActive - doesn't exist)
      generalSpeaker = this.speakerRepository.create({
        name: 'General Moderator',
        companyName: 'Event Platform',
        position: 'Moderator',
        speakerProfile: 'General event moderator for broadcast communications',
      });

      return await this.speakerRepository.save(generalSpeaker);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get or create general speaker');
      throw error;
    }
  }

  // =============== SIMPLE BROADCAST METHODS ===============

  // Join main broadcast room (single room for everyone)
  async joinMainBroadcast(userId: string) {
    try {
      // Get or create the main broadcast room
      const mainRoom = await this.getOrCreateMainRoom();
      
      // Join user to main room
      const joinResult = await this.joinRoom({ roomId: mainRoom.id }, userId);
      
      // Get recent messages
      const messages = await this.getAllMessages(1, 50);
      
      return {
        room: mainRoom,
        joinResult,
        recentMessages: messages.messages,
        onlineUsers: messages.onlineUsers,
        totalMessages: messages.totalMessages,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Join main broadcast');
      throw error;
    }
  }

  // Send message to main broadcast room
  async sendBroadcastMessage(messageText: string, userId: string, isAnonymous: boolean = false) {
    try {
      // Get main room
      const mainRoom = await this.getOrCreateMainRoom();
      
      // Get user info
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is a speaker
      const speaker = await this.speakerRepository.findOne({
        where: { email: user.email } // Assuming speakers have matching emails
      });
      const isSpeaker = !!speaker;

      // Create message
      const message = this.broadcastMessageRepository.create({
        message: messageText,
        messageType: MessageType.TEXT,
        isAnonymous: isAnonymous,
        roomId: mainRoom.id,
        userId: userId,
        ...(isSpeaker && { speakerId: speaker.id }),
      });

      const savedMessage = await this.broadcastMessageRepository.save(message);

      // Update room message count
      await this.broadcastRoomRepository.update(
        { id: mainRoom.id },
        { totalMessages: () => 'totalMessages + 1' }
      );

      return this.formatMessageResponse(savedMessage, user, speaker || undefined);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Send broadcast message');
      throw error;
    }
  }

  // Get all messages from main room
  async getAllMessages(page: number = 1, limit: number = 50) {
    try {
      const mainRoom = await this.getOrCreateMainRoom();
      
      const offset = (page - 1) * limit;

      // Get messages with users and speakers
      const [messages, total] = await this.broadcastMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user')
        .leftJoinAndSelect('message.speaker', 'speaker')
        .where('message.roomId = :roomId', { roomId: mainRoom.id })
        .andWhere('message.isActive = :isActive', { isActive: true })
        .orderBy('message.createdAt', 'ASC') // Chronological order like real chat
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      // Get online users
      const onlineUsers = await this.getActiveParticipants(mainRoom.id);

      const formattedMessages = messages.map(msg => this.formatMessageResponse(msg));

      return {
        messages: formattedMessages,
        onlineUsers,
        totalMessages: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        room: this.formatRoomResponse(mainRoom),
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all messages');
      return {
        messages: [],
        onlineUsers: [],
        totalMessages: 0,
        currentPage: 1,
        totalPages: 0,
        room: null,
      };
    }
  }

  // Get live messages (for real-time updates)
  async getLiveMessages(lastUpdate?: string) {
    try {
      const mainRoom = await this.getOrCreateMainRoom();

      const queryBuilder = this.broadcastMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user')
        .leftJoinAndSelect('message.speaker', 'speaker')
        .where('message.roomId = :roomId', { roomId: mainRoom.id })
        .andWhere('message.isActive = :isActive', { isActive: true });

      // Filter by last update for live updates
      if (lastUpdate) {
        queryBuilder.andWhere('message.createdAt > :lastUpdate', { 
          lastUpdate: new Date(lastUpdate) 
        });
      }

      queryBuilder.orderBy('message.createdAt', 'ASC');

      const messages = await queryBuilder.getMany();
      const onlineUsers = await this.getActiveParticipants(mainRoom.id);

      return {
        messages: messages.map(msg => this.formatMessageResponse(msg)),
        onlineUsers,
        lastUpdate: new Date().toISOString(),
        hasNewMessages: messages.length > 0,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get live messages');
      return {
        messages: [],
        onlineUsers: [],
        lastUpdate: new Date().toISOString(),
        hasNewMessages: false,
      };
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const mainRoom = await this.getOrCreateMainRoom();
      return await this.getActiveParticipants(mainRoom.id);
    } catch (error: any) {
      return [];
    }
  }

  // Get or create main broadcast room
  private async getOrCreateMainRoom(): Promise<BroadcastRoom> {
    try {
      // Look for existing main room
      let mainRoom = await this.broadcastRoomRepository.findOne({
        where: { 
          name: 'Main Broadcast Chat',
          isActive: true 
        },
        relations: ['event', 'speaker']
      });

      if (mainRoom) {
        return mainRoom;
      }

      // Create main room
      const defaultEvent = await this.getOrCreateDefaultEvent();
      const generalSpeaker = await this.getOrCreateGeneralSpeaker();

      mainRoom = this.broadcastRoomRepository.create({
        name: 'Main Broadcast Chat',
        description: 'Main chat room where everyone can talk with speakers',
        eventId: defaultEvent.id,
        speakerId: generalSpeaker.id,
        isLive: true,
        isActive: true,
        activeUsers: 0,
        totalMessages: 0,
      });

      const savedRoom = await this.broadcastRoomRepository.save(mainRoom);

      // Send welcome message
      await this.sendSystemMessage(
        savedRoom.id, 
        'Welcome to Main Broadcast Chat! Ask questions and chat with speakers here! 🎤'
      );

      return savedRoom;
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get or create main room');
      throw error;
    }
  }

  // =============== SPEAKER CHAT SYSTEM ===============

  // Join specific speaker's chat room
  async joinSpeakerChat(speakerId: string, userId: string) {
    try {
      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', speakerId);
      }

      // Get or create speaker room
      const speakerRoom = await this.getOrCreateSpeakerRoom(speakerId);
      
      // Join user to speaker room
      const joinResult = await this.joinRoom({ roomId: speakerRoom.id }, userId);
      
      // Get recent messages
      const recentMessages = await this.getSpeakerChatMessages(speakerId, userId, 1, 20);

      return {
        room: this.formatRoomResponse(speakerRoom),
        speaker: {
          id: speaker.id,
          name: speaker.name,
          companyName: speaker.companyName,
          position: speaker.position,
          speakerProfile: speaker.speakerProfile,
        },
        joinResult,
        recentMessages: recentMessages.messages,
        onlineUsers: recentMessages.onlineUsers,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Join speaker chat');
      throw error;
    }
  }

  // Send message to specific speaker (check if user joined first)
  async sendMessageToSpeaker(speakerId: string, messageText: string, userId: string, isAnonymous: boolean = false) {
    try {
      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', speakerId);
      }

      // Get speaker room
      const speakerRoom = await this.getOrCreateSpeakerRoom(speakerId);

      // Check if user has joined this room
      const participant = await this.roomParticipantRepository.findOne({
        where: { 
          roomId: speakerRoom.id,
          userId: userId,
          isOnline: true
        }
      });

      if (!participant) {
        throw new ValidationException(`You must join ${speaker.name}'s chat room first before sending messages`);
      }

      // Get user info
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is the speaker themselves
      const isSpeaker = speakerId === userId;

      // Create message with speaker mention
      const message = this.broadcastMessageRepository.create({
        message: `@${speaker.name}: ${messageText}`, // Mention speaker in message
        messageType: MessageType.TEXT,
        isAnonymous: isAnonymous,
        roomId: speakerRoom.id,
        userId: userId,
        ...(isSpeaker && { speakerId: userId }),
      });

      const savedMessage = await this.broadcastMessageRepository.save(message);

      // Update room message count
      await this.broadcastRoomRepository.update(
        { id: speakerRoom.id },
        { totalMessages: () => 'totalMessages + 1' }
      );

      return {
        message: this.formatMessageResponse(savedMessage, user, isSpeaker ? speaker : undefined),
        speaker: {
          id: speaker.id,
          name: speaker.name,
          companyName: speaker.companyName,
          position: speaker.position,
        },
        targetSpeaker: speaker.name,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Send message to speaker');
      throw error;
    }
  }

  // Get chat messages with specific speaker (check if user joined)
  async getSpeakerChatMessages(speakerId: string, userId: string, page: number = 1, limit: number = 50) {
    try {
      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', speakerId);
      }

      // Get speaker room
      const speakerRoom = await this.getOrCreateSpeakerRoom(speakerId);

      // Check if user has joined this room
      const participant = await this.roomParticipantRepository.findOne({
        where: { 
          roomId: speakerRoom.id,
          userId: userId
        }
      });

      if (!participant) {
        throw new ValidationException(`You must join ${speaker.name}'s chat room first to view messages`);
      }

      const offset = (page - 1) * limit;

      // Get messages with users and speakers
      const [messages, total] = await this.broadcastMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user')
        .leftJoinAndSelect('message.speaker', 'speaker')
        .where('message.roomId = :roomId', { roomId: speakerRoom.id })
        .andWhere('message.isActive = :isActive', { isActive: true })
        .orderBy('message.createdAt', 'ASC') // Chronological order
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      // Get online users in this room
      const onlineUsers = await this.getActiveParticipants(speakerRoom.id);

      const formattedMessages = messages.map(msg => this.formatMessageResponse(msg));

      return {
        messages: formattedMessages,
        speaker: {
          id: speaker.id,
          name: speaker.name,
          companyName: speaker.companyName,
          position: speaker.position,
        },
        onlineUsers,
        totalMessages: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        room: this.formatRoomResponse(speakerRoom),
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get speaker chat messages');
      throw error;
    }
  }

  // Get live updates from speaker chat
  async getSpeakerLiveUpdates(speakerId: string, userId: string, lastUpdate?: string) {
    try {
      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', speakerId);
      }

      // Get speaker room
      const speakerRoom = await this.getOrCreateSpeakerRoom(speakerId);

      // Check if user has joined this room
      const participant = await this.roomParticipantRepository.findOne({
        where: { 
          roomId: speakerRoom.id,
          userId: userId,
          isOnline: true
        }
      });

      if (!participant) {
        throw new ValidationException(`You must join ${speaker.name}'s chat room first`);
      }

      const queryBuilder = this.broadcastMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user')
        .leftJoinAndSelect('message.speaker', 'speaker')
        .where('message.roomId = :roomId', { roomId: speakerRoom.id })
        .andWhere('message.isActive = :isActive', { isActive: true });

      // Filter by last update for live updates
      if (lastUpdate) {
        queryBuilder.andWhere('message.createdAt > :lastUpdate', { 
          lastUpdate: new Date(lastUpdate) 
        });
      }

      queryBuilder.orderBy('message.createdAt', 'ASC');

      const messages = await queryBuilder.getMany();
      const onlineUsers = await this.getActiveParticipants(speakerRoom.id);

      return {
        messages: messages.map(msg => this.formatMessageResponse(msg)),
        speaker: {
          id: speaker.id,
          name: speaker.name,
          companyName: speaker.companyName,
          position: speaker.position,
        },
        onlineUsers,
        lastUpdate: new Date().toISOString(),
        newMessages: messages.length,
        hasNewMessages: messages.length > 0,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get speaker live updates');
      throw error;
    }
  }

  // Get user's joined speaker rooms
  async getUserJoinedRooms(userId: string) {
    try {
      const participants = await this.roomParticipantRepository.find({
        where: { 
          userId: userId,
          isOnline: true
        },
        relations: ['room', 'room.speaker'],
        order: { joinedAt: 'DESC' }
      });

      return participants.map(p => ({
        roomId: p.room?.id,
        speaker: p.room?.speaker ? {
          id: p.room.speaker.id,
          name: p.room.speaker.name,
          companyName: p.room.speaker.companyName,
          position: p.room.speaker.position,
        } : null,
        joinedAt: p.joinedAt,
        lastSeen: p.lastSeen,
        roomName: p.room?.name,
      }));
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get user joined rooms');
      return [];
    }
  }

  // Get available speakers for broadcast (updated)
  async getAvailableSpeakers() {
    try {
      const speakers = await this.speakerRepository.find({
        select: [
          'id', 
          'name', 
          'companyName', 
          'position', 
          'speakerProfile'
        ],
        order: { name: 'ASC' }
      });

      return speakers.map(speaker => ({
        id: speaker.id,
        name: speaker.name,
        companyName: speaker.companyName,
        position: speaker.position,
        speakerProfile: speaker.speakerProfile,
        joinUrl: `/api/events/broadcast/speaker/${speaker.id}/join`,
        chatUrl: `/api/events/broadcast/speaker/${speaker.id}/messages`,
      }));
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get available speakers');
      return [];
    }
  }
} 