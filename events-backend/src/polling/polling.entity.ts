// src/polling/polling.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Event } from 'event/event.entity';
import { UserEntity } from 'user/users.entity';
import { Speaker } from 'speaker/speaker.entity';

export enum ExternalPlatform {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

@Entity('polls')
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  question!: string;

  @Column()
  eventId!: string;

  @Column() // Add speakerId field
  speakerId!: string;

  @ManyToOne(() => Event, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @ManyToOne(() => Speaker, { eager: false }) // Add speaker relation
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @Column()
  createdById!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy?: UserEntity;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: true })
  isLive!: boolean;

  @Column({ type: 'int', default: 30 }) // Timer in seconds for each question
  timerSeconds!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PollOption, (option) => option.poll, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  options!: PollOption[];

  @OneToMany(() => PollVote, (vote) => vote.poll, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  votes!: PollVote[];
}

@Entity('polls_options')
export class PollOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  optionText!: string;

  @Column()
  pollId!: string;

  @ManyToOne(() => Poll, (poll) => poll.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pollId' })
  poll?: Poll;

  @Column({ type: 'int', default: 0 })
  voteCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('polls_votes')
export class PollVote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  pollId!: string;

  @ManyToOne(() => Poll, (poll) => poll.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pollId' })
  poll?: Poll;

  @Column()
  optionId!: string;

  @Column()
  speakerId?: string;

  @ManyToOne(() => PollOption, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option?: PollOption;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @CreateDateColumn()
  votedAt!: Date;
  updatedAt: any;
  createdAt: any;
}

@Entity('polls_user_sessions')
export class UserPollSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column()
  eventId!: string;

  @ManyToOne(() => Event, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column({ nullable: true })
  speakerId?: string;

  @ManyToOne(() => Speaker, { eager: false })
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @Column({ type: 'int', default: 1 })
  currentQuestionIndex!: number; // Current question number (0-based)

  @Column({ type: 'int', default: 0 })
  totalQuestions!: number;

  @Column({ type: 'int', default: 0 })
  answeredQuestions!: number;

  @Column({ type: 'boolean', default: false })
  isCompleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentQuestionStartTime?: Date; // When current question started

  @Column({ type: 'int', nullable: true })
  currentQuestionTimer?: number; // Timer for current question in seconds

  @Column({ type: 'boolean', default: false })
  isTimerExpired!: boolean; // Whether current question timer has expired

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserPollVote, (vote) => vote.session, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  votes!: UserPollVote[];
}

@Entity('polls_user_votes')
export class UserPollVote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @ManyToOne(() => UserPollSession, (session) => session.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session?: UserPollSession;

  @Column()
  pollId!: string;

  @ManyToOne(() => Poll, { eager: false })
  @JoinColumn({ name: 'pollId' })
  poll?: Poll;

  @Column()
  optionId!: string;

  @ManyToOne(() => PollOption, { eager: false })
  @JoinColumn({ name: 'optionId' })
  option?: PollOption;

  @CreateDateColumn()
  votedAt!: Date;
} 