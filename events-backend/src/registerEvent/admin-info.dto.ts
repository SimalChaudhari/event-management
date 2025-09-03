import { Type } from 'class-transformer';
import { IsOptional, IsString, IsArray, IsUUID, IsBoolean, ValidateNested } from 'class-validator';

// DTO for creating/updating individual admin info
export class CreateAdminInfoDto {
  @IsUUID()
  registerEventId!: string;

  @IsOptional()
  @IsString()
  luckyDrawNumber?: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @IsOptional()
  @IsString()
  dressCode?: string;

  @IsOptional()
  @IsString()
  hall?: string;
}

// DTO for updating admin info
export class UpdateAdminInfoDto {
  @IsOptional()
  @IsString()
  luckyDrawNumber?: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @IsOptional()
  @IsString()
  dressCode?: string;

  @IsOptional()
  @IsString()
  hall?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// DTO for CSV row data
export class CsvRowData {
  @IsString()
  registerEventId!: string;

  @IsOptional()
  @IsString()
  luckyDrawNumber?: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  dressCode?: string;

  @IsOptional()
  @IsString()
  hall?: string;
}

// admin-info.dto.ts

// Individual item for bulk upload
export class BulkAdminInfoItemDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  luckyDrawNumber?: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @IsOptional()
  @IsString()
  dressCode?: string;

  @IsOptional()
  @IsString()
  hall?: string;
}

// Bulk upload DTO
export class BulkUploadAdminInfoDto {
  @IsUUID()
  eventId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAdminInfoItemDto)
  bulkData!: BulkAdminInfoItemDto[];
}

// Response DTO
export class BulkUpdateResponseDto {
  success!: boolean;
  message!: string;
  totalProcessed!: number;
  successfulUpdates!: number;
  failedUpdates!: number;
  errors?: string[];
}