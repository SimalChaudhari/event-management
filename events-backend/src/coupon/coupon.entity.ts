import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CouponUsage } from './coupon-usage.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // Like: "WELCOME10"

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
  expiryDate?: Date; // coupon expiry date

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages!: CouponUsage[];
}