// src/entities/event-speaker.entity.ts
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Event } from './event.entity'; // Adjust the import path as necessary
import { Speaker } from 'speaker/speaker.entity';
import { EventType } from './event.dto';
import { Category } from 'category/category.entity';


@Entity('event_speaker')
export class EventSpeaker {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId?: string; // Store only the event ID

  @Column()
  speakerId?: string; // Store only the speaker ID

  @ManyToOne(() => Event, (event) => event.eventSpeakers, {
    onDelete: 'CASCADE',
  })
  event?: Event;
  

  @ManyToOne(() => Speaker, (speaker) => speaker.eventSpeakers)
  speaker!: Speaker; // Define the relation to Speaker
}

@Entity('event_category')
export class EventCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId?: string;

  @Column()
  categoryId?: string;

  @ManyToOne(() => Event, (event) => event.category, {
    onDelete: 'CASCADE',
  })
  event?: Event;

  @ManyToOne(() => Category, (category) => category.events)
  category?: Category;
}