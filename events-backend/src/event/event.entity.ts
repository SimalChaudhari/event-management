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
import { Survey } from '../survey/survey.entity';
import { EventBooth } from './event-booth.entity';
import { EventStaff } from './event-staff.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { EventStampEvent } from './event-stamp-event.entity';

export enum EventType {
  Physical = 'Physical',
  Virtual = 'Virtual',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  // Event code from Salesforce/external system - used for SSO sync
  @Column({ type: 'varchar', nullable: true, unique: true })
  eventCode?: string;

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

  // Publish dates - determines when event is visible on the app
  @Column({ type: 'date', nullable: true })
  publishStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  publishEndDate?: Date;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'varchar', nullable: true })
  exhibitorDescription?: string;

  @Column({ type: 'text', nullable: true })
  eventStampDescription?: string;

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
  // @Column('simple-array', { nullable: true })
  // documents?: string[];

  @Column({ type: 'enum', enum: EventType, nullable: true })
  type?: EventType;

  @Column({ type: 'decimal', nullable: true })
  price?: number;

  /** GST/Tax % for this event (e.g. 18 for 18%). Used for checkout breakdown. */
  @Column({ type: 'decimal', nullable: true, default: 18 })
  gstRate?: number;

  @Column({ type: 'varchar', length: 10, default: 'SGD' })
  currency?: string = 'SGD';

  /** Early Bird: price and validity period (start = when it becomes available, end = expiry) */
  @Column({ type: 'decimal', nullable: true })
  earlyBirdPrice?: number;

  @Column({ type: 'date', nullable: true })
  earlyBirdStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  earlyBirdEndDate?: Date;

  // Floor plan - single image
  @Column({ type: 'varchar', nullable: true })
  floorPlan?: string;

  // Background image for Q&A pages
  @Column({ type: 'varchar', nullable: true })
  backgroundImage?: string;

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

  @OneToMany(() => Survey, (survey) => survey.event, {
    cascade: true,
    eager: false,
  })
  surveys!: Survey[];

  @Column({ type: 'boolean', default: false })
  enableLuckyDrawFeature!: boolean;

  // Event Stamp relationship - many-to-many through EventStampEvent
  @OneToMany(() => EventStampEvent, (eventStampEvent) => eventStampEvent.event)
  eventStampEvents!: EventStampEvent[];

  // Exhibitor relationship
  @OneToMany(() => EventExhibitor, (eventExhibitor) => eventExhibitor.event)
  eventExhibitors!: EventExhibitor[];

  @Column('simple-array', { nullable: true })
  documents?: string[];

  // Add this new field for document names
  @Column('simple-array', { nullable: true })
  documentNames?: string[];
  
  // Event booths relationship
  @OneToMany(() => EventBooth, (eventBooth) => eventBooth.event)
  eventBooths!: EventBooth[];
  
  // Event staff relationship (users who switched to exhibitor role for this event)
  @OneToMany(() => EventStaff, (eventStaff) => eventStaff.event)
  eventStaffs!: EventStaff[];
  
  // Event agendas relationship
  @OneToMany(() => EventAgenda, (eventAgenda) => eventAgenda.event)
  eventAgendas!: EventAgenda[];
  
  // Programme tracks relationship
  @OneToMany(() => ProgrammeTrack, (programmeTrack) => programmeTrack.event, {
    cascade: true,
    eager: false,
  })
  programmeTracks!: ProgrammeTrack[];
  
  /** Stamps required to get reward (e.g. 8). Progress shown as collectedCount/stampRequiredForReward (e.g. 3/8) in app. */
  @Column({ type: 'int', nullable: true })
  stampRequiredForReward?: number;

  // Tab visibility configuration - JSON object to control which tabs are visible
  @Column({ type: 'json', nullable: true })
  tabVisibility?: {
    speakers?: boolean;
    documents?: boolean;
    floorplan?: boolean;
    gallery?: boolean;
    stamps?: boolean;
    survey?: boolean;
    exhibitors?: boolean;
    categories?: boolean;
    agenda?: boolean;
    adminInfo?: boolean;
    engagement?: boolean;
    programme?: boolean;
    chat?: boolean;
  };

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

  @ManyToOne(() => Exhibitor, (exhibitor) => exhibitor.eventExhibitors, {
    onDelete: 'CASCADE',
  })
  exhibitor!: Exhibitor;

  
}
