import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('csv_upload_logs')
export class CsvUploadLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  sessionId!: string; // Unique session identifier

  @Column({ type: 'varchar', length: 255 })
  adminId!: string; // Admin who performed the upload

  @Column({ type: 'varchar', length: 255 })
  fileName!: string; // Original CSV file name


  @Column({ type: 'int' })
  totalRecords!: number; // Total records in CSV

  @Column({ type: 'int', default: 0 })
  recordsProcessed!: number; // Successfully processed

  @Column({ type: 'int', default: 0 })
  recordsFailed!: number; // Failed to process

  @Column({ type: 'int', default: 0 })
  recordsSkipped!: number; // Skipped (already exists)

  @Column({ type: 'int', default: 0 })
  newUsersCreated!: number; // New users created

  @Column({ type: 'int', default: 0 })
  existingUsersUpdated!: number; // Existing users updated

  @Column({ type: 'int', default: 0 })
  passwordsGenerated!: number; // Passwords generated

  @Column({ type: 'int', default: 0 })
  emailsTotal!: number; // Total emails to send

  @Column({ type: 'int', default: 0 })
  emailsSent!: number; // Emails successfully sent

  @Column({ type: 'int', default: 0 })
  emailsFailed!: number; // Emails failed to send

  @Column({ type: 'int', default: 0 })
  emailsPending!: number; // Emails still processing

  @Column({ type: 'varchar', length: 50 })
  status!: 'processing' | 'completed' | 'failed' | 'partial'; // Overall status

  @Column({ type: 'bigint' })
  processingTimeMs!: number; // Processing time in milliseconds

  @Column({ type: 'text', nullable: true })
  errorDetails?: string; // JSON string of error details

  @Column({ type: 'text', nullable: true })
  skippedRecords?: string; // JSON string of skipped records

  @Column({ type: 'text', nullable: true })
  failedRecords?: string; // JSON string of failed records

  @Column({ type: 'text', nullable: true })
  emailDetails?: string; // JSON string of email status details

  @Column({ type: 'boolean', default: false })
  emailSendingEnabled!: boolean; // Whether email sending was enabled

  @Column({ type: 'varchar', length: 1000, nullable: true })
  summary?: string; // Human readable summary

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
