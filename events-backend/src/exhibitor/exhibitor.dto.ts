import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean, IsEmail } from 'class-validator';

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

export class FlyerDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  flyer!: string;
}

export class DocumentDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  document!: string;
}

export class EventImageDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  eventImage!: string;
}

export class ExhibitorDto {
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

  // Add new fields: email, mobile, UEN, and logo
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  uen?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  // Updated flyers structure - array of objects with name and flyer
  @IsOptional()
  @IsArray()
  flyers?: FlyerDto[];

  // Comma-separated names for uploaded flyers (form-data)
  @IsOptional()
  @IsString()
  flyerNames?: string;

  @IsOptional()
  promotionalOffers?: PromotionalOfferDto[];

  // Updated documents structure - array of objects with name and document
  @IsOptional()
  @IsArray()
  documents?: DocumentDto[];

  // Comma-separated names for uploaded documents (form-data)
  @IsOptional()
  @IsString()
  documentNames?: string;

  // Updated event images structure - array of objects with name and eventImage
  @IsOptional()
  @IsArray()
  eventImages?: EventImageDto[];

  // Comma-separated names for uploaded event images (form-data)
  @IsOptional()
  @IsString()
  eventImageNames?: string;

  // For handling existing files during update
  @IsOptional()
  @IsArray()
  originalFlyers?: FlyerDto[];

  @IsOptional()
  @IsArray()
  originalDocuments?: DocumentDto[];

  @IsOptional()
  @IsArray()
  originalEventImages?: EventImageDto[];
}
