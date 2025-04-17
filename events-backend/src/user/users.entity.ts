import { Order } from 'order/order.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum UserRole {
    Admin = 'admin',
    User = 'user',
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

    @Column({ nullable: true })
    mobile?: string; // Updated field

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

    @Column({ nullable: true })
    refreshToken?: string; // Add this field

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @OneToMany(() => Order, (order) => order.user)
    orders?: Order[];

}
