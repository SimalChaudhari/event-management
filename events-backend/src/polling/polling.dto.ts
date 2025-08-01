// src/polling/polling.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsUUID, ValidateNested, ArrayMinSize, IsEnum, IsUrl } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PollType, ExternalPlatform } from './polling.entity';

export class QuizOptionDto {
  @IsNotEmpty()
  @IsString()
  optionText!: string;

  @IsNotEmpty()
  @IsBoolean()
  isCorrectAnswer!: boolean;
}

export class CreateQuizQuestionDto {
  @IsNotEmpty()
  @IsString()
  question!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  // नया field add करें speaker के लिए
  @IsOptional()
  @IsUUID()
  speakerId?: string;

  @IsOptional()
  @IsBoolean()
  allowMultipleSelection?: boolean;

  @IsOptional()
  pollType?: PollType;

  @IsOptional()
  externalUrl?: string;

  @IsOptional()
  platform?: ExternalPlatform;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options!: QuizOptionDto[];
}

export class UpdateQuizQuestionDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMultipleSelection?: boolean;

  // नया field add करें speaker update के लिए
  @IsOptional()
  @IsUUID()
  speakerId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options?: QuizOptionDto[];
}

// StartQuizDto में भी speakerId add करें
export class StartQuizDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  // Remove @IsOptional - speakerId is now required
  @IsNotEmpty()
  @IsUUID()
  speakerId!: string;
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