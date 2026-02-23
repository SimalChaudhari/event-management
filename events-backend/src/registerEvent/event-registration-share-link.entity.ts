import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('event_registration_share_links')
@Index('IDX_EVENT_REG_SHARE_TOKEN', ['shareToken'], { unique: true })
@Index('IDX_EVENT_REG_SHARE_EVENT', ['eventId'])
export class EventRegistrationShareLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  shareToken!: string;

  /** Access code required to view share page. Unique per event; stored in cookie after verify. */
  @Column({ type: 'varchar', length: 16 })
  accessCode!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
