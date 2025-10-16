import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProgrammeTrack } from '../programme/programme-track.entity';

@Entity('engagements')
export class Engagement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  trackId!: string;

  @ManyToOne(() => ProgrammeTrack, { eager: true })
  @JoinColumn({ name: 'trackId' })
  track!: ProgrammeTrack;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

