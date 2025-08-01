// src/chat/chat.dto.ts
import { IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsString, MaxLength } from 'class-validator';

export class PostQuestionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000, { message: 'Question cannot exceed 1000 characters' })
  message!: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  speakerId!: string;
}

export class LikeQuestionDto {
  @IsNotEmpty()
  @IsUUID()
  questionId!: string;
}

export class PostAnswerDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000, { message: 'Answer cannot exceed 1000 characters' })
  message!: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;

  @IsNotEmpty()
  @IsUUID()
  questionId!: string;
}

export class GetQuestionsDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  speakerId!: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  sortBy?: 'likes' | 'recent' | 'answered' = 'likes';
} 