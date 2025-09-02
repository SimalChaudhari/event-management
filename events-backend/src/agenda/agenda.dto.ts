import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUUID,
  IsArray,
  IsDateString,
  Min,
  Max,
  Matches,
  Validate,
} from 'class-validator';
import { MeetingStatus, RequestStatus, RequestType } from './agenda.entity';

// Custom validator for future dates
export class FutureDateValidator {
  static validate(value: string): boolean {
    const date = new Date(value);
    const now = new Date();
    return date > now;
  }
}

export class CreateEventAgendaDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  time!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours in minutes
  duration!: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId!: string;

  @IsNotEmpty()
  @IsUUID()
  createdBy!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // New meeting fields
  @IsOptional()
  @IsEnum(MeetingStatus)
  meetingStatus?: MeetingStatus;

  @IsOptional()
  @IsEnum(RequestStatus)
  requestStatus?: RequestStatus;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attendees?: string[];

  @IsOptional()
  @IsBoolean()
  isMeetingRequest?: boolean;

  @IsOptional()
  @IsDateString()
  meetingDate?: string;
}

export class UpdateEventAgendaDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  time?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  duration?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // New meeting fields
  @IsOptional()
  @IsEnum(MeetingStatus)
  meetingStatus?: MeetingStatus;

  @IsOptional()
  @IsEnum(RequestStatus)
  requestStatus?: RequestStatus;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attendees?: string[];

  @IsOptional()
  @IsString()
  meetingNotes?: string;

  @IsOptional()
  @IsBoolean()
  isMeetingRequest?: boolean;

  @IsOptional()
  @IsDateString()
  meetingDate?: string;
}

// New DTOs for meeting functionality
export class CreateMeetingRequestDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  targetUserId!: string; // User to meet with

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  time!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(15)
  @Max(480) // Max 8 hours in minutes
  duration!: number;

  @IsNotEmpty()
  @IsDateString()
  meetingDate!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  meetingNotes?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class RespondToMeetingRequestDto {
  @IsNotEmpty()
  @IsEnum(RequestStatus)
  response!: RequestStatus;

  @IsOptional()
  @IsString()
  message?: string; // Optional message when accepting/rejecting
}

export class RescheduleMeetingDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  newTime!: string;

  @IsNotEmpty()
  @IsDateString()
  newDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  newLocation?: string;

  @IsOptional()
  @IsString()
  newDetails?: string;
}

export class EventAgendaResponseDto {
  id!: string;
  eventId!: string;
  userId!: string;
  title!: string;
  time!: string;
  duration!: number;
  location?: string;
  details?: string;
  categoryId!: string;
  isActive!: boolean;
  createdBy!: string;
  createdAt!: Date;
  updatedAt!: Date;
  
  // New meeting fields
  meetingStatus?: MeetingStatus;
  requestStatus?: RequestStatus;
  requestType?: RequestType;
  attendees?: string[];
  meetingNotes?: string;
  isMeetingRequest?: boolean;
  meetingDate?: Date;
}

export class EventAgendaListResponseDto {
  id!: string;
  eventId!: string;
  userId!: string;
  title!: string;
  time!: string;
  duration!: number;
  location?: string;
  details?: string;
  categoryId!: string;
  createdBy!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  // New meeting fields
  meetingStatus?: MeetingStatus;
  requestStatus?: RequestStatus;
  requestType?: RequestType;
  attendees?: string[];
  meetingNotes?: string;
  isMeetingRequest?: boolean;
  meetingDate?: Date;
}
