// src/entities/qa.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Survey } from './survey.entity';

export enum QuestionType {
  TEXT = 'text',
  DROPDOWN = 'dropdown',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  RATING = 'rating',
}

export enum QuestionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity('survey_feedback_questions')
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  surveyId!: string;

  @Column({ type: 'varchar' })
  sessionId!: string;

  @Column({ type: 'varchar' })
  questionName!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.TEXT,
  })
  questionType!: QuestionType;

  @Column({
    type: 'enum',
    enum: QuestionStatus,
    default: QuestionStatus.ACTIVE,
  })
  status!: QuestionStatus;

  @Column({ type: 'boolean', default: true })
  isRequired!: boolean;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  // For dropdown, radio, checkbox, multiple choice questions
  @Column({ type: 'json', nullable: true })
  options?: string[];

  // For rating questions (min and max values)
  @Column({ type: 'int', nullable: true })
  minRating?: number;

  @Column({ type: 'int', nullable: true })
  maxRating?: number;

  @Column({ type: 'varchar', nullable: true })
  ratingLabel?: string;

  // For validation rules
  @Column({ type: 'json', nullable: true })
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
  };

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => Survey, (survey) => survey.questions)
  survey?: Survey;

  @OneToMany(() => SurveyAnswer, (answer) => answer.question)
  answers?: SurveyAnswer[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('survey_feedback_answers')
export class SurveyAnswer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  questionId!: string;

  @Column({ type: 'varchar' })
  surveyId!: string;

  @Column({ type: 'varchar' })
  sessionId!: string;

  @Column({ type: 'varchar' })
  eventId!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'text', nullable: true })
  textAnswer?: string;

  @Column({ type: 'json', nullable: true })
  selectedOptions?: string[];

  @Column({ type: 'int', nullable: true })
  ratingAnswer?: number;

  @Column({ type: 'boolean', default: false })
  isAnswered!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => SurveyQuestion, (question) => question.answers)
  question?: SurveyQuestion;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
