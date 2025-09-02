import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { EventQRCode } from './event-qr-code.entity';

@Entity('exhibitor_stamps')
@Index(['attendeeId', 'eventQRCodeId'], { unique: true }) // Prevent duplicate stamps from same booth
export class ExhibitorStamp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  attendeeId!: string; // Attendee who collected the stamp

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendeeId' })
  attendee!: UserEntity;

  @Column()
  eventQRCodeId!: string; // QR code of the exhibition booth

  @ManyToOne(() => EventQRCode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventQRCodeId' })
  eventQRCode!: EventQRCode;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column({ type: 'varchar', length: 255, nullable: true })
  boothName?: string; // Name of the exhibition booth

  @Column({ type: 'varchar', length: 255, nullable: true })
  boothLocation?: string; // Location of the booth

  @Column({ type: 'text', nullable: true })
  notes?: string; // Any notes about the visit

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
