// events-backend/src/event/order.entity.ts
import { IsEnum } from 'class-validator';

import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { UserEntity } from 'user/users.entity';
import { OrderStatus } from './order.dto';
import { OrderItemEntity } from './event.item.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => UserEntity, (user) => user.orders, { nullable: false, onDelete: 'CASCADE' })
    user!: UserEntity;  // Made non-nullable

    @Column({ type: 'varchar', unique: true })
    orderNo!: string;

    @Column({ type: 'varchar' })
    paymentMethod!: string;

    @Column({ type: 'decimal' })
    price!: number;

    @Column({ type: 'enum', enum: OrderStatus, nullable: true })
    status?: OrderStatus;


    @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order) // Add relation to OrderItemEntity
    orderItems!: OrderItemEntity[];
    


}