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
import { Exhibitor } from './exhibitor.entity';

@Entity('exhibitor_leads')
@Index(['exhibitorId', 'attendeeId', 'eventId'], { unique: true }) // Prevent duplicate leads for same exhibitor-attendee-event combination
export class ExhibitorLead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  exhibitorId!: string; // Exhibitor who collected the lead

  @ManyToOne(() => Exhibitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exhibitorId' })
  exhibitor!: Exhibitor;

  @Column()
  attendeeId!: string; // Attendee whose QR code was scanned

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendeeId' })
  attendee!: UserEntity;

  @Column()
  eventId!: string; // Event where the lead was collected

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  scannedBy!: string; // User ID of the exhibitor staff member who scanned

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scannedBy' })
  scanner!: UserEntity;

  // Contact details stored for reference
  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  designation?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string; // Optional notes about the lead

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

