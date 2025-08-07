// src/qna/qna.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionSortBy {
  LIKES = 'likes',
  CREATED_AT = 'createdAt',
  ANSWERED_AT = 'answeredAt'
}

export enum QuestionStatus {
  ALL = 'all',
  ANSWERED = 'answered',
  UNANSWERED = 'unanswered'
}

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  question!: string;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  speakerId!: string; // Required - question must be for a specific speaker

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AnswerQuestionDto {
  @IsNotEmpty()
  @IsString()
  answer!: string;
}

export class LikeQuestionDto {
  @IsNotEmpty()
  @IsUUID()
  questionId!: string;
}

export class GetQuestionsDto {
  @IsNotEmpty() // Changed from @IsOptional() to @IsNotEmpty()
  @IsUUID()
  eventId!: string; // Required

  @IsNotEmpty() // Changed from @IsOptional() to @IsNotEmpty()
  @IsUUID()
  speakerId!: string; // Required - both event and speaker are compulsory

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus = QuestionStatus.ALL;

  @IsOptional()
  @IsEnum(QuestionSortBy)
  sortBy?: QuestionSortBy = QuestionSortBy.LIKES;

  @IsOptional()
  @IsBoolean()
  includeAnonymous?: boolean = true;
}

export class PinQuestionDto {
  @IsNotEmpty()
  @IsUUID()
  questionId!: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean = true;
} 