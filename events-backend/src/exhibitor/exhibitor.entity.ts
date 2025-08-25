// src/entities/exhibitor.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { PromotionalOffer } from '../promotional-offer/promotional-offer.entity';
import { EventExhibitor } from 'event/event.entity';
import { EventBooth } from '../event/event-booth.entity';
import { EventAgenda } from 'agenda/agenda.entity';

@Entity('exhibitors')
export class Exhibitor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  companyName!: string;

  @Column({ type: 'text', nullable: true })
  companyDescription?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Add new bothNumber field
  @Column({ type: 'varchar', nullable: true })
  bothNumber?: string;

  // Add new fields: email, mobile, UEN, and logo
  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'varchar', nullable: true })
  mobile?: string;

  @Column({ type: 'varchar', nullable: true })
  uen?: string;

  @Column({ type: 'varchar', nullable: true })
  logo?: string;

  // Multiple flyer images support
  @Column('simple-array', { nullable: true })
  flyers?: string[];

  // Add flyer names field
  @Column('simple-array', { nullable: true })
  flyerNames?: string[];

  // Multiple documents support
  @Column('simple-array', { nullable: true })
  documents?: string[];

  // Add this new field for document names 
  @Column('simple-array', { nullable: true })
  documentNames?: string[];

  // Multiple event images support
  @Column('simple-array', { nullable: true })
  eventImages?: string[];

  // Add event image names field
  @Column('simple-array', { nullable: true })
  eventImageNames?: string[];

  // Add the new relationship
  @OneToMany(
    () => PromotionalOffer,
    (promotionalOffer) => promotionalOffer.exhibitor,
  )
  promotionalOffers!: PromotionalOffer[];

  // Event relationship
  @OneToMany(() => EventExhibitor, (eventExhibitor) => eventExhibitor.exhibitor)
  eventExhibitors!: EventExhibitor[];

  // Event booth relationship
  @OneToMany(() => EventBooth, (eventBooth) => eventBooth.exhibitor)
  eventBooths!: EventBooth[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
