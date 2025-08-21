import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { Exhibitor } from '../exhibitor/exhibitor.entity';

@Entity('event_exhibitor_booths')
export class EventBooth {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'uuid' })
  exhibitorId!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  uniqueCode!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid', nullable: true })
  usedBy?: string; // User ID who used this booth code

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date; // When the code was used

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Event, (event) => event.eventBooths)
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @ManyToOne(() => Exhibitor, (exhibitor) => exhibitor.eventBooths)
  @JoinColumn({ name: 'exhibitorId' })
  exhibitor!: Exhibitor;
}
