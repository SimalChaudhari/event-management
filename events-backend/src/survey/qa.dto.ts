// src/dto/qa.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsUUID, 
  IsBoolean, 
  IsEnum, 
  IsArray, 
  IsInt, 
  IsObject,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize
} from 'class-validator';
import { QuestionType, QuestionStatus } from './qa.entity';

export class CreateQuestionDto {
  @IsUUID()
  @IsNotEmpty()
  surveyId!: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  questionName!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  questionType!: QuestionType;

  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  orderIndex?: number;

  // For radio questions
  @IsArray()
  @IsOptional()
  @ArrayMinSize(2, { message: 'At least 2 options are required for radio questions' })
  @ArrayMaxSize(20, { message: 'Maximum 20 options allowed' })
  options?: string[];

  // For rating questions
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  minRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxRating?: number;

  @IsString()
  @IsOptional()
  ratingLabel?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  questionName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  orderIndex?: number;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(2, { message: 'At least 2 options are required for radio questions' })
  @ArrayMaxSize(20, { message: 'Maximum 20 options allowed' })
  options?: string[];

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  minRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxRating?: number;

  @IsString()
  @IsOptional()
  ratingLabel?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SubmitAnswerDto {
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @IsUUID()
  @IsNotEmpty()
  surveyId!: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;  // If true, saves as draft (answering status)

  @IsString()
  @IsOptional()
  textAnswer?: string;

  @IsArray()
  @IsOptional()
  selectedOptions?: string[];

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  ratingAnswer?: number;
}

export class BulkSubmitAnswersDto {
  @IsUUID()
  @IsNotEmpty()
  surveyId!: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;  // If true, saves all as draft

  @IsArray()
  @IsNotEmpty()
  answers!: Array<{
    questionId: string;
    textAnswer?: string;
    selectedOptions?: string[];
    ratingAnswer?: number;
  }>;
}

export class QuestionResponseDto {
  id!: string;
  surveyId!: string;
  questionName!: string;
  description!: string;
  questionType!: QuestionType;
  status!: QuestionStatus;
  isRequired!: boolean;
  orderIndex!: number;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  ratingLabel?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class AnswerResponseDto {
  id!: string;
  questionId!: string;
  surveyId!: string;
  sessionId!: string;
  eventId!: string;
  userId!: string;
  textAnswer?: string;
  selectedOptions?: string[];
  ratingAnswer?: number;
  isAnswered!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}