import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Event } from '../event/event.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { ScheduledPushNotificationDelivery } from './scheduled-push-notification-delivery.entity';

export enum NotificationStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RedirectType {
  URL = 'url',
  APP_PAGE = 'app_page',
  NONE = 'none',
}

@Entity('scheduled_push_notifications')
export class ScheduledPushNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  message!: string; // Notification message

  @Column({ type: 'boolean', default: false })
  sendToAllUsers!: boolean; // If true, send to all users

  @Column({ nullable: true })
  eventId?: string; // Event ID (if not sending to all users)

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column({ type: 'simple-array', nullable: true })
  trackIds?: string[]; // Array of track IDs (if targeting specific tracks)

  @Column({
    type: 'enum',
    enum: RedirectType,
    default: RedirectType.NONE,
  })
  redirectType!: RedirectType;

  @Column({ type: 'text', nullable: true })
  redirectUrl?: string; // External URL to redirect to

  @Column({ type: 'text', nullable: true })
  appPageRoute?: string; // App page route (e.g., '/surveys/:eventId')

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date; // When to send the notification

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.SCHEDULED,
  })
  status!: NotificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date; // When notification was actually sent

  @Column({ type: 'int', default: 0 })
  sentCount!: number; // Number of users who received the notification

  @Column({ type: 'int', default: 0 })
  failedCount!: number; // Number of failed sends

  @Column({ type: 'text', nullable: true })
  errorMessage?: string; // Error message if sending failed

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(
    () => ScheduledPushNotificationDelivery,
    (delivery) => delivery.notification,
    { cascade: true },
  )
  deliveries?: ScheduledPushNotificationDelivery[];
}

