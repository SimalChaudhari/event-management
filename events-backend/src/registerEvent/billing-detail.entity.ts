import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { RegisterEvent } from './registerEvent.entity';

@Entity('billing_details')
export class BillingDetail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  registerEventId?: string;

  @ManyToOne(() => RegisterEvent, (registerEvent) => registerEvent.billingDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registerEventId' })
  registerEvent?: RegisterEvent;

  // External registration details
  @Column({ nullable: true })
  registrationId?: string; // External registration ID from API

  @Column({ nullable: true })
  registrationName?: string; // e.g., "CR-922891"

  @Column({ nullable: true })
  registrationStatus?: string; // e.g., "Confirmed"

  // Billing information
  @Column({ nullable: true })
  billingHeaderName?: string; // e.g., "BID-000734296"

  @Column({ nullable: true })
  billingHeaderId?: string;

  @Column({ nullable: true })
  billingDetailName?: string; // e.g., "BD-01099326"

  @Column({ nullable: true })
  billingDetailId?: string;

  @Column({ type: 'text', nullable: true })
  billingAttachmentUrl?: string;

  // Location details
  @Column({ nullable: true })
  unitNumber?: string;

  @Column({ nullable: true })
  streetName?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  buildingNumber?: string;

  @Column({ nullable: true })
  buildingName?: string;

  // Additional flags
  @Column({ default: false })
  hasCourseInstance?: boolean;

  @Column({ type: 'int', default: 0 })
  totalBillingDetails?: number;

  @CreateDateColumn()
  createdAt!: Date;
}

