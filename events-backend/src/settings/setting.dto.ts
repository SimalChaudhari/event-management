// src/faq/dto/create-faq.dto.ts

import { IsArray, IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreatePrivacyPolicyDto {
    @IsString()
    readonly id?: string; // Optional for creation, required for updates

    @IsNotEmpty()
    @IsString()
    readonly content?: string;
}

export class CreateTermsConditionsDto {
    @IsString()
    readonly id?: string; // Optional for creation, required for updates

    @IsNotEmpty()
    @IsString()
    readonly content?: string;
}

export class CreateBannerDto {
    @IsString()
    readonly id?: string;

    @IsString()
    readonly imageUrl!: string;

    @IsOptional()
    @IsString()
    readonly hyperlink?: string;
}

export class CreateBannerEventDto {
    @IsString()
    readonly id?: string;

    @IsArray()
    @IsString({ each: true })
    readonly imageUrls!: string[];

    @IsOptional()
    @IsString()
    readonly hyperlink?: string;
}

// DTO for creating permission templates (admin only)
export class CreatePermissionTemplateDto {
    @IsNotEmpty()
    @IsString()
    readonly title!: string; // Display title like 'Biometric Sign in'

    @IsNotEmpty()
    @IsString()
    readonly description!: string; // Description text

    @IsOptional()
    @IsBoolean()
    readonly defaultEnabled?: boolean; // Default value for all users (defaults to false)
}

// DTO for updating user's specific permission
export class UpdateUserPermissionDto {
    @IsNotEmpty()
    @IsBoolean()
    readonly enabled!: boolean; // User's choice (true/false)
}

// DTO for getting user permissions with template info
export class UserPermissionWithTemplate {
    id!: string; // Template UUID
    title!: string;
    description!: string;
    defaultEnabled!: boolean;
}

// Push Notification DTOs
export class RegisterDeviceTokenDto {
    @IsNotEmpty()
    @IsString()
    readonly deviceToken!: string;

    @IsOptional()
    @IsString()
    readonly platform?: string; // 'android' or 'ios'
}

export class SendNotificationDto {
    @IsNotEmpty()
    @IsString()
    readonly title!: string;

    @IsNotEmpty()
    @IsString()
    readonly body!: string;

    @IsOptional()
    readonly data?: any; // Additional data payload

    @IsOptional()
    @IsString()
    readonly type?: string; // 'general', 'event', 'networking', 'permission', etc.

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly userIds?: string[]; // Specific user IDs to send to (optional)
}

export class NotificationHistoryDto {
    id!: string;
    userId!: string;
    title!: string;
    body!: string;
    data!: any;
    type!: string;
    isRead!: boolean;
    isSent!: boolean;
    sentAt!: Date;
    createdAt!: Date;
    updatedAt!: Date;
}

