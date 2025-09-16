// src/qna/qna.service.ts
import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QnaQuestion, QnaLike } from './qna.entity';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  AnswerQuestionDto,
  LikeQuestionDto,
  GetQuestionsDto,
  PinQuestionDto,
  QuestionSortBy,
  QuestionStatus,
} from './qna.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { Event } from 'event/event.entity';
import { UserEntity, UserRole } from '../user/users.entity';
import { UserUtils } from '../utils/user.utils';

@Injectable()
export class QnaService {
  constructor(
    @InjectRepository(QnaQuestion)
    private qnaQuestionRepository: Repository<QnaQuestion>,
    @InjectRepository(QnaLike)
    private qnaLikeRepository: Repository<QnaLike>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private errorHandler: ErrorHandlerService,
  ) {}

  // Create Question (Always for a specific speaker)
  async createQuestion(createDto: CreateQuestionDto, askedById: string) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: createDto.eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', createDto.eventId);
      }

      // Validate speaker exists (required)
      const speaker = await this.userRepository.findOne({
        where: { id: createDto.speakerId, role: UserRole.Speaker },
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', createDto.speakerId);
      }

      // Create question
      const question = new QnaQuestion();
      question.question = createDto.question;
      question.eventId = createDto.eventId;
      question.askedById = askedById;
      question.speakerId = createDto.speakerId; // Always required
      question.isAnonymous = createDto.isAnonymous || false;
      question.likesCount = 0;
      question.isPinned = false;
      question.isActive = true;

      const savedQuestion = await this.qnaQuestionRepository.save(question);

      // Get user details for response
      const user = await this.userRepository.findOne({
        where: { id: askedById },
      });

      return {
        ...savedQuestion,
        askedBy: question.isAnonymous
          ? null
          : user
            ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                fullName: `${user.firstName} ${user.lastName}`.trim(),
              }
            : null,
        event: {
          id: event.id,
          name: event.name,
        },
        speaker: UserUtils.getBasicSpeakerInfo(speaker),
        answer: null, // Always show answer field
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
      this.errorHandler.logError(error, 'Create Q&A question');
      this.errorHandler.handleDatabaseError(error, 'Question creation');
    }
  }

  // Get Questions (All users can see all questions) - Updated to require both eventId and speakerId
  async getQuestions(getDto: GetQuestionsDto, userId?: string) {
    try {
      // Both eventId and speakerId are now required
      if (!getDto.eventId || !getDto.speakerId) {
        throw new ValidationException(
          'Both eventId and speakerId are required to retrieve Q&A questions',
        );
      }

      const whereConditions: any = {
        isActive: true,
        eventId: getDto.eventId, // Always required
        speakerId: getDto.speakerId, // Always required
      };

      // Handle status filter
      if (getDto.status === QuestionStatus.ANSWERED) {
        whereConditions.answeredAt = { $ne: null };
      } else if (getDto.status === QuestionStatus.UNANSWERED) {
        whereConditions.answeredAt = null;
      }

      // Debug logging
  
      const questions = await this.qnaQuestionRepository.find({
        where: whereConditions,
        relations: ['askedBy', 'event', 'speaker', 'answeredByUser', 'likes'],
        order: this.getSortOrder(getDto.sortBy),
      });

      // Get user's likes for these questions
      let userLikes: QnaLike[] = [];
      if (userId && questions.length > 0) {
        const questionIds = questions.map((q) => q.id);
        userLikes = await this.qnaLikeRepository.find({
          where: {
            questionId: In(questionIds),
            userId: userId,
          },
        });
      }

      // Get event and speaker details
      const event = await this.eventRepository.findOne({
        where: { id: getDto.eventId },
      });

      const speaker = await this.userRepository.findOne({
        where: { id: getDto.speakerId, role: UserRole.Speaker },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', getDto.eventId);
      }

      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', getDto.speakerId);
      }

      // Process questions for this specific event-speaker combination
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

      // Return structured response with event and speaker info
      const data = {
        event: {
          id: event.id,
          name: event.name,
        },
                speaker: UserUtils.getBasicSpeakerInfo(speaker),
        questions: sortedQuestions,
      };

      // Calculate summary statistics
      const totalQuestions = questions.length;
      const answeredQuestions = questions.filter((q) => q.answeredAt).length;
      const unansweredQuestions = totalQuestions - answeredQuestions;
      const pinnedQuestions = questions.filter((q) => q.isPinned).length;

      return {
        success: true,
        message: 'Questions retrieved successfully',
        data: data,
        metadata: {
          total: totalQuestions,
          answered: answeredQuestions,
          unanswered: unansweredQuestions,
          pinned: pinnedQuestions,
          eventId: getDto.eventId,
          speakerId: getDto.speakerId,
          status: getDto.status,
          sortBy: getDto.sortBy,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      if (error instanceof ValidationException || error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get Q&A questions');
      return {
        success: false,
        message: 'Failed to retrieve questions',
        data: {
          event: null,
          speaker: null,
          questions: [],
        },
        metadata: {
          total: 0,
          answered: 0,
          unanswered: 0,
          pinned: 0,
          eventId: getDto.eventId,
          speakerId: getDto.speakerId,
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
      const question = await this.qnaQuestionRepository.findOne({
        where: { id },
        relations: ['askedBy', 'event', 'speaker', 'answeredByUser', 'likes'],
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Check if user liked this question
      let userLiked = false;
      if (userId) {
        const userLike = await this.qnaLikeRepository.findOne({
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
        answeredAt: question.answeredAt,
        answer: question.answer || null, // Always show answer field
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        event: question.event
          ? {
              id: question.event.id,
              name: question.event.name,
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
        speaker: question.speaker
          ? UserUtils.getBasicSpeakerInfo(question.speaker)
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
    answerDto: AnswerQuestionDto,
    answeredById: string,
  ) {
    try {
      const question = await this.qnaQuestionRepository.findOne({
        where: { id },
        relations: ['speaker'],
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Check if the user answering is admin (you can add role check here)
      // For now, we'll allow any user to answer (you can modify this logic)
      // You can check user role from the request context

      question.answer = answerDto.answer;
      question.answeredBy = answeredById;
      question.answeredAt = new Date();

      const savedQuestion = await this.qnaQuestionRepository.save(question);

      // Get user details
      const user = await this.userRepository.findOne({
        where: { id: answeredById },
      });

      return {
        success: true,
        message: 'Question answered successfully',
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
  async toggleLike(likeDto: LikeQuestionDto, userId: string) {
    try {
      // Check if question exists
      const question = await this.qnaQuestionRepository.findOne({
        where: { id: likeDto.questionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', likeDto.questionId);
      }

      // Check if user already liked
      const existingLike = await this.qnaLikeRepository.findOne({
        where: {
          questionId: likeDto.questionId,
          userId: userId,
        },
      });

      if (existingLike) {
        // Unlike
        await this.qnaLikeRepository.remove(existingLike);
        question.likesCount = Math.max(0, question.likesCount - 1);
        await this.qnaQuestionRepository.save(question);

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
        const like = new QnaLike();
        like.questionId = likeDto.questionId;
        like.userId = userId;
        await this.qnaLikeRepository.save(like);

        question.likesCount += 1;
        await this.qnaQuestionRepository.save(question);

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

  // Pin/Unpin Question (Admin only)
  async togglePin(pinDto: PinQuestionDto) {
    try {
      const question = await this.qnaQuestionRepository.findOne({
        where: { id: pinDto.questionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', pinDto.questionId);
      }

      question.isPinned = pinDto.isPinned ?? true; // Use nullish coalescing
      await this.qnaQuestionRepository.save(question);

      return {
        success: true,
        message: question.isPinned
          ? 'Question pinned successfully'
          : 'Question unpinned successfully',
        data: {
          questionId: pinDto.questionId,
          isPinned: question.isPinned,
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Toggle question pin');
      this.errorHandler.handleDatabaseError(error, 'Question pin toggle');
    }
  }

  // Update Question
  async updateQuestion(
    id: string,
    updateDto: UpdateQuestionDto,
    userId: string,
  ) {
    try {
      const question = await this.qnaQuestionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Only the question creator can update
      if (question.askedById !== userId) {
        throw new ValidationException('You can only update your own questions');
      }

      Object.assign(question, updateDto);
      const savedQuestion = await this.qnaQuestionRepository.save(question);

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

  // Delete Question
  async deleteQuestion(id: string, userId: string) {
    try {
      const question = await this.qnaQuestionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Only the question creator can delete
      if (question.askedById !== userId) {
        throw new ValidationException('You can only delete your own questions');
      }

      await this.qnaQuestionRepository.remove(question);

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
