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
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';

@Entity('moderator_events')
@Index(['moderatorId', 'eventId', 'trackId', 'sessionId'], { unique: true })
export class ModeratorEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  moderatorId!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'uuid', nullable: true })
  trackId?: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

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

  @ManyToOne(() => ProgrammeTrack, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track?: ProgrammeTrack;

  @ManyToOne(() => ProgrammeSession, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session?: ProgrammeSession;

  @CreateDateColumn()
  createdAt!: Date;
}

