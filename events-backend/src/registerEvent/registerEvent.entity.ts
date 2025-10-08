import { Event } from 'event/event.entity';
import { Order } from 'order/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserEntity } from 'user/users.entity';
import { Status } from './registerEvent.dto';
import { AdminInfo } from './admin-info.entity';
import { BillingDetail } from './billing-detail.entity';

@Entity('registerEvents')
export class RegisterEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // @Column({ nullable: true })
  // registerEventId?: string;

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

  @Column({
    type: 'enum',
    enum: ['Attendee', 'Exhibitor'],
    default: 'Attendee',
  })
  type?: string;


  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ 
    type: 'enum', 
    enum: Status, 
    default: Status.Sucesss 
  })
  status?: Status;

  @Column({ type: 'boolean', default: false })
  isCreatedByAdmin?: boolean;

  @Column({ type: 'boolean', default: true })
  isRegister?: boolean;
  
  // External registration ID from SSO API
  @Column({ nullable: true })
  externalRegistrationId?: string;

  @Column({ nullable: true })
  externalRegistrationName?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Admin Info relationship
  @OneToOne(() => AdminInfo, (adminInfo) => adminInfo.registerEvent)
  adminInfo?: AdminInfo;

  // Billing details relationship - one registration can have multiple billing details
  @OneToMany(() => BillingDetail, (billingDetail) => billingDetail.registerEvent, {
    cascade: true,
    eager: false,
  })
  billingDetails?: BillingDetail[];
}
