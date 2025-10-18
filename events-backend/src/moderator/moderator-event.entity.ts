import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Moderator } from './moderator.entity';
import { Event } from '../event/event.entity';

@Entity('moderator_events')
@Index(['moderatorId', 'eventId'], { unique: true })
export class ModeratorEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  moderatorId!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @ManyToOne(() => Moderator, (moderator) => moderator.moderatorEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moderatorId' })
  moderator!: Moderator;

  @ManyToOne(() => Event, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @CreateDateColumn()
  createdAt!: Date;
}

