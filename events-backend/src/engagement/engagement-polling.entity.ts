import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ProgrammeSession } from '../programme/programme-session.entity';

@Entity('session_polling_links')
export class EngagementPollingLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  sessionId!: string;

  @ManyToOne(() => ProgrammeSession, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session?: ProgrammeSession;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  url!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


