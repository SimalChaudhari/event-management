import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exhibitor } from '../exhibitor/exhibitor.entity';

@Entity('promotional_offers')
export class PromotionalOffer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  companyName!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  validDate?: string;

  @Column({ type: 'varchar', nullable: true })
  image?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => Exhibitor, (exhibitor) => exhibitor.promotionalOffers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exhibitorId' })
  exhibitor!: Exhibitor;

  @Column({ type: 'uuid' })
  exhibitorId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 