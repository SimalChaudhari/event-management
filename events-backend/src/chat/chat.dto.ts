import { IsUUID, IsNotEmpty, IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { MessageType } from './chat.entity';

export class SendMessageDto {
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @Transform(({ value }) => value?.trim())
  msg!: string;

  @IsOptional()
  @IsUUID(4, { message: 'Reply must be a valid UUID' })
  reply?: string;

  @IsOptional()
  @IsEnum(MessageType, { message: 'Invalid message type' })
  msgType?: MessageType;

  @IsOptional()
  msgJson?: any;
}

export class GetChatDto {
  @IsUUID(4, { message: 'ReceiverID must be a valid UUID' })
  @IsNotEmpty({ message: 'ReceiverID is required' })
  receiverID!: string;

  @IsOptional()
  @IsInt({ message: 'Pagination count must be an integer' })
  @Min(1, { message: 'Pagination count must be at least 1' })
  @Transform(({ value }) => parseInt(value))
  paginationCount?: number = 20;

  @IsOptional()
  @IsInt({ message: 'Pagination page must be an integer' })
  @Min(1, { message: 'Pagination page must be at least 1' })
  @Transform(({ value }) => parseInt(value))
  paginationCurrentPage?: number = 1;
}

export class CreateThreadDto {
  @IsUUID()
  receiverID!: string;
}

export class MarkReadDto {
  @IsUUID(4, { message: 'ThreadID must be a valid UUID' })
  @IsNotEmpty({ message: 'ThreadID is required' })
  threadID!: string;

  @IsOptional()
  @IsUUID(4, { message: 'MessageID must be a valid UUID' })
  msgID?: string;
}



export class SendMessageWithReceiverDto {
  @IsUUID(4, { message: 'ReceiverID must be a valid UUID' })
  @IsNotEmpty({ message: 'ReceiverID is required' })
  receiverID!: string;

  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @Transform(({ value }) => value?.trim())
  msg!: string;

  @IsOptional()
  @IsUUID(4, { message: 'Reply must be a valid UUID' })
  reply?: string;

  @IsOptional()
  @IsEnum(MessageType, { message: 'Invalid message type' })
  msgType?: MessageType;

  @IsOptional()
  msgJson?: any;
}

export class DeleteMessageDto {
  @IsUUID(4, { message: 'MessageID must be a valid UUID' })
  @IsNotEmpty({ message: 'MessageID is required' })
  msgID!: string;

  @IsUUID(4, { message: 'ThreadID must be a valid UUID' })
  @IsNotEmpty({ message: 'ThreadID is required' })
  threadID!: string;
}

export class DeleteAllMessagesDto {
  @IsUUID(4, { message: 'ThreadID must be a valid UUID' })
  @IsNotEmpty({ message: 'ThreadID is required' })
  threadID!: string;

  @IsUUID(4, { message: 'ReceiverID must be a valid UUID' })
  @IsNotEmpty({ message: 'ReceiverID is required' })
  receiverID!: string;
}

export class EditMessageDto {
  @IsUUID(4, { message: 'MessageID must be a valid UUID' })
  @IsNotEmpty({ message: 'MessageID is required' })
  msgID!: string;

  @IsUUID(4, { message: 'ThreadID must be a valid UUID' })
  @IsNotEmpty({ message: 'ThreadID is required' })
  threadID!: string;

  @IsString({ message: 'New message must be a string' })
  @IsNotEmpty({ message: 'New message cannot be empty' })
  @Transform(({ value }) => value?.trim())
  newMsg!: string;
}

export class GetChatListDto {
  @IsOptional()
  @IsInt({ message: 'Pagination count must be an integer' })
  @Min(1, { message: 'Pagination count must be at least 1' })
  @Transform(({ value }) => parseInt(value))
  paginationCount?: number = 20;

  @IsOptional()
  @IsInt({ message: 'Pagination page must be an integer' })
  @Min(1, { message: 'Pagination page must be at least 1' })
  @Transform(({ value }) => parseInt(value))
  paginationCurrentPage?: number = 1;

  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  /** When provided, only return chat threads with other registered attendees of this event (event chatroom). */
  @IsOptional()
  @IsUUID(4, { message: 'EventID must be a valid UUID' })
  eventId?: string;
}