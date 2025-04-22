// src/entities/event.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EventSpeaker } from './event-speaker.entity';
import { Cart } from 'cart/cart.entity';
import { OrderItemEntity } from 'order/event.item.entity';

export enum EventType {
    Physical = 'Physical',
    Virtual = 'Virtual',
    Hybrid = 'Hybrid',
}

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'date' })
    startDate!: Date;

    @Column({ type: 'time' })
    startTime!: string;

    @Column({ type: 'date' })
    endDate!: Date;

    @Column({ type: 'time' })
    endTime!: string;

    @Column({ type: 'varchar', nullable: true })
    location?: string;

    @Column({ type: 'varchar', nullable: true })
    country?: string;

    @Column({ type: 'varchar', nullable: true })
    image?: string;

    @Column({ type: 'enum', enum: EventType, nullable: true })
    type?: EventType;

    @Column({ type: 'decimal', nullable: true })
    price?: number;

    @Column({ type: 'varchar', length: 10, default: 'USD', nullable: true })
    currency?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    
    
    @OneToMany(() => EventSpeaker, (eventSpeaker) => eventSpeaker.event)
    eventSpeakers!: EventSpeaker[];

    @OneToMany(() => Cart, (cart) => cart.event) // Define the relationship
    carts!: Cart[]; // Carts associated with the event
    eventOrders: any;

    
    @OneToMany(() => OrderItemEntity, (order) => order.event)
    orderItem?: OrderItemEntity[];
  
}