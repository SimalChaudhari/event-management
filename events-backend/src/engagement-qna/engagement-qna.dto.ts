import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUUID, IsEnum } from 'class-validator';

export enum QuestionSortBy {
  LIKES = 'likes',
  CREATED_AT = 'createdAt',
  ANSWERED_AT = 'answeredAt'
}

export enum QuestionStatus {
  ALL = 'all',
  NOT_ANSWERED = 'not_answered',
  ANSWERING = 'answering',
  ANSWERED = 'answered'
}

export class CreateEngagementQuestionDto {
  @IsNotEmpty()
  @IsString()
  question!: string;

  @IsNotEmpty()
  @IsUUID()
  engagementId!: string;

  @IsNotEmpty()
  @IsUUID()
  sessionId!: string;
}

export class UpdateEngagementQuestionDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AnswerEngagementQuestionDto {
  @IsNotEmpty()
  @IsString()
  answer!: string;
}

export class LikeEngagementQuestionDto {
  @IsNotEmpty()
  @IsUUID()
  questionId!: string;
}

export class GetEngagementQuestionsDto {
  @IsOptional()
  @IsUUID()
  engagementId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus = QuestionStatus.ALL;

  @IsOptional()
  @IsEnum(QuestionSortBy)
  sortBy?: QuestionSortBy = QuestionSortBy.LIKES;
}

