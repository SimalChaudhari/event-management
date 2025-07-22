// src/dto/category.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export const STATUS_OPTIONS = ['active', 'inactive'];

export class CategoryDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(STATUS_OPTIONS)
  status!: string;
} 