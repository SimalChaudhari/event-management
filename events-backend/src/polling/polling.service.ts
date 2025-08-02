// src/polling/polling.service.ts
import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm'; // Add In import
import { InjectRepository } from '@nestjs/typeorm';
import { Poll, PollOption, PollVote } from './polling.entity';
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

      // Create poll
      const poll = new Poll();
      poll.question = createDto.question;
      poll.description = createDto.description;
      poll.eventId = createDto.eventId
      poll.createdById = createdById;

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

  // Get All Questions List - Updated to show one event with multiple questions
  async getAllQuestionsList(
    eventId?: string,
    isAdmin: boolean = false,
  ) {
    try {
      const whereCondition: any = {
        isActive: true,
        // isLive: true,
      };

      if (eventId) whereCondition.eventId = eventId;

      // Debug logging
      console.log('Searching polls with conditions:', whereCondition);

      const polls = await this.pollRepository.find({
        where: whereCondition,
        relations: ['options', 'event']
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

      // Group polls by event
      const groupedByEvent = polls.reduce((acc: Record<string, any>, poll) => {
        const eventKey = poll.eventId || 'no-event';
        
        if (!acc[eventKey]) {
          acc[eventKey] = {
            event: poll.event
              ? {
                  id: poll.event.id,
                  name: poll.event.name,
                }
              : null,
            questions: []
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
          description: poll.description,
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

        acc[eventKey].questions.push(questionData);
        return acc;
      }, {} as Record<string, any>);

      // Convert to array format - each event with its questions
      const data = Object.values(groupedByEvent).map((group: any) => ({
        event: group.event,
        questions: group.questions
      }));

      // Return the formatted response
      return {
        success: true,
        message: "Questions list retrieved successfully",
        data: data,
     
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all questions list');
      return {
        success: false,
        message: "Failed to retrieve questions list",
        data: [],
        metadata: {
          total: 0,
          eventId: eventId || null,
          isAdmin: isAdmin,
          timestamp: new Date().toISOString(),
        }
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
        id: poll.id,
        question: poll.question,
        description: poll.description,
        eventId: poll.eventId,
       
        isActive: poll.isActive,
        isLive: poll.isLive,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
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
          description: poll.description,
        
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



  // Get All Votes by Event ID - Enhanced with detailed user, speaker, and question information
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
          message: "No polls found for this event",
          data: [],
          metadata: {
            eventId: eventId,
            totalPolls: 0,
            totalVotes: 0,
            isAdmin: isAdmin,
            timestamp: new Date().toISOString(),
          }
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
      const speakerIds = [...new Set(allVotes.map(vote => vote.speakerId).filter(Boolean))];
      const speakers = await this.speakerRepository.find({
        where: { id: In(speakerIds) },
      });

      // Group votes by poll with detailed information
      const pollsWithVotes = polls.map((poll) => {
        const pollVotes = allVotes.filter((vote) => vote.pollId === poll.id);
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

        // Group votes by speaker
        const votesBySpeaker = pollVotes.reduce((acc: Record<string, any[]>, vote) => {
          const speakerId = vote.speakerId || 'unknown';
          if (!acc[speakerId]) {
            acc[speakerId] = [];
          }
          acc[speakerId].push(vote);
          return acc;
        }, {} as Record<string, any[]>);

        return {
          id: poll.id,
          question: poll.question,
          description: poll.description,
          totalVotes: totalVotes,
          totalVoters: pollVotes.length,
          createdAt: poll.createdAt,
          options: poll.options.map((option) => {
            const optionVotes = pollVotes.filter((vote) => vote.optionId === option.id);
            const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
            
            return {
              id: option.id,
              optionText: option.optionText,
              voteCount: option.voteCount,
              percentage: percentage,
              voters: isAdmin ? optionVotes.map((vote) => {
                const speaker = speakers.find(s => s.id === vote.speakerId);
                return {
                  userId: vote.userId,
                  speakerId: vote.speakerId,
                  speaker: speaker ? {
                    id: speaker.id,
                    name: speaker.name,
                    email: speaker.email,
                  } : null,
                  user: vote.user ? {
                    id: vote.user.id,
                    firstName: vote.user.firstName,
                    lastName: vote.user.lastName,
                    email: vote.user.email,
                    mobile: vote.user.mobile,
                    fullName: `${vote.user.firstName} ${vote.user.lastName}`.trim(),
                  } : null,
                  votedAt: vote.createdAt,
                  selectedOption: vote.option ? {
                    id: vote.option.id,
                    optionText: vote.option.optionText,
                  } : null,
                };
              }) : [],
            };
          }),
          votesBySpeaker: isAdmin ? Object.keys(votesBySpeaker).map(speakerId => {
            const speaker = speakers.find(s => s.id === speakerId);
            const speakerVotes = votesBySpeaker[speakerId];
            
            return {
              speaker: speaker ? {
                id: speaker.id,
                name: speaker.name,
                email: speaker.email,
              } : { id: speakerId, name: 'Unknown Speaker' },
              votes: speakerVotes.map((vote: any) => ({
                userId: vote.userId,
                user: vote.user ? {
                  id: vote.user.id,
                  firstName: vote.user.firstName,
                  lastName: vote.user.lastName,
                  email: vote.user.email,
                  mobile: vote.user.mobile,
                  fullName: `${vote.user.firstName} ${vote.user.lastName}`.trim(),
                } : null,
                optionId: vote.optionId,
                selectedOption: vote.option ? {
                  id: vote.option.id,
                  optionText: vote.option.optionText,
                } : null,
                votedAt: vote.createdAt,
                updatedAt: vote.updatedAt,
              })),
              totalVotesBySpeaker: speakerVotes.length,
            };
          }) : [],
          allVotes: isAdmin ? pollVotes.map((vote) => {
            const speaker = speakers.find(s => s.id === vote.speakerId);
            return {
              userId: vote.userId,
              speakerId: vote.speakerId,
              optionId: vote.optionId,
              votedAt: vote.createdAt,
              updatedAt: vote.updatedAt,
              user: vote.user ? {
                id: vote.user.id,
                firstName: vote.user.firstName,
                lastName: vote.user.lastName,
                email: vote.user.email,
                mobile: vote.user.mobile,
                fullName: `${vote.user.firstName} ${vote.user.lastName}`.trim(),
              } : null,
              speaker: speaker ? {
                id: speaker.id,
                name: speaker.name,
                email: speaker.email,
              } : null,
              selectedOption: vote.option ? {
                id: vote.option.id,
                optionText: vote.option.optionText,
              } : null,
            };
          }) : [],
        };
      });

      // Create summary by user and speaker
      const userVoteSummary = isAdmin ? allVotes.reduce((acc: Record<string, any>, vote) => {
        const key = `${vote.userId}-${vote.speakerId}`;
        if (!acc[key]) {
          const foundSpeaker = speakers.find(s => s.id === vote.speakerId);
          acc[key] = {
            userId: vote.userId,
            speakerId: vote.speakerId,
            user: vote.user ? {
              id: vote.user.id,
              firstName: vote.user.firstName,
              lastName: vote.user.lastName,
              email: vote.user.email,
              mobile: vote.user.mobile,
              fullName: `${vote.user.firstName} ${vote.user.lastName}`.trim(),
            } : null,
            speaker: foundSpeaker ? {
              id: foundSpeaker.id,
              name: foundSpeaker.name,
              email: foundSpeaker.email,
            } : null,
            votes: [],
          };
        }
        acc[key].votes.push({
          pollId: vote.pollId,
          question: vote.poll?.question,
          optionId: vote.optionId,
          selectedOption: vote.option ? {
            id: vote.option.id,
            optionText: vote.option.optionText,
          } : null,
          votedAt: vote.createdAt,
        });
        return acc;
      }, {} as Record<string, any>) : {};

      return {
        success: true,
        message: "Votes retrieved successfully",
        data: {
          event: event ? {
            id: event.id,
            name: event.name,
          } : null,
          polls: pollsWithVotes,
          userVoteSummary: isAdmin ? Object.values(userVoteSummary) : [],
          summary: {
            totalPolls: polls.length,
            totalVotes: allVotes.length,
            uniqueVoters: new Set(allVotes.map(vote => vote.userId)).size,
            uniqueSpeakers: speakers.length,
            speakers: speakers.map(speaker => ({
              id: speaker.id,
              name: speaker.name,
              email: speaker.email,
            })),
          }
        },
        metadata: {
          eventId: eventId,
          totalPolls: polls.length,
          totalVotes: allVotes.length,
          isAdmin: isAdmin,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all votes by event ID');
      return {
        success: false,
        message: "Failed to retrieve votes",
        data: [],
        metadata: {
          eventId: eventId,
          totalPolls: 0,
          totalVotes: 0,
          isAdmin: isAdmin,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }
}
