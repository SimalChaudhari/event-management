import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Base filter DTO for pagination and common filters
 * Can be extended for specific entity filters
 */
export class BaseFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'SortBy must be a string' })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'SortOrder must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * User-specific filter DTO
 */
export class UserFilterDto extends BaseFilterDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Role filter must be a string' })
  role?: string; // 'user', 'exhibitor', 'speaker', 'moderator', 'admin'

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'IsActive must be a boolean' })
  isActive?: boolean;
}

/**
 * Event-specific filter DTO
 */
export class EventFilterDto extends BaseFilterDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Keyword must be a string' })
  keyword?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Global search must be a string' })
  globalSearch?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Start date must be a string' })
  startDate?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'End date must be a string' })
  endDate?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Event type must be a string' })
  type?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Category must be a string' })
  category?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  @IsString({ message: 'Event name must be a string' })
  eventName?: string;

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'Upcoming must be a boolean' })
  upcoming?: boolean;
}

