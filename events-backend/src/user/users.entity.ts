import { FavoriteEvent } from 'favorite-event/favorite-event.entity';
import { Order } from 'order/order.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Speaker = 'speaker',
  Exhibitor = 'exhibitor',
}
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  LINKEDIN = 'linkedin',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  firstName!: string; // Updated field

  @Column({ type: 'varchar' })
  lastName!: string; // Updated field

  @Column({ type: 'varchar', unique: true })
  email!: string; // Updated field

  @Column()
  password!: string; // Updated field

  @Column()
  mobile!: string; // Updated field

  @Column({ nullable: true })
  address?: string; // Updated field

  @Column({ nullable: true })
  city?: string; // Updated field

  @Column({ nullable: true })
  state?: string; // Updated field

  @Column({ nullable: true })
  postalCode?: string; // Updated field

  @Column({
    type: 'enum',
    enum: UserRole,
    // default: UserRole.Admin,
  })
  role?: UserRole;

  @Column({ default: false })
  isMember!: boolean; // Updated field

  @Column({ default: false })
  biometricEnabled!: boolean; // Updated field

  @Column({ nullable: true })
  countryCurrency?: string; // Updated field

  @Column({ nullable: true, type: 'text' })
  profilePicture?: string; // Updated field

  @Column({ nullable: true, type: 'text' })
  linkedinProfile?: string; // Updated field

  @Column({ nullable: true })
  resetToken?: string; // Updated field

  @Column({ nullable: true, type: 'timestamp' })
  resetTokenExpiry?: Date; // Updated field

  @Column({ default: false })
  isVerify!: boolean; // Updated field

  @Column({ nullable: true })
  otp?: string; // Updated field

  @Column({ nullable: true, type: 'timestamp' })
  otpExpiry?: Date; // Updated field

  // Role switch verification fields
  @Column({ nullable: true })
  roleSwitchCode?: string; // Code for role switching verification

  @Column({ nullable: true, type: 'timestamp' })
  roleSwitchCodeExpiry?: Date; // Expiry time for role switch code

  @Column({ type: 'enum', enum: UserRole, nullable: true })
  pendingRole?: UserRole; // Role user wants to switch to

  @Column({ nullable: true })
  refreshToken?: string; // Add this field

  // Optional field for Terms & Conditions acceptance
  @Column({ nullable: true, default: false })
  acceptTerms!: boolean;

  // Social Login Fields
  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider!: AuthProvider;

  @Column({ nullable: true })
  socialId?: string; // ID from social provider

  @Column({ nullable: true })
  socialAccessToken?: string; // Access token from social provider

  @Column({ nullable: true })
  socialRefreshToken?: string; // Refresh token from social provider

  @Column({ nullable: true })
  socialTokenExpiry?: Date; // Token expiry from social provider

  // Speaker-specific fields
  @Column({ nullable: true })
  companyName?: string; // Company/Organization name for speakers

  @Column({ nullable: true })
  position?: string; // Job title/position for speakers

  @Column({ type: 'text', nullable: true })
  description?: string; // Bio/description for speakers

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders?: Order[];

  @OneToMany(() => FavoriteEvent, (favoriteEvent) => favoriteEvent.user)
  favoriteEvents?: FavoriteEvent[];

  // Speaker relationship - when user has Speaker role
  @OneToMany('EventSpeaker', 'speaker')
  eventSpeakers?: any[];

  // Exhibitor relationship - when user has Exhibitor role
  @OneToMany('Exhibitor', 'user')
  exhibitorProfile?: any[];
}
