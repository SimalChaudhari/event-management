// src/entities/event-speaker.entity.ts
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Event } from './event.entity'; // Adjust the import path as necessary
import { Speaker } from 'speaker/speaker.entity';
import { EventType } from './event.dto';

export interface EventResponse {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  location?: string;
  country?: string;
  image?: string;
  type?: EventType;
  price?: number;
  currency?: string;
  createdAt?: Date;
  updatedAt?: Date;
  speakers?: { // Change from speaker to speakers
    id: string;
    name: string;
    companyName: string;
    position: string;
}[]; // Array of speakers
}


@Entity('event_speaker')
export class EventSpeaker {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId?: string; // Store only the event ID

  @Column()
  speakerId?: string; // Store only the speaker ID


  @ManyToOne(() => Event, (event) => event.eventSpeakers)
  event!: Event; // Define the relation to Event

  @ManyToOne(() => Speaker, (speaker) => speaker.eventSpeakers)
  speaker!: Speaker; // Define the relation to Speaker
}
