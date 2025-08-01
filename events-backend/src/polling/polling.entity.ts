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

export enum PollType {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

export enum ExternalPlatform {
  KAHOOT = 'kahoot',
  SLIDO = 'slido',
  MENTIMETER = 'mentimeter',
  OTHER = 'other'
}

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  question!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  eventId!: string;


  @Column({ nullable: true })
  speakerId?: string;

  @ManyToOne(() => Event, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event?: Event;


  @ManyToOne(() => Speaker, { eager: false })
  @JoinColumn({ name: 'speakerId' })
  speaker?: Speaker;

  @Column()
  createdById!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy?: UserEntity;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  allowMultipleSelection!: boolean;

  @Column({ type: 'boolean', default: true })
  hasCorrectAnswer!: boolean;

  @Column({ type: 'boolean', default: true })
  showCorrectAnswer!: boolean;

  @Column({
    type: 'enum',
    enum: PollType,
    default: PollType.INTERNAL
  })
  pollType!: PollType;

  // For external polls only
  @Column({ type: 'varchar', nullable: true })
  externalUrl?: string;

  @Column({
    type: 'enum',
    enum: ExternalPlatform,
    nullable: true
  })
  platform?: ExternalPlatform;

  @Column({ type: 'boolean', default: false })
  isLive!: boolean; // Currently showing to users

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // CASCADE DELETE: When question is deleted, all options will be deleted
  @OneToMany(() => QuizOption, (option) => option.question, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  options!: QuizOption[];
}

@Entity('quiz_options')
export class QuizOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  optionText!: string;

  @Column()
  questionId!: string;

  @ManyToOne(() => QuizQuestion, (question) => question.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question?: QuizQuestion;

  @Column({ type: 'boolean', default: false })
  isCorrectAnswer!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('quiz_user_attempts')
export class UserQuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'boolean', default: false })
  isCompleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 0 })
  totalQuestions!: number;

  @Column({ type: 'int', default: 0 })
  answeredQuestions!: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scorePercentage!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // CASCADE DELETE: When attempt is deleted, all answers will be deleted
  @OneToMany(() => UserQuizAnswer, (answer) => answer.attempt, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  answers!: UserQuizAnswer[];
}

@Entity('quiz_user_answers')
export class UserQuizAnswer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  attemptId!: string;

  @ManyToOne(() => UserQuizAttempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attemptId' })
  attempt?: UserQuizAttempt;

  @Column()
  questionId!: string;

  @ManyToOne(() => QuizQuestion, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question?: QuizQuestion;

  @Column('simple-array')
  selectedOptionIds!: string[];

  @Column({ type: 'boolean', default: false })
  isCorrect!: boolean;

  @CreateDateColumn()
  answeredAt!: Date;
} 