// src/entities/eventStamp.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Event } from 'event/event.entity';

@Entity('event_stamps')
export class EventStamp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Multiple images support for thumbnails
  @Column('simple-array', { nullable: true })
  images?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Event, (event) => event.eventStamps, {
    onDelete: 'CASCADE',
  })
  event?: Event;
} 