import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from 'user/users.entity';

@Entity('chat_threads')
@Index(['userID', 'receiverID'], { unique: true })
export class ChatThread {
  @PrimaryGeneratedColumn('uuid')
  threadID!: string;

  @Column({ type: 'uuid' })
  userID!: string;

  @Column({ type: 'uuid' })
  receiverID!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userID' })
  user!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiverID' })
  receiver!: UserEntity;

  @Column({ type: 'text', nullable: true })
  lastMessage?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  REPLY = 'reply'
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  msgID!: string;

  @Column({ type: 'uuid' })
  threadID!: string;

  @ManyToOne(() => ChatThread, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadID' })
  thread!: ChatThread;

  @Column({ type: 'uuid' })
  senderID!: string;

  @Column({ type: 'uuid' })
  receiverID!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderID' })
  sender!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receiverID' })
  receiver!: UserEntity;

  @Column({ type: 'text' })
  msg!: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  msgType!: MessageType;

  @Column({ type: 'jsonb', nullable: true })
  msgJson?: any;

  @Column({ type: 'uuid', nullable: true })
  reply?: string;

  @ManyToOne(() => ChatMessage, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reply' })
  replyToMessage?: ChatMessage;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'boolean', default: false })
  isDelivered!: boolean;

  @Column({ type: 'boolean', default: true })
  visibleToSender!: boolean;

  @Column({ type: 'boolean', default: true })
  visibleToReceiver!: boolean;

  @Column({ type: 'boolean', default: false })
  isEdited!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt?: Date;

  @CreateDateColumn()
  msgDateUTC!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('chat_participants')
@Index(['threadID', 'userID'], { unique: true })
export class ChatParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  threadID!: string;

  @Column({ type: 'uuid' })
  userID!: string;

  @ManyToOne(() => ChatThread, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadID' })
  thread!: ChatThread;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userID' })
  user!: UserEntity;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen?: Date;

  @Column({ type: 'int', default: 0 })
  unreadCount!: number;

  @CreateDateColumn()
  joinedAt!: Date;
}