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

@Entity('contact_exchange')
@Index(['scannerId', 'scannedUserId', 'eventId'], { unique: true })
export class ContactExchange {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  scannerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scannerId' })
  scanner!: UserEntity;

  @Column()
  scannedUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scannedUserId' })
  scannedUser!: UserEntity;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column({ nullable: true })
  eventQRCodeId?: string;

  @ManyToOne(() => EventQRCode, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'eventQRCodeId' })
  eventQRCode?: EventQRCode;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
