import { IsNotEmpty, IsString, IsEmail, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class PromotionalOfferDto {
  @IsNotEmpty()
  @IsString()
  companyName!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  validDate?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;


}

export class ExhibitorDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  userName!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  mobile!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  companyName!: string;

  @IsOptional()
  @IsString()
  companyDescription?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  flyers?: string[];

  @IsOptional()
  promotionalOffers?: PromotionalOfferDto[];

  @IsOptional()
  @IsArray()
  documents?: string[];

  @IsOptional()
  @IsArray()
  eventImages?: string[];

  // For handling existing files during update
  @IsOptional()
  @IsArray()
  originalFlyers?: string[];

  @IsOptional()
  @IsArray()
  originalDocuments?: string[];

  @IsOptional()
  @IsArray()
  originalEventImages?: string[];
}
