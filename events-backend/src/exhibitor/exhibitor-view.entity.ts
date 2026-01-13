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
import { Exhibitor } from './exhibitor.entity';

@Entity('exhibitor_views')
@Index(['userId', 'exhibitorId', 'eventId'], { unique: true }) // Prevent duplicate views for same user-exhibitor-event combination
export class ExhibitorView {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; // Registered user who viewed the exhibitor profile

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  exhibitorId!: string; // Exhibitor whose profile was viewed

  @ManyToOne(() => Exhibitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exhibitorId' })
  exhibitor!: Exhibitor;

  @Column()
  eventId!: string; // Event where the view occurred

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

