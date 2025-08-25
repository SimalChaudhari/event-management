import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './users.entity';

@Entity('speaker_profiles')
export class SpeakerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ nullable: true })
  companyName?: string; // Company/Organization name for speakers

  @Column({ nullable: true })
  position?: string; // Job title/position for speakers

  @Column({ type: 'text', nullable: true })
  description?: string; // Bio/description for speakers

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // One-to-one relationship with UserEntity
  @OneToOne(() => UserEntity, (user) => user.speakerProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
