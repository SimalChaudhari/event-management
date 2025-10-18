import { IsNotEmpty, IsEmail, IsOptional, IsString, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class CreateModeratorDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

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
  name?: string;

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

