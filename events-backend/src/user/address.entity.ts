import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './users.entity';

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  OTHER = 'other',
}

@Entity('addresses')
export class AddressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  street!: string;

  @Column({ type: 'varchar' })
  city!: string;

  @Column({ type: 'varchar' })
  state!: string;

  @Column({ type: 'varchar' })
  postalCode!: string;

  @Column({ type: 'varchar' })
  country!: string;

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.HOME,
  })
  type!: AddressType;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'varchar', nullable: true })
  label?: string; // Optional custom label like "Mom's House", "Office", etc.

  @Column({ type: 'varchar', nullable: true })
  apartment?: string; // Apartment, suite, unit number

  @Column({ type: 'varchar', nullable: true })
  landmark?: string; // Nearby landmark for easier location

  @Column({ type: 'varchar', nullable: true })
  instructions?: string; // Delivery instructions

  // Foreign key to User
  @Column({ type: 'uuid' })
  userId!: string;

  // Relationship with User
  @ManyToOne(() => UserEntity, (user) => user.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
