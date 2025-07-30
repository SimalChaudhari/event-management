// src/polling/polling.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @IsBoolean()
  allowMultipleSelection?: boolean;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options?: QuizOptionDto[];
}

export class StartQuizDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;
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