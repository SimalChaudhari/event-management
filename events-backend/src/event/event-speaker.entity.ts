// src/entities/event-speaker.entity.ts
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Event } from './event.entity'; // Adjust the import path as necessary
import { Speaker } from 'speaker/speaker.entity';

@Entity('event_speaker')
export class EventSpeaker {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Event, (event) => event.eventSpeakers, { onDelete: 'CASCADE' })
    event!: Event;

    @ManyToOne(() => Speaker, (speaker) => speaker.eventSpeakers, { onDelete: 'CASCADE' })
    speaker!: Speaker;
}