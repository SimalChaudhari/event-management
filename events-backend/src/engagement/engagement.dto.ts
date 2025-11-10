import { Type } from 'class-transformer';
import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';

export class CreateEngagementDto {
  @IsUUID()
  trackId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNotEmpty({ message: 'sessionIds is required' })
  @IsArray()
  @IsUUID('4', { each: true })
  sessionIds!: string[];
}

export class UpdateEngagementDto {
  @IsOptional()
  @IsUUID()
  trackId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNotEmpty({ message: 'sessionIds is required' })
  @IsArray()
  @IsUUID('4', { each: true })
  sessionIds!: string[];
}

export class ReorderEngagementItemDto {
  @IsUUID()
  id!: string;

  @IsInt()
  @Min(0)
  displayOrder!: number;
}

export class UpdateEngagementOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderEngagementItemDto)
  items!: ReorderEngagementItemDto[];
}

