import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EngagementQnaQuestion, EngagementQnaLike, EngagementQnaShareLink, EngagementQnaQuestionShareLink, EngagementQnaTrackShareLink } from './engagement-qna.entity';
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
  GenerateTrackShareLinkDto,
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
import { ProgrammeTrack } from '../programme/programme-track.entity';
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
    @InjectRepository(EngagementQnaTrackShareLink)
    private engagementQnaTrackShareLinkRepository: Repository<EngagementQnaTrackShareLink>,
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(ProgrammeSession)
    private programmeSessionRepository: Repository<ProgrammeSession>,
    @InjectRepository(ProgrammeTrack)
    private programmeTrackRepository: Repository<ProgrammeTrack>,
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
      question.status = QuestionStatus.NOT_ANSWERED; // Default status is not_answered

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
      } else if (getDto.status === QuestionStatus.APPROVAL) {
        whereConditions.status = 'approval';
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
      const approvalQuestions = questions.filter((q) => q.status === 'approval').length;
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
          approval: approvalQuestions,
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
      // Validate session exists through engagement (find engagement that has this session in its track)
      // Note: We validate through engagement instead of directly querying programme session
      const questions = await this.engagementQnaQuestionRepository.find({
        where: { sessionId: generateDto.sessionId, isActive: true },
        relations: ['engagement', 'engagement.track'],
        take: 1,
      });

      if (questions.length === 0) {
        // Try to find engagement by checking if any engagement's track has this session
        // Since we can't directly query, we'll validate when the link is actually used
        // For now, just proceed with link generation
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
      const approvalQuestions = questions.filter((q) => q.status === 'approval').length;
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
                backgroundImage: session.track.event.backgroundImage || null,
              }
            : null,
          questions: sortedQuestions,
          statistics: {
            total: totalQuestions,
            answered: answeredQuestions,
            answering: answeringQuestions,
            unanswered: unansweredQuestions,
            approval: approvalQuestions,
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
      // First try to find session share link
      let shareLink = await this.engagementQnaShareLinkRepository.findOne({
        where: { shareToken },
      });

      // If not found, try track share link
      let trackShareLink = null;
      if (!shareLink) {
        trackShareLink = await this.engagementQnaTrackShareLinkRepository.findOne({
          where: { shareToken },
        });
      }

      if (!shareLink && !trackShareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }

      const activeShareLink = shareLink || trackShareLink;
      if (!activeShareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }
      
      if (!activeShareLink.isActive) {
        throw new ValidationException('This share link is no longer active');
      }

      if (activeShareLink.expiresAt && activeShareLink.expiresAt < new Date()) {
        throw new ValidationException('This share link has expired');
      }

      // Get question
      let question;
      if (shareLink) {
        // Session share link - question must belong to this session
        question = await this.engagementQnaQuestionRepository.findOne({
          where: { id: questionId, sessionId: shareLink.sessionId },
        });
      } else if (trackShareLink) {
        // Track share link - question must belong to a session in this track
        question = await this.engagementQnaQuestionRepository.findOne({
          where: { id: questionId },
          relations: ['engagement', 'engagement.track'],
        });
        
        if (question && question.engagement?.trackId !== trackShareLink.trackId) {
          throw new ValidationException('Question does not belong to this track');
        }
      }

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
      // First try to find session share link
      let shareLink = await this.engagementQnaShareLinkRepository.findOne({
        where: { shareToken },
      });

      // If not found, try track share link
      let trackShareLink = null;
      if (!shareLink) {
        trackShareLink = await this.engagementQnaTrackShareLinkRepository.findOne({
          where: { shareToken },
        });
      }

      if (!shareLink && !trackShareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }

      const activeShareLink = shareLink || trackShareLink;
      if (!activeShareLink) {
        throw new ResourceNotFoundException('Share link', shareToken);
      }
      
      if (!activeShareLink.isActive) {
        throw new ValidationException('This share link is no longer active');
      }

      if (activeShareLink.expiresAt && activeShareLink.expiresAt < new Date()) {
        throw new ValidationException('This share link has expired');
      }

      // Get question
      let question;
      if (shareLink) {
        // Session share link - question must belong to this session
        question = await this.engagementQnaQuestionRepository.findOne({
          where: { id: questionId, sessionId: shareLink.sessionId },
        });
      } else if (trackShareLink) {
        // Track share link - question must belong to a session in this track
        question = await this.engagementQnaQuestionRepository.findOne({
          where: { id: questionId },
          relations: ['engagement', 'engagement.track'],
        });
        
        if (question && question.engagement?.trackId !== trackShareLink.trackId) {
          throw new ValidationException('Question does not belong to this track');
        }
      }

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

  // Generate Shareable Link for Track (All Sessions with Questions)
  async generateTrackShareLink(generateDto: GenerateTrackShareLinkDto) {
    try {
      // Validate track exists through engagement (get the specific engagement for this track)
      const engagement = await this.engagementRepository.findOne({
        where: { 
          trackId: generateDto.trackId,
          isActive: true 
        },
        relations: ['track', 'track.event', 'track.sessions'],
        // sessionIds is a JSON column, it will be loaded automatically
      });

      if (!engagement || !engagement.track) {
        throw new ResourceNotFoundException('Track', generateDto.trackId);
      }

      const track = engagement.track;

      // Check if an active link already exists for this track
      let shareLink = await this.engagementQnaTrackShareLinkRepository.findOne({
        where: {
          trackId: generateDto.trackId,
          isActive: true,
        },
      });

      // If link exists and not expired, return existing link
      if (shareLink) {
        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
          // Link expired, deactivate it
          shareLink.isActive = false;
          await this.engagementQnaTrackShareLinkRepository.save(shareLink);
        } else {
          // Return existing active link
          const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
          const shareUrl = `${baseUrl}/qna/track/${shareLink.shareToken}`;
          
          // Get session share links for all sessions in this track through engagement
          const sessionShareLinks = [];
          const engagementForSessions = await this.engagementRepository.findOne({
            where: { 
              trackId: shareLink.trackId,
              isActive: true 
            },
            relations: ['track', 'track.sessions'],
          });

          // Filter sessions: if engagement has sessionIds, only use those; otherwise use all active sessions
          let trackSessions = engagementForSessions?.track?.sessions?.filter(s => s.isActive === true) || [];
          
          // If engagement has sessionIds, filter to only those sessions
          if (engagementForSessions?.sessionIds && engagementForSessions.sessionIds.length > 0) {
            trackSessions = trackSessions.filter(s => engagementForSessions.sessionIds!.includes(s.id));
          }

          // Sort sessions
          trackSessions = trackSessions.sort((a, b) => {
            if (a.sessionDate && b.sessionDate) {
              const dateCompare = new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
              if (dateCompare !== 0) return dateCompare;
            }
            if (a.startTime && b.startTime) {
              return a.startTime.localeCompare(b.startTime);
            }
            return 0;
          });

          for (const session of trackSessions) {
            // Check if session share link exists
            let sessionShareLink = await this.engagementQnaShareLinkRepository.findOne({
              where: {
                sessionId: session.id,
                isActive: true,
              },
            });

            // Generate if doesn't exist
            if (!sessionShareLink) {
              const sessionShareToken = crypto.randomBytes(32).toString('hex');
              const sessionExpiresAt = generateDto.expiresInDays && generateDto.expiresInDays > 0
                ? (() => {
                    const exp = new Date();
                    exp.setDate(exp.getDate() + generateDto.expiresInDays);
                    return exp;
                  })()
                : undefined;

              sessionShareLink = this.engagementQnaShareLinkRepository.create({
                sessionId: session.id,
                shareToken: sessionShareToken,
                isActive: true,
                expiresAt: sessionExpiresAt,
              });
              sessionShareLink = await this.engagementQnaShareLinkRepository.save(sessionShareLink);
            }

            const sessionShareUrl = `${baseUrl}/qna/share/${sessionShareLink.shareToken}`;
            sessionShareLinks.push({
              sessionId: session.id,
              sessionTitle: session.title,
              shareToken: sessionShareLink.shareToken,
              shareUrl: sessionShareUrl,
              expiresAt: sessionShareLink.expiresAt,
            });
          }
          
          return {
            success: true,
            message: 'Track share link retrieved successfully',
            data: {
              shareToken: shareLink.shareToken,
              shareUrl: shareUrl,
              trackId: shareLink.trackId,
              expiresAt: shareLink.expiresAt,
              createdAt: shareLink.createdAt,
              sessionShareLinks: sessionShareLinks,
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
      const newShareLink = this.engagementQnaTrackShareLinkRepository.create({
        trackId: generateDto.trackId,
        shareToken: shareToken,
        isActive: true,
        expiresAt: expiresAt,
      });

      const savedShareLink = await this.engagementQnaTrackShareLinkRepository.save(newShareLink);

      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
      const shareUrl = `${baseUrl}/qna/track/${savedShareLink.shareToken}`;

      // Generate session share links for all sessions in this track through engagement
      const sessionShareLinks = [];
      
      // Filter sessions: if engagement has sessionIds, only use those; otherwise use all active sessions
      let trackSessions = track.sessions?.filter(s => s.isActive === true) || [];
      
      // If engagement has sessionIds, filter to only those sessions
      if (engagement.sessionIds && engagement.sessionIds.length > 0) {
        trackSessions = trackSessions.filter(s => engagement.sessionIds!.includes(s.id));
      }

      // Sort sessions
      trackSessions = trackSessions.sort((a, b) => {
        if (a.sessionDate && b.sessionDate) {
          const dateCompare = new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
          if (dateCompare !== 0) return dateCompare;
        }
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });

      for (const session of trackSessions) {
        // Check if session share link already exists
        let sessionShareLink = await this.engagementQnaShareLinkRepository.findOne({
          where: {
            sessionId: session.id,
            isActive: true,
          },
        });

        // If link exists and not expired, use it
        if (sessionShareLink) {
          if (sessionShareLink.expiresAt && sessionShareLink.expiresAt < new Date()) {
            sessionShareLink.isActive = false;
            await this.engagementQnaShareLinkRepository.save(sessionShareLink);
            sessionShareLink = null;
          }
        }

        // Generate new link if needed
        if (!sessionShareLink) {
          const sessionShareToken = crypto.randomBytes(32).toString('hex');
          const sessionExpiresAt = generateDto.expiresInDays && generateDto.expiresInDays > 0
            ? (() => {
                const exp = new Date();
                exp.setDate(exp.getDate() + generateDto.expiresInDays);
                return exp;
              })()
            : undefined;

          sessionShareLink = this.engagementQnaShareLinkRepository.create({
            sessionId: session.id,
            shareToken: sessionShareToken,
            isActive: true,
            expiresAt: sessionExpiresAt,
          });
          sessionShareLink = await this.engagementQnaShareLinkRepository.save(sessionShareLink);
        }

        const sessionShareUrl = `${baseUrl}/qna/share/${sessionShareLink.shareToken}`;
        sessionShareLinks.push({
          sessionId: session.id,
          sessionTitle: session.title,
          shareToken: sessionShareLink.shareToken,
          shareUrl: sessionShareUrl,
          expiresAt: sessionShareLink.expiresAt,
        });
      }

      return {
        success: true,
        message: 'Track share link generated successfully',
        data: {
          shareToken: savedShareLink.shareToken,
          shareUrl: shareUrl,
          trackId: savedShareLink.trackId,
          expiresAt: savedShareLink.expiresAt,
          createdAt: savedShareLink.createdAt,
          sessionShareLinks: sessionShareLinks,
        },
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Generate track share link');
      this.errorHandler.handleDatabaseError(error, 'Track share link generation');
    }
  }

  // Get Track Q&A by Share Link (All Sessions with Questions) - Public Access
  async getTrackQnaByShareLink(shareToken: string, page: number = 1, pageSize: number = 1) {
    try {
      // Find the share link
      const shareLink = await this.engagementQnaTrackShareLinkRepository.findOne({
        where: { shareToken },
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

      // Get engagement by trackId (Engagement has track relation)
      const engagement = await this.engagementRepository.findOne({
        where: { 
          trackId: shareLink.trackId,
          isActive: true 
        },
        relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers'],
      });

      if (!engagement || !engagement.track) {
        throw new ResourceNotFoundException('Track', shareLink.trackId);
      }

      const track = engagement.track;

      // Get all active sessions from engagement's track (filtered from relation)
      let allSessions = (track.sessions || []).filter(session => session.isActive === true);
      
      // If engagement has sessionIds, filter to only those sessions
      if (engagement.sessionIds && engagement.sessionIds.length > 0) {
        allSessions = allSessions.filter(s => engagement.sessionIds!.includes(s.id));
      }
      
      // Sort sessions
      allSessions = allSessions.sort((a, b) => {
        // Sort by sessionDate first, then startTime
        if (a.sessionDate && b.sessionDate) {
          const dateCompare = new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
          if (dateCompare !== 0) return dateCompare;
        }
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });

      // Apply pagination to sessions
      const totalSessions = allSessions.length;
      const totalPages = Math.ceil(totalSessions / pageSize);
      const skip = (page - 1) * pageSize;
      const sessions = allSessions.slice(skip, skip + pageSize);

      // Get all questions for all sessions in this track (still need all questions for statistics)
      const allSessionIds = allSessions.map(s => s.id);
      const allQuestions = allSessionIds.length > 0 
        ? await this.engagementQnaQuestionRepository.find({
            where: {
              sessionId: In(allSessionIds),
              isActive: true,
            },
            relations: ['askedBy', 'answeredByUser'],
            order: { likesCount: 'DESC', createdAt: 'DESC' },
          })
        : [];

      // Get session share links for all sessions
      const sessionShareLinksMap = new Map();
      for (const session of sessions) {
        let sessionShareLink = await this.engagementQnaShareLinkRepository.findOne({
          where: {
            sessionId: session.id,
            isActive: true,
          },
        });

        // Generate if doesn't exist
        if (!sessionShareLink) {
          const sessionShareToken = crypto.randomBytes(32).toString('hex');
          const sessionExpiresAt = shareLink.expiresAt ? new Date(shareLink.expiresAt) : undefined;
          sessionShareLink = this.engagementQnaShareLinkRepository.create({
            sessionId: session.id,
            shareToken: sessionShareToken,
            isActive: true,
            expiresAt: sessionExpiresAt, // Use same expiry as track link
          });
          sessionShareLink = await this.engagementQnaShareLinkRepository.save(sessionShareLink);
        }

        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const sessionShareUrl = `${baseUrl}/qna/share/${sessionShareLink.shareToken}`;
        sessionShareLinksMap.set(session.id, {
          shareToken: sessionShareLink.shareToken,
          shareUrl: sessionShareUrl,
        });
      }

      // Group questions by session
      const sessionsWithQuestions = sessions.map((session) => {
        const sessionQuestions = allQuestions.filter(q => q.sessionId === session.id);
        const sessionShareLink = sessionShareLinksMap.get(session.id);
        
        // Process questions for this session
        const processedQuestions = sessionQuestions.map((question) => {
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

        // Calculate statistics for this session
        const totalQuestions = sessionQuestions.length;
        const answeredQuestions = sessionQuestions.filter((q) => q.status === 'answered').length;
        const answeringQuestions = sessionQuestions.filter((q) => q.status === 'answering').length;
        const unansweredQuestions = sessionQuestions.filter((q) => q.status === 'not_answered' || q.status === null).length;
        const approvalQuestions = sessionQuestions.filter((q) => q.status === 'approval').length;
        const pinnedQuestions = sessionQuestions.filter((q) => q.isPinned).length;

        return {
          id: session.id,
          title: session.title,
          description: session.description,
          sessionDate: session.sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
          venue: session.venue,
          speakers: session.speakers?.map((speaker: UserEntity) => ({
            id: speaker.id,
            firstName: speaker.firstName,
            lastName: speaker.lastName,
            fullName: `${speaker.firstName} ${speaker.lastName}`.trim(),
          })) || [],
          questions: sortedQuestions,
          statistics: {
            total: totalQuestions,
            answered: answeredQuestions,
            answering: answeringQuestions,
            unanswered: unansweredQuestions,
            approval: approvalQuestions,
            pinned: pinnedQuestions,
          },
          shareLink: sessionShareLink ? {
            shareToken: sessionShareLink.shareToken,
            shareUrl: sessionShareLink.shareUrl,
          } : null,
        };
      });

      // Calculate overall statistics
      const totalQuestions = allQuestions.length;
      const answeredQuestions = allQuestions.filter((q) => q.status === 'answered').length;
      const answeringQuestions = allQuestions.filter((q) => q.status === 'answering').length;
      const unansweredQuestions = allQuestions.filter((q) => q.status === 'not_answered' || q.status === null).length;
      const approvalQuestions = allQuestions.filter((q) => q.status === 'approval').length;
      const pinnedQuestions = allQuestions.filter((q) => q.isPinned).length;

      return {
        success: true,
        message: 'Track Q&A retrieved successfully',
        data: {
          track: {
            id: track.id,
            title: track.title,
            description: track.description,
          },
          event: track.event
            ? {
                id: track.event.id,
                name: track.event.name,
                description: track.event.description,
                startDate: track.event.startDate,
                endDate: track.event.endDate,
                location: track.event.location,
              }
            : null,
          sessions: sessionsWithQuestions,
          overallStatistics: {
            totalSessions: totalSessions,
            totalQuestions: totalQuestions,
            answered: answeredQuestions,
            answering: answeringQuestions,
            unanswered: unansweredQuestions,
            approval: approvalQuestions,
            pinned: pinnedQuestions,
          },
          pagination: {
            currentPage: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalSessions: totalSessions,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
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
      this.errorHandler.logError(error, 'Get track Q&A by share link');
      this.errorHandler.handleDatabaseError(error, 'Track Q&A retrieval');
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

