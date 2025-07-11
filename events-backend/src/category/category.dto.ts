// src/dto/category.dto.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CategoryDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
} 