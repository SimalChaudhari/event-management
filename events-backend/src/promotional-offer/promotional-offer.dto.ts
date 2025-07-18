import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreatePromotionalOfferDto {
  @IsNotEmpty()
  @IsString()
  companyName!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  validDate?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNotEmpty()
  @IsUUID()
  exhibitorId!: string;
}

export class UpdatePromotionalOfferDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  validDate?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 