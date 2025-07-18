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

  @Entity('exhibitors')
  export class Exhibitor {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ type: 'varchar' })
    name!: string;
  
    @Column({ type: 'varchar' })
    userName!: string;
  
    @Column({ type: 'varchar', unique: true })
    email!: string;
  
    @Column({ type: 'varchar' })
    mobile!: string;
  
    @Column({ type: 'text', nullable: true })
    address?: string;
  
    @Column({ type: 'varchar' })
    companyName!: string;
  
    @Column({ type: 'text', nullable: true })
    companyDescription?: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;
  
    // Multiple flyer images support
    @Column('simple-array', { nullable: true })
    flyers?: string[];
  
    // Multiple documents support
    @Column('simple-array', { nullable: true })
    documents?: string[];
  
    // Multiple event images support
    @Column('simple-array', { nullable: true })
    eventImages?: string[];

    // Add the new relationship
    @OneToMany(() => PromotionalOffer, (promotionalOffer) => promotionalOffer.exhibitor)
    promotionalOffers!: PromotionalOffer[];

     // Event relationship
  @OneToMany(() => EventExhibitor, (eventExhibitor) => eventExhibitor.exhibitor)
  eventExhibitors!: EventExhibitor[];
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  
  
  } 