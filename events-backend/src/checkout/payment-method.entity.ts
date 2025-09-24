import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'user/users.entity';

export enum CardBrand {
  // Global Networks
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DINERS = 'diners',
  
  // Americas
  DISCOVER = 'discover',
  
  // Europe
  MAESTRO = 'maestro',
  INSTAPAYMENT = 'instapayment',
  LASER = 'laser',
  SOLO = 'solo',
  SWITCH = 'switch',
  DANKORT = 'dankort',
  CARTE_BANCAIRE = 'carte_bancaire',
  
  // Asia
  JCB = 'jcb',
  UNIONPAY = 'unionpay',
  RUPAY = 'rupay',
  MIR = 'mir',
  
  // South America
  ELO = 'elo',
  HIPERCARD = 'hipercard',
  AURA = 'aura',
  
  // Turkey
  TROY = 'troy',
  
  // Unknown
  UNKNOWN = 'unknown',
}

export enum CardFunding {
  CREDIT = 'credit',
  DEBIT = 'debit',
  PREPAID = 'prepaid',
  UNKNOWN = 'unknown',
}

@Entity('user_payment_methods')
export class UserPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  userId!: string;

  // WooShPay Payment Method Token (Secure)
  @Column({ unique: true })
  wooshpayPaymentMethodId!: string; // e.g., "pm_1234567890"

  @Column({ nullable: true })
  wooshpayCustomerId?: string; // WooShPay customer ID

  // Card Display Information (Safe to store)
  @Column({ length: 4 })
  last4!: string; // Last 4 digits from WooShPay

  @Column({
    type: 'enum',
    enum: CardBrand,
    default: CardBrand.UNKNOWN,
  })
  brand!: CardBrand; // Card brand from WooShPay

  @Column({
    type: 'enum',
    enum: CardFunding,
    default: CardFunding.UNKNOWN,
  })
  funding!: CardFunding; // credit/debit from WooShPay

  @Column({ type: 'int' })
  expMonth!: number; // Expiry month

  @Column({ type: 'int' })
  expYear!: number; // Expiry year

  @Column({ type: 'int', default: 3 })
  cvvLength!: number; // CVV length (3 for most cards, 4 for Amex)

  @Column({ nullable: true })
  country?: string; // Card issuing country

  @Column({ nullable: true })
  fingerprint?: string; // WooShPay card fingerprint

  // Billing Details
  @Column({ nullable: true })
  billingName?: string;

  @Column({ nullable: true })
  billingEmail?: string;

  @Column({ nullable: true })
  billingPhone?: string;

  // User Preferences
  @Column({ default: false })
  isDefault!: boolean;

  @Column({ nullable: true })
  nickname?: string; // User-defined name

  // Usage Tracking
  @Column({ default: 0 })
  usageCount!: number;

  @Column({ nullable: true })
  lastUsedAt?: Date;

  // Status
  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Display Methods
  getDisplayName(): string {
    if (this.nickname) {
      return this.nickname;
    }
    return `${this.brand.charAt(0).toUpperCase() + this.brand.slice(1)} ****${this.last4}`;
  }

  getMaskedCardNumber(): string {
    return `****-****-****-${this.last4}`;
  }

  getExpiryDisplay(): string {
    return `${this.expMonth.toString().padStart(2, '0')}/${this.expYear}`;
  }

  isExpired(): boolean {
    const now = new Date();
    const expiry = new Date(this.expYear, this.expMonth - 1); // Month is 0-indexed
    return now > expiry;
  }

  getCardIcon(): string {
    switch (this.brand) {
      case CardBrand.VISA:
        return '💳'; // Visa icon
      case CardBrand.MASTERCARD:
        return '💳'; // Mastercard icon
      case CardBrand.AMEX:
        return '💳'; // AMEX icon
      default:
        return '💳'; // Generic card icon
    }
  }
}
