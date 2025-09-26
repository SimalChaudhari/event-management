// src/utils/qna.utils.ts
import { Injectable } from '@nestjs/common';
import { Repository, In, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QnaQuestion, QnaLike } from '../qna/qna.entity';
import { Event } from '../event/event.entity';
import { UserEntity, UserRole } from '../user/users.entity';
import { UserUtils } from './user.utils';
import { ErrorHandlerService } from './services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from './exceptions/custom-exceptions';

@Injectable()
export class QnaUtils {
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

  /**
   * Get all questions for a specific event (Admin Only)
   * Returns comprehensive Q&A data including user details, speaker information, and statistics
   */
  async getAllQuestionsForEvent(eventId: string) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Get all questions for this event (including inactive ones for admin)
      const questions = await this.qnaQuestionRepository.find({
        where: { eventId: eventId },
        relations: ['askedBy', 'event', 'speaker', 'answeredByUser', 'likes'],
        order: { 
          isPinned: 'DESC', 
          likesCount: 'DESC', 
          createdAt: 'DESC' 
        },
      });

      // Process questions with all details
      const processedQuestions = questions.map((question) => {
        return {
          id: question.id,
          question: question.question,
          // eventId: question.eventId,
          // askedById: question.askedById,
          speakerId: question.speakerId,
          isAnonymous: question.isAnonymous,
          likesCount: question.likesCount,
          isPinned: question.isPinned,
          isActive: question.isActive,
          status: question.status || 'not_answered', // Default to 'not_answered' if null
          answeredAt: question.answeredAt,
          answer: question.answer || null,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
          // User details (even for anonymous questions for admin view)
          askedBy: question.askedBy
            ? {
                id: question.askedBy.id,
                firstName: question.askedBy.firstName,
                lastName: question.askedBy.lastName,
                email: question.askedBy.email,
                fullName: `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim(),
                role: question.askedBy.role,
              }
            : null,
          // Speaker details
          speaker: question.speaker
            ? UserUtils.getBasicSpeakerInfo(question.speaker)
            : null,
          // Answer details
          answeredBy: question.answeredByUser
            ? {
                id: question.answeredByUser.id,
                firstName: question.answeredByUser.firstName,
                lastName: question.answeredByUser.lastName,
                email: question.answeredByUser.email,
                fullName: `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
                role: question.answeredByUser.role,
              }
            : null,
        
          // Like details
          likes: question.likes?.map((like) => ({
            id: like.id,
            userId: like.userId,
            createdAt: like.createdAt,
          })) || [],
          // Computed fields
          isAnswered: question.status === 'answered',
          totalLikes: question.likesCount,
        };
      });

      // Calculate statistics
      const totalQuestions = questions.length;
      const answeredQuestions = questions.filter((q) => q.status === 'answered').length;
      const answeringQuestions = questions.filter((q) => q.status === 'answering').length;
      const unansweredQuestions = questions.filter((q) => q.status === 'not_answered' || q.status === null).length;
      const pinnedQuestions = questions.filter((q) => q.isPinned).length;
      const anonymousQuestions = questions.filter((q) => q.isAnonymous).length;
      const activeQuestions = questions.filter((q) => q.isActive).length;
      const inactiveQuestions = totalQuestions - activeQuestions;

      // Group by speaker for better organization
      const questionsBySpeaker = processedQuestions.reduce((acc, question) => {
        const speakerId = question.speakerId;
        if (!acc[speakerId]) {
          acc[speakerId] = {
            speaker: question.speaker,
            questions: [],
          };
        }
        acc[speakerId].questions.push(question);
        return acc;
      }, {} as any);

      return {
        success: true,
        message: 'All questions for event retrieved successfully',
        data: {
          questions: processedQuestions,
          // questionsBySpeaker: questionsBySpeaker,
          statistics: {
            total: totalQuestions,
            answered: answeredQuestions,
            answering: answeringQuestions,
            unanswered: unansweredQuestions,
            pinned: pinnedQuestions,
            anonymous: anonymousQuestions,
            active: activeQuestions,
            inactive: inactiveQuestions,
          },
        },
        metadata: {
          eventId: eventId,
          totalQuestions: totalQuestions,
          speakersCount: Object.keys(questionsBySpeaker).length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get all questions for event');
      return {
        success: false,
        message: 'Failed to retrieve questions for event',
        data: {
          event: null,
          questions: [],
          questionsBySpeaker: {},
          statistics: {
            total: 0,
            answered: 0,
            answering: 0,
            unanswered: 0,
            pinned: 0,
            anonymous: 0,
            active: 0,
            inactive: 0,
          },
        },
        metadata: {
          eventId: eventId,
          totalQuestions: 0,
          speakersCount: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Get Q&A statistics for an event
   * Returns basic statistics without full question details
   */
  async getQnaStatistics(eventId: string) {
    try {
      const totalQuestions = await this.qnaQuestionRepository.count({
        where: { eventId: eventId },
      });

      const answeredQuestions = await this.qnaQuestionRepository.count({
        where: { eventId: eventId, status: 'answered' },
      });

      const answeringQuestions = await this.qnaQuestionRepository.count({
        where: { eventId: eventId, status: 'answering' },
      });

      const unansweredQuestions = await this.qnaQuestionRepository.count({
        where: { 
          eventId: eventId, 
          status: 'not_answered' 
        },
      });

      const nullStatusQuestions = await this.qnaQuestionRepository.count({
        where: { 
          eventId: eventId, 
          status: IsNull() 
        },
      });

      const pinnedQuestions = await this.qnaQuestionRepository.count({
        where: { eventId: eventId, isPinned: true },
      });

      const activeQuestions = await this.qnaQuestionRepository.count({
        where: { eventId: eventId, isActive: true },
      });

      return {
        total: totalQuestions,
        answered: answeredQuestions,
        answering: answeringQuestions,
        unanswered: unansweredQuestions + nullStatusQuestions,
        pinned: pinnedQuestions,
        active: activeQuestions,
        inactive: totalQuestions - activeQuestions,
      };
    } catch (error) {
      this.errorHandler.logError(error, 'Get Q&A statistics');
      return {
        total: 0,
        answered: 0,
        answering: 0,
        unanswered: 0,
        pinned: 0,
        active: 0,
        inactive: 0,
      };
    }
  }

  /**
   * Get questions by speaker for an event
   * Returns questions grouped by speaker
   */
  async getQuestionsBySpeaker(eventId: string, speakerId: string) {
    try {
      const questions = await this.qnaQuestionRepository.find({
        where: { eventId: eventId, speakerId: speakerId, isActive: true },
        relations: ['askedBy', 'speaker', 'answeredByUser', 'likes'],
        order: { 
          isPinned: 'DESC', 
          likesCount: 'DESC', 
          createdAt: 'DESC' 
        },
      });

      const processedQuestions = questions.map((question) => ({
        id: question.id,
        question: question.question,
        isAnonymous: question.isAnonymous,
        likesCount: question.likesCount,
        isPinned: question.isPinned,
        status: question.status || 'not_answered', // Default to 'not_answered' if null
        answeredAt: question.answeredAt,
        answer: question.answer || null,
        createdAt: question.createdAt,
        askedBy: question.isAnonymous ? null : {
          id: question.askedBy?.id,
          firstName: question.askedBy?.firstName,
          lastName: question.askedBy?.lastName,
          fullName: question.askedBy ? `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim() : null,
        },
        answeredBy: question.answeredByUser ? {
          id: question.answeredByUser.id,
          firstName: question.answeredByUser.firstName,
          lastName: question.answeredByUser.lastName,
          fullName: `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
        } : null,
        isAnswered: question.status === 'answered',
      }));

      return {
        success: true,
        data: processedQuestions,
        metadata: {
          eventId,
          speakerId,
          totalQuestions: questions.length,
        },
      };
    } catch (error) {
      this.errorHandler.logError(error, 'Get questions by speaker');
      return {
        success: false,
        data: [],
        metadata: {
          eventId,
          speakerId,
          totalQuestions: 0,
        },
      };
    }
  }
}
