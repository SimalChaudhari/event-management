import { Event } from 'event/event.entity';
import { Order } from 'order/order.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from 'user/users.entity';

@Entity('registerEvents')
export class RegisterEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId?: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column()
  eventId?: string;

  @ManyToOne(() => Event, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @ManyToOne(() => Order, { eager: false, nullable: true }) // ← Add this block
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @Column({ type: 'enum', enum: ['Attendee', 'Exhibitor'], default: 'Attendee' })
  type?: string;

  @Column({ type: 'varchar', nullable: true })
  registerCode?: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @CreateDateColumn()
  createdAt!: Date;


}

