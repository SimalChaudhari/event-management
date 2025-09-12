// src/faq/entities/faq.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('privacy_policies')
export class PrivacyPolicy {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string; // The content of the terms and conditions

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('terms_conditions')
export class TermsConditions {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string; // The content of the terms and conditions

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('banners')
export class Banner {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    imageUrl!: string; // Single image URL

    @Column('text', { nullable: true })
    hyperlink?: string; // Single optional hyperlink

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('banner_events')
export class BannerEvent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('simple-array')
    imageUrls!: string[]; // Array of image URLs

    @Column('text', { nullable: true })
    hyperlink?: string; // Single optional hyperlink

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
@Entity('permission_templates')
export class PermissionTemplate {
    @PrimaryGeneratedColumn('uuid')
    id!: string; // UUID as main identifier

    @Column({ unique: true, generated: 'increment' })
    indexNumber!: number; // Auto-generated unique index number (1, 2, 3, 4...)

    @Column()
    title!: string; // Display title (e.g., 'Biometric Sign in')

    @Column({ type: 'text' })
    description!: string; // Description text

    @Column({ default: false })
    defaultEnabled!: boolean; // Default boolean value for all users

    @Column({ default: true })
    isActive!: boolean; // Whether this permission is active/available

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('user_permissions')
@Unique('UQ_USER_PERMISSION', ['userId', 'templateId'])
export class UserPermissions {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; // Foreign key to users table

  @Column()
  templateId!: string; // References permission_templates.id (UUID)

  @Column({ default: false })
  enabled!: boolean; // User's custom setting (overrides default)

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// Push Notification Entity
@Entity('push_notifications')
export class PushNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; // Foreign key to users table

  @Column()
  deviceToken!: string; // FCM/OneSignal device token

  @Column({ default: 'android' })
  platform!: string; // 'android' or 'ios'

  @Column({ default: true })
  isActive!: boolean; // Whether this device token is active

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// Notification History Entity
@Entity('notification_history')
export class NotificationHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; // Foreign key to users table

  @Column()
  title!: string; // Notification title

  @Column({ type: 'text' })
  body!: string; // Notification body/message

  @Column({ type: 'json', nullable: true })
  data!: any; // Additional data payload

  @Column({ default: 'general' })
  type!: string; // 'general', 'event', 'networking', 'permission', etc.

  @Column({ default: false })
  isRead!: boolean; // Whether user has read the notification

  @Column({ default: false })
  isSent!: boolean; // Whether notification was successfully sent

  @Column({ nullable: true })
  sentAt!: Date; // When notification was sent

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
