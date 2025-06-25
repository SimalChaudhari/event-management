import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CouponUsage } from './coupon-usage.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // Like: "WELCOME10"

  @Column({ default: true })
  isActive!: boolean; // coupon active है या नहीं

  @Column('decimal', { precision: 10, scale: 2 })
  actualValue!: number; // minimum order value जिस पर coupon apply होगा

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue!: number; // discount की value

  @Column({ type: 'enum', enum: ['percentage', 'fixed'] })
  discountType!: 'percentage' | 'fixed'; // percentage या fixed amount

  @Column({ default: 1 })
  usageLimit!: number; // एक user कितनी बार use कर सकता है

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date; // coupon का expiry date

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages!: CouponUsage[];
}