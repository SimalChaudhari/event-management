 // src/entities/survey.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';

  @Entity('surveys')
  export class Survey {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ type: 'varchar' })
    eventId!: string;
  
    @Column({ type: 'varchar' })
    title!: string;
  
    @Column({ type: 'text' })
    description!: string;
  
    @Column({ type: 'date' })
    startDate!: Date;
  
    @Column({ type: 'time' })
    startTime!: string;
  
    @Column({ type: 'date' })
    endDate!: Date;
  
    @Column({ type: 'time' })
    endTime!: string;
  
    @Column({ type: 'boolean', default: true })
    isActive!: boolean;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
  
  @Entity('survey_sessions')
  export class SurveySession {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column()
    surveyId!: string;
  
    @Column({ type: 'varchar' })
    name!: string; // "Session 1", "Session 2", etc.
  
    @Column({ type: 'date' })
    date!: Date;
  
    @Column({ type: 'time' })
    startTime!: string;
  
    @Column({ type: 'time' })
    endTime!: string;
  
    @Column({ type: 'varchar' })
    description!: string; // Session specific description
  
    @Column({ type: 'boolean', default: true })
    isActive!: boolean;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
  
  @Entity('survey_responses')
  export class SurveyResponse {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column()
    surveyId!: string;
  
    @Column()
    sessionId!: string;
  
    @Column()
    eventId!: string;
  
    @Column()
    userId!: string;
  
    @Column({ type: 'varchar' })
    name!: string;
  
    @Column({ type: 'varchar' })
    title!: string;
  
    @Column({ type: 'text' })
    comment!: string;
  
    @CreateDateColumn()
    createdAt!: Date;
  }