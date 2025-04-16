// src/dto/event.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, Matches, Validate } from 'class-validator';

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
    country?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsEnum(EventType)
    type?: EventType;

    @IsOptional()
    price?: number;

    @IsOptional()
    @IsString()
    currency?: string;
    
    @IsOptional()
    speakerIds?: string; // Keep this as a string for comma-separated values
}