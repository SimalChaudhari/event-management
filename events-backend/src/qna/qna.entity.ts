// src/qna/qna.entity.ts
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

@Entity('qna_questions')
@Index('IDX_QNA_EVENT_SPEAKER_LIKES', ['eventId', 'speakerId', 'likesCount'])
export class QnaQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  question!: string;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column()
  askedById!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'askedById' })
  askedBy?: UserEntity;

  // Speaker ID is required - question is always for a specific speaker
  @Column()
  speakerId!: string;

  @ManyToOne(() => Speaker, { eager: false })
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'int', default: 0 })
  likesCount!: number;

  @Column({ type: 'boolean', default: false })
  isPinned!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt?: Date;

  @Column({ type: 'text', nullable: true })
  answer?: string;

  @Column({ nullable: true })
  answeredBy?: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'answeredBy' })
  answeredByUser?: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => QnaLike, (like) => like.question, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  likes!: QnaLike[];
}

@Entity('qna_likes')
@Index('IDX_QNA_LIKE_UNIQUE', ['questionId', 'userId'], { unique: true })
export class QnaLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  questionId!: string;

  @ManyToOne(() => QnaQuestion, (question) => question.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question?: QnaQuestion;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
} 