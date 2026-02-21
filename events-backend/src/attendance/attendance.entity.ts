import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { EventQRCode } from './event-qr-code.entity';

export enum AttendanceStatus {
  CheckedIn = 'checked_in',
  CheckedOut = 'checked_out',
  NoShow = 'no_show',
}

export enum CheckInMethod {
  QRCode = 'qr_code',
  PhysicalDevice = 'physical_device',
  MobileCamera = 'mobile_camera',
  Manual = 'manual',
  Admin = 'admin',
}

@Entity('event_attendance')
@Index(['userId', 'eventId'], { unique: true }) // One attendance record per user per event
export class EventAttendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column({ nullable: true })
  registerEventId?: string;

  @ManyToOne(() => RegisterEvent, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registerEventId' })
  registerEvent?: RegisterEvent;

  @Column({ nullable: true })
  eventQRCodeId?: string; // QR code that was scanned for check-in

  @ManyToOne(() => EventQRCode, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'eventQRCodeId' })
  eventQRCode?: EventQRCode;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.CheckedIn,
  })
  status!: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: CheckInMethod,
    default: CheckInMethod.QRCode,
  })
  checkInMethod!: CheckInMethod;

  @Column({ type: 'timestamp', nullable: true })
  checkInTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOutTime?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  checkInLocation?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  checkedInBy?: string; // Admin user ID who checked in the user

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
