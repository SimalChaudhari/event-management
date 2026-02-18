// src/entities/gallery.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { Event } from 'event/event.entity';
  
  @Entity('galleries')
  export class Gallery {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    /** Track name within event gallery (e.g. "Track 1", "Track 2"). */
    @Column({ type: 'varchar', length: 255, nullable: true })
    trackTitle?: string;

  @Column('simple-array', { nullable: true })
  galleryImages?: string[];
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  
    @ManyToOne(() => Event, (event) => event.galleries)
    @JoinColumn({ name: 'eventId' })
    event!: Event;
  }