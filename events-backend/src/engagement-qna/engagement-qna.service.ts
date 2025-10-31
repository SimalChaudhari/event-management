import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EngagementQnaQuestion, EngagementQnaLike, EngagementQnaShareLink, EngagementQnaQuestionShareLink } from './engagement-qna.entity';
import {
  CreateEngagementQuestionDto,
  UpdateEngagementQuestionDto,
  AnswerEngagementQuestionDto,
  LikeEngagementQuestionDto,
  GetEngagementQuestionsDto,
  QuestionSortBy,
  QuestionStatus,
  GenerateShareLinkDto,
  GenerateQuestionShareLinkDto,
} from './engagement-qna.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { Engagement } from '../engagement/engagement.entity';
import { UserEntity } from '../user/users.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';
import * as crypto from 'crypto';

@Injectable()
export class EngagementQnaService {
  constructor(
    @InjectRepository(EngagementQnaQuestion)
    private engagementQnaQuestionRepository: Repository<EngagementQnaQuestion>,
    @InjectRepository(EngagementQnaLike)
    private engagementQnaLikeRepository: Repository<EngagementQnaLike>,
    @InjectRepository(EngagementQnaShareLink)
    private engagementQnaShareLinkRepository: Repository<EngagementQnaShareLink>,
    @InjectRepository(EngagementQnaQuestionShareLink)
    private engagementQnaQuestionShareLinkRepository: Repository<EngagementQnaQuestionShareLink>,
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(ProgrammeSession)
    private programmeSessionRepository: Repository<ProgrammeSession>,
    private errorHandler: ErrorHandlerService,
  ) {}

  // 1. Create Question (Only for registered users of the event)
  async createQuestion(createDto: CreateEngagementQuestionDto, askedById: string) {
    try {
      // Validate engagement exists
      const engagement = await this.engagementRepository.findOne({
        where: { id: createDto.engagementId },
        relations: ['track', 'track.event', 'track.sessions'],
      });

      if (!engagement) {
        throw new ResourceNotFoundException('Engagement', createDto.engagementId);
      }

      // Validate session exists and belongs to this engagement's track
      const session = engagement.track?.sessions?.find(s => s.id === createDto.sessionId);
      if (!session) {
        throw new ValidationException(`Session with ID ${createDto.sessionId} not found or does not belong to this engagement's track`);
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
      question.sessionId = createDto.sessionId;
      question.askedById = askedById;
      question.isAnonymous = false; // Removed anonymous support
      question.likesCount = 0;
      question.isPinned = false;
      question.isActive = true;
      question.status = 'answering'; // Default status is answering

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
      if (!getDto.engagementId && !getDto.sessionId) {
        throw new ValidationException('Engagement ID or Session ID is required to retrieve Q&A questions');
      }

      const whereConditions: any = { isActive: true };

      if (getDto.engagementId) {
        whereConditions.engagementId = getDto.engagementId;
      }

      // Add sessionId filter if provided
      if (getDto.sessionId) {
        whereConditions.sessionId = getDto.sessionId;
      }

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
      let engagement: Engagement | null = null;
      if (getDto.engagementId) {
        engagement = await this.engagementRepository.findOne({
          where: { id: getDto.engagementId },
          relations: ['track', 'track.event'],
        });

        if (!engagement) {
          throw new ResourceNotFoundException('Engagement', getDto.engagementId);
        }
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
      const data = engagement
        ? {
            engagement: {
              id: engagement.id,
              trackTitle: engagement.track?.title || 'Unknown Track',
              eventName: engagement.track?.event?.name || 'Unknown Event',
            },
            questions: sortedQuestions,
          }
        : {
            // For session-only queries, do not include engagement details at all
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
          sessionId: getDto.sessionId,
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
    isModerator: boolean = false,
  ) {
    try {
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Only the question creator or admin can update
      if (!isAdmin && !isModerator && question.askedById !== userId) {
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
  async deleteQuestion(id: string, userId: string, isAdmin: boolean = false, isModerator: boolean = false) {
    try {
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', id);
      }

      // Only the question creator or admin can delete
      if (!isAdmin && !isModerator && question.askedById !== userId) {
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

  // Generate Shareable Link for Session Q&A
  async generateShareLink(generateDto: GenerateShareLinkDto) {
    try {
      // Validate session exists
      const session = await this.programmeSessionRepository.findOne({
        where: { id: generateDto.sessionId },
        relations: ['track', 'track.event'],
      });

      if (!session) {
        throw new ResourceNotFoundException('Session', generateDto.sessionId);
      }

      // Check if an active link already exists for this session
      let shareLink = await this.engagementQnaShareLinkRepository.findOne({
        where: {
          sessionId: generateDto.sessionId,
          isActive: true,
        },
      });

      // If link exists and not expired, return existing link
      if (shareLink) {
        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
          // Link expired, deactivate it
          shareLink.isActive = false;
          await this.engagementQnaShareLinkRepository.save(shareLink);
        } else {
          // Return existing active link
          const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
          const shareUrl = `${baseUrl}/qna/share/${shareLink.shareToken}`;
          
          return {
            success: true,
            message: 'Share link retrieved successfully',
            data: {
              shareToken: shareLink.shareToken,
              shareUrl: shareUrl,
              sessionId: shareLink.sessionId,
              expiresAt: shareLink.expiresAt,
              createdAt: shareLink.createdAt,
            },
          };
        }
      }

      // Generate unique share token
      const shareToken = crypto.randomBytes(32).toString('hex');

      // Calculate expiry date if provided
      let expiresAt: Date | undefined;
      if (generateDto.expiresInDays && generateDto.expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + generateDto.expiresInDays);
      }

      // Create new share link
      const newShareLink = this.engagementQnaShareLinkRepository.create({
        sessionId: generateDto.sessionId,
        shareToken: shareToken,
        isActive: true,
        expiresAt: expiresAt,
      });

      const savedShareLink = await this.engagementQnaShareLinkRepository.save(newShareLink);

      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
      const shareUrl = `${baseUrl}/qna/share/${savedShareLink.shareToken}`;

      return {
        success: true,
        message: 'Share link generated successfully',
        data: {
          shareToken: savedShareLink.shareToken,
          shareUrl: shareUrl,
          sessionId: savedShareLink.sessionId,
          expiresAt: savedShareLink.expiresAt,
          createdAt: savedShareLink.createdAt,
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Generate share link');
      this.errorHandler.handleDatabaseError(error, 'Share link generation');
    }
  }

  // Get Session Q&A by Share Link (Public Access)
  async getSessionQnaByShareLink(shareToken: string) {
    try {
      // Find the share link
      const shareLink = await this.engagementQnaShareLinkRepository.findOne({
        where: { shareToken },
        relations: ['session', 'session.track', 'session.track.event'],
      });

      if (!shareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }

      // Check if link is active
      if (!shareLink.isActive) {
        throw new ValidationException('This share link is no longer active');
      }

      // Check if link has expired
      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        throw new ValidationException('This share link has expired');
      }

      // Get session details
      const session = await this.programmeSessionRepository.findOne({
        where: { id: shareLink.sessionId },
        relations: ['track', 'track.event', 'speakers'],
      });

      if (!session) {
        throw new ResourceNotFoundException('Session', shareLink.sessionId);
      }

      // Get all questions for this session
      const questions = await this.engagementQnaQuestionRepository.find({
        where: {
          sessionId: shareLink.sessionId,
          isActive: true,
        },
        relations: ['askedBy', 'answeredByUser', 'engagement', 'engagement.track', 'engagement.track.event'],
        order: { likesCount: 'DESC', createdAt: 'DESC' },
      });

      // Process questions (no user likes since this is public access)
      const processedQuestions = questions.map((question) => {
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
                  fullName: `${question.askedBy.firstName} ${question.askedBy.lastName}`.trim(),
                }
              : null,
          answeredBy: question.answeredByUser
            ? {
                id: question.answeredByUser.id,
                firstName: question.answeredByUser.firstName,
                lastName: question.answeredByUser.lastName,
                fullName: `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
              }
            : null,
          isAnonymous: question.isAnonymous,
          likesCount: question.likesCount,
          isPinned: question.isPinned,
          status: question.status || 'not_answered',
          answeredAt: question.answeredAt,
          answer: question.answer || null,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
          isAnswered: !!question.answeredAt,
        };
      });

      // Sort questions by pinned first, then by likes
      const sortedQuestions = processedQuestions.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.likesCount - a.likesCount;
      });

      // Calculate summary statistics
      const totalQuestions = questions.length;
      const answeredQuestions = questions.filter((q) => q.status === 'answered').length;
      const answeringQuestions = questions.filter((q) => q.status === 'answering').length;
      const unansweredQuestions = questions.filter((q) => q.status === 'not_answered' || q.status === null).length;
      const pinnedQuestions = questions.filter((q) => q.isPinned).length;

      return {
        success: true,
        message: 'Session Q&A retrieved successfully',
        data: {
          session: {
            id: session.id,
            title: session.title,
            description: session.description,
            sessionDate: session.sessionDate,
            startTime: session.startTime,
            endTime: session.endTime,
            venue: session.venue,
            speakers: session.speakers?.map((speaker) => ({
              id: speaker.id,
              firstName: speaker.firstName,
              lastName: speaker.lastName,
              fullName: `${speaker.firstName} ${speaker.lastName}`.trim(),
            })) || [],
          },
          track: session.track
            ? {
                id: session.track.id,
                title: session.track.title,
                description: session.track.description,
              }
            : null,
          event: session.track?.event
            ? {
                id: session.track.event.id,
                name: session.track.event.name,
                description: session.track.event.description,
                startDate: session.track.event.startDate,
                endDate: session.track.event.endDate,
                location: session.track.event.location,
              }
            : null,
          questions: sortedQuestions,
          statistics: {
            total: totalQuestions,
            answered: answeredQuestions,
            answering: answeringQuestions,
            unanswered: unansweredQuestions,
            pinned: pinnedQuestions,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          shareToken: shareToken,
        },
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get session Q&A by share link');
      this.errorHandler.handleDatabaseError(error, 'Session Q&A retrieval');
    }
  }

  // Answer Question via Share Link (Public Access)
  async answerQuestionViaShareLink(
    shareToken: string,
    questionId: string,
    answer: string,
  ) {
    try {
      // Validate share link
      const shareLink = await this.engagementQnaShareLinkRepository.findOne({
        where: { shareToken },
      });

      if (!shareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }

      if (!shareLink.isActive) {
        throw new ValidationException('This share link is no longer active');
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        throw new ValidationException('This share link has expired');
      }

      // Get question
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id: questionId, sessionId: shareLink.sessionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', questionId);
      }

      // Update answer (simple - no user tracking for public view)
      const isUpdating = !!question.answer;
      question.answer = answer;
      question.status = 'answered';
      
      if (!isUpdating) {
        question.answeredAt = new Date();
      }

      const savedQuestion = await this.engagementQnaQuestionRepository.save(question);

      return {
        success: true,
        message: isUpdating 
          ? 'Answer updated successfully' 
          : 'Question answered successfully',
        data: savedQuestion,
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Answer question via share link');
      this.errorHandler.handleDatabaseError(error, 'Answer question');
    }
  }

  // Update Question via Share Link (Public Access)
  async updateQuestionViaShareLink(
    shareToken: string,
    questionId: string,
    updateDto: UpdateEngagementQuestionDto,
  ) {
    try {
      // Validate share link
      const shareLink = await this.engagementQnaShareLinkRepository.findOne({
        where: { shareToken },
      });

      if (!shareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }

      if (!shareLink.isActive) {
        throw new ValidationException('This share link is no longer active');
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        throw new ValidationException('This share link has expired');
      }

      // Get question
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id: questionId, sessionId: shareLink.sessionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', questionId);
      }

      // Update question
      if (updateDto.question) {
        question.question = updateDto.question;
      }
      
      // Allow status update if provided (for public view, simple update)
      if ((updateDto as any).status) {
        question.status = (updateDto as any).status;
      }

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
      this.errorHandler.logError(error, 'Update question via share link');
      this.errorHandler.handleDatabaseError(error, 'Question update');
    }
  }

  // Delete Question via Share Link (Public Access)
  async deleteQuestionViaShareLink(
    shareToken: string,
    questionId: string,
  ) {
    try {
      // Validate share link
      const shareLink = await this.engagementQnaShareLinkRepository.findOne({
        where: { shareToken },
      });

      if (!shareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }

      if (!shareLink.isActive) {
        throw new ValidationException('This share link is no longer active');
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        throw new ValidationException('This share link has expired');
      }

      // Get question
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id: questionId, sessionId: shareLink.sessionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', questionId);
      }

      // Delete question
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
      this.errorHandler.logError(error, 'Delete question via share link');
      this.errorHandler.handleDatabaseError(error, 'Question deletion');
      throw error;
    }
  }

  // Generate Shareable Link for Individual Question
  async generateQuestionShareLink(generateDto: GenerateQuestionShareLinkDto) {
    try {
      // Validate question exists
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id: generateDto.questionId },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', generateDto.questionId);
      }

      // Check if active share link already exists for this question
      let shareLink = await this.engagementQnaQuestionShareLinkRepository.findOne({
        where: { questionId: generateDto.questionId },
        order: { createdAt: 'DESC' },
      });

      if (shareLink) {
        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
          // Expired link found, deactivate it
          shareLink.isActive = false;
          await this.engagementQnaQuestionShareLinkRepository.save(shareLink);
        } else if (shareLink.isActive) {
          // Active link exists, return it
          const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
          const shareUrl = `${baseUrl}/qna/question/${shareLink.shareToken}`;

          return {
            success: true,
            message: 'Share link retrieved successfully',
            data: {
              shareUrl,
              shareToken: shareLink.shareToken,
              questionId: shareLink.questionId,
              expiresAt: shareLink.expiresAt,
              createdAt: shareLink.createdAt,
            },
          };
        }
      }

      // Generate new token
      const shareToken = crypto.randomBytes(32).toString('hex');

      // Calculate expiry date if provided
      let expiresAt: Date | null = null;
      if (generateDto.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + generateDto.expiresInDays);
      }

      // Create new share link
      const newShareLink = this.engagementQnaQuestionShareLinkRepository.create({
        questionId: generateDto.questionId,
        shareToken,
        isActive: true,
        expiresAt: expiresAt || undefined,
      });

      const savedShareLink = await this.engagementQnaQuestionShareLinkRepository.save(newShareLink);

      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
      const shareUrl = `${baseUrl}/qna/question/${savedShareLink.shareToken}`;

      return {
        success: true,
        message: 'Question share link generated successfully',
        data: {
          shareUrl,
          shareToken: savedShareLink.shareToken,
          questionId: savedShareLink.questionId,
          expiresAt: savedShareLink.expiresAt,
          createdAt: savedShareLink.createdAt,
        },
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Generate question share link');
      this.errorHandler.handleDatabaseError(error, 'Question share link generation');
      throw error;
    }
  }

  // Get Question by Share Link (Public Access)
  async getQuestionByShareLink(shareToken: string) {
    try {
      // Find the share link
      const shareLink = await this.engagementQnaQuestionShareLinkRepository.findOne({
        where: { shareToken },
        relations: ['question'],
      });

      if (!shareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }

      // Check if link is active
      if (!shareLink.isActive) {
        throw new ValidationException('This share link is no longer active');
      }

      // Check if link has expired
      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        throw new ValidationException('This share link has expired');
      }

      // Get question with related data
      const question = await this.engagementQnaQuestionRepository.findOne({
        where: { id: shareLink.questionId },
        relations: ['askedBy', 'answeredByUser', 'engagement'],
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', shareLink.questionId);
      }

      // Get session and related event/track data
      const session = await this.programmeSessionRepository.findOne({
        where: { id: question.sessionId },
        relations: ['track', 'track.event'],
      });

      if (!session) {
        throw new ResourceNotFoundException('Session', question.sessionId);
      }

      const event = session.track?.event;

      // Format question for public view
      const formattedQuestion = {
        id: question.id,
        question: question.question,
        answer: question.answer,
        status: question.status || 'not_answered',
        likesCount: question.likesCount || 0,
        createdAt: question.createdAt,
        answeredAt: question.answeredAt,
        answeredBy: question.answeredByUser
          ? {
              id: question.answeredByUser.id,
              firstName: question.answeredByUser.firstName,
              lastName: question.answeredByUser.lastName,
              fullName: `${question.answeredByUser.firstName} ${question.answeredByUser.lastName}`.trim(),
            }
          : null,
      };

      return {
        success: true,
        message: 'Question retrieved successfully',
        data: {
          question: formattedQuestion,
          session: {
            id: session.id,
            title: session.title,
            startTime: session.startTime,
            endTime: session.endTime,
          },
          track: session.track
            ? {
                id: session.track.id,
                title: session.track.title,
              }
            : null,
          event: event
            ? {
                id: event.id,
                name: event.name,
                startDate: event.startDate,
                endDate: event.endDate,
                backgroundImage: event.backgroundImage,
              }
            : null,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          shareToken: shareToken,
        },
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get question by share link');
      this.errorHandler.handleDatabaseError(error, 'Get question by share link');
      throw error;
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

