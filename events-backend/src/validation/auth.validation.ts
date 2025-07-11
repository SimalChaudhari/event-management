import { IsEmail, IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches, IsEnum, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { applyDecorators } from '@nestjs/common';

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
    INVALID: 'Please provide a valid mobile number'
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
  MOBILE: /^[0-9]{10,15}$/,
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