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
import { EventStamp } from './event-stamp.entity';

@Entity('user_stamp_visits')
@Index(['userId', 'stampId'], { unique: true }) // One visit record per user per stamp
export class UserStampVisit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; // User who visited/collected the stamp

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  stampId!: string; // EventStamp ID

  @ManyToOne(() => EventStamp, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stampId' })
  stamp!: EventStamp;

  @Column({ type: 'boolean', default: true })
  isVisited!: boolean; // Whether the user has visited/collected this stamp

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
