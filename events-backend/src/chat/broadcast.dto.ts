// src/chat/broadcast.dto.ts
import { IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsString, MaxLength, IsEnum } from 'class-validator';
import { MessageType } from './broadcast.entity';

export class CreateBroadcastRoomDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'Room name cannot exceed 100 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  speakerId!: string;
}

export class JoinRoomDto {
  @IsNotEmpty()
  @IsUUID()
  roomId!: string;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message!: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;

  @IsNotEmpty()
  @IsUUID()
  roomId!: string;
}

export class PinMessageDto {
  @IsNotEmpty()
  @IsUUID()
  messageId!: string;
}

export class GetMessagesDto {
  @IsNotEmpty()
  @IsUUID()
  roomId!: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 50;

  @IsOptional()
  lastMessageId?: string; // For pagination
}

export class LiveUpdatesDto {
  @IsNotEmpty()
  @IsUUID()
  roomId!: string;

  @IsOptional()
  lastUpdate?: string; // ISO timestamp
} 