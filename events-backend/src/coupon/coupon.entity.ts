import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CouponUsage } from './coupon-usage.entity';
import { Event } from '../event/event.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string; // Voucher name like: "WELCOME10"

  @Column({ default: true })
  isActive!: boolean; // coupon active 

  @Column('decimal', { precision: 10, scale: 2 })
  actualValue!: number; // minimum order

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue!: number; // discount

  @Column({ type: 'enum', enum: ['percentage', 'fixed'] })
  discountType!: 'percentage' | 'fixed'; // percentage  fixed amount

  @Column({ default: 1 })
  usageLimit!: number; //

  @Column({ type: 'date', nullable: true })
  validFrom?: Date; // Voucher valid from date

  @Column({ type: 'date', nullable: true })
  validTo?: Date; // Voucher valid to date

  @Column({ type: 'uuid', nullable: true })
  eventId?: string; // Event ID - null means coupon is global, otherwise event-specific

  @ManyToOne(() => Event, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'eventId' })
  event?: Event; // Event relationship

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages!: CouponUsage[];
}