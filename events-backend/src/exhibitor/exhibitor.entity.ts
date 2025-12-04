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
import { documentArrayTransformer, fileArrayTransformer, eventImageArrayTransformer } from '../utils/transformers/document-array.transformer';

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
  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  mobile?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', nullable: true })
  uen?: string;

  @Column({ type: 'varchar', nullable: true })
  logo?: string;

  // Updated flyers structure - array of objects with name and flyer
  @Column({ type: 'text', nullable: true, transformer: fileArrayTransformer })
  flyers?: Array<{ name: string; flyer: string }>;

  // Updated documents structure - array of objects with name and document
  @Column({ type: 'text', nullable: true, transformer: documentArrayTransformer })
  documents?: Array<{ name: string; document: string }>;

  // Updated event images structure - array of objects with name and eventImage
  @Column({ type: 'text', nullable: true, transformer: eventImageArrayTransformer })
  eventImages?: Array<{ name: string; eventImage: string }>;

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

  // Event Staff relationship
  @OneToMany('EventStaff', 'exhibitor')
  eventStaffs?: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
