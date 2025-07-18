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
  
    @Column({ type: 'varchar' })
    title!: string;
  
    @Column({ type: 'uuid' })
    eventId!: string;
  
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