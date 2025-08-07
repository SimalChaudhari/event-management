// src/polling/polling.service.ts //testing
import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm'; // Add In import
import { InjectRepository } from '@nestjs/typeorm';
import {
  Poll,
  PollOption,
  PollVote,
  UserPollSession,
  UserPollVote,
} from './polling.entity';
import { CreatePollDto, UpdatePollDto, VoteDto } from './polling.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { Event } from 'event/event.entity';
import { Speaker } from 'speaker/speaker.entity';
import { UserEntity } from 'user/users.entity';

@Injectable()
export class PollingService {
  constructor(
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private pollOptionRepository: Repository<PollOption>,
    @InjectRepository(PollVote)
    private pollVoteRepository: Repository<PollVote>,
    @InjectRepository(UserPollSession)
    private userPollSessionRepository: Repository<UserPollSession>,
    @InjectRepository(UserPollVote)
    private userPollVoteRepository: Repository<UserPollVote>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private errorHandler: ErrorHandlerService,
  ) {}

  // Create Poll (Admin) - Event-based only, no speakerId
  async createPoll(createDto: CreatePollDto, createdById: string) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: createDto.eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', createDto.eventId);
      }

      // Validate speaker exists if speakerId is provided
      if (createDto.speakerId) {
        const speaker = await this.speakerRepository.findOne({
          where: { id: createDto.speakerId },
        });
        if (!speaker) {
          throw new ResourceNotFoundException('Speaker', createDto.speakerId);
        }
      }

      // Create poll
      const poll = new Poll();
      poll.question = createDto.question;

      poll.eventId = createDto.eventId;
      poll.speakerId = createDto.speakerId; // Add speakerId
      poll.createdById = createdById;
      poll.timerSeconds = createDto.timerSeconds || 30; // Set timer

      const savedPoll = await this.pollRepository.save(poll);

      // Create options
      const optionPromises = createDto.options.map(async (optionDto) => {
        const option = new PollOption();
        option.optionText = optionDto.optionText;
        option.pollId = savedPoll.id;
        option.voteCount = 0;
        return await this.pollOptionRepository.save(option);
      });

      const savedOptions = await Promise.all(optionPromises);

      return {
        ...savedPoll,
        options: savedOptions,
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Create poll');
      this.errorHandler.handleDatabaseError(error, 'Poll creation');
    }
  }

  // Get or Create Session with Current Question - Single API
  async getOrCreateSession(userId: string, eventId: string, speakerId?: string) {
    try {
      // First validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });
      if (!event) {
        throw new ValidationException(`Event does not exist`);
      }

      // Validate speaker exists if speakerId is provided
      if (speakerId) {
        const speaker = await this.speakerRepository.findOne({
          where: { id: speakerId },
        });
        if (!speaker) {
          throw new ValidationException(`Speaker does not exist`);
        }
      }

      // Check if user already has a completed session for this event and speaker
      const completedSessionWhereCondition: any = {
        userId: userId,
        eventId: eventId,
        isCompleted: true,
      };

      if (speakerId) {
        completedSessionWhereCondition.speakerId = speakerId;
      } else {
        completedSessionWhereCondition.speakerId = null;
      }

      const completedSession = await this.userPollSessionRepository.findOne({
        where: completedSessionWhereCondition,
      });

      // If user has completed session, return results instead of starting new session
      if (completedSession) {
        return await this.getCompletedSessionResults(
          completedSession.id,
          userId,
        );
      }

      // Check if any polls exist for this event and speaker combination
      const pollExistsCondition: any = {
        eventId: eventId,
        isActive: true,
        isLive: true,
      };

      if (speakerId) {
        pollExistsCondition.speakerId = speakerId;
      } else {
        pollExistsCondition.speakerId = null;
      }

      const existingPolls = await this.pollRepository.find({
        where: pollExistsCondition,
        select: ['id'], // Only get IDs for efficiency
      });

      if (existingPolls.length === 0) {
        const errorMessage = speakerId
          ? `No active polls found for event ${eventId} and speaker ${speakerId}`
          : `No active polls found for event ${eventId}`;
        throw new ValidationException(errorMessage);
      }

      // Now get all active polls with full details
      const whereCondition: any = {
        eventId: eventId,
        speakerId: speakerId,
        isActive: true,
        isLive: true,
      };

      if (speakerId) {
        console.log(whereCondition.speakerId, '&&&&&&&');
      }

      console.log('🔍 Searching polls with conditions:', whereCondition);

      const polls = await this.pollRepository.find({
        where: whereCondition,
        relations: ['options'],
        order: { createdAt: 'ASC' },
      });

      console.log('📊 Found polls:', polls.length);
      console.log(
        '📋 Polls details:',
        polls.map((p) => ({
          id: p.id,
          question: p.question,
          isActive: p.isActive,
          isLive: p.isLive,
          timerSeconds: p.timerSeconds,
        })),
      );

      if (polls.length === 0) {
        throw new ValidationException('No active polls found for this event');
      }

      // Check if user already has an active session
      const sessionWhereCondition: any = {
        userId: userId,
        eventId: eventId,
        isCompleted: false,
      };

      if (speakerId) {
        sessionWhereCondition.speakerId = speakerId;
      } else {
        sessionWhereCondition.speakerId = null;
      }

      console.log(
        '🔍 Searching existing session with conditions:',
        sessionWhereCondition,
      );

      let existingSession = await this.userPollSessionRepository.findOne({
        where: sessionWhereCondition,
      });

      console.log('📋 Existing session found:', existingSession ? 'Yes' : 'No');

      if (existingSession) {
        // Get current question with timer info
        const currentPoll = polls[existingSession.currentQuestionIndex];
        const totalVotes = currentPoll.options.reduce(
          (sum, opt) => sum + opt.voteCount,
          0,
        );

        // Get all votes for current poll with user details
        const allVotes = await this.pollVoteRepository.find({
          where: { pollId: currentPoll.id },
          relations: ['user', 'option'],
        });

        // Get current user's vote for this poll
        const currentUserVote = allVotes.find(vote => vote.userId === userId);

        // Calculate time remaining
        let timeRemaining = 0;
        let isTimerExpired = false;

        if (existingSession.currentQuestionStartTime && existingSession.currentQuestionTimer) {
          const elapsedSeconds = Math.floor(
            (new Date().getTime() - existingSession.currentQuestionStartTime.getTime()) /
              1000,
          );
          timeRemaining = Math.max(
            0,
            existingSession.currentQuestionTimer - elapsedSeconds,
          );
          isTimerExpired = timeRemaining <= 0;
        }

        // If timer expired, auto-advance to next question
        if (isTimerExpired && !existingSession.isTimerExpired) {
          existingSession.isTimerExpired = true;
          await this.userPollSessionRepository.save(existingSession);

          // Auto-advance to next question
          return await this.advanceToNextQuestion(existingSession.id, userId);
        }

        console.log('🎯 Current question:', {
          id: currentPoll.id,
          question: currentPoll.question,
          timerSeconds: currentPoll.timerSeconds,
          totalOptions: currentPoll.options.length,
        });

        return {
          sessionId: existingSession.id,
          currentQuestion: {
            id: currentPoll.id,
            question: currentPoll.question,
            timerSeconds: currentPoll.timerSeconds,
            timeRemaining: timeRemaining,
            options: currentPoll.options.map((option) => ({
              id: option.id,
              optionText: option.optionText,
              voteCount: option.voteCount,
              percentage:
                totalVotes > 0
                  ? Math.round((option.voteCount / totalVotes) * 100)
                  : 0,
              isUserSelected: currentUserVote?.optionId === option.id,
            })),
          },
          sessionInfo: {
            currentQuestionIndex: existingSession.currentQuestionIndex,
            totalQuestions: existingSession.totalQuestions,
            answeredQuestions: existingSession.answeredQuestions,
            isCompleted: existingSession.isCompleted,
          },
          // Add all votes information
          allVotes: allVotes.map(vote => ({
            userId: vote.userId,
            optionId: vote.optionId,
            votedAt: vote.createdAt,
            user: vote.user ? {
              id: vote.user.id,
              firstName: vote.user.firstName,
              lastName: vote.user.lastName,
              email: vote.user.email,
              mobile: vote.user.mobile,
              fullName: `${vote.user.firstName} ${vote.user.lastName}`.trim(),
            } : null,
            selectedOption: vote.option ? {
              id: vote.option.id,
              optionText: vote.option.optionText,
            } : null,
            isCurrentUser: vote.userId === userId,
          })),
          currentUserVote: currentUserVote ? {
            optionId: currentUserVote.optionId,
            votedAt: currentUserVote.createdAt,
            selectedOption: currentUserVote.option ? {
              id: currentUserVote.option.id,
              optionText: currentUserVote.option.optionText,
            } : null,
          } : null,
          voteSummary: {
            totalVotes: allVotes.length,
            totalVoters: new Set(allVotes.map(v => v.userId)).size,
            currentUserHasVoted: !!currentUserVote,
          },
        };
      } else {
        // Create new session
        const session = new UserPollSession();
        session.userId = userId;
        session.eventId = eventId;
        session.speakerId = speakerId;
        session.currentQuestionIndex = 1;
        session.totalQuestions = polls.length;
        session.answeredQuestions = 0;
        session.isCompleted = false;
        session.currentQuestionStartTime = new Date();
        session.currentQuestionTimer = polls[0].timerSeconds;
        session.isTimerExpired = false;

        existingSession = await this.userPollSessionRepository.save(session);
        console.log('✅ Created new session');
      }

      // Get current question with timer info
      const currentPoll = polls[0];
      const totalVotes = currentPoll.options.reduce(
        (sum, opt) => sum + opt.voteCount,
        0,
      );

      // Get all votes for current poll with user details
      const allVotes = await this.pollVoteRepository.find({
        where: { pollId: currentPoll.id },
        relations: ['user', 'option'],
      });

      // Get current user's vote for this poll
      const currentUserVote = allVotes.find(vote => vote.userId === userId);

      console.log('🎯 Current question:', {
        id: currentPoll.id,
        question: currentPoll.question,
        timerSeconds: currentPoll.timerSeconds,
        totalOptions: currentPoll.options.length,
      });

      return {
        sessionId: existingSession.id,
        currentQuestion: {
          id: currentPoll.id,
          question: currentPoll.question,
          timerSeconds: currentPoll.timerSeconds,
          timeRemaining: currentPoll.timerSeconds,
          options: currentPoll.options.map((option) => ({
            id: option.id,
            optionText: option.optionText,
            voteCount: option.voteCount,
            percentage:
              totalVotes > 0
                ? Math.round((option.voteCount / totalVotes) * 100)
                : 0,
            isUserSelected: currentUserVote?.optionId === option.id,
          })),
        },
        sessionInfo: {
          currentQuestionIndex: existingSession.currentQuestionIndex,
          totalQuestions: existingSession.totalQuestions,
          answeredQuestions: existingSession.answeredQuestions,
          isCompleted: existingSession.isCompleted,
        },
        // Add all votes information
        allVotes: allVotes.map(vote => ({
          userId: vote.userId,
          optionId: vote.optionId,
          votedAt: vote.createdAt,
          user: vote.user ? {
            id: vote.user.id,
            firstName: vote.user.firstName,
            lastName: vote.user.lastName,
            email: vote.user.email,
            mobile: vote.user.mobile,
            fullName: `${vote.user.firstName} ${vote.user.lastName}`.trim(),
          } : null,
          selectedOption: vote.option ? {
            id: vote.option.id,
            optionText: vote.option.optionText,
          } : null,
          isCurrentUser: vote.userId === userId,
        })),
        currentUserVote: currentUserVote ? {
          optionId: currentUserVote.optionId,
          votedAt: currentUserVote.createdAt,
          selectedOption: currentUserVote.option ? {
            id: currentUserVote.option.id,
            optionText: currentUserVote.option.optionText,
          } : null,
        } : null,
        voteSummary: {
          totalVotes: allVotes.length,
          totalVoters: new Set(allVotes.map(v => v.userId)).size,
          currentUserHasVoted: !!currentUserVote,
        },
      };
    } catch (error: any) {
      console.error('❌ Error in getOrCreateSession:', error.message);
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get or create session');
      this.errorHandler.handleDatabaseError(error, 'Session retrieval');
    }
  }

  // New method to get completed session results
  private async getCompletedSessionResults(sessionId: string, userId: string) {
    try {
      const session = await this.userPollSessionRepository.findOne({
        where: { id: sessionId, userId: userId },
        relations: ['event', 'speaker'],
      });

      if (!session) {
        throw new ResourceNotFoundException('Poll Session');
      }

      // Get all user votes for this session
      const userVotes = await this.userPollVoteRepository.find({
        where: { sessionId: sessionId },
        relations: ['poll', 'option'],
      });

      // Get all polls for this session to show results
      const whereCondition: any = {
        eventId: session.eventId,
        isActive: true,
        isLive: true,
      };

      if (session.speakerId) {
        whereCondition.speakerId = session.speakerId;
      }

      const polls = await this.pollRepository.find({
        where: whereCondition,
        relations: ['options'],
        order: { createdAt: 'ASC' },
      });

      const sessionResults = polls.map((poll) => {
        const userVote = userVotes.find((vote) => vote.pollId === poll.id);
        const totalVotes = poll.options.reduce(
          (sum, opt) => sum + opt.voteCount,
          0,
        );

        return {
          id: poll.id,
          question: poll.question,

          userAnswer: userVote
            ? {
                optionId: userVote.optionId,
                optionText: userVote.option?.optionText,
                isCorrect: false, // You can add logic to determine if answer is correct
              }
            : null,
          options: poll.options.map((option) => ({
            id: option.id,
            optionText: option.optionText,
            voteCount: option.voteCount,
            percentage:
              totalVotes > 0
                ? Math.round((option.voteCount / totalVotes) * 100)
                : 0,
            isUserSelected: userVote?.optionId === option.id,
          })),
          totalVotes: totalVotes,
        };
      });

      return {
        isCompleted: true,
        message: 'Session already completed. Here are your results:',
        sessionInfo: {
          totalQuestions: session.totalQuestions,
          answeredQuestions: session.answeredQuestions,
          completedAt: session.completedAt,
          score: `${session.answeredQuestions}/${session.totalQuestions}`,
        },
        results: sessionResults,
        event: session.event
          ? {
              id: session.event.id,
              name: session.event.name,
            }
          : null,
        speaker: session.speaker
          ? {
              id: session.speaker.id,
              name: session.speaker.name,
              email: session.speaker.email,
            }
          : null,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get completed session results');
      throw error;
    }
  }

  // Submit Answer and Advance to Next Question - Updated to auto-find session
  async submitAnswerAndAdvance(
    userId: string,
    eventId: string,
    speakerId: string,
    pollId: string,
    optionId: string,
  ) {
    try {
      // Find user's active session for this event and speaker
      const sessionWhereCondition: any = {
        userId: userId,
        eventId: eventId,
        isCompleted: false,
      };

      if (speakerId) {
        sessionWhereCondition.speakerId = speakerId;
      } else {
        sessionWhereCondition.speakerId = null;
      }

      const session = await this.userPollSessionRepository.findOne({
        where: sessionWhereCondition,
      });

      if (!session) {
        throw new ValidationException('No active session found for this event and speaker');
      }

      // Validate that session speakerId matches the provided speakerId
      if (session.speakerId !== speakerId) {
        throw new ValidationException(
          'Session speakerId does not match the provided speakerId',
        );
      }

      if (session.isCompleted) {
        throw new ValidationException('Poll session already completed');
      }

      // Validate poll and option
      const poll = await this.pollRepository.findOne({
        where: { id: pollId },
        relations: ['options'],
      });

      if (!poll) {
        throw new ResourceNotFoundException('Poll', pollId);
      }

      const option = poll.options.find((opt) => opt.id === optionId);
      if (!option) {
        throw new ValidationException('Invalid option selected');
      }

      // Check if timer expired
      if (session.currentQuestionStartTime && session.currentQuestionTimer) {
        const elapsedSeconds = Math.floor(
          (new Date().getTime() - session.currentQuestionStartTime.getTime()) /
            1000,
        );
        const timeRemaining = Math.max(
          0,
          session.currentQuestionTimer - elapsedSeconds,
        );

        if (timeRemaining <= 0) {
          throw new ValidationException('Time expired for this question');
        }
      }

      // Save vote
      const vote = new UserPollVote();
      vote.sessionId = session.id;
      vote.pollId = pollId;
      vote.optionId = optionId;
      await this.userPollVoteRepository.save(vote);

      // Update poll option vote count
      option.voteCount += 1;
      await this.pollOptionRepository.save(option);

      // Advance to next question
      return await this.advanceToNextQuestion(session.id, userId);
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Submit answer and advance');
      this.errorHandler.handleDatabaseError(error, 'Answer submission');
    }
  }

  // Advance to Next Question (Internal method)
  private async advanceToNextQuestion(sessionId: string, userId: string) {
    const session = await this.userPollSessionRepository.findOne({
      where: { id: sessionId, userId: userId },
    });

    if (!session) {
      throw new ResourceNotFoundException('Poll Session', sessionId);
    }

    // Update session
    session.currentQuestionIndex += 1;
    session.answeredQuestions += 1;

    // Get all polls for this session
    const whereCondition: any = {
      eventId: session.eventId,
      isActive: true,
      isLive: true,
    };

    if (session.speakerId) {
      whereCondition.speakerId = session.speakerId;
    }

    const polls = await this.pollRepository.find({
      where: whereCondition,
      relations: ['options'],
      order: { createdAt: 'ASC' },
    });

    if (session.currentQuestionIndex >= polls.length) {
      // Session completed
      session.isCompleted = true;
      session.completedAt = new Date();
      await this.userPollSessionRepository.save(session);

      return {
        isCompleted: true,
        message: 'Poll session completed',
        sessionInfo: {
          totalQuestions: session.totalQuestions,
          answeredQuestions: session.answeredQuestions,
          completedAt: session.completedAt,
        },
      };
    }

    // Set up next question
    const nextPoll = polls[session.currentQuestionIndex];
    session.currentQuestionStartTime = new Date();
    session.currentQuestionTimer = nextPoll.timerSeconds;
    session.isTimerExpired = false;
    await this.userPollSessionRepository.save(session);

    const totalVotes = nextPoll.options.reduce(
      (sum, opt) => sum + opt.voteCount,
      0,
    );

    return {
      isCompleted: false,
      currentQuestion: {
        id: nextPoll.id,
        question: nextPoll.question,

        timerSeconds: nextPoll.timerSeconds,
        timeRemaining: nextPoll.timerSeconds,
        options: nextPoll.options.map((option) => ({
          id: option.id,
          optionText: option.optionText,
          voteCount: option.voteCount,
          percentage:
            totalVotes > 0
              ? Math.round((option.voteCount / totalVotes) * 100)
              : 0,
        })),
      },
      sessionInfo: {
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        answeredQuestions: session.answeredQuestions,
        isCompleted: session.isCompleted,
      },
    };
  }

  // Get All Questions List - Updated to show one event with multiple questions
  async getAllQuestionsList(
    eventId?: string,
    speakerId?: string, // Add speakerId parameter
    isAdmin: boolean = false,
  ) {
    try {
      if (!eventId && !speakerId) {
        throw new ValidationException(
          'Either eventId or speakerId must be provided to retrieve polling questions',
        );
      }

      const whereCondition: any = {
        isActive: true,
        // isLive: true,
      };

      if (eventId) whereCondition.eventId = eventId;
      if (speakerId) whereCondition.speakerId = speakerId; // Add speaker filtering

      // Debug logging
      console.log('Searching polls with conditions:', whereCondition);

      const polls = await this.pollRepository.find({
        where: whereCondition,
        relations: ['options', 'event', 'speaker'], // Add speaker relation
      });

      // Get all votes for these polls if admin
      let allVotes: PollVote[] = [];
      if (isAdmin && polls.length > 0) {
        const pollIds = polls.map((poll) => poll.id);
        allVotes = await this.pollVoteRepository.find({
          where: {
            pollId: In(pollIds),
          },
          relations: ['user'],
        });
      }

      // Group polls by event and speaker
      const groupedByEventAndSpeaker = polls.reduce(
        (acc: Record<string, any>, poll) => {
          const eventKey = poll.eventId || 'no-event';
          const speakerKey = poll.speakerId || 'no-speaker';
          const groupKey = `${eventKey}-${speakerKey}`;

          if (!acc[groupKey]) {
            acc[groupKey] = {
              event: poll.event
                ? {
                    id: poll.event.id,
                    name: poll.event.name,
                  }
                : null,
              speaker: poll.speaker
                ? {
                    id: poll.speaker.id,
                    name: poll.speaker.name,
                    email: poll.speaker.email,
                  }
                : null,
              questions: [],
            };
          }

          const totalVotes = poll.options.reduce(
            (sum, opt) => sum + opt.voteCount,
            0,
          );
          const pollVotes = isAdmin
            ? allVotes.filter((vote) => vote.pollId === poll.id)
            : [];

          const questionData = {
            id: poll.id,
            question: poll.question,

            totalVotes: totalVotes,
            totalVoters: isAdmin ? pollVotes.length : 0,
            options: poll.options.map((option) => ({
              id: option.id,
              optionText: option.optionText,
              voteCount: option.voteCount,
              percentage:
                totalVotes > 0
                  ? Math.round((option.voteCount / totalVotes) * 100)
                  : 0,
              voters: isAdmin
                ? pollVotes
                    .filter((vote) => vote.optionId === option.id)
                    .map((vote) => ({
                      userId: vote.userId,
                      user: vote.user
                        ? {
                            id: vote.user.id,
                            firstName: vote.user.firstName,
                            lastName: vote.user.lastName,
                            email: vote.user.email,
                            mobile: vote.user.mobile,
                            fullName:
                              `${vote.user.firstName} ${vote.user.lastName}`.trim(),
                          }
                        : null,
                      votedAt: vote.createdAt,
                    }))
                : [],
            })),
            createdAt: poll.createdAt,
          };

          acc[groupKey].questions.push(questionData);
          return acc;
        },
        {} as Record<string, any>,
      );

      // Convert to array format - each event-speaker group with its questions
      const data = Object.values(groupedByEventAndSpeaker).map(
        (group: any) => ({
          event: group.event,
          speaker: group.speaker,
          questions: group.questions,
        }),
      );

      // Return the formatted response
      return {
        success: true,
        message: 'Questions list retrieved successfully',
        data: data,
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all questions list');
      return {
        success: false,
        message: 'Failed to retrieve questions list',
        data: [],
        metadata: {
          total: 0,
          eventId: eventId || null,
          isAdmin: isAdmin,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Submit Vote Answer - Updated with proper vote count logic
  async submitVoteAnswer(voteDto: VoteDto, userId: string) {
    try {
      // Get poll with event relation
      const poll = await this.pollRepository.findOne({
        where: {
          id: voteDto.pollId,
          isActive: true,
          // isLive: true,
        },
        relations: ['options', 'event'],
      });

      if (!poll) {
        throw new ResourceNotFoundException('Live Poll', voteDto.pollId);
      }

      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: voteDto.speakerId },
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', voteDto.speakerId);
      }

      // Get event details
      const event = await this.eventRepository.findOne({
        where: { id: poll.eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', poll.eventId);
      }

      // Check if option exists
      const option = poll.options.find((opt) => opt.id === voteDto.optionId);
      if (!option) {
        throw new ValidationException('Invalid option selected');
      }

      // Check if user already voted for this poll AND same speaker
      const existingVote = await this.pollVoteRepository.findOne({
        where: {
          pollId: voteDto.pollId,
          userId: userId,
          speakerId: voteDto.speakerId, // Only check for same speaker
        },
      });

      let isVoteModified = false;
      let previousOptionId = null;
      let isNewVote = false;

      if (existingVote) {
        // Same speaker + same question = UPDATE vote count
        isVoteModified = true;
        previousOptionId = existingVote.optionId;

        // Decrease vote count from previous option
        const previousOption = poll.options.find(
          (opt) => opt.id === existingVote.optionId,
        );
        if (previousOption) {
          previousOption.voteCount = Math.max(0, previousOption.voteCount - 1);
          await this.pollOptionRepository.save(previousOption);
        }

        // Update existing vote
        existingVote.optionId = voteDto.optionId;
        existingVote.updatedAt = new Date();
        await this.pollVoteRepository.save(existingVote);
      } else {
        // Different speaker OR new vote = CREATE new vote (don't affect previous counts)
        isNewVote = true;

        // Create new vote
        const vote = new PollVote();
        vote.pollId = voteDto.pollId;
        vote.optionId = voteDto.optionId;
        vote.userId = userId;
        vote.speakerId = voteDto.speakerId;
        await this.pollVoteRepository.save(vote);
      }

      // Increment vote count for new option
      option.voteCount += 1;
      await this.pollOptionRepository.save(option);

      // Get updated poll with results
      const updatedPoll = await this.pollRepository.findOne({
        where: { id: voteDto.pollId },
        relations: ['options'],
      });

      if (!updatedPoll) {
        throw new ResourceNotFoundException('Poll', voteDto.pollId);
      }

      const totalVotes = updatedPoll.options.reduce(
        (sum, opt) => sum + opt.voteCount,
        0,
      );

      // Get user details
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      // Determine message based on vote type
      let message = 'Vote submitted successfully';
      if (isVoteModified) {
        message = 'Vote updated successfully for same speaker';
      } else if (isNewVote) {
        message = 'New vote submitted';
      }

      return {
        success: true,
        message: message,
        poll: {
          id: updatedPoll.id,
          question: updatedPoll.question,
          totalVotes: totalVotes,
          speakerId: voteDto.speakerId,
          eventId: poll.eventId,
          options: updatedPoll.options.map((opt) => {
            const percentage =
              totalVotes > 0
                ? Math.round((opt.voteCount / totalVotes) * 100)
                : 0;
            return {
              id: opt.id,
              optionText: opt.optionText,
              voteCount: opt.voteCount,
              percentage: percentage,
            };
          }),
        },
        userVote: {
          userId: userId,
          optionId: voteDto.optionId,
          speakerId: voteDto.speakerId,
          eventId: poll.eventId,
          isModified: isVoteModified,
          isNewVote: isNewVote,
          previousOptionId: previousOptionId,
          votedAt: existingVote ? existingVote.updatedAt : new Date(),
          user: user
            ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobile: user.mobile,
                fullName: `${user.firstName} ${user.lastName}`.trim(),
              }
            : null,
        },
        event: {
          id: event.id,
          name: event.name,
          // Add other event fields as needed
        },
        speaker: {
          id: speaker.id,
          name: speaker.name,
          email: speaker.email,
        },
        voteDetails: {
          selectedOption: option.optionText,
          pollQuestion: updatedPoll.question,
          eventName: event.name,
          speakerName: speaker.name,
          voteType: isVoteModified ? 'updated' : 'new',
        },
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Submit vote answer');
      this.errorHandler.handleDatabaseError(error, 'Vote submission');
    }
  }
  //test
  // Get User's Vote for a Poll with User Details
  async getUserVote(pollId: string, userId: string) {
    try {
      const vote = await this.pollVoteRepository.findOne({
        where: {
          pollId: pollId,
          userId: userId,
        },
      });

      if (!vote) {
        return {
          hasVoted: false,
          userVote: null,
        };
      }

      // Get user details
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      return {
        hasVoted: true,
        userVote: {
          userId: vote.userId,
          optionId: vote.optionId,
          votedAt: vote.createdAt,
          updatedAt: vote.updatedAt,
          user: user
            ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobile: user.mobile,
                fullName: `${user.firstName} ${user.lastName}`.trim(),
              }
            : null,
        },
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get user vote');
      return {
        hasVoted: false,
        userVote: null,
      };
    }
  }

  // Get Poll by ID
  async getPollById(id: string) {
    try {
      const poll = await this.pollRepository.findOne({
        where: { id },
        relations: ['options', 'event', 'speaker', 'createdBy'],
      });

      if (!poll) {
        throw new ResourceNotFoundException('Poll', id);
      }

      const totalVotes = poll.options.reduce(
        (sum, opt) => sum + opt.voteCount,
        0,
      );

      return {
        event: poll.event
          ? {
              id: poll.event.id,
              name: poll.event.name,
            }
          : null,
        speaker: poll.speaker
          ? {
              // Add speaker information
              id: poll.speaker.id,
              name: poll.speaker.name,
              email: poll.speaker.email,
            }
          : null,
        createdBy: poll.createdBy
          ? {
              id: poll.createdBy.id,
              name: `${poll.createdBy.firstName} ${poll.createdBy.lastName}`,
            }
          : null,
        question: {
          id: poll.id,
          question: poll.question,

          isActive: poll.isActive,
          isLive: poll.isLive,
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt,
          options: poll.options.map((option) => {
            const percentage =
              totalVotes > 0
                ? Math.round((option.voteCount / totalVotes) * 100)
                : 0;
            return {
              id: option.id,
              optionText: option.optionText,
              voteCount: option.voteCount,
              percentage: percentage,
            };
          }),
        },

        totalVotes: totalVotes,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get poll by ID');
      this.errorHandler.handleDatabaseError(error, 'Poll retrieval');
    }
  }

  // Get All Polls (Admin)
  async getAllPolls(eventId?: string, speakerId?: string) {
    try {
      const whereConditions: any = {};

      if (eventId) whereConditions.eventId = eventId;
      if (speakerId) whereConditions.speakerId = speakerId;

      const polls = await this.pollRepository.find({
        where: whereConditions,
        relations: ['options', 'event', 'speaker', 'createdBy'],
      });

      return polls.map((poll) => {
        const totalVotes = poll.options.reduce(
          (sum, option) => sum + option.voteCount,
          0,
        );

        return {
          id: poll.id,
          question: poll.question,

          isActive: poll.isActive,
          isLive: poll.isLive,
          createdAt: poll.createdAt,
          event: poll.event
            ? {
                id: poll.event.id,
                name: poll.event.name,
              }
            : null,

          createdBy: poll.createdBy
            ? {
                id: poll.createdBy.id,
                name: `${poll.createdBy.firstName} ${poll.createdBy.lastName}`,
              }
            : null,
          options: poll.options.map((option) => {
            const percentage =
              totalVotes > 0
                ? Math.round((option.voteCount / totalVotes) * 100)
                : 0;
            return {
              id: option.id,
              optionText: option.optionText,
              voteCount: option.voteCount,
              percentage: percentage,
            };
          }),
          totalVotes: totalVotes,
        };
      });
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all polls');
      return [];
    }
  }

  // Toggle Poll Live Status (Admin)
  async togglePollLive(pollId: string) {
    try {
      const poll = await this.pollRepository.findOne({
        where: { id: pollId },
      });

      if (!poll) {
        throw new ResourceNotFoundException('Poll', pollId);
      }

      poll.isLive = !poll.isLive;
      await this.pollRepository.save(poll);

      return {
        id: poll.id,
        isLive: poll.isLive,
        message: poll.isLive ? 'Poll is now live' : 'Poll is no longer live',
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Toggle poll live status');
      this.errorHandler.handleDatabaseError(error, 'Poll status toggle');
    }
  }

  // Update Poll (Admin)
  async updatePoll(id: string, updateDto: UpdatePollDto) {
    try {
      const poll = await this.pollRepository.findOne({
        where: { id },
      });

      if (!poll) {
        throw new ResourceNotFoundException('Poll', id);
      }

      Object.assign(poll, updateDto);
      const savedPoll = await this.pollRepository.save(poll);

      return savedPoll;
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Update poll');
      this.errorHandler.handleDatabaseError(error, 'Poll update');
    }
  }

  // Delete Poll (Admin)
  async deletePoll(id: string) {
    try {
      const poll = await this.pollRepository.findOne({
        where: { id },
      });

      if (!poll) {
        throw new ResourceNotFoundException('Poll', id);
      }

      await this.pollRepository.remove(poll);

      return { message: 'Poll deleted successfully' };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Delete poll');
      this.errorHandler.handleDatabaseError(error, 'Poll deletion');
    }
  }

  // Get All Votes by Event ID - Enhanced with better vote display
  async getAllVotesByEventId(eventId: string, isAdmin: boolean = false) {
    try {
      // Get all polls for this event
      const polls = await this.pollRepository.find({
        where: {
          eventId: eventId,
          isActive: true,
        },
        relations: ['options', 'event'],
      });

      if (polls.length === 0) {
        return {
          success: true,
          message: 'No polls found for this event',
          data: [],
          metadata: {
            eventId: eventId,
            totalPolls: 0,
            totalVotes: 0,
            isAdmin: isAdmin,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Get all votes for these polls with speaker information
      const pollIds = polls.map((poll) => poll.id);
      const allVotes = await this.pollVoteRepository.find({
        where: {
          pollId: In(pollIds),
        },
        relations: ['user', 'poll', 'option'],
      });

      // Get event details
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      // Get all speakers involved in votes
      const speakerIds = [
        ...new Set(allVotes.map((vote) => vote.speakerId).filter(Boolean)),
      ];
      const speakers = await this.speakerRepository.find({
        where: { id: In(speakerIds) },
      });

      // Group votes by poll with detailed information
      const pollsWithVotes = polls.map((poll) => {
        const pollVotes = allVotes.filter((vote) => vote.pollId === poll.id);
        const totalVotes = poll.options.reduce(
          (sum, opt) => sum + opt.voteCount,
          0,
        );

        // Group votes by speaker
        const votesBySpeaker = pollVotes.reduce(
          (acc: Record<string, any[]>, vote) => {
            const speakerId = vote.speakerId || 'unknown';
            if (!acc[speakerId]) {
              acc[speakerId] = [];
            }
            acc[speakerId].push(vote);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        return {
          id: poll.id,
          question: poll.question,

          totalVotes: totalVotes,
          totalVoters: pollVotes.length,
          createdAt: poll.createdAt,
          options: poll.options.map((option) => {
            const optionVotes = pollVotes.filter(
              (vote) => vote.optionId === option.id,
            );
            const percentage =
              totalVotes > 0
                ? Math.round((option.voteCount / totalVotes) * 100)
                : 0;

            return {
              id: option.id,
              optionText: option.optionText,
              voteCount: option.voteCount,
              percentage: percentage,
              progressBar: {
                width: `${percentage}%`,
                backgroundColor: this.getProgressBarColor(percentage),
              },
              voters: isAdmin
                ? optionVotes.map((vote) => {
                    const speaker = speakers.find(
                      (s) => s.id === vote.speakerId,
                    );
                    return {
                      userId: vote.userId,
                      speakerId: vote.speakerId,
                      speaker: speaker
                        ? {
                            id: speaker.id,
                            name: speaker.name,
                            email: speaker.email,
                          }
                        : null,
                      user: vote.user
                        ? {
                            id: vote.user.id,
                            firstName: vote.user.firstName,
                            lastName: vote.user.lastName,
                            email: vote.user.email,
                            mobile: vote.user.mobile,
                            fullName:
                              `${vote.user.firstName} ${vote.user.lastName}`.trim(),
                          }
                        : null,
                      votedAt: vote.createdAt,
                      selectedOption: vote.option
                        ? {
                            id: vote.option.id,
                            optionText: vote.option.optionText,
                          }
                        : null,
                    };
                  })
                : [],
            };
          }),
          votesBySpeaker: isAdmin
            ? Object.keys(votesBySpeaker).map((speakerId) => {
                const speaker = speakers.find((s) => s.id === speakerId);
                const speakerVotes = votesBySpeaker[speakerId];

                return {
                  speaker: speaker
                    ? {
                        id: speaker.id,
                        name: speaker.name,
                        email: speaker.email,
                      }
                    : { id: speakerId, name: 'Unknown Speaker' },
                  votes: speakerVotes.map((vote: any) => ({
                    userId: vote.userId,
                    user: vote.user
                      ? {
                          id: vote.user.id,
                          firstName: vote.user.firstName,
                          lastName: vote.user.lastName,
                          email: vote.user.email,
                          mobile: vote.user.mobile,
                          fullName:
                            `${vote.user.firstName} ${vote.user.lastName}`.trim(),
                        }
                      : null,
                    optionId: vote.optionId,
                    selectedOption: vote.option
                      ? {
                          id: vote.option.id,
                          optionText: vote.option.optionText,
                        }
                      : null,
                    votedAt: vote.createdAt,
                    updatedAt: vote.updatedAt,
                  })),
                  totalVotesBySpeaker: speakerVotes.length,
                };
              })
            : [],
          allVotes: isAdmin
            ? pollVotes.map((vote) => {
                const speaker = speakers.find((s) => s.id === vote.speakerId);
                return {
                  userId: vote.userId,
                  speakerId: vote.speakerId,
                  optionId: vote.optionId,
                  votedAt: vote.createdAt,
                  updatedAt: vote.updatedAt,
                  user: vote.user
                    ? {
                        id: vote.user.id,
                        firstName: vote.user.firstName,
                        lastName: vote.user.lastName,
                        email: vote.user.email,
                        mobile: vote.user.mobile,
                        fullName:
                          `${vote.user.firstName} ${vote.user.lastName}`.trim(),
                      }
                    : null,
                  speaker: speaker
                    ? {
                        id: speaker.id,
                        name: speaker.name,
                        email: speaker.email,
                      }
                    : null,
                  selectedOption: vote.option
                    ? {
                        id: vote.option.id,
                        optionText: vote.option.optionText,
                      }
                    : null,
                };
              })
            : [],
        };
      });

      // Create summary by user and speaker
      const userVoteSummary = isAdmin
        ? allVotes.reduce(
            (acc: Record<string, any>, vote) => {
              const key = `${vote.userId}-${vote.speakerId}`;
              if (!acc[key]) {
                const foundSpeaker = speakers.find(
                  (s) => s.id === vote.speakerId,
                );
                acc[key] = {
                  userId: vote.userId,
                  speakerId: vote.speakerId,
                  user: vote.user
                    ? {
                        id: vote.user.id,
                        firstName: vote.user.firstName,
                        lastName: vote.user.lastName,
                        email: vote.user.email,
                        mobile: vote.user.mobile,
                        fullName:
                          `${vote.user.firstName} ${vote.user.lastName}`.trim(),
                      }
                    : null,
                  speaker: foundSpeaker
                    ? {
                        id: foundSpeaker.id,
                        name: foundSpeaker.name,
                        email: foundSpeaker.email,
                      }
                    : null,
                  votes: [],
                };
              }
              acc[key].votes.push({
                pollId: vote.pollId,
                question: vote.poll?.question,
                optionId: vote.optionId,
                selectedOption: vote.option
                  ? {
                      id: vote.option.id,
                      optionText: vote.option.optionText,
                    }
                  : null,
                votedAt: vote.createdAt,
              });
              return acc;
            },
            {} as Record<string, any>,
          )
        : {};

      return {
        success: true,
        message: 'Votes retrieved successfully',
        data: {
          event: event
            ? {
                id: event.id,
                name: event.name,
              }
            : null,
          polls: pollsWithVotes,
          userVoteSummary: isAdmin ? Object.values(userVoteSummary) : [],
          summary: {
            totalPolls: polls.length,
            totalVotes: allVotes.length,
            uniqueVoters: new Set(allVotes.map((vote) => vote.userId)).size,
            uniqueSpeakers: speakers.length,
            speakers: speakers.map((speaker) => ({
              id: speaker.id,
              name: speaker.name,
              email: speaker.email,
            })),
          },
        },
        metadata: {
          eventId: eventId,
          totalPolls: polls.length,
          totalVotes: allVotes.length,
          isAdmin: isAdmin,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all votes by event ID');
      return {
        success: false,
        message: 'Failed to retrieve votes',
        data: [],
        metadata: {
          eventId: eventId,
          totalPolls: 0,
          totalVotes: 0,
          isAdmin: isAdmin,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Helper method to get progress bar color based on percentage
  private getProgressBarColor(percentage: number): string {
    if (percentage >= 70) return '#28a745'; // Green for high percentage
    if (percentage >= 40) return '#ffc107'; // Yellow for medium percentage
    if (percentage >= 20) return '#fd7e14'; // Orange for low percentage
    return '#dc3545'; // Red for very low percentage
  }

}
