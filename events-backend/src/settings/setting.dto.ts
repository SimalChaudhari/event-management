// src/faq/dto/create-faq.dto.ts

import { IsArray, IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { EventNotificationType, GeneralNotificationType } from '../types/notification.types';

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

    @IsArray()
    @IsString({ each: true })
    readonly imageUrls!: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly hyperlinks?: string[];
}

export class CreateBannerEventDto {
    @IsString()
    readonly id?: string;

    @IsArray()
    @IsString({ each: true })
    readonly imageUrls!: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly hyperlinks?: string[];
}

export class ReorderBannerDto {
    @IsArray()
    @IsString({ each: true })
    readonly imageUrls!: string[];
}

export class CreateLogoDto {
    @IsString()
    readonly id?: string;

    @IsString()
    readonly imageUrl!: string;

    @IsOptional()
    @IsString()
    readonly hyperlink?: string;
}

export class UpdateAppVersionDto {
    @IsOptional()
    @IsString()
    readonly appVersionAndroid?: string;

    @IsOptional()
    @IsString()
    readonly appVersionIOS?: string;

    @IsOptional()
    @IsBoolean()
    readonly enableForceUpdate?: boolean;
}

export class AppVersionResponseDto {
    appVersionAndroid!: string;
    appVersionIOS!: string;
    enableForceUpdate!: boolean;
}

// DTO for creating permission templates (admin only)
export class CreatePermissionTemplateDto {
    @IsNotEmpty()
    @IsString()
    readonly title!: string; // Display title like 'Biometric Sign in'

    @IsNotEmpty()
    @IsString()
    readonly code!: string; // Unique code for programmatic identification

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

    @IsOptional()
    @IsString()
    readonly clientId?: string; // Per-browser id so Edge/Firefox get separate rows even if FCM returns same token
}

export class CleanupTokensDto {
    @IsNotEmpty()
    @IsString()
    readonly keepToken!: string;
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
    @IsEnum(GeneralNotificationType)
    readonly type?: GeneralNotificationType;

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

// Simple Event Notification DTO
export class EventNotificationDto {
    @IsNotEmpty()
    @IsString()
    readonly eventId!: string;

    @IsNotEmpty()
    @IsString()
    readonly title!: string;

    @IsNotEmpty()
    @IsString()
    readonly description!: string;

    @IsOptional()
    @IsEnum(EventNotificationType)
    readonly type?: EventNotificationType;
}

// Mark event notification as read DTO
export class MarkEventNotificationReadDto {
    @IsNotEmpty()
    @IsString()
    readonly eventNotificationId!: string;
}

// Get event notification history DTO
export class GetEventNotificationHistoryDto {
    @IsOptional()
    @IsString()
    readonly type?: string; // Filter by notification type

    @IsOptional()
    @IsString()
    readonly eventId?: string; // Filter by event

    @IsOptional()
    @IsBoolean()
    readonly isRead?: boolean; // Filter by read status

    @IsOptional()
    @IsNumber()
    readonly page?: number;

    @IsOptional()
    @IsNumber()
    readonly limit?: number;
}

// Event notification response DTO
export class EventNotificationResponseDto {
    id!: string;
    eventId!: string;
    title!: string;
    description!: string;
    type?: string;
    isRead!: boolean;
    readAt?: Date;
    createdAt!: Date;
    sentAt?: Date;
}

// Advert Notification DTOs
export class CreateAdvertNotificationDto {
    @IsNotEmpty()
    @IsString()
    readonly title!: string;

    @IsNotEmpty()
    @IsString()
    readonly content!: string; // Rich content (HTML/text) - like EDM content

    @IsOptional()
    @IsString()
    readonly imageUrl?: string;

    @IsOptional()
    @IsString()
    readonly actionUrl?: string;

    @IsOptional()
    @IsString()
    readonly actionText?: string;

    @IsOptional()
    @IsBoolean()
    readonly isActive?: boolean;

    @IsOptional()
    readonly scheduledAt?: Date;
}

export class UpdateAdvertNotificationDto {
    @IsOptional()
    @IsString()
    readonly title?: string;

    @IsOptional()
    @IsString()
    readonly content?: string;

    @IsOptional()
    @IsString()
    readonly imageUrl?: string;

    @IsOptional()
    @IsString()
    readonly actionUrl?: string;

    @IsOptional()
    @IsString()
    readonly actionText?: string;

    @IsOptional()
    @IsBoolean()
    readonly isActive?: boolean;

    @IsOptional()
    readonly scheduledAt?: Date;
}

export class AdvertNotificationResponseDto {
    id!: string;
    title!: string;
    content!: string;
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
    isActive!: boolean;
    isSent!: boolean;
    scheduledAt?: Date;
    sentAt?: Date;
    sentCount!: number;
    createdAt!: Date;
    updatedAt!: Date;
}

export class GetAdvertNotificationHistoryDto {
    @IsOptional()
    @IsBoolean()
    readonly isRead?: boolean;

    @IsOptional()
    @IsNumber()
    readonly page?: number;

    @IsOptional()
    @IsNumber()
    readonly limit?: number;
}

export class MarkAdvertNotificationReadDto {
    @IsNotEmpty()
    @IsString()
    readonly advertNotificationId!: string;
}

export class SendAdvertNotificationDto {
    @IsNotEmpty()
    @IsString()
    readonly advertId!: string;

    @IsOptional()
    @IsBoolean()
    readonly sendToAllUsers?: boolean; // If true, sends to all users who have advert notifications enabled
}

// DTO for form data (with file upload)
export class CreateAdvertNotificationFormDto {
    @IsString()
    @IsNotEmpty()
    readonly title!: string;

    @IsString()
    @IsNotEmpty()
    readonly content!: string;

    @IsOptional()
    @IsString()
    readonly actionUrl?: string;

    @IsOptional()
    @IsString()
    readonly actionText?: string;

    @IsOptional()
    @IsBoolean()
    readonly isActive?: boolean;

    @IsOptional()
    readonly scheduledAt?: Date;
}

export class UpdateAdvertNotificationFormDto {
    @IsOptional()
    @IsString()
    readonly title?: string;

    @IsOptional()
    @IsString()
    readonly content?: string;

    @IsOptional()
    @IsString()
    readonly actionUrl?: string;

    @IsOptional()
    @IsString()
    readonly actionText?: string;

    @IsOptional()
    @IsBoolean()
    readonly isActive?: boolean;

    @IsOptional()
    readonly scheduledAt?: Date;
}

