// src/entities/exhibitor.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { EventExhibitor } from 'event/event.entity';
import { EventBooth } from '../event/event-booth.entity';
import { documentArrayTransformer, fileArrayTransformer, eventImageArrayTransformer, socialMediaTransformer } from '../utils/transformers/document-array.transformer';
import { BoothBanner } from './booth-banner.entity';

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

  // Booth banner relationship - now stored in separate table
  @OneToMany(() => BoothBanner, (boothBanner) => boothBanner.exhibitor)
  boothBanners!: BoothBanner[];

  // Add new fields: email, mobile, UEN, and logo
  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  mobile?: string;

  @Column({ type: 'varchar', nullable: true })
  uen?: string;

  @Column({ type: 'varchar', nullable: true })
  logo?: string;

  @Column({ type: 'varchar', nullable: true })
  website?: string;

  @Column({ type: 'varchar', nullable: true })
  facebookUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  instagramUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  linkedinUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  xUrl?: string;

  @Column({ type: 'text', nullable: true, transformer: socialMediaTransformer })
  socialMedia?: Array<{
    platform?: string;
    icon?: string;
    link?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  promotionalOfferNote?: string;

  // Updated flyers structure - array of objects with id (required), name and flyer
  @Column({ type: 'text', nullable: true, transformer: fileArrayTransformer })
  flyers?: Array<{ id: string; name: string; flyer: string }>;

  // Updated documents structure - array of objects with id (required), name and document
  @Column({ type: 'text', nullable: true, transformer: documentArrayTransformer })
  documents?: Array<{ id: string; name: string; document: string }>;

  // Updated event images structure - array of objects with id (required), name and eventImage
  @Column({ type: 'text', nullable: true, transformer: eventImageArrayTransformer })
  eventImages?: Array<{ id: string; name: string; eventImage: string }>;

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
