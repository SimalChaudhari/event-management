import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateProgrammeTrackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProgrammeTrackDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProgrammeSessionDto {
  @IsUUID()
  trackId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  sessionDate!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  venue?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  speakerIds?: string[];
}

export class UpdateProgrammeSessionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  venue?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  speakerIds?: string[];
}

export class ProgrammeTrackResponseDto {
  id!: string;
  eventId!: string;
  title!: string;
  description?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  sessions?: ProgrammeSessionResponseDto[];
  event?: {
    id: string;
    name: string;
  };
}

export class ProgrammeSessionResponseDto {
  id!: string;
  trackId!: string;
  title!: string;
  description?: string;
  sessionDate!: Date;
  startTime!: string;
  endTime!: string;
  venue?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  speakers?: {
    id?: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    position: string;
    companyName: string;
    description: string;
    location: string;
    profilePicture: string;
    speakingStartTime: string;
    speakingEndTime: string;
  }[];
  track?: {
    id: string;
    title: string;
    event?: {
      id: string;
      name: string;
    };
  };
}
