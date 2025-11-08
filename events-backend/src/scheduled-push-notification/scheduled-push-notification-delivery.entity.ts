import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScheduledPushNotification } from './scheduled-push-notification.entity';
import { UserEntity } from '../user/users.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('scheduled_push_notification_deliveries')
export class ScheduledPushNotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  notificationId!: string;

  @ManyToOne(
    () => ScheduledPushNotification,
    (notification) => notification.deliveries,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'notificationId' })
  notification?: ScheduledPushNotification;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status!: DeliveryStatus;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


