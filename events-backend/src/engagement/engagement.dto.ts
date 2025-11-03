import { IsUUID, IsOptional, IsBoolean, IsArray, IsNotEmpty } from 'class-validator';

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

