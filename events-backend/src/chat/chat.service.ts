// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatQuestion, ChatLike, ChatResponse } from './chat.entity';
import { PostQuestionDto, LikeQuestionDto, PostAnswerDto } from './chat.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ResourceNotFoundException, ValidationException, DuplicateResourceException } from '../utils/exceptions/custom-exceptions';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';
import { Speaker } from 'speaker/speaker.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatQuestion)
    private chatQuestionRepository: Repository<ChatQuestion>,
    
    @InjectRepository(ChatLike)
    private chatLikeRepository: Repository<ChatLike>,
    
    @InjectRepository(ChatResponse)
    private chatResponseRepository: Repository<ChatResponse>,
    
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
    
    private errorHandler: ErrorHandlerService,
  ) {}

  // Post a question
  async postQuestion(postQuestionDto: PostQuestionDto, userId: string) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: postQuestionDto.eventId }
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', postQuestionDto.eventId);
      }

      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: postQuestionDto.speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', postQuestionDto.speakerId);
      }

      // Validate user exists
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Create question
      const question = this.chatQuestionRepository.create({
        message: postQuestionDto.message,
        isAnonymous: postQuestionDto.isAnonymous || false,
        eventId: postQuestionDto.eventId,
        speakerId: postQuestionDto.speakerId,
        userId: userId,
      });

      const savedQuestion = await this.chatQuestionRepository.save(question);

      // Return formatted question
      return this.formatQuestionResponse(savedQuestion, false, userId);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Post question');
      this.errorHandler.handleDatabaseError(error, 'Question posting');
    }
  }

  // Like/Unlike a question
  async likeQuestion(likeQuestionDto: LikeQuestionDto, userId: string) {
    try {
      // Check if question exists
      const question = await this.chatQuestionRepository.findOne({
        where: { id: likeQuestionDto.questionId }
      });
      if (!question) {
        throw new ResourceNotFoundException('Question', likeQuestionDto.questionId);
      }

      // Check if user already liked this question
      const existingLike = await this.chatLikeRepository.findOne({
        where: { 
          questionId: likeQuestionDto.questionId,
          userId: userId
        }
      });

      if (existingLike) {
        // Unlike - remove like
        await this.chatLikeRepository.remove(existingLike);
        
        // Decrease likes count
        await this.chatQuestionRepository.update(
          { id: likeQuestionDto.questionId },
          { likesCount: () => 'likesCount - 1' }
        );

        return {
          isLiked: false,
          likesCount: Math.max(0, question.likesCount - 1),
          message: 'Question unliked successfully'
        };
      } else {
        // Like - add like
        const like = this.chatLikeRepository.create({
          questionId: likeQuestionDto.questionId,
          userId: userId
        });
        await this.chatLikeRepository.save(like);

        // Increase likes count
        await this.chatQuestionRepository.update(
          { id: likeQuestionDto.questionId },
          { likesCount: () => 'likesCount + 1' }
        );

        return {
          isLiked: true,
          likesCount: question.likesCount + 1,
          message: 'Question liked successfully'
        };
      }
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Like question');
      this.errorHandler.handleDatabaseError(error, 'Question liking');
    }
  }

  // Get questions for speaker (sorted by likes or recent)
  async getQuestions(eventId: string, speakerId: string, userId: string, page: number = 1, limit: number = 20, sortBy: 'likes' | 'recent' | 'answered' = 'likes') {
    try {
      // Validate event and speaker exist
      const event = await this.eventRepository.findOne({
        where: { id: eventId }
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', speakerId);
      }

      const offset = (page - 1) * limit;

      // Build query
      const queryBuilder = this.chatQuestionRepository
        .createQueryBuilder('question')
        .leftJoinAndSelect('question.user', 'user')
        .leftJoinAndSelect('question.likes', 'likes')
        .leftJoinAndSelect('question.answers', 'answers')
        .leftJoinAndSelect('answers.user', 'answerUser')
        .leftJoinAndSelect('answers.speaker', 'answerSpeaker')
        .where('question.eventId = :eventId', { eventId })
        .andWhere('question.speakerId = :speakerId', { speakerId })
        .andWhere('question.isActive = :isActive', { isActive: true });

      // Sorting
      if (sortBy === 'likes') {
        queryBuilder
          .orderBy('question.isPinned', 'DESC') // Pinned questions first
          .addOrderBy('question.likesCount', 'DESC')
          .addOrderBy('question.createdAt', 'DESC');
      } else if (sortBy === 'answered') {
        queryBuilder
          .orderBy('question.isPinned', 'DESC') // Pinned questions first
          .addOrderBy('question.answersCount', 'DESC')
          .addOrderBy('question.createdAt', 'DESC');
      } else {
        queryBuilder
          .orderBy('question.isPinned', 'DESC') // Pinned questions first
          .addOrderBy('question.createdAt', 'DESC');
      }

      // Pagination
      queryBuilder.skip(offset).take(limit);

      const [questions, total] = await queryBuilder.getManyAndCount();

      // Format questions with user like status
      const formattedQuestions = await Promise.all(
        questions.map(question => this.formatQuestionResponse(question, true, userId))
      );

      return {
        questions: formattedQuestions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        speaker: {
          id: speaker.id,
          name: speaker.name,
          companyName: speaker.companyName,
          position: speaker.position,
          speakerProfile: speaker.speakerProfile,
        },
        event: {
          id: event.id,
          name: event.name,
        }
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get questions');
      return {
        questions: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        speaker: null,
        event: null
      };
    }
  }

  // Any user can answer a question
  async postAnswer(postAnswerDto: PostAnswerDto, userId: string) {
    try {
      // Validate question exists
      const question = await this.chatQuestionRepository.findOne({
        where: { id: postAnswerDto.questionId },
        relations: ['user', 'speaker']
      });
      if (!question) {
        throw new ResourceNotFoundException('Question', postAnswerDto.questionId);
      }

      // Validate user exists
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is a speaker for this question
      const isSpeaker = question.speakerId === userId;

      // Create answer
      const answer = this.chatResponseRepository.create({
        message: postAnswerDto.message,
        isAnonymous: postAnswerDto.isAnonymous || false,
        questionId: postAnswerDto.questionId,
        userId: userId,
        ...(isSpeaker && { speakerId: userId }), // Only set speakerId if user is speaker
      });

      const savedAnswer = await this.chatResponseRepository.save(answer);

      // Update question's answers count
      await this.chatQuestionRepository.update(
        { id: postAnswerDto.questionId },
        { answersCount: () => 'answersCount + 1' }
      );

      // Format author name
      const author = savedAnswer.isAnonymous ? 
        'Anonymous' : 
        `${user.firstName} ${user.lastName}`;

      return {
        id: savedAnswer.id,
        message: savedAnswer.message,
        isAnonymous: savedAnswer.isAnonymous,
        author: author,
        isSpeaker: isSpeaker,
        questionId: savedAnswer.questionId,
        createdAt: savedAnswer.createdAt,
        question: {
          id: question.id,
          message: question.message,
          isAnonymous: question.isAnonymous,
          author: question.isAnonymous ? 'Anonymous' : `${question.user?.firstName} ${question.user?.lastName}`,
          likesCount: question.likesCount,
          createdAt: question.createdAt
        }
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Post answer');
      this.errorHandler.handleDatabaseError(error, 'Answer posting');
    }
  }

  // Get answers for a question
  async getQuestionAnswers(questionId: string) {
    try {
      const answers = await this.chatResponseRepository.find({
        where: { questionId, isActive: true },
        relations: ['user', 'speaker'],
        order: { createdAt: 'ASC' }
      });

      return answers.map(answer => {
        const author = answer.isAnonymous ? 
          'Anonymous' : 
          `${answer.user?.firstName || ''} ${answer.user?.lastName || ''}`.trim();

        return {
          id: answer.id,
          message: answer.message,
          isAnonymous: answer.isAnonymous,
          author: author,
          isSpeaker: !!answer.speakerId,
          speakerInfo: answer.speaker ? {
            id: answer.speaker.id,
            name: answer.speaker.name,
            companyName: answer.speaker.companyName,
            position: answer.speaker.position,
            speakerProfile: answer.speaker.speakerProfile,
          } : null,
          createdAt: answer.createdAt
        };
      });
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get question answers');
      return [];
    }
  }

  // Private helper method to format question response
  private async formatQuestionResponse(question: ChatQuestion, includeAnswers: boolean = false, currentUserId?: string) {
    // Check if current user liked this question
    let isLikedByUser = false;
    if (currentUserId) {
      const userLike = await this.chatLikeRepository.findOne({
        where: { questionId: question.id, userId: currentUserId }
      });
      isLikedByUser = !!userLike;
    }

    // Get author info
    const author = question.isAnonymous ? 
      'Anonymous' : 
      `${question.user?.firstName || ''} ${question.user?.lastName || ''}`.trim();

    const formattedQuestion: any = {
      id: question.id,
      message: question.message,
      isAnonymous: question.isAnonymous,
      author: author,
      likesCount: question.likesCount,
      answersCount: question.answersCount || 0,
      isLikedByUser: isLikedByUser,
      isPinned: question.isPinned,
      createdAt: question.createdAt,
      isOwnQuestion: currentUserId === question.userId
    };

    // Include answers if requested
    if (includeAnswers) {
      formattedQuestion.answers = await this.getQuestionAnswers(question.id);
    }

    return formattedQuestion;
  }

  // Admin/Speaker: Pin/Unpin question
  async toggleQuestionPin(questionId: string, adminUserId: string) {
    try {
      const question = await this.chatQuestionRepository.findOne({
        where: { id: questionId }
      });
      if (!question) {
        throw new ResourceNotFoundException('Question', questionId);
      }

      question.isPinned = !question.isPinned;
      await this.chatQuestionRepository.save(question);

      return {
        id: question.id,
        isPinned: question.isPinned,
        message: question.isPinned ? 'Question pinned successfully' : 'Question unpinned successfully'
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Toggle question pin');
      this.errorHandler.handleDatabaseError(error, 'Question pin toggle');
    }
  }
} 