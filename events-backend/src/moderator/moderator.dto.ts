import { IsNotEmpty, IsEmail, IsOptional, IsString, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class CreateModeratorDto {
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateModeratorDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignModeratorToEventDto {
  @IsNotEmpty()
  @IsUUID()
  moderatorId!: string;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsUUID()
  trackId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class AssignModeratorToSessionDto {
  @IsNotEmpty()
  @IsUUID()
  moderatorId!: string;

  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  trackId!: string;

  @IsNotEmpty()
  @IsUUID()
  sessionId!: string;
}

export class AssignMultipleEventsDto {
  @IsNotEmpty()
  @IsUUID()
  moderatorId!: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID(undefined, { each: true })
  eventIds!: string[];
}

