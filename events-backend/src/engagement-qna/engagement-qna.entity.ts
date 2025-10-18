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
import { Engagement } from '../engagement/engagement.entity';
import { UserEntity } from '../user/users.entity';

@Entity('engagement_qna_questions')
@Index('IDX_ENGAGEMENT_QNA_ENGAGEMENT_LIKES', ['engagementId', 'likesCount'])
export class EngagementQnaQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  question!: string;

  @Column()
  engagementId!: string;

  @ManyToOne(() => Engagement, { eager: false })
  @JoinColumn({ name: 'engagementId' })
  engagement?: Engagement;

  @Column()
  askedById!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'askedById' })
  askedBy?: UserEntity;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'int', default: 0 })
  likesCount!: number;

  @Column({ type: 'boolean', default: false })
  isPinned!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ 
    type: 'enum', 
    enum: ['not_answered', 'answering', 'answered'], 
    nullable: true,
    default: null
  })
  status?: string;

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

  @OneToMany(() => EngagementQnaLike, (like) => like.question, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  likes!: EngagementQnaLike[];
}

@Entity('engagement_qna_likes')
@Index('IDX_ENGAGEMENT_QNA_LIKE_UNIQUE', ['questionId', 'userId'], { unique: true })
export class EngagementQnaLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  questionId!: string;

  @ManyToOne(() => EngagementQnaQuestion, (question) => question.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question?: EngagementQnaQuestion;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
}

