// src/chat/chat.entity.ts
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

@Entity('chat_questions')
@Index(['eventId', 'speakerId', 'createdAt'])
@Index(['eventId', 'speakerId', 'likesCount'])
export class ChatQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column()
  eventId!: string;

  @Column()
  speakerId!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => Event, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @ManyToOne(() => Speaker, { eager: false })
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'int', default: 0 })
  likesCount!: number;

  @Column({ type: 'int', default: 0 })
  answersCount!: number; // Count of answers

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isPinned!: boolean; // For moderator pinning

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationship to likes
  @OneToMany(() => ChatLike, (like) => like.question, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  likes!: ChatLike[];

  // Relationship to answers
  @OneToMany(() => ChatResponse, (response) => response.question, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  answers!: ChatResponse[];
}

@Entity('chat_likes')
@Index(['questionId', 'userId'], { unique: true }) // Prevent duplicate likes
export class ChatLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  questionId!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => ChatQuestion, (question) => question.likes, { 
    eager: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'questionId' })
  question?: ChatQuestion;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('chat_responses')
export class ChatResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean; // Users can also answer anonymously

  @Column()
  questionId!: string;

  @Column()
  userId!: string; // Changed from speakerId to userId

  @Column({ nullable: true })
  speakerId?: string; // Optional - if answered by speaker

  @ManyToOne(() => ChatQuestion, (question) => question.answers, { 
    eager: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'questionId' })
  question?: ChatQuestion;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => Speaker, { eager: false })
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 