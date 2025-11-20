import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string; // Template name like "Welcome Email", "Password Reset", etc.

  @Column()
  subject!: string; // Email subject line

  @Column('text')
  body!: string; // Email body (HTML supported)

  @Column({ type: 'text', nullable: true })
  variables?: string; // JSON string of available variables like {"userName": "User Name", "eventName": "Event Name"}

  @Column({ default: true })
  isActive!: boolean; // Template active status

  @Column({ type: 'enum', enum: ['welcome', 'password-reset', 'event-registration', 'event-reminder', 'notification', 'custom'], default: 'custom' })
  type!: 'welcome' | 'password-reset' | 'event-registration' | 'event-reminder' | 'notification' | 'custom';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

