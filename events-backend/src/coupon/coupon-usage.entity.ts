import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Coupon } from './coupon.entity';

@Entity('coupon_usages')
export class CouponUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  couponId!: string;

  @Column()
  orderId!: string; // किस order में use किया

  @CreateDateColumn()
  usedAt!: Date;

  @ManyToOne(() => Coupon, (coupon) => coupon.usages)
  coupon!: Coupon;
}
