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

  // Add new profile field
  @IsOptional()
  @IsString()
  profile?: string;

  // Add new bothNumber field
  @IsOptional()
  @IsString()
  bothNumber?: string;

  @IsOptional()
  @IsArray()
  flyers?: string[];

  // Add flyer names field
  @IsOptional()
  @IsArray()
  flyerNames?: string[];

  @IsOptional()
  promotionalOffers?: PromotionalOfferDto[];

  @IsOptional()
  @IsArray()
  documents?: string[];

  // Add document names field (Event जैसा ही)
  @IsOptional()
  @IsArray()
  documentNames?: string[];

  @IsOptional()
  @IsArray()
  eventImages?: string[];

  // Add event image names field
  @IsOptional()
  @IsArray()
  eventImageNames?: string[];

  // For handling existing files during update
  @IsOptional()
  @IsArray()
  originalFlyers?: string[];

  // Add original flyer names field
  @IsOptional()
  @IsArray()
  originalFlyerNames?: string[];

  @IsOptional()
  @IsArray()
  originalDocuments?: string[];

  // Add this for handling existing document names (Event जैसा ही)
  @IsOptional()
  @IsArray()
  originalDocumentNames?: string[];

  @IsOptional()
  @IsArray()
  originalEventImages?: string[];

  // Add original event image names field
  @IsOptional()
  @IsArray()
  originalEventImageNames?: string[];
}
