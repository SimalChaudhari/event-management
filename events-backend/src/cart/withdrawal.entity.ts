import { Event } from 'event/event.entity';
import { Order } from 'order/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.withdrawals, { onDelete: 'CASCADE' })
  order?: Order;

  @ManyToOne(() => Event, { eager: true, nullable: false })
  event?: Event;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status?: WithdrawalStatus;

  @CreateDateColumn()
  request_at?: Date;

  @UpdateDateColumn({ nullable: true })
  reviewed_at?: Date;

  @Column({ nullable: true })
  admin_note?: string;
}
