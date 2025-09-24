// src/entities/cart.entity.ts
import { Event } from 'event/event.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string; // User ID

    @Column({ type: 'uuid' })
    eventId!: string; // Event ID

    @ManyToOne(() => Event, (event) => event.carts) // Define the relationship
    event!: Event; // Event associated with the cart

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// New entity for user cart preferences (coupon only)
@Entity('user_cart_preferences')
export class UserCartPreference {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string; // User ID

    @Column({ type: 'varchar', nullable: true })
    appliedCoupon?: string; // Currently applied coupon code

    @Column({ type: 'decimal', nullable: true })
    couponDiscount?: number; // Discount amount from coupon

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}