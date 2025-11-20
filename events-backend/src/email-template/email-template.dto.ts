import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  subject!: string;

  @IsNotEmpty()
  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  variables?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['welcome', 'password-reset', 'event-registration', 'event-reminder', 'notification', 'custom'])
  type?: 'welcome' | 'password-reset' | 'event-registration' | 'event-reminder' | 'notification' | 'custom';
}

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  variables?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['welcome', 'password-reset', 'event-registration', 'event-reminder', 'notification', 'custom'])
  type?: 'welcome' | 'password-reset' | 'event-registration' | 'event-reminder' | 'notification' | 'custom';
}

export class RenderEmailTemplateDto {
  @IsNotEmpty()
  @IsString()
  templateId!: string;

  @IsOptional()
  variables?: Record<string, any>; // Variables to replace in template
}

