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
  @IsOptional()
  @IsString()
  userId?: string; // Reference to User table - optional for self-registration

  // User fields for admin to create full exhibitor with user
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

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
