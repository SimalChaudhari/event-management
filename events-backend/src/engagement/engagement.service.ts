import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Engagement } from './engagement.entity';
import { CreateEngagementDto, UpdateEngagementDto } from './engagement.dto';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { UserUtils } from '../utils/user.utils';
import { EngagementQnaQuestion } from '../engagement-qna/engagement-qna.entity';
import { Poll } from '../polling/polling.entity';

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
  private async getSessionStatistics(engagementId: string, sessions: any[]): Promise<any[]> {
    if (!sessions || sessions.length === 0) {
      return [];
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
        relations: ['votes', 'speaker']
      });
    }

    // Process each session
    return sessions.map(session => {
      // Get session speakers
      const sessionSpeakerIds = session.speakers?.map((speaker: any) => speaker.id) || [];
      
      // Filter questions for this specific session
      const sessionQuestions = questions.filter(q => q.sessionId === session.id);
      const sessionQuestionsCount = sessionQuestions.length;
      const sessionAnsweredQuestionsCount = sessionQuestions.filter(q => q.status === 'answered').length;
      
      // Count polls for this session (polls linked to speakers)
      const sessionPolls = polls.filter(poll => 
        poll.speakerId && sessionSpeakerIds.includes(poll.speakerId)
      );
      
      const sessionPollsCount = sessionPolls.length;
      const sessionVotesCount = sessionPolls.reduce((total, poll) => 
        total + (poll.votes?.length || 0), 0
      );

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
        }))
      };
    });
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
        const sessionsWithStats = await this.getSessionStatistics(engagement.id, engagement.track?.sessions || []);
        
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
   */
  async getEngagementsByEvent(eventId: string): Promise<any[]> {
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
        const sessionsWithStats = await this.getSessionStatistics(engagement.id, engagement.track?.sessions || []);
        
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
      const targetSession = engagement.track?.sessions?.find(s => s.id === sessionId);
      if (!targetSession) {
        throw new NotFoundException(`Session with ID ${sessionId} not found in this engagement`);
      }
      sessionsWithStats = await this.getSessionStatistics(engagementId, [targetSession]);
    } else {
      // Get all sessions
      sessionsWithStats = await this.getSessionStatistics(engagementId, engagement.track?.sessions || []);
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
    const sessionsWithStats = await this.getSessionStatistics(engagement.id, engagement.track?.sessions || []);
    
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
        const sessionsWithStats = await this.getSessionStatistics(engagement.id, engagement.track?.sessions || []);
        
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

    Object.assign(engagement, updateEngagementDto);
    return await this.engagementRepository.save(engagement);
  }

  /**
   * Delete an engagement
   */
  async deleteEngagement(id: string): Promise<{ message: string }> {
    const engagement = await this.getEngagementById(id);
    await this.engagementRepository.remove(engagement);
    return { message: 'Engagement deleted successfully' };
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
        const sessionsWithStats = await this.getSessionStatistics(engagement.id, engagement.track?.sessions || []);
        
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

