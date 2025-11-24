import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Checkout } from './checkout.entity';

@Entity('checkout_cart_items')
export class CheckoutCartItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Checkout, (checkout) => checkout.checkoutCartItems, { nullable: false, onDelete: 'CASCADE' })
    checkout!: Checkout;

    @Column({ type: 'varchar' })
    checkoutId!: string;

    @Column({ type: 'uuid' })
    cartId!: string; // Cart ID

    @Column({ type: 'uuid' })
    eventId!: string; // Event ID

    @CreateDateColumn({ type: 'timestamp' })
    createdAt?: Date;
}

