// src/polling/polling.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsUUID, ValidateNested, ArrayMinSize, IsEnum, IsUrl, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ExternalPlatform } from './polling.entity';

export class PollOptionDto {
  @IsNotEmpty()
  @IsString()
  optionText!: string;
}

export class CreatePollDto {
  @IsNotEmpty()
  @IsString()
  question!: string;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty() // Add speakerId field
  @IsUUID()
  speakerId!: string;

  @IsOptional()
  @IsNumber()
  @Min(5, { message: 'Timer must be at least 5 seconds' })
  @Max(300, { message: 'Timer cannot exceed 300 seconds (5 minutes)' })
  timerSeconds?: number = 30; // Default 30 seconds

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options!: PollOptionDto[];
}

export class UpdatePollDto {
  @IsOptional()
  @IsString()
  question?: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @IsOptional()
  @IsNumber()
  questionOrder?: number;

  @IsOptional()
  @IsNumber()
  @Min(5, { message: 'Timer must be at least 5 seconds' })
  @Max(300, { message: 'Timer cannot exceed 300 seconds (5 minutes)' })
  timerSeconds?: number;
}

export class VoteDto {
  @IsNotEmpty()
  @IsUUID()
  pollId!: string;

  @IsNotEmpty()
  @IsUUID()
  optionId!: string;

  @IsNotEmpty()
  @IsUUID()
  speakerId!: string; // Add speakerId for voting
}

export class StartPollSessionDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsUUID()
  speakerId?: string;
}

export class SubmitVoteAndGetNextDto {
  @IsNotEmpty()
  @IsUUID()
  sessionId!: string;

  @IsNotEmpty()
  @IsUUID()
  pollId!: string;

  @IsNotEmpty()
  @IsUUID()
  optionId!: string;
}

export class QuizAnswerDto {
  @IsNotEmpty()
  @IsUUID()
  questionId!: string;

  @IsNotEmpty()
  @IsArray()
  selectedOptionIds!: string[];
}

export class SubmitQuizDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}

export class SubmitAnswerDto {
  @IsNotEmpty()
  @IsUUID()
  attemptId!: string;

  @IsNotEmpty()
  @IsUUID()
  questionId!: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one option must be selected' })
  @Transform(({ value }) => {
    // Ensure it's always an array
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  selectedOptions!: string[];
}

// Add these new DTOs for result queries

export class GetUserQuizResultDto {
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  speakerId?: string;
}

// New DTO for external polls
export class CreateExternalPollDto {
  @IsNotEmpty()
  question!: string;

  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsUrl()
  externalUrl!: string;

  @IsEnum(ExternalPlatform)
  platform!: ExternalPlatform;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsUUID()
  speakerId?: string;
} 