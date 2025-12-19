// src/entities/event-staff.entity.ts
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Event } from './event.entity';
import { UserEntity } from '../user/users.entity';
import { Exhibitor } from '../exhibitor/exhibitor.entity';

@Entity('event_staff')
export class EventStaff {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string; // Event ID

  @Column()
  exhibitorId!: string; // Exhibitor (Company) ID

  @Column()
  userId!: string; // User ID who switched to exhibitor role

  @Column({ type: 'boolean', default: false })
  isCurrent!: boolean; // Marks the current/active association for this user

  @ManyToOne(() => Event, (event) => event.eventStaffs, {
    onDelete: 'CASCADE',
  })
  event?: Event;

  @ManyToOne(() => Exhibitor, (exhibitor) => exhibitor.eventStaffs, {
    onDelete: 'CASCADE',
  })
  exhibitor?: Exhibitor; // Exhibitor (Company) this staff belongs to

  @ManyToOne(() => UserEntity, (user) => user.eventStaffs)
  user!: UserEntity; // User who is event staff (exhibitor)

  @CreateDateColumn()
  createdAt!: Date;
}

