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

// Custom transformer to handle both old and new data formats
const fileArrayTransformer = {
  to: (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  },
  from: (value: string): any => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Check if it's the new format (array of objects) or old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name && parsed[0].flyer) {
          return parsed; // New format: array of objects
        } else {
          // Old format: array of strings, convert to new format
          return parsed.map((item: string, index: number) => ({
            name: `Item ${index + 1}`,
            flyer: item
          }));
        }
      }
      return parsed;
    } catch (error) {
      // If parsing fails, try to split as comma-separated string (fallback)
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map((item: string, index: number) => ({
          name: `Item ${index + 1}`,
          flyer: item.trim()
        }));
      }
      return [];
    }
  }
};

const documentArrayTransformer = {
  to: (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  },
  from: (value: string): any => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Check if it's the new format (array of objects) or old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name && parsed[0].document) {
          return parsed; // New format: array of objects
        } else {
          // Old format: array of strings, convert to new format
          return parsed.map((item: string, index: number) => ({
            name: `Document ${index + 1}`,
            document: item
          }));
        }
      }
      return parsed;
    } catch (error) {
      // If parsing fails, try to split as comma-separated string (fallback)
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map((item: string, index: number) => ({
          name: `Document ${index + 1}`,
          document: item.trim()
        }));
      }
      return [];
    }
  }
};

const eventImageArrayTransformer = {
  to: (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  },
  from: (value: string): any => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Check if it's the new format (array of objects) or old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name && parsed[0].eventImage) {
          return parsed; // New format: array of objects
        } else {
          // Old format: array of strings, convert to new format
          return parsed.map((item: string, index: number) => ({
            name: `Event Image ${index + 1}`,
            eventImage: item
          }));
        }
      }
      return parsed;
    } catch (error) {
      // If parsing fails, try to split as comma-separated string (fallback)
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map((item: string, index: number) => ({
          name: `Event Image ${index + 1}`,
          eventImage: item.trim()
        }));
      }
      return [];
    }
  }
};

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
