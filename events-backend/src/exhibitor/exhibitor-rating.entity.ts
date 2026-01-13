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

@Entity('exhibitor_ratings')
@Index(['userId', 'exhibitorId', 'eventId'], { unique: true }) // Prevent duplicate ratings for same user-exhibitor-event combination
export class ExhibitorRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; // Registered user who rated the exhibitor

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  exhibitorId!: string; // Exhibitor who was rated

  @ManyToOne(() => Exhibitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exhibitorId' })
  exhibitor!: Exhibitor;

  @Column()
  eventId!: string; // Event where the rating was given

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  rating!: number; // Rating value from 1.0 to 5.0

  @Column({ type: 'text', nullable: true })
  comment?: string; // Optional comment/review

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

