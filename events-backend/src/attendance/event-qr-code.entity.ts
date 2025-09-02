import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Event } from '../event/event.entity';
import { UserEntity } from '../user/users.entity';
import { EventAttendance } from './attendance.entity';

export enum EventQRCodeType {
  CheckIn = 'check_in',
  Attendance = 'attendance', // Legacy value for backward compatibility
  ContactExchange = 'contact_exchange',
  ExhibitorStamp = 'exhibitor_stamp',
}

export enum EventQRCodeStatus {
  Active = 'active',
  Inactive = 'inactive',
  Expired = 'expired',
}

@Entity('event_qr_codes')
export class EventQRCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column({ nullable: true })
  createdBy?: string; // Admin user ID who created the QR code

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @Column({
    type: 'enum',
    enum: EventQRCodeType,
    default: EventQRCodeType.CheckIn,
  })
  type!: EventQRCodeType;

  @Column({
    type: 'enum',
    enum: EventQRCodeStatus,
    default: EventQRCodeStatus.Active,
  })
  status!: EventQRCodeStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string; // Custom title for the QR code

  @Column({ type: 'text', nullable: true })
  description?: string; // Description of what this QR code is for

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string; // Where this QR code is located (e.g., "Main Entrance", "Booth A1")

  @Column({ type: 'timestamp', nullable: true })
  validFrom?: Date; // When this QR code becomes valid

  @Column({ type: 'timestamp', nullable: true })
  validUntil?: Date; // When this QR code expires

  @Column({ type: 'boolean', default: true })
  allowSelfCheckIn!: boolean; // Whether attendees can check themselves in

  @Column({ type: 'boolean', default: false })
  autoRegister!: boolean; // Whether to auto-register unregistered users for free events

  @Column({ type: 'boolean', default: false })
  redirectToPayment!: boolean; // Whether to redirect unregistered users to payment for paid events

  @Column({ type: 'int', default: 0 })
  scanCount!: number; // How many times this QR code has been scanned

  @Column({ type: 'int', default: -1 })
  maxScans?: number; // Maximum number of scans allowed (-1 for unlimited)

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => EventAttendance, (attendance) => attendance.eventQRCode)
  attendances?: EventAttendance[];

  @OneToMany('ContactExchange', 'eventQRCode')
  contactExchanges?: any[];

  @OneToMany('ExhibitorStamp', 'eventQRCode')
  exhibitorStamps?: any[];
}
