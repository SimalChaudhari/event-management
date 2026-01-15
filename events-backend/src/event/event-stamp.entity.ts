import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EventStampEvent } from './event-stamp-event.entity';

@Entity('event_stamps')
export class EventStamp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string; // This will store boothNumber

  @Column({ type: 'varchar', nullable: true })
  image?: string; // Logo/image/stamp path

  @Column({ type: 'uuid', nullable: true })
  exhibitorId?: string; // Exhibitor (Company) ID

  @Column({ type: 'boolean', default: false })
  isVisited!: boolean; // Whether the stamp has been visited/collected

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => EventStampEvent, (eventStampEvent) => eventStampEvent.eventStamp)
  eventStampEvents!: EventStampEvent[];
}
