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

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
