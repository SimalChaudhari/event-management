// src/dto/survey.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsDate, IsArray, IsDateString, Validate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSurveyDto {
  @IsUUID()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  // Make date and time fields optional - will be auto-filled from event
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  surveyUrls?: Array<{ title: string; url: string }>;

  @IsArray()
  @IsOptional()
  sessions?: CreateSessionDto[];
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class EventSuggestionDto {
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;
}

export class UpdateSurveyDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  surveyUrls?: Array<{ title: string; url: string }>;

  @IsArray()
  @IsOptional()
  sessions?: CreateSessionDto[];
}


export class UpdateSessionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SurveyResponseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  comment!: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;
}
