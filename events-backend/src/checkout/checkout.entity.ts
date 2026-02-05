import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserEntity } from 'user/users.entity';
import { CheckoutStatus, PaymentGateway } from './checkout.dto';
import { CheckoutCartItem } from './checkout-cart-item.entity';

@Entity('checkouts')
export class Checkout {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
    user!: UserEntity;

    @Column({ type: 'varchar', unique: true })
    checkoutId!: string;

    @OneToMany(() => CheckoutCartItem, (checkoutCartItem) => checkoutCartItem.checkout, { cascade: true })
    checkoutCartItems!: CheckoutCartItem[];

    @Column({ type: 'decimal' })
    totalAmount!: number;

    @Column({ type: 'decimal', nullable: true })
    discount?: number;

    @Column({ type: 'varchar', nullable: true })
    couponCode?: string;

    @Column({ type: 'varchar', nullable: true })
    promoCode?: string;

    @Column({ type: 'enum', enum: CheckoutStatus, default: CheckoutStatus.Pending })
    status!: CheckoutStatus;

    @Column({ type: 'enum', enum: PaymentGateway, nullable: true })
    paymentGateway?: PaymentGateway;

    @Column({ type: 'varchar', nullable: true })
    paymentMethod?: string;

    @Column({ type: 'varchar', nullable: true })
    transactionId?: string;

    @Column({ type: 'varchar', nullable: true })
    paymentUrl?: string;

    @Column({ type: 'varchar', nullable: true })
    wooshpaySessionId?: string;

    /** WooShPay payment intent ID (pi_xxx) – used for refunds */
    @Column({ type: 'varchar', nullable: true })
    wooshpayPaymentIntentId?: string;

    /** Order created from this checkout (set when payment completes) */
    @Column({ type: 'uuid', nullable: true })
    orderId?: string;

    @Column({ type: 'text', nullable: true })
    paymentNotes?: string;

    @Column({ type: 'boolean', default: false })
    isCompleted!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date;

    @Column({ type: 'boolean', default: false })
    isDeleted!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt?: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt?: Date;
}
