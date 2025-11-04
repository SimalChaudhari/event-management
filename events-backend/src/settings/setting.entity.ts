// src/faq/entities/faq.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Unique, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { GeneralNotificationType } from '../types/notification.types';

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

    @Column({ type: 'enum', enum: ['home', 'event'], default: 'home' })
    type!: 'home' | 'event'; // Banner type: home or event

    @Column('simple-array')
    imageUrls!: string[]; // Array of image URLs

    @Column('simple-array', { nullable: true })
    hyperlinks?: string[]; // Array of hyperlinks, one per image

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('logos')
export class Logo {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    imageUrl!: string; // Single logo image URL

    @Column('text', { nullable: true })
    hyperlink?: string; // Optional hyperlink for logo

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

    @Column({ unique: true })
    code!: string; // Unique code for programmatic identification (e.g., 'biometric_signin', 'event_notifications')

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

  @Column({ 
    type: 'enum', 
    enum: GeneralNotificationType, 
    default: GeneralNotificationType.GENERAL 
  })
  type!: GeneralNotificationType;

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

// Advert Notification Entity
@Entity('advert_notifications')
export class AdvertNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string; // Advert title

  @Column({ type: 'text' })
  content!: string; // Rich content (HTML/text) - like EDM content

  @Column({ type: 'text', nullable: true })
  imageUrl?: string; // Optional image URL

  @Column({ type: 'text', nullable: true })
  actionUrl?: string; // Optional call-to-action URL

  @Column({ type: 'text', nullable: true })
  actionText?: string; // Optional call-to-action button text

  @Column({ default: false })
  isActive!: boolean; // Whether this advert is active/published

  @Column({ default: false })
  isSent!: boolean; // Whether this advert has been sent to users

  @Column({ nullable: true })
  scheduledAt?: Date; // Optional scheduled send time

  @Column({ nullable: true })
  sentAt?: Date; // When advert was actually sent

  @Column({ default: 0 })
  sentCount!: number; // Number of users who received this advert

  @OneToMany(() => AdvertNotificationRead, (read: AdvertNotificationRead) => read.advertNotification)
  advertNotificationReads!: AdvertNotificationRead[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// Advert Notification Read Entity (to track which users received/read adverts)
@Entity('advert_notification_reads')
export class AdvertNotificationRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  advertNotificationId?: string;

  @ManyToOne(() => AdvertNotification, (advert: AdvertNotification) => advert.advertNotificationReads, { nullable: true })
  @JoinColumn({ name: 'advertNotificationId' })
  advertNotification?: AdvertNotification;

  @Column()
  userId!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}