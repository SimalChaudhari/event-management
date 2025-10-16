import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateEngagementDto {
  @IsUUID()
  trackId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEngagementDto {
  @IsOptional()
  @IsUUID()
  trackId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

