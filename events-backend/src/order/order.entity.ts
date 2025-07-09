// events-backend/src/event/order.entity.ts
import { IsEnum } from 'class-validator';

import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from 'user/users.entity';
import { OrderStatus, PaymentMethod } from './order.dto';
import { OrderItemEntity } from './event.item.entity';
import { Withdrawal } from 'withdrawal/withdrawal.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => UserEntity, (user) => user.orders, { nullable: false, onDelete: 'CASCADE' })
    user!: UserEntity;  // Made non-nullable

    @Column({ type: 'varchar', unique: true })
    orderNo!: string;

    @Column({ type: 'enum', enum: PaymentMethod,nullable: true  })
    paymentMethod?: PaymentMethod;

    @Column({ type: 'decimal' })
    price!: number;

    @Column({ type: 'decimal', nullable: true })
    discount?: number;

    @Column({ type: 'decimal', nullable: true })
    originalPrice?: number;

    @Column({ type: 'enum', enum: OrderStatus, nullable: true })
    status?: OrderStatus;

    @Column({ default: false })
    isDeleted!: boolean;

    @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order) // Add relation to OrderItemEntity
    orderItems!: OrderItemEntity[];

    @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.order)
    withdrawals?: Withdrawal[];
    
    @CreateDateColumn({ type: 'timestamp' })
    createdAt?: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt?: Date;

}