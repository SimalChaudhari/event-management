// src/chat/broadcast.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from 'event/event.entity';
import { UserEntity } from 'user/users.entity';
import { Speaker } from 'speaker/speaker.entity';

export enum MessageType {
  TEXT = 'text',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system'
}

@Entity('broadcast_rooms')
@Index(['eventId', 'speakerId'], { unique: true })
export class BroadcastRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string; // Room name like "KPMG Speakers Room"

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  eventId!: string;

  @Column()
  speakerId!: string;

  @ManyToOne(() => Event, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @ManyToOne(() => Speaker, { eager: false })
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isLive!: boolean; // Room is currently live

  @Column({ type: 'int', default: 0 })
  activeUsers!: number; // Count of active users in room

  @Column({ type: 'int', default: 0 })
  totalMessages!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationship to messages
  @OneToMany(() => BroadcastMessage, (message) => message.room, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  messages!: BroadcastMessage[];

  // Relationship to active users
  @OneToMany(() => RoomParticipant, (participant) => participant.room, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  participants!: RoomParticipant[];
}

@Entity('broadcast_messages')
@Index(['roomId', 'createdAt'])
@Index(['roomId', 'isPinned'])
export class BroadcastMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT
  })
  messageType!: MessageType;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'boolean', default: false })
  isPinned!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  pinnedAt?: Date;

  @Column({ nullable: true })
  pinnedById?: string; // Admin/Speaker who pinned

  @Column()
  roomId!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true })
  speakerId?: string; // If message is from speaker

  @ManyToOne(() => BroadcastRoom, (room) => room.messages, { 
    eager: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'roomId' })
  room?: BroadcastRoom;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => Speaker, { eager: false })
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'pinnedById' })
  pinnedBy?: UserEntity;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('room_participants')
@Index(['roomId', 'userId'], { unique: true })
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  roomId!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => BroadcastRoom, (room) => room.participants, { 
    eager: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'roomId' })
  room?: BroadcastRoom;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'boolean', default: true })
  isOnline!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSeen!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 