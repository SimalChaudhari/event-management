import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Event } from '../event/event.entity';

@Entity('programme_tracks')
export class ProgrammeTrack {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Event, (event) => event.programmeTracks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @OneToMany('ProgrammeSession', 'track', {
    cascade: true,
    eager: false,
  })
  sessions!: any[];
}
