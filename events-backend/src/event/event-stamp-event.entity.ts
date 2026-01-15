import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
import { EventStamp } from './event-stamp.entity';

@Entity('event_stamp_events')
@Index(['eventId', 'eventStampId'], { unique: true }) // Prevent duplicate associations
export class EventStampEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, (event) => event.eventStampEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  eventStampId!: string;

  @ManyToOne(() => EventStamp, (eventStamp) => eventStamp.eventStampEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventStampId' })
  eventStamp!: EventStamp;

  @CreateDateColumn()
  createdAt!: Date;
}
