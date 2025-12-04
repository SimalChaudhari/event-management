import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exhibitor } from './exhibitor.entity';

@Entity('booth_banners')
export class BoothBanner {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  exhibitorId!: string;

  @Column({ type: 'text' })
  banner!: string; // Can be file path (uploads/...) or URL (http://...)

  @ManyToOne(() => Exhibitor, (exhibitor) => exhibitor.boothBanners, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exhibitorId' })
  exhibitor!: Exhibitor;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

