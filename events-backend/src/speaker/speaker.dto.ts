// src/dto/speaker.dto.ts
import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class SpeakerDto {
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsString()
  companyName?: string;

  @IsNotEmpty()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  speakerProfile?: string; // This will be the filename (set by multer)
}
