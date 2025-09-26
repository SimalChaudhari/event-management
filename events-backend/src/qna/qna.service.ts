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
  UpdateQuestionStatusDto,
  GetEventQuestionsDto,
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
import { QnaUtils } from '../utils/qna.utils';

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
    private readonly qnaUtils: QnaUtils,
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
      question.status = undefined; // Default undefined, will be set to 'not_answered' when first viewed

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
        whereConditions.status = 'answered';
      } else if (getDto.status === QuestionStatus.NOT_ANSWERED) {
        whereConditions.status = 'not_answered';
      } else if (getDto.status === QuestionStatus.ANSWERING) {
        whereConditions.status = 'answering';
      }

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
          status: question.status || 'not_answered', // Default to 'not_answered' if null
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
          answering: 0,
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
        status: question.status || 'not_answered', // Default to 'not_answered' if null
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

      question.answer = answerDto.answer;
      question.answeredBy = answeredById;
      question.answeredAt = new Date();
      question.status = 'answered';

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

  // Get All Questions for Event (Admin Only) - Returns all questions for a specific event
  async getAllQuestionsForEvent(eventId: string) {
    return await this.qnaUtils.getAllQuestionsForEvent(eventId);
  }

  // Admin: Get all events with Q&A questions
  async getEventsWithQuestions() {
    try {
      const events = await this.eventRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.eventSpeakers', 'eventSpeaker')
        .leftJoinAndSelect('eventSpeaker.speaker', 'speaker')
        .leftJoin('qna_questions', 'qna', 'qna.eventId = event.id')
        .addSelect('COUNT(DISTINCT qna.id)', 'questionCount')
        .addSelect('COUNT(CASE WHEN qna.status = \'answered\' THEN 1 END)', 'answeredCount')
        .addSelect('COUNT(CASE WHEN qna.status = \'answering\' THEN 1 END)', 'answeringCount')
        .addSelect('COUNT(CASE WHEN qna.status = \'not_answered\' OR qna.status IS NULL THEN 1 END)', 'unansweredCount')
        .groupBy('event.id, eventSpeaker.id, speaker.id')
        .orderBy('event.startDate', 'DESC')
        .getRawAndEntities();

      const eventsWithStats = events.entities.map((event, index) => {
        const raw = events.raw[index];
        return {
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          venue: event.venue,
          speakers: event.eventSpeakers?.map(es => ({
            id: es.speaker?.id,
            name: es.speaker ? `${es.speaker.firstName} ${es.speaker.lastName}`.trim() : 'Unknown',
            email: es.speaker?.email
          })) || [],
          questionStats: {
            total: parseInt(raw.questionCount) || 0,
            answered: parseInt(raw.answeredCount) || 0,
            answering: parseInt(raw.answeringCount) || 0,
            unanswered: parseInt(raw.unansweredCount) || 0
          }
        };
      });

      return {
        success: true,
        message: 'Events with Q&A questions retrieved successfully',
        data: eventsWithStats,
        metadata: {
          total: eventsWithStats.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get events with Q&A questions');
      return {
        success: false,
        message: 'Failed to retrieve events with Q&A questions',
        data: [],
        metadata: {
          total: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Admin: Get all questions for an event (consolidated view)
  async getEventQuestions(getDto: GetEventQuestionsDto) {
    try {
      const whereConditions: any = {
        isActive: true
      };

      if (getDto.eventId) {
        whereConditions.eventId = getDto.eventId;
      }

      // Handle status filter
      if (getDto.status === QuestionStatus.ANSWERED) {
        whereConditions.status = 'answered';
      } else if (getDto.status === QuestionStatus.NOT_ANSWERED) {
        whereConditions.status = 'not_answered';
      } else if (getDto.status === QuestionStatus.ANSWERING) {
        whereConditions.status = 'answering';
      }

      // Handle search
      if (getDto.search) {
        whereConditions.question = { $like: `%${getDto.search}%` };
      }

      const questions = await this.qnaQuestionRepository.find({
        where: whereConditions,
        relations: ['askedBy', 'event', 'speaker', 'answeredByUser', 'likes'],
        order: this.getSortOrder(getDto.sortBy),
      });

      const processedQuestions = questions.map((question) => {
        return {
          id: question.id,
          question: question.question,
          event: question.event ? {
            id: question.event.id,
            name: question.event.name,
            startDate: question.event.startDate,
            location: question.event.location,
            venue: question.event.venue
          } : null,
          speaker: question.speaker ? UserUtils.getBasicSpeakerInfo(question.speaker) : null,
          askedBy: question.isAnonymous
            ? null
            : question.askedBy
              ? {
                  id: question.askedBy.id,
                  firstName: question.askedBy.firstName,
                  lastName: question.askedBy.lastName,
                  email: question.askedBy.email,
                  fullName: `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim(),
                }
              : null,
          answeredBy: question.answeredByUser
            ? {
                id: question.answeredByUser.id,
                firstName: question.answeredByUser.firstName,
                lastName: question.answeredByUser.lastName,
                email: question.answeredByUser.email,
                fullName: `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
              }
            : null,
          isAnonymous: question.isAnonymous,
          likesCount: question.likesCount,
          isPinned: question.isPinned,
          isActive: question.isActive,
          status: question.status || 'not_answered',
          answeredAt: question.answeredAt,
          answer: question.answer || null,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
          isAnswered: question.status === 'answered',
        };
      });

      // Calculate summary statistics
      const totalQuestions = questions.length;
      const answeredQuestions = questions.filter((q) => q.status === 'answered').length;
      const answeringQuestions = questions.filter((q) => q.status === 'answering').length;
      const unansweredQuestions = questions.filter((q) => q.status === 'not_answered' || q.status === null).length;
      const pinnedQuestions = questions.filter((q) => q.isPinned).length;

      return {
        success: true,
        message: 'Event questions retrieved successfully',
        data: processedQuestions,
        metadata: {
          total: totalQuestions,
          answered: answeredQuestions,
          answering: answeringQuestions,
          unanswered: unansweredQuestions,
          pinned: pinnedQuestions,
          eventId: getDto.eventId,
          status: getDto.status,
          sortBy: getDto.sortBy,
          search: getDto.search,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get event questions');
      return {
        success: false,
        message: 'Failed to retrieve event questions',
        data: [],
        metadata: {
          total: 0,
          answered: 0,
          answering: 0,
          unanswered: 0,
          pinned: 0,
          eventId: getDto.eventId,
          status: getDto.status,
          sortBy: getDto.sortBy,
          search: getDto.search,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  // Admin: Update question status
  async updateQuestionStatus(updateDto: UpdateQuestionStatusDto) {
    try {
      const question = await this.qnaQuestionRepository.findOne({
        where: { id: updateDto.questionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', updateDto.questionId);
      }

      question.status = updateDto.status;
      
      // If marking as answered, set answeredAt timestamp
      if (updateDto.status === 'answered' && !question.answeredAt) {
        question.answeredAt = new Date();
      }

      const savedQuestion = await this.qnaQuestionRepository.save(question);

      return {
        success: true,
        message: 'Question status updated successfully',
        data: {
          id: savedQuestion.id,
          status: savedQuestion.status,
          answeredAt: savedQuestion.answeredAt
        }
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Update question status');
      this.errorHandler.handleDatabaseError(error, 'Question status update');
    }
  }

  // Admin: Delete question
  async adminDeleteQuestion(questionId: string) {
    try {
      const question = await this.qnaQuestionRepository.findOne({
        where: { id: questionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', questionId);
      }

      await this.qnaQuestionRepository.remove(question);

      return {
        success: true,
        message: 'Question deleted successfully by admin'
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Admin delete question');
      this.errorHandler.handleDatabaseError(error, 'Question deletion by admin');
    }
  }

  // Public: Get question for slideshow (answering status)
  async getSlideshowQuestion(questionId: string) {
    try {
      const question = await this.qnaQuestionRepository.findOne({
        where: { 
          id: questionId,
          status: 'answering',
          isActive: true
        },
        relations: ['event', 'speaker', 'askedBy']
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', questionId);
      }

      return {
        success: true,
        message: 'Slideshow question retrieved successfully',
        data: {
          id: question.id,
          question: question.question,
          event: question.event ? {
            id: question.event.id,
            name: question.event.name
          } : null,
          speaker: question.speaker ? UserUtils.getBasicSpeakerInfo(question.speaker) : null,
          askedBy: question.isAnonymous
            ? null
            : question.askedBy
              ? {
                  firstName: question.askedBy.firstName,
                  lastName: question.askedBy.lastName,
                  fullName: `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim(),
                }
              : null,
          isAnonymous: question.isAnonymous,
          likesCount: question.likesCount,
          createdAt: question.createdAt
        }
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get slideshow question');
      this.errorHandler.handleDatabaseError(error, 'Slideshow question retrieval');
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