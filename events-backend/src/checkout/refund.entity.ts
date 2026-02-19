import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Order this refund belongs to */
  @Column({ type: 'uuid' })
  orderId!: string;

  /** WooShPay refund ID (re_xxx) */
  @Column({ type: 'varchar' })
  wooshpayRefundId!: string;

  /** Amount refunded in currency units (e.g. 144.00 SGD) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'SGD' })
  currency!: string;

  /** pending | succeeded | failed | canceled */
  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', nullable: true })
  reason?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
