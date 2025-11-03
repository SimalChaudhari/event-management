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
  IsObject,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthProvider, UserRole, Industry } from './users.entity';
import { UserEntity } from './users.entity';
import { SingaporePhoneUtils } from '../utils/singapore-phone.utils';


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
  @Transform(({ value }) => {
    if (!value) return value;
    try {
      return SingaporePhoneUtils.formatPhoneForDatabase(value);
    } catch {
      return value;
    }
  })
  @Matches(/^(\+?65)?[-\s]?[89]\d{7}$/, { 
    message: 'Please provide a valid Singapore mobile number (8 digits starting with 8 or 9)' 
  })
  mobile?: string; // Updated field - Singapore format: +6589532476 (database format)

  @IsOptional()
  @IsString()
  salutation?: string; // Mr., Mrs., Dr., etc.

  @IsOptional()
  @IsString()
  company?: string; // Company/Organization name

  @IsOptional()
  @IsEnum(Industry)
  industry?: Industry; // Industry sector

  @IsOptional()
  @IsString()
  designation?: string; // Job designation/title

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

  @IsOptional()
  @IsString()
  otp?: string; // Updated field

  @IsOptional()
  otpExpiry?: Date; // Updated field

   // Optional field for Terms & Conditions acceptance
   @IsOptional()
   @IsBoolean()
   acceptTerms?: boolean;

  // Speaker-specific fields
  @IsOptional()
  @IsString()
  companyName?: string; // Company/Organization name for speakers

  @IsOptional()
  @IsString()
  position?: string; // Job title/position for speakers

  @IsOptional()
  @IsString()
  description?: string; // Bio/description for speakers

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;

  // Optional address fields for admin registration
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  addressType?: string; // home, work, billing, shipping, other

  @IsOptional()
  @IsBoolean()
  isDefaultAddress?: boolean;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  addressLabel?: string;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
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

export class CreateSpeakerDto extends UserDto {
  // Speaker-specific fields for profile creation
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RoleSwitchDto {
  @IsEnum(UserRole)
  newRole!: UserRole;

  @IsOptional()
  @IsString()
  boothCode?: string;
}

// QR Code DTOs
export class GenerateQRCodeDto {
  @IsOptional()
  @IsString()
  userId?: string; // Optional, for admin generating QR for other users
}

export class ScanQRCodeDto {
  @IsString()
  qrCodeId!: string;
}

export class QRCodeResponseDto {
  @IsString()
  qrCodeId!: string;

  @IsString()
  qrCodeImage!: string; // Base64 encoded image

  @IsObject()
  userInfo!: Partial<UserEntity>;
}