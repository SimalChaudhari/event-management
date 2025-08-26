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
import { UserEntity } from '../user/users.entity';

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
  Meeting = 'Meeting', // Added meeting category
  Other = 'Other',
}

export enum MeetingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Rescheduled = 'rescheduled',
}

export enum RequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
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

   // New fields for table seating and lucky draw
   @Column({ type: 'varchar', length: 100, nullable: true })
   tableNumber?: string;
 
   @Column({ type: 'varchar', length: 100, nullable: true })
   luckyDrawTicketNumber?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // New fields for meeting functionality
  @Column({ 
    type: 'enum', 
    enum: MeetingStatus, 
    nullable: true,
    default: MeetingStatus.Confirmed 
  })
  meetingStatus?: MeetingStatus;

  @Column({ 
    type: 'enum', 
    enum: RequestStatus, 
    nullable: true,
    default: RequestStatus.Accepted 
  })
  requestStatus?: RequestStatus;

  @Column({ type: 'text', nullable: true, array: true })
  attendees?: string[]; // Array of user IDs

  @Column({ type: 'text', nullable: true })
  meetingNotes?: string;

  @Column({ type: 'boolean', default: false })
  isMeetingRequest?: boolean; // True if this is a meeting request

  @Column({ type: 'uuid', nullable: true })
  parentMeetingId?: string; // For rescheduled meetings

  @Column({ type: 'timestamp', nullable: true })
  meetingDate?: Date; // Specific date for the meeting

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
