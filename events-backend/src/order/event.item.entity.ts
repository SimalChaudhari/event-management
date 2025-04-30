
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Event } from 'event/event.entity';

export enum OrderNoStatus {
    Pending = 'Pending',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
}

@Entity('ordersItem')
export class OrderItemEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Order, (or) => or.orderItems, { nullable: false, onDelete: 'CASCADE' })
    order!: Order;  // Link to the order

    @ManyToOne(() => Event, (e) => e.orderItem, { nullable: false, onDelete: 'CASCADE' })
    event!: Event;  // Changed user? to user! to enforce non-nullable constraint

    @Column({ type: 'enum', enum: OrderNoStatus, default: OrderNoStatus.Pending })
    status!: OrderNoStatus;

    @Column({ default: false })
    isDeleted!: boolean;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date;
}
