import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { ProgrammeTrack } from './programme-track.entity';
import { UserEntity } from '../user/users.entity';

@Entity('programme_sessions')
export class ProgrammeSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  trackId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  sessionDate!: Date;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  venue?: string;

  @Column({ type: 'int', default: 0 })
  order!: number; // For ordering sessions within a track

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => ProgrammeTrack, (track) => track.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track!: ProgrammeTrack;

  @ManyToMany(() => UserEntity, (speaker) => speaker.programmeSessions)
  @JoinTable({
    name: 'programme_session_speakers',
    joinColumn: {
      name: 'sessionId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'speakerId',
      referencedColumnName: 'id',
    },
  })
  speakers!: UserEntity[];
}
