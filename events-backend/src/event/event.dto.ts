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
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Column } from 'typeorm';
import { Type } from 'class-transformer';
import { CreateEventStampDto } from './event-stamp.dto';

// Custom validator for time format
class IsTimeFormat {
  validate(value: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }
}

export enum EventType {
  Physical = 'Physical',
  Virtual = 'Virtual',
}

export class EventDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  // Event code from Salesforce/external system - used for SSO sync
  @IsOptional()
  @IsString()
  eventCode?: string;

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

  // Publish dates - determines when event is visible on the app
  @IsOptional()
  @IsDateString()
  publishStartDate?: string;

  @IsOptional()
  @IsDateString()
  publishEndDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  exhibitorDescription?: string;

  @IsOptional()
  @IsString()
  eventStampDescription?: string;

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
  @IsNumber()
  gstRate?: number;

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

  // Background image for Q&A pages
  @IsOptional()
  @IsString()
  backgroundImage?: string;

  // Event Stamp fields - use stamp IDs instead of images
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  eventStampIds?: string[]; // Array of existing stamp IDs to associate

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventStampDto)
  newStamps?: CreateEventStampDto[]; // New stamps to create during event creation

  @IsOptional()
  @Column('simple-array', { nullable: true })
  documents?: string[];
  
    // Add this new field for document names
    @IsOptional()
    @Column('simple-array', { nullable: true })
    documentNames?: string[];

  @IsOptional()
  speakerIds?: string;

  // Tab visibility configuration
  @IsOptional()
  tabVisibility?: {
    speakers?: boolean;
    documents?: boolean;
    floorplan?: boolean;
    gallery?: boolean;
    stamps?: boolean;
    survey?: boolean;
    exhibitors?: boolean;
    categories?: boolean;
    agenda?: boolean;
    adminInfo?: boolean;
    engagement?: boolean;
  };

  originalImages: any;
  originalDocuments: any;
  originalFloorPlan: any;
  originalDocumentNames: any; // Add this line
  originalBackgroundImage: any;
}

