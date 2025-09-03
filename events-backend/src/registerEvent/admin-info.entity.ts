import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RegisterEvent } from './registerEvent.entity';

@Entity('adminInfo')
export class AdminInfo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  registerEventId!: string;

  @ManyToOne(() => RegisterEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registerEventId' })
  registerEvent!: RegisterEvent;

  @Column({ type: 'varchar', nullable: true })
  luckyDrawNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  tableNumber?: string;

  @Column({ type: 'text', nullable: true })
  additionalInformation?: string;

  @Column({ type: 'varchar', nullable: true })
  dressCode?: string;

  @Column({ type: 'varchar', nullable: true })
  hall?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
