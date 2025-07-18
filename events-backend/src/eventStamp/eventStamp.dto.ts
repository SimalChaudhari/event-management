// src/dto/eventStamp.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
} from 'class-validator';

export class CreateEventStampDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class UpdateEventStampDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class CreateOrUpdateEventStampDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class EventStampResponseDto {
  id!: string;
  eventId!: string;
  description?: string;
  images?: string[];
  createdAt!: Date;
  updatedAt!: Date;
} 