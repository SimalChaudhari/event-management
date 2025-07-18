// src/entities/event.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { EventCategory, EventSpeaker } from './event-speaker.entity';
import { Cart } from 'cart/cart.entity';
import { OrderItemEntity } from 'order/event.item.entity';
import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Feedback } from 'feedback/feedback.entity';
import { Category } from 'category/category.entity';
import { Exhibitor } from 'exhibitor/exhibitor.entity';
import { Gallery } from 'gallery/gallery.entity';
import { EventStamp } from 'eventStamp/eventStamp.entity';
import { Survey } from 'survey/survey.entity';

export enum EventType {
  Physical = 'Physical',
  Virtual = 'Virtual',
  Hybrid = 'Hybrid',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'varchar', nullable: true })
  exhibitorDescription?: string;

  @Column({ type: 'varchar', nullable: true })
  venue?: string;

  @Column('float', { nullable: true })
  latitude?: number; // Latitude of the venue

  @Column('float', { nullable: true })
  longitude?: number; // Longitude of the venue

  @Column({ type: 'varchar', nullable: true })
  country?: string;

  // Multiple images support
  @Column('simple-array', { nullable: true })
  images?: string[];

  // Multiple PDF documents support
  @Column('simple-array', { nullable: true })
  documents?: string[];

  @Column({ type: 'enum', enum: EventType, nullable: true })
  type?: EventType;

  @Column({ type: 'decimal', nullable: true })
  price?: number;

  @Column({ type: 'varchar', length: 10, default: 'USD', nullable: true })
  currency?: string;

  // Floor plan - single image
  @Column({ type: 'varchar', nullable: true })
  floorPlan?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => EventSpeaker, (eventSpeaker) => eventSpeaker.event)
  eventSpeakers!: EventSpeaker[];

  // Category relationship
  @OneToMany(() => EventCategory, (eventCategory) => eventCategory.event)
  category?: EventCategory[];

  @OneToMany(() => Cart, (cart) => cart.event) // Define the relationship
  carts!: Cart[]; // Carts associated with the event
  eventOrders: any;

  @OneToMany(() => OrderItemEntity, (order) => order.event)
  orderItem?: OrderItemEntity[];

  @OneToMany(() => FavoriteEvent, (favoriteEvent) => favoriteEvent.event)
  favoriteEvents?: FavoriteEvent[];

  @OneToMany(() => Feedback, (feedback) => feedback.event)
  feedbacks?: Feedback[];

  @OneToMany(() => Gallery, (gallery) => gallery.event)
  galleries?: Gallery[];

  // Event Stamp relationship
  @OneToMany(() => EventStamp, (eventStamp) => eventStamp.event)
  eventStamps?: EventStamp[];

  // Exhibitor relationship
  @OneToMany(() => EventExhibitor, (eventExhibitor) => eventExhibitor.event)
  eventExhibitors!: EventExhibitor[];


}

@Entity('event_exhibitor')
export class EventExhibitor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId?: string;

  @Column()
  exhibitorId?: string;

  @ManyToOne(() => Event, (event) => event.eventExhibitors, {
    onDelete: 'CASCADE',
  })
  event?: Event;

  @ManyToOne(() => Exhibitor, (exhibitor) => exhibitor.eventExhibitors)
  exhibitor!: Exhibitor;
}
