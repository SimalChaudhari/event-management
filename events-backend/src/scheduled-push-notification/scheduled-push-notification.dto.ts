import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { NotificationStatus, RedirectType } from './scheduled-push-notification.entity';
import { DeliveryStatus } from './scheduled-push-notification-delivery.entity';

export class CreateScheduledPushNotificationDto {
  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsNotEmpty()
  @IsBoolean()
  sendToAllUsers!: boolean;

  @ValidateIf((o) => !o.sendToAllUsers)
  @IsOptional()
  @IsString()
  eventId?: string;

  @ValidateIf((o) => !o.sendToAllUsers && o.eventId)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trackIds?: string[];

  @IsOptional()
  @IsEnum(RedirectType)
  redirectType?: RedirectType;

  @ValidateIf((o) => o.redirectType === RedirectType.URL)
  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @ValidateIf((o) => o.redirectType === RedirectType.APP_PAGE)
  @IsOptional()
  @IsString()
  appPageRoute?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string; // ISO date string
}

export class UpdateScheduledPushNotificationDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  sendToAllUsers?: boolean;

  @ValidateIf((o) => !o.sendToAllUsers)
  @IsOptional()
  @IsString()
  eventId?: string;

  @ValidateIf((o) => !o.sendToAllUsers && o.eventId)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trackIds?: string[];

  @IsOptional()
  @IsEnum(RedirectType)
  redirectType?: RedirectType;

  @ValidateIf((o) => o.redirectType === RedirectType.URL)
  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @ValidateIf((o) => o.redirectType === RedirectType.APP_PAGE)
  @IsOptional()
  @IsString()
  appPageRoute?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}

export class ScheduledPushNotificationResponseDto {
  id!: string;
  message!: string;
  sendToAllUsers!: boolean;
  eventId?: string;
  event?: {
    id: string;
    name: string;
  };
  trackIds?: string[];
  tracks?: Array<{
    id: string;
    title: string;
  }>;
  redirectType!: RedirectType;
  redirectUrl?: string;
  appPageRoute?: string;
  scheduledAt?: Date;
  status!: NotificationStatus;
  sentAt?: Date;
  sentCount!: number;
  failedCount!: number;
  errorMessage?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class FilterScheduledPushNotificationDto {
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsBoolean()
  sendToAllUsers?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // Search in message
}

export class UserPushNotificationFilterDto {
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class UserPushNotificationResponseDto {
  id!: string;
  message!: string;
  sendToAllUsers!: boolean;
  eventId?: string;
  eventName?: string;
  redirectType!: RedirectType;
  redirectUrl?: string;
  appPageRoute?: string;
  scheduledAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  status!: DeliveryStatus;
  isRead!: boolean;
  readAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}


