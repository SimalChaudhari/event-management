import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EngagementQnaQuestion, EngagementQnaLike } from './engagement-qna.entity';
import {
  CreateEngagementQuestionDto,
  UpdateEngagementQuestionDto,
  AnswerEngagementQuestionDto,
  LikeEngagementQuestionDto,
  GetEngagementQuestionsDto,
  QuestionSortBy,
  QuestionStatus,
} from './engagement-qna.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { Engagement } from '../engagement/engagement.entity';
import { UserEntity } from '../user/users.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';

@Injectable()
export class EngagementQnaService {
  constructor(
    @InjectRepository(EngagementQnaQuestion)
    private engagementQnaQuestionRepository: Repository<EngagementQnaQuestion>,
    @InjectRepository(EngagementQnaLike)
    private engagementQnaLikeRepository: Repository<EngagementQnaLike>,
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    private errorHandler: ErrorHandlerService,
  ) {}

  // 1. Create Question (Only for registered users of the event)
  async createQuestion(createDto: CreateEngagementQuestionDto, askedById: string) {
    try {
      // Validate engagement exists
      const engagement = await this.engagementRepository.findOne({
        where: { id: createDto.engagementId },
        relations: ['track', 'track.event'],
      });

      if (!engagement) {
        throw new ResourceNotFoundException('Engagement', createDto.engagementId);
      }

      // Check if user is registered for this event
      const eventId = engagement.track?.event?.id;
      if (!eventId) {
        throw new ValidationException('Engagement is not associated with a valid event');
      }

      const registration = await this.registerEventRepository.findOne({
        where: {
          userId: askedById,
          eventId: eventId,
        },
      });

      if (!registration) {
        throw new ValidationException('You must be registered for this event to post questions');
      }

      // Create question
      const question = new EngagementQnaQuestion();
      question.question = createDto.question;
      question.engagementId = createDto.engagementId;
      question.askedById = askedById;
      question.isAnonymous = false; // Removed anonymous support
      question.likesCount = 0;
      question.isPinned = false;
      question.isActive = true;
      question.status = undefined;

      const savedQuestion = await this.engagementQnaQuestionRepository.save(question);

      // Get user details for response
      const user = await this.userRepository.findOne({
        where: { id: askedById },
      });

      return {
        ...savedQuestion,
        askedBy: user
          ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              fullName: `${user.firstName} ${user.lastName}`.trim(),
            }
          : null,
        engagement: {
          id: engagement.id,
          trackTitle: engagement.track?.title || 'Unknown Track',
          eventName: engagement.track?.event?.name || 'Unknown Event',
        },
        answer: null,
        answeredAt: null,
        answeredBy: null,
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Create Engagement Q&A question');
      this.errorHandler.handleDatabaseError(error, 'Question creation');
    }
  }

  // Get Questions
  async getQuestions(getDto: GetEngagementQuestionsDto, userId?: string) {
    try {
      if (!getDto.engagementId) {
        throw new ValidationException('Engagement ID is required to retrieve Q&A questions');
      }

      const whereConditions: any = {
        isActive: true,
        engagementId: getDto.engagementId,
      };

      // Handle status filter
      if (getDto.status === QuestionStatus.ANSWERED) {
        whereConditions.status = 'answered';
      } else if (getDto.status === QuestionStatus.NOT_ANSWERED) {
        whereConditions.status = 'not_answered';
      } else if (getDto.status === QuestionStatus.ANSWERING) {
        whereConditions.status = 'answering';
      }

      const questions = await this.engagementQnaQuestionRepository.find({
        where: whereConditions,
        relations: ['askedBy', 'engagement', 'engagement.track', 'engagement.track.event', 'answeredByUser', 'likes'],
        order: this.getSortOrder(getDto.sortBy),
      });

      // Get user's likes for these questions
      let userLikes: EngagementQnaLike[] = [];
      if (userId && questions.length > 0) {
        const questionIds = questions.map((q) => q.id);
        userLikes = await this.engagementQnaLikeRepository.find({
          where: {
            questionId: In(questionIds),
            userId: userId,
          },
        });
      }

      // Get engagement details
      const engagement = await this.engagementRepository.findOne({
        where: { id: getDto.engagementId },
        relations: ['track', 'track.event'],
      });

      if (!engagement) {
        throw new ResourceNotFoundException('Engagement', getDto.engagementId);
      }

      // Process questions
      const processedQuestions = questions.map((question) => {
        const userLiked = userLikes.some(
          (like) => like.questionId === question.id,
        );

        return {
          id: question.id,
          question: question.question,
          askedBy: question.isAnonymous
            ? null
            : question.askedBy
              ? {
                  id: question.askedBy.id,
                  firstName: question.askedBy.firstName,
                  lastName: question.askedBy.lastName,
                  email: question.askedBy.email,
                  fullName:
                    `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim(),
                }
              : null,
          answeredBy: question.answeredByUser
            ? {
                id: question.answeredByUser.id,
                firstName: question.answeredByUser.firstName,
                lastName: question.answeredByUser.lastName,
                email: question.answeredByUser.email,
                fullName:
                  `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
              }
            : null,
          userLiked: userLiked,
          isAnonymous: question.isAnonymous,
          likesCount: question.likesCount,
          isPinned: question.isPinned,
          isActive: question.isActive,
          status: question.status || 'not_answered',
          answeredAt: question.answeredAt,
          answer: question.answer || null,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
          isAnswered: !!question.answeredAt,
          isMyQuestion: userId === question.askedById,
        };
      });

      // Sort questions by pinned first, then by likes
      const sortedQuestions = processedQuestions.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.likesCount - a.likesCount;
      });

      // Return structured response
      const data = {
        engagement: {
          id: engagement.id,
          trackTitle: engagement.track?.title || 'Unknown Track',
          eventName: engagement.track?.event?.name || 'Unknown Event',
        },
        questions: sortedQuestions,
      };

      // Calculate summary statistics
      const totalQuestions = questions.length;
      const answeredQuestions = questions.filter((q) => q.status === 'answered').length;
      const answeringQuestions = questions.filter((q) => q.status === 'answering').length;
      const unansweredQuestions = questions.filter((q) => q.status === 'not_answered' || q.status === null).length;
      const pinnedQuestions = questions.filter((q) => q.isPinned).length;

      return {
        success: true,
        message: 'Questions retrieved successfully',
        data: data,
        metadata: {
          total: totalQuestions,
          answered: answeredQuestions,
          answering: answeringQuestions,
          unanswered: unansweredQuestions,
          pinned: pinnedQuestions,
          engagementId: getDto.engagementId,
          status: getDto.status,
          sortBy: getDto.sortBy,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      if (error instanceof ValidationException || error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get Engagement Q&A questions');
      return {
        success: false,
        message: 'Failed to retrieve questions',
        data: {
          engagement: null,
          questions: [],
        },
        metadata: {
          total: 0,
          answered: 0,
          answering: 0,
          unanswered: 0,
          pinned: 0,
          engagementId: getDto.engagementId,
          status: getDto.status,
          sortBy: getDto.sortBy,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Get Question by ID
  async getQuestionById(id: string, userId?: string) {
    try {
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id },
        relations: ['askedBy', 'engagement', 'engagement.track', 'engagement.track.event', 'answeredByUser', 'likes'],
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Check if user liked this question
      let userLiked = false;
      if (userId) {
        const userLike = await this.engagementQnaLikeRepository.findOne({
          where: {
            questionId: id,
            userId: userId,
          },
        });
        userLiked = !!userLike;
      }

      return {
        id: question.id,
        question: question.question,
        isAnonymous: question.isAnonymous,
        likesCount: question.likesCount,
        isPinned: question.isPinned,
        isActive: question.isActive,
        status: question.status || 'not_answered',
        answeredAt: question.answeredAt,
        answer: question.answer || null,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        engagement: question.engagement
          ? {
              id: question.engagement.id,
              trackTitle: question.engagement.track?.title || 'Unknown Track',
              eventName: question.engagement.track?.event?.name || 'Unknown Event',
            }
          : null,
        askedBy: question.isAnonymous
          ? null
          : question.askedBy
            ? {
                id: question.askedBy.id,
                firstName: question.askedBy.firstName,
                lastName: question.askedBy.lastName,
                email: question.askedBy.email,
                fullName:
                  `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim(),
              }
            : null,
        answeredBy: question.answeredByUser
          ? {
              id: question.answeredByUser.id,
              firstName: question.answeredByUser.id,
              lastName: question.answeredByUser.lastName,
              email: question.answeredByUser.email,
              fullName:
                `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
            }
          : null,
        userLiked: userLiked,
        isAnswered: !!question.answeredAt,
        isMyQuestion: userId === question.askedById,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get question by ID');
      this.errorHandler.handleDatabaseError(error, 'Question retrieval');
    }
  }

  // Answer Question (Admin only)
  async answerQuestion(
    id: string,
    answerDto: AnswerEngagementQuestionDto,
    answeredById: string,
  ) {
    try {
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      const isUpdating = !!question.answer;
      
      question.answer = answerDto.answer;
      question.answeredBy = answeredById;
      
      if (!isUpdating) {
        question.answeredAt = new Date();
      }
      
      question.status = 'answered';

      const savedQuestion = await this.engagementQnaQuestionRepository.save(question);

      // Get user details
      const user = await this.userRepository.findOne({
        where: { id: answeredById },
      });

      return {
        success: true,
        message: isUpdating 
          ? 'Question answer updated successfully' 
          : 'Question answered successfully',
        data: {
          ...savedQuestion,
          answeredBy: user
            ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                fullName: `${user.firstName} ${user.lastName}`.trim(),
              }
            : null,
          isUpdated: isUpdating,
        },
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Answer question');
      this.errorHandler.handleDatabaseError(error, 'Question answering');
    }
  }

  // Like/Unlike Question
  async toggleLike(likeDto: LikeEngagementQuestionDto, userId: string) {
    try {
      // Check if question exists
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id: likeDto.questionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', likeDto.questionId);
      }

      // Check if user already liked
      const existingLike = await this.engagementQnaLikeRepository.findOne({
        where: {
          questionId: likeDto.questionId,
          userId: userId,
        },
      });

      if (existingLike) {
        // Unlike
        await this.engagementQnaLikeRepository.remove(existingLike);
        question.likesCount = Math.max(0, question.likesCount - 1);
        await this.engagementQnaQuestionRepository.save(question);

        return {
          success: true,
          message: 'Question unliked successfully',
          data: {
            questionId: likeDto.questionId,
            liked: false,
            likesCount: question.likesCount,
          },
        };
      } else {
        // Like
        const like = new EngagementQnaLike();
        like.questionId = likeDto.questionId;
        like.userId = userId;
        await this.engagementQnaLikeRepository.save(like);

        question.likesCount += 1;
        await this.engagementQnaQuestionRepository.save(question);

        return {
          success: true,
          message: 'Question liked successfully',
          data: {
            questionId: likeDto.questionId,
            liked: true,
            likesCount: question.likesCount,
          },
        };
      }
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Toggle question like');
      this.errorHandler.handleDatabaseError(error, 'Question like toggle');
    }
  }

  // 6. Update Question (Own question OR Admin)
  async updateQuestion(
    id: string,
    updateDto: UpdateEngagementQuestionDto,
    userId: string,
    isAdmin: boolean = false,
  ) {
    try {
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Only the question creator or admin can update
      if (!isAdmin && question.askedById !== userId) {
        throw new ValidationException('You can only update your own questions');
      }

      Object.assign(question, updateDto);
      const savedQuestion = await this.engagementQnaQuestionRepository.save(question);

      return {
        success: true,
        message: 'Question updated successfully',
        data: savedQuestion,
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Update question');
      this.errorHandler.handleDatabaseError(error, 'Question update');
    }
  }

  // 5. Delete Question (Own question OR Admin)
  async deleteQuestion(id: string, userId: string, isAdmin: boolean = false) {
    try {
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Only the question creator or admin can delete
      if (!isAdmin && question.askedById !== userId) {
        throw new ValidationException('You can only delete your own questions');
      }

      await this.engagementQnaQuestionRepository.remove(question);

      return {
        success: true,
        message: 'Question deleted successfully',
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Delete question');
      this.errorHandler.handleDatabaseError(error, 'Question deletion');
    }
  }

  private getSortOrder(sortBy?: QuestionSortBy): any {
    switch (sortBy) {
      case QuestionSortBy.CREATED_AT:
        return { createdAt: 'DESC' as const };
      case QuestionSortBy.ANSWERED_AT:
        return { answeredAt: 'DESC' as const };
      case QuestionSortBy.LIKES:
      default:
        return { likesCount: 'DESC' as const, createdAt: 'DESC' as const };
    }
  }
}

