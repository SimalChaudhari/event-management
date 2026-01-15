import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateEventStampDto {
  @IsNotEmpty()
  @IsString()
  name!: string; // Booth number

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsUUID()
  exhibitorId?: string; // Exhibitor (Company) ID

  @IsOptional()
  @IsBoolean()
  isVisited?: boolean; // Default false
}

export class UpdateEventStampDto {
  @IsOptional()
  @IsString()
  name?: string; // Booth number

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsUUID()
  exhibitorId?: string; // Exhibitor (Company) ID

  @IsOptional()
  @IsBoolean()
  isVisited?: boolean;
}
