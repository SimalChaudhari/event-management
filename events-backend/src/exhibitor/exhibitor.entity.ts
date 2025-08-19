// src/entities/exhibitor.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PromotionalOffer } from '../promotional-offer/promotional-offer.entity';
import { EventExhibitor } from 'event/event.entity';
import { UserEntity } from '../user/users.entity';

@Entity('exhibitors')
export class Exhibitor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // User relationship - basic info comes from User table
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar' })
  userName!: string; 

  @Column({ type: 'varchar' })
  companyName!: string;

  @Column({ type: 'text', nullable: true })
  companyDescription?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Add new bothNumber field
  @Column({ type: 'varchar', nullable: true })
  bothNumber?: string;

  // Multiple flyer images support
  @Column('simple-array', { nullable: true })
  flyers?: string[];

  // Add flyer names field
  @Column('simple-array', { nullable: true })
  flyerNames?: string[];

  // Multiple documents support
  @Column('simple-array', { nullable: true })
  documents?: string[];

  // Add this new field for document names (Event जैसा ही)
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
