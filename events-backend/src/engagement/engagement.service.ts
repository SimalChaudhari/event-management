import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Engagement } from './engagement.entity';
import { CreateEngagementDto, UpdateEngagementDto } from './engagement.dto';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { UserUtils } from '../utils/user.utils';
import { EngagementQnaQuestion } from '../engagement-qna/engagement-qna.entity';
import { Poll } from '../polling/polling.entity';
import { EngagementPollingLink } from './engagement-polling.entity';
import { ProgrammeSession } from '../programme/programme-session.entity';

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    @InjectRepository(ProgrammeTrack)
    private programmeTrackRepository: Repository<ProgrammeTrack>,
    @InjectRepository(EngagementQnaQuestion)
    private engagementQnaQuestionRepository: Repository<EngagementQnaQuestion>,
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
    @InjectRepository(EngagementPollingLink)
    private engagementPollingLinkRepository: Repository<EngagementPollingLink>,
    @InjectRepository(ProgrammeSession)
    private programmeSessionRepository: Repository<ProgrammeSession>,
  ) {}

  /**
   * Create a new engagement
   */
  async createEngagement(createEngagementDto: CreateEngagementDto): Promise<Engagement> {
    // Verify that the programme track exists
    const track = await this.programmeTrackRepository.findOne({
      where: { id: createEngagementDto.trackId },
      relations: ['event'],
    });

    if (!track) {
      throw new NotFoundException(`Programme track with ID ${createEngagementDto.trackId} not found`);
    }

    // Check if an engagement already exists for this track
    const existingEngagement = await this.engagementRepository.findOne({
      where: { trackId: createEngagementDto.trackId },
    });

    if (existingEngagement) {
      throw new ConflictException(
        `Engagement already exists for this track.`
      );
    }

    // Validate session IDs (now required)
    if (!createEngagementDto.sessionIds || createEngagementDto.sessionIds.length === 0) {
      throw new NotFoundException('At least one session ID is required');
    }

    const sessions = await this.programmeSessionRepository.find({
      where: { trackId: createEngagementDto.trackId },
    });

    const validSessionIds = sessions.map(s => s.id);
    const invalidSessionIds = createEngagementDto.sessionIds.filter(sessionId => !validSessionIds.includes(sessionId));

    if (invalidSessionIds.length > 0) {
      throw new NotFoundException(
        `One or more sessions not found or do not belong to this track: ${invalidSessionIds.join(', ')}`
      );
    }

    const engagement = this.engagementRepository.create(createEngagementDto);
    return await this.engagementRepository.save(engagement);
  }

  /**
   * Get engagement statistics (questions, votes, sessions)
   */
  private async getEngagementStatistics(engagementId: string): Promise<any> {
    // Get Q&A questions count
    const questionsCount = await this.engagementQnaQuestionRepository.count({
      where: { engagementId, isActive: true }
    });

    // Get answered questions count
    const answeredQuestionsCount = await this.engagementQnaQuestionRepository.count({
      where: { engagementId, isActive: true, status: 'answered' }
    });

    // Get polls count for this engagement's event
    const engagement = await this.engagementRepository.findOne({
      where: { id: engagementId },
      relations: ['track', 'track.event']
    });

    let pollsCount = 0;
    let totalVotesCount = 0;

    if (engagement?.track?.event) {
      pollsCount = await this.pollRepository.count({
        where: { eventId: engagement.track.event.id, isActive: true }
      });

      // Get total votes count for polls in this event
      const polls = await this.pollRepository.find({
        where: { eventId: engagement.track.event.id, isActive: true },
        relations: ['votes']
      });

      totalVotesCount = polls.reduce((total, poll) => total + (poll.votes?.length || 0), 0);
    }

    return {
      questionsCount,
      answeredQuestionsCount,
      unansweredQuestionsCount: questionsCount - answeredQuestionsCount,
      pollsCount,
      totalVotesCount
    };
  }

  /**
   * Get session-specific statistics (questions and votes for each session)
   */
  private async getSessionStatistics(engagementId: string, sessions: any[], selectedSessionIds?: string[]): Promise<any[]> {
    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Filter sessions based on selectedSessionIds if provided
    let filteredSessions = sessions;
    if (selectedSessionIds && selectedSessionIds.length > 0) {
      filteredSessions = sessions.filter(session => selectedSessionIds.includes(session.id));
    }

    // Get all questions for this engagement
    const questions = await this.engagementQnaQuestionRepository.find({
      where: { engagementId, isActive: true },
      relations: ['likes']
    });

    // Get all polls for this engagement's event
    const engagement = await this.engagementRepository.findOne({
      where: { id: engagementId },
      relations: ['track', 'track.event']
    });

    let polls: any[] = [];
    if (engagement?.track?.event) {
      polls = await this.pollRepository.find({
        where: { eventId: engagement.track.event.id, isActive: true },
        relations: ['votes', 'speaker', 'options']
      });
    }

    // Process each session
    return Promise.all(filteredSessions.map(async (session) => {
      // Get session speakers
      const sessionSpeakerIds = session.speakers?.map((speaker: any) => speaker.id) || [];
      
      // Filter questions for this specific session
      const sessionQuestions = questions.filter(q => q.sessionId === session.id);
      const sessionQuestionsCount = sessionQuestions.length;
      const sessionAnsweredQuestionsCount = sessionQuestions.filter(q => q.status === 'answered').length;
      
      // Count polls for this session
      // Show polls linked to session speakers OR polls without a speaker assigned (event-level polls)
      const sessionPolls = polls.filter(poll => 
        !poll.speakerId || sessionSpeakerIds.includes(poll.speakerId)
      );
      
      const sessionPollsCount = sessionPolls.length;
      const sessionVotesCount = sessionPolls.reduce((total, poll) => 
        total + (poll.votes?.length || 0), 0
      );

      const pollingLink = await this.getPollingLinkForSession(session.id);

      return {
        ...session,
        statistics: {
          questionsCount: sessionQuestionsCount,
          answeredQuestionsCount: sessionAnsweredQuestionsCount,
          unansweredQuestionsCount: sessionQuestionsCount - sessionAnsweredQuestionsCount,
          pollsCount: sessionPollsCount,
          totalVotesCount: sessionVotesCount
        },
        questions: sessionQuestions.map(q => ({
          id: q.id,
          question: q.question,
          status: q.status,
          likesCount: q.likesCount,
          isPinned: q.isPinned,
          createdAt: q.createdAt,
          answeredAt: q.answeredAt
        })),
        polls: sessionPolls.map(poll => ({
          id: poll.id,
          question: poll.question,
          isLive: poll.isLive,
          timerSeconds: poll.timerSeconds,
          votesCount: poll.votes?.length || 0,
          options: poll.options?.map((option: any) => ({
            id: option.id,
            optionText: option.optionText,
            voteCount: option.voteCount
          })) || []
        })),
        polling: pollingLink
      };
    }));
  }

  /**
   * Get all engagements with formatted data
   */
  async getAllEngagements(): Promise<any[]> {
    const engagements = await this.engagementRepository.find({
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      order: { createdAt: 'DESC' },
    });

    // Get statistics for each engagement
    const engagementsWithStats = await Promise.all(
      engagements.map(async (engagement) => {
        const statistics = await this.getEngagementStatistics(engagement.id);
        const sessionsWithStats = await this.getSessionStatistics(
          engagement.id, 
          engagement.track?.sessions || [],
          engagement.sessionIds || undefined
        );
        
        return {
          ...engagement,
          statistics,
          track: {
            ...engagement.track,
            sessions: sessionsWithStats
          }
        };
      })
    );

    return UserUtils.formatEngagements(engagementsWithStats);
  }

  /**
   * Get all engagements for a specific event
   * Returns an object instead of array for consistency
   */
  async getEngagementsByEvent(eventId: string): Promise<any> {
    const engagements = await this.engagementRepository.find({
      where: { 
        track: { 
          event: { id: eventId } 
        } 
      },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      order: { createdAt: 'DESC' },
    });

    // Get statistics for each engagement
    const engagementsWithStats = await Promise.all(
      engagements.map(async (engagement) => {
        const statistics = await this.getEngagementStatistics(engagement.id);
        const sessionsWithStats = await this.getSessionStatistics(
          engagement.id, 
          engagement.track?.sessions || [],
          engagement.sessionIds || undefined
        );
        
        return {
          ...engagement,
          statistics,
          track: {
            ...engagement.track,
            sessions: sessionsWithStats
          }
        };
      })
    );

    const formattedArray = UserUtils.formatEngagements(engagementsWithStats);
    
    // Convert array to object (return first element or empty object structure)
    if (formattedArray && formattedArray.length > 0) {
      return formattedArray[0];
    }
    
    // Return empty object structure if no engagements
    return {
      event: null,
      programmeTracks: [],
      statistics: {
        questionsCount: 0,
        answeredQuestionsCount: 0,
        unansweredQuestionsCount: 0,
        pollsCount: 0,
        totalVotesCount: 0
      },
      totalSessionsCount: 0
    };
  }

  /**
   * Get engagement data for moderator with sessionId filter
   */
  async getEngagementForModerator(engagementId: string, sessionId?: string): Promise<any> {
    const engagement = await this.engagementRepository.findOne({
      where: { id: engagementId },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
    });

    if (!engagement) {
      throw new NotFoundException(`Engagement with ID ${engagementId} not found`);
    }

    // Get engagement statistics
    const statistics = await this.getEngagementStatistics(engagementId);

    // Get session-specific data
    let sessionsWithStats;
    if (sessionId) {
      // Filter to specific session only
      // First check if sessionId is in the selected sessionIds (if any)
      if (engagement.sessionIds && engagement.sessionIds.length > 0) {
        if (!engagement.sessionIds.includes(sessionId)) {
          throw new NotFoundException(`Session with ID ${sessionId} is not selected for this engagement`);
        }
      }
      const targetSession = engagement.track?.sessions?.find(s => s.id === sessionId);
      if (!targetSession) {
        throw new NotFoundException(`Session with ID ${sessionId} not found in this engagement`);
      }
      sessionsWithStats = await this.getSessionStatistics(engagementId, [targetSession], engagement.sessionIds || undefined);
    } else {
      // Get sessions based on selected sessionIds if available
      sessionsWithStats = await this.getSessionStatistics(
        engagementId, 
        engagement.track?.sessions || [],
        engagement.sessionIds || undefined
      );
    }

    const engagementWithStats = {
      ...engagement,
      statistics,
      track: {
        ...engagement.track,
        sessions: sessionsWithStats
      }
    };

    return UserUtils.formatEngagements([engagementWithStats])[0];
  }

  /**
   * Get engagement by ID with formatted data
   */
  async getEngagementById(id: string): Promise<any> {
    const engagement = await this.engagementRepository.findOne({
      where: { id },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
    });

    if (!engagement) {
      throw new NotFoundException(`Engagement with ID ${id} not found`);
    }

    const statistics = await this.getEngagementStatistics(engagement.id);
    const sessionsWithStats = await this.getSessionStatistics(
      engagement.id, 
      engagement.track?.sessions || [],
      engagement.sessionIds || undefined
    );
    
    const engagementWithStats = {
      ...engagement,
      statistics,
      track: {
        ...engagement.track,
        sessions: sessionsWithStats
      }
    };

    const formatted = UserUtils.formatEngagements([engagementWithStats]);
    return formatted[0];
  }

  /**
   * Create a simple polling link for a session
   */
  async createPollingLinkForSession(sessionId: string, title: string, url: string): Promise<EngagementPollingLink> {
    const session = await this.programmeSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }
    const link = this.engagementPollingLinkRepository.create({ sessionId, title, url, isActive: true });
    return await this.engagementPollingLinkRepository.save(link);
  }

  /**
   * Get active polling links for a session
   */
  async getPollingLinkForSession(sessionId: string): Promise<{ id: string; title: string; url: string } | null> {
    const link = await this.engagementPollingLinkRepository.findOne({ where: { sessionId, isActive: true } });
    if (!link) return null;
    return { id: link.id, title: link.title, url: link.url };
  }

  async upsertPollingLinkForSession(sessionId: string, title: string, url: string): Promise<EngagementPollingLink> {
    const existing = await this.engagementPollingLinkRepository.findOne({ where: { sessionId, isActive: true } });
    if (existing) {
      existing.title = title;
      existing.url = url;
      return await this.engagementPollingLinkRepository.save(existing);
    }
    return await this.createPollingLinkForSession(sessionId, title, url);
  }

  /**
   * Delete a polling link by id
   */
  async deletePollingLink(linkId: string): Promise<{ message: string }> {
    const link = await this.engagementPollingLinkRepository.findOne({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException('Polling link not found');
    }
    await this.engagementPollingLinkRepository.remove(link);
    return { message: 'Polling link deleted successfully' };
  }

  /**
   * Get engagements by track ID with formatted data
   */
  async getEngagementsByTrackId(trackId: string): Promise<any[]> {
    const engagements = await this.engagementRepository.find({
      where: { trackId },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      order: { createdAt: 'DESC' },
    });

    // Get statistics for each engagement
    const engagementsWithStats = await Promise.all(
      engagements.map(async (engagement) => {
        const statistics = await this.getEngagementStatistics(engagement.id);
        const sessionsWithStats = await this.getSessionStatistics(
          engagement.id, 
          engagement.track?.sessions || [],
          engagement.sessionIds || undefined
        );
        
        return {
          ...engagement,
          statistics,
          track: {
            ...engagement.track,
            sessions: sessionsWithStats
          }
        };
      })
    );

    return UserUtils.formatEngagements(engagementsWithStats);
  }

  /**
   * Update an engagement
   */
  async updateEngagement(id: string, updateEngagementDto: UpdateEngagementDto): Promise<Engagement> {
    const engagement = await this.engagementRepository.findOne({
      where: { id },
    });

    if (!engagement) {
      throw new NotFoundException(`Engagement with ID ${id} not found`);
    }

    // If trackId is being updated, verify the new track exists and no duplicate exists
    if (updateEngagementDto.trackId && updateEngagementDto.trackId !== engagement.trackId) {
      const track = await this.programmeTrackRepository.findOne({
        where: { id: updateEngagementDto.trackId },
        relations: ['event'],
      });

      if (!track) {
        throw new NotFoundException(`Programme track with ID ${updateEngagementDto.trackId} not found`);
      }

      // Check if another engagement already exists for this new track
      const existingEngagement = await this.engagementRepository.findOne({
        where: { trackId: updateEngagementDto.trackId },
      });

      if (existingEngagement) {
        throw new ConflictException(
          `Engagement already exists for this track.`
        );
      }
    }

    // Validate session IDs (now required)
    if (!updateEngagementDto.sessionIds || updateEngagementDto.sessionIds.length === 0) {
      throw new NotFoundException('At least one session ID is required');
    }

    const trackIdToValidate = updateEngagementDto.trackId || engagement.trackId;
    const sessions = await this.programmeSessionRepository.find({
      where: { trackId: trackIdToValidate },
    });

    const validSessionIds = sessions.map(s => s.id);
    const invalidSessionIds = updateEngagementDto.sessionIds.filter(sessionId => !validSessionIds.includes(sessionId));

    if (invalidSessionIds.length > 0) {
      throw new NotFoundException(
        `One or more sessions not found or do not belong to this track: ${invalidSessionIds.join(', ')}`
      );
    }

    Object.assign(engagement, updateEngagementDto);
    return await this.engagementRepository.save(engagement);
  }

  /**
   * Delete an engagement and all related data
   */
  async deleteEngagement(id: string): Promise<{ message: string }> {
    const engagement = await this.engagementRepository.findOne({
      where: { id },
      relations: ['track', 'track.sessions'],
    });

    if (!engagement) {
      throw new NotFoundException(`Engagement with ID ${id} not found`);
    }

    // 1. Delete all Q&A questions related to this engagement (likes and share links will be cascade deleted)
    const questions = await this.engagementQnaQuestionRepository.find({
      where: { engagementId: id },
    });
    if (questions.length > 0) {
      await this.engagementQnaQuestionRepository.remove(questions);
    }

    // 2. Delete all polling links for sessions in this engagement
    const sessionIds = engagement.sessionIds || [];
    if (sessionIds.length > 0) {
      const pollingLinks = await this.engagementPollingLinkRepository.find({
        where: { sessionId: In(sessionIds) },
      });
      if (pollingLinks.length > 0) {
        await this.engagementPollingLinkRepository.remove(pollingLinks);
      }
    }

    // 3. Finally, delete the engagement itself
    await this.engagementRepository.remove(engagement);
    return { message: 'Engagement and all related data deleted successfully' };
  }

  /**
   * Get active engagements with formatted data
   */
  async getActiveEngagements(): Promise<any[]> {
    const engagements = await this.engagementRepository.find({
      where: { isActive: true },
      relations: ['track', 'track.event', 'track.sessions', 'track.sessions.speakers', 'track.sessions.speakers.speakerProfile'],
      order: { createdAt: 'DESC' },
    });

    // Get statistics for each engagement
    const engagementsWithStats = await Promise.all(
      engagements.map(async (engagement) => {
        const statistics = await this.getEngagementStatistics(engagement.id);
        const sessionsWithStats = await this.getSessionStatistics(
          engagement.id, 
          engagement.track?.sessions || [],
          engagement.sessionIds || undefined
        );
        
        return {
          ...engagement,
          statistics,
          track: {
            ...engagement.track,
            sessions: sessionsWithStats
          }
        };
      })
    );

    return UserUtils.formatEngagements(engagementsWithStats);
  }

  /**
   * Toggle engagement active status
   */
  async toggleEngagementStatus(id: string): Promise<Engagement> {
    const engagement = await this.engagementRepository.findOne({
      where: { id },
    });
    
    if (!engagement) {
      throw new NotFoundException(`Engagement with ID ${id} not found`);
    }
    
    engagement.isActive = !engagement.isActive;
    return await this.engagementRepository.save(engagement);
  }

}

