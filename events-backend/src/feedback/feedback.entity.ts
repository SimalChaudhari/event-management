import { Event } from 'event/event.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column()
  name!: string;         // User Name

  @Column()
  title!: string;        // Feedback Title

  @Column('text')
  feedback!: string;     // Feedback Message

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Event, (event) => event.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event?: Event;
}