import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { AgendaCategory } from './agenda.entity';

export class CreateEventAgendaDto {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsNotEmpty()
  @IsUUID()
  exhibitorId!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  time!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours in minutes
  duration!: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsNotEmpty()
  @IsEnum(AgendaCategory)
  category!: AgendaCategory;

  @IsNotEmpty()
  @IsUUID()
  createdBy!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEventAgendaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  time?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  duration?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsEnum(AgendaCategory)
  category?: AgendaCategory;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EventAgendaResponseDto {
  id!: string;
  eventId!: string;
  exhibitorId!: string;
  title!: string;
  time!: string;
  duration!: number;
  location?: string;
  details?: string;
  category!: AgendaCategory;
  isActive!: boolean;
  createdBy!: string;
  createdAt!: Date;
  updatedAt!: Date;
  exhibitor?: {
    id: string;
    companyName: string;
    companyDescription?: string;
    logo?: string;
    email?: string;
    mobile?: string;
    uen?: string;
  };
}

export class EventAgendaListResponseDto {
  id!: string;
  eventId!: string;
  exhibitorId!: string;
  title!: string;
  time!: string;
  duration!: number;
  location?: string;
  details?: string;
  category!: AgendaCategory;
  createdBy!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  exhibitor?: {
    id: string;
    companyName: string;
    companyDescription?: string;
    logo?: string;
  };
}
