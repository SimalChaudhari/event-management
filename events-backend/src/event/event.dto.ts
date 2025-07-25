// src/dto/event.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches,
  Validate,
  IsUUID,
} from 'class-validator';
import { Column } from 'typeorm';

// Custom validator for time format
class IsTimeFormat {
  validate(value: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }
}

export enum EventType {
  Physical = 'Physical',
  Virtual = 'Virtual',
  Hybrid = 'Hybrid',
}

export class EventDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(IsTimeFormat)
  startTime!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(IsTimeFormat)
  endTime!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  exhibitorDescription?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  latitude?: number; // Latitude of the venue

  @IsOptional()
  longitude?: number; // Longitude of the venue

  @IsOptional()
  @IsString()
  country?: string;

  // Multiple images support
  @IsOptional()
  images?: string[];

  // Multiple PDF documents support
  // @IsOptional()
  // documents?: string[];

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  // Category field
  @IsOptional()
  @IsUUID()
  categoryIds?: string;

  @IsOptional()
  exhibitorIds?: string; // Add this field
  
  // Floor plan - single image
  @IsOptional()
  @IsString()
  floorPlan?: string;

    // Event Stamp fields
    @IsOptional()
    @IsString()
    eventStampDescription?: string;
  
    @IsOptional()
    eventStampImages?: string[];

    @IsOptional()
    @Column('simple-array', { nullable: true })
    documents?: string[];
  
    // Add this new field for document names
    @IsOptional()
    @Column('simple-array', { nullable: true })
    documentNames?: string[];

  @IsOptional()
  speakerIds?: string;
  originalImages: any;
  originalDocuments: any;
  originalEventStampImages: any;
  originalFloorPlan: any;
  originalDocumentNames: any; // Add this line
}

