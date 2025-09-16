import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Event } from '../event/event.entity';
import { UserEntity } from '../user/users.entity';
import { EventNotificationType } from '../types/notification.types';

@Entity('event_notifications')
export class EventNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ 
    type: 'enum', 
    enum: EventNotificationType, 
    nullable: true 
  })
  type?: EventNotificationType;

  // Removed data field - only using title and description

  @Column({ type: 'boolean', default: false })
  isSent!: boolean; // Whether notification was sent to all users

  @OneToMany(() => EventNotificationRead, read => read.eventNotification)
  eventNotificationReads!: EventNotificationRead[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('event_notification_reads')
@Index(['eventNotificationId', 'userId'], { unique: true })
export class EventNotificationRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventNotificationId!: string;

  @ManyToOne(() => EventNotification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventNotificationId' })
  eventNotification!: EventNotification;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean; // Whether user has read this notification

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date; // When user read the notification

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
