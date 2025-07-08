//users.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsEnum,
  MinLength,
} from 'class-validator';
import { AuthProvider, UserRole } from './users.entity';


export class UserDto {

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // Added field for user role

  @IsNotEmpty()
  @IsString()
  firstName?: string; // Updated field

  @IsNotEmpty()
  @IsString()
  lastName?: string; // Updated field

  @IsNotEmpty()
  @IsEmail()
  email?: string; // Updated field

  @IsNotEmpty()
  @IsString()
  password?: string; // Updated field

  @IsOptional()
  @IsString()
  mobile?: string; // Updated field

  @IsOptional()
  @IsString()
  address?: string; // Updated field

  @IsOptional()
  @IsString()
  city?: string; // Updated field

  @IsOptional()
  @IsString()
  state?: string; // Updated field

  @IsOptional()
  @IsString()
  postalCode?: string; // Updated field

  @IsOptional()
  @IsBoolean()
  isMember?: boolean; // Updated field

  @IsOptional()
  @IsBoolean()
  biometricEnabled?: boolean; // Updated field

  @IsOptional()
  @IsString()
  countryCurrency?: string; // Updated field

  @IsOptional()
  @IsString()
  profilePicture?: string; // Updated field

  @IsOptional()
  @IsString()
  linkedinProfile?: string; // Updated field

  @IsOptional()
  @IsString()
  resetToken?: string; // Updated field

  @IsOptional()
  resetTokenExpiry?: Date; // Updated field

  @IsOptional()
  @IsBoolean()
  isVerify?: boolean; // Updated field

  // @IsOptional()
  // @IsString()
  // otp?: string; // Updated field

  // @IsOptional()
  // otpExpiry?: Date; // Updated field

   // Optional field for Terms & Conditions acceptance
   @IsOptional()
   @IsBoolean()
   acceptTerms?: boolean;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}


export class SocialLoginDto {
  @IsNotEmpty()
  @IsString()
  accessToken!: string;

  @IsNotEmpty()
  @IsString()
  provider!: AuthProvider;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  idToken!: string; // Google ID token
}

export class FacebookLoginDto {
  @IsNotEmpty()
  @IsString()
  accessToken!: string;
}

export class AppleLoginDto {
  @IsNotEmpty()
  @IsString()
  identityToken!: string; // Apple ID token
}

export class LinkedInLoginDto {
  @IsNotEmpty()
  @IsString()
  accessToken!: string;
}