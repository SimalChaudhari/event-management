import { IsEmail, IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches, IsEnum, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { applyDecorators } from '@nestjs/common';
import { SingaporePhoneUtils } from '../utils/singapore-phone.utils';

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

// Validation Constants
const VALIDATION_MESSAGES = {
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please provide a valid email address'
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    MIN_LENGTH: 'Password must be at least 8 characters long',
    MAX_LENGTH: 'Password cannot exceed 128 characters',
    PATTERN: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  },
  NAME: {
    FIRST_NAME: {
      REQUIRED: 'First name is required',
      MIN_LENGTH: 'First name must be at least 2 characters long',
      MAX_LENGTH: 'First name cannot exceed 50 characters'
    },
    LAST_NAME: {
      REQUIRED: 'Last name is required',
      MIN_LENGTH: 'Last name must be at least 2 characters long',
      MAX_LENGTH: 'Last name cannot exceed 50 characters'
    }
  },
  MOBILE: {
    REQUIRED: 'Mobile number is required',
    INVALID: 'Please provide a valid Singapore mobile number (8 digits starting with 8 or 9)'
  },
  OTP: {
    REQUIRED: 'OTP is required',
    LENGTH: 'OTP must be 6 digits',
    PATTERN: 'OTP must contain only 6 digits'
  }
};

// Validation Patterns
const VALIDATION_PATTERNS = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  MOBILE: /^(\+?65)?[-\s]?[89]\d{7}$/, // Singapore format: +65-XXXX-XXXX or 8XXXXXXX/9XXXXXXX
  OTP: /^[0-9]{6}$/
};

// Reusable Validation Decorators
export function IsValidEmail() {
  return applyDecorators(
    IsString({ message: VALIDATION_MESSAGES.EMAIL.REQUIRED }),
    IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL.INVALID }),
  );
}

export function IsValidPassword() {
  return applyDecorators(
    IsString({ message: VALIDATION_MESSAGES.PASSWORD.REQUIRED }),
    MinLength(8, { message: VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH }),
    MaxLength(128, { message: VALIDATION_MESSAGES.PASSWORD.MAX_LENGTH }),
    Matches(VALIDATION_PATTERNS.PASSWORD, {
      message: VALIDATION_MESSAGES.PASSWORD.PATTERN
    })
  );
}

export function IsValidFirstName() {
  return applyDecorators(
    IsString({ message: VALIDATION_MESSAGES.NAME.FIRST_NAME.REQUIRED }),
    MinLength(2, { message: VALIDATION_MESSAGES.NAME.FIRST_NAME.MIN_LENGTH }),
    MaxLength(50, { message: VALIDATION_MESSAGES.NAME.FIRST_NAME.MAX_LENGTH })
  );
}

export function IsValidLastName() {
  return applyDecorators(
    IsString({ message: VALIDATION_MESSAGES.NAME.LAST_NAME.REQUIRED }),
    MinLength(2, { message: VALIDATION_MESSAGES.NAME.LAST_NAME.MIN_LENGTH }),
    MaxLength(50, { message: VALIDATION_MESSAGES.NAME.LAST_NAME.MAX_LENGTH })
  );
}

export function IsValidMobile() {
  return applyDecorators(
    IsString({ message: VALIDATION_MESSAGES.MOBILE.REQUIRED }),
    Transform(({ value }) => {
      if (!value) return value;
      try {
        // Format the phone number for database storage (without hyphens)
        return SingaporePhoneUtils.formatPhoneForDatabase(value);
      } catch {
        return value;
      }
    }),
    Matches(VALIDATION_PATTERNS.MOBILE, { message: VALIDATION_MESSAGES.MOBILE.INVALID })
  );
}

export function IsValidOTP() {
  return applyDecorators(
    IsString({ message: VALIDATION_MESSAGES.OTP.REQUIRED }),
    MinLength(6, { message: VALIDATION_MESSAGES.OTP.LENGTH }),
    MaxLength(6, { message: VALIDATION_MESSAGES.OTP.LENGTH }),
    Matches(VALIDATION_PATTERNS.OTP, { message: VALIDATION_MESSAGES.OTP.PATTERN })
  );
}

// DTOs using reusable decorators
export class RegisterDto {
  @IsValidFirstName()
  firstName!: string;

  @IsValidLastName()
  lastName!: string;

  @IsValidEmail()
  email!: string;

  @IsValidPassword()
  password!: string;

  @IsValidMobile()
  mobile!: string;

  @IsOptional()
  @IsString({ message: 'Profile picture must be a string' })
  profilePicture?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be either user or admin' })
  role?: UserRole;
}

export class LoginDto {
  @IsValidEmail()
  email!: string;

  @IsString({ message: 'Password is required' })
  password!: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Current password is required' })
  currentPassword!: string;

  @IsValidPassword()
  newPassword!: string;

  @IsString({ message: 'Confirm password is required' })
  confirmPassword!: string;
}

export class ForgotPasswordDto {
  @IsValidEmail()
  email!: string;
}

export class ResendOTPDto {
  @IsValidEmail()
  email!: string;
}

export class VerifyOTPDto {
  @IsValidEmail()
  email!: string;

  @IsValidOTP()
  otp!: string;
}

export class ResetPasswordDto {
  @IsValidEmail()
  email!: string;

  @IsValidOTP()
  otp!: string;

  @IsValidPassword()
  newPassword!: string;
}

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token is required' })
  refreshToken!: string;
}

// Social Login DTOs
export class GoogleLoginDto {
  @IsString({ message: 'ID token is required' })
  idToken!: string;
}

export class FacebookLoginDto {
  @IsString({ message: 'Access token is required' })
  accessToken!: string;
}

export class AppleLoginDto {
  @IsString({ message: 'Identity token is required' })
  identityToken!: string;
}

export class LinkedInLoginDto {
  @IsString({ message: 'Access token is required' })
  accessToken!: string;
}

// CSV Upload DTOs
export class CsvUserDto {
  @IsValidFirstName()
  firstName!: string;

  @IsValidLastName()
  lastName!: string;

  @IsValidEmail()
  email!: string;

  @IsValidMobile()
  mobile!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  designation?: string;
}

export class CsvUploadResponseDto {
  @IsString()
  message!: string;

  @IsString()
  totalProcessed!: string;

  @IsString()
  newUsersCreated!: string;

  @IsString()
  existingUsersSkipped!: string;

  @IsString()
  passwordsGenerated!: string;

  @IsString()
  emailsSent!: string;

  @IsString()
  emailsFailed!: string;

  @IsString()
  details!: string;

  @IsOptional()
  skippedUsers?: string[];

  @IsOptional()
  emailStatus?: {
    totalEmails: number;
    emailsSent: number;
    emailsFailed: number;
    emailsProcessing: number;
    status: 'sending' | 'completed' | 'background_processing' | 'disabled' | 'none';
  };

  @IsOptional()
  sessionId?: string;

  @IsOptional()
  eventAssociation?: {
    eventId: string;
    eventName: string;
    registrationsCreated: number;
    registrationsSkipped: number;
  };
}

// SSO Provider enum
export enum SSOProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  LINKEDIN = 'linkedin'
}

// Unified SSO Login DTO
export class SSOLoginDto {
  @IsEnum(SSOProvider, { message: 'Provider must be one of: google, facebook, apple, linkedin' })
  provider!: SSOProvider;

  @IsString({ message: 'Token is required' })
  token!: string;

  @IsOptional()
  @IsString({ message: 'Device info must be a string' })
  deviceInfo?: string;

  @IsOptional()
  @IsString({ message: 'Client info must be a string' })
  clientInfo?: string;
}