import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';

@Entity('favorite_events')
export class FavoriteEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.favoriteEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => Event, (event) => event.favoriteEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;
}
