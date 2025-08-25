import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from '../event/event.entity';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { UserEntity } from 'user/users.entity';

export enum AgendaCategory {
  Brainstorm = 'Brainstorm',
  Discussion = 'Discussion',
  Presentation = 'Presentation',
  Workshop = 'Workshop',
  Networking = 'Networking',
  Break = 'Break',
  QnA = 'QnA',
  Panel = 'Panel',
  Demo = 'Demo',
  Other = 'Other',
}

@Entity('event_agendas')
export class EventAgenda {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'time' })
  time!: string;

  @Column({ type: 'int' }) // Duration in minutes
  duration!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ 
    type: 'enum', 
    enum: AgendaCategory, 
    default: AgendaCategory.Other 
  })
  category!: AgendaCategory;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Event, (event) => event.eventAgendas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @ManyToOne(() => UserEntity, (user) => user.agendas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
