import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProgrammeTrack } from './programme-track.entity';
import { ProgrammeSession } from './programme-session.entity';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { EventSpeaker } from '../event/event-speaker.entity';
import { Engagement } from '../engagement/engagement.entity';
import {
  CreateProgrammeTrackDto,
  UpdateProgrammeTrackDto,
  CreateProgrammeSessionDto,
  UpdateProgrammeSessionDto,
  ProgrammeTrackResponseDto,
  ProgrammeSessionResponseDto,
  ReorderProgrammeTrackItemDto,
} from './programme.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { UserUtils } from '../utils/user.utils';
import { ForeignKeyConstraintException } from '../utils/exceptions/custom-exceptions';

@Injectable()
export class ProgrammeService {
  constructor(
    @InjectRepository(ProgrammeTrack)
    private programmeTrackRepository: Repository<ProgrammeTrack>,
    @InjectRepository(ProgrammeSession)
    private programmeSessionRepository: Repository<ProgrammeSession>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventSpeaker)
    private eventSpeakerRepository: Repository<EventSpeaker>,
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // Track Management
  async createTrack(eventId: string, createTrackDto: CreateProgrammeTrackDto): Promise<ProgrammeTrackResponseDto> {
    try {
      // Verify event exists
      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const track = this.programmeTrackRepository.create({
        eventId,
        ...createTrackDto,
        isActive: createTrackDto.isActive !== undefined ? createTrackDto.isActive : true,
      });

      track.displayOrder = await this.getNextTrackDisplayOrderValue();

      const savedTrack = await this.programmeTrackRepository.save(track);
      return this.mapTrackToResponseDto(savedTrack);
    } catch (error) {
      this.errorHandler.logError(error, 'Create Programme Track', eventId);
      throw error;
    }
  }

  async updateTrack(trackId: string, updateTrackDto: UpdateProgrammeTrackDto): Promise<ProgrammeTrackResponseDto> {
    try {
      const track = await this.programmeTrackRepository.findOne({
        where: { id: trackId },
        relations: ['sessions', 'sessions.speakers'],
      });

      if (!track) {
        throw new NotFoundException('Programme track not found');
      }

      Object.assign(track, updateTrackDto);
      const savedTrack = await this.programmeTrackRepository.save(track);
      return this.mapTrackToResponseDto(savedTrack);
    } catch (error) {
      this.errorHandler.logError(error, 'Update Programme Track', trackId);
      throw error;
    }
  }

  async deleteTrack(trackId: string): Promise<void> {
    try {
      const track = await this.programmeTrackRepository.findOne({
        where: { id: trackId },
        relations: ['sessions'],
      });

      if (!track) {
        throw new NotFoundException('Programme track not found');
      }

      // Check if track has engagements before deleting
      const engagements = await this.engagementRepository.find({
        where: { trackId },
      });

      if (engagements.length > 0) {
        throw new ForeignKeyConstraintException(
          'Programme Track',
          'Engagements',
          engagements.length,
          'delete',
        );
      }

      // Delete all sessions first (cascade should handle this, but being explicit)
      if (track.sessions && track.sessions.length > 0) {
        await this.programmeSessionRepository.delete(
          track.sessions.map(session => session.id)
        );
      }

      await this.programmeTrackRepository.delete(trackId);
    } catch (error: any) {
      // Check if it's a foreign key constraint error
      if (
        error?.code === '23503' ||
        error?.message?.includes('foreign key constraint') ||
        error?.message?.includes('FK_35e9c23cece2cfabc9335c670d2') ||
        error instanceof ForeignKeyConstraintException
      ) {
        // If we already threw ForeignKeyConstraintException, re-throw it
        if (error instanceof ForeignKeyConstraintException) {
          throw error;
        }
        // Otherwise, create a proper error message
        const engagements = await this.engagementRepository.find({
          where: { trackId },
        });
        throw new ForeignKeyConstraintException(
          'Programme Track',
          'Engagements',
          engagements.length,
          'delete',
        );
      }
      
      // Re-throw NotFoundException
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.errorHandler.logError(error, 'Delete Programme Track', trackId);
      throw error;
    }
  }

  async getTracksByEvent(eventId: string): Promise<ProgrammeTrackResponseDto[]> {
    try {
      const tracks = await this.programmeTrackRepository.find({
        where: { eventId },
        relations: ['sessions', 'sessions.speakers'],
        order: { displayOrder: 'ASC', createdAt: 'ASC' },
      });

      return tracks.map(track => this.mapTrackToResponseDto(track));
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Tracks', eventId);
      throw error;
    }
  }

  async getAllTracks(): Promise<ProgrammeTrackResponseDto[]> {
    try {
      const tracks = await this.programmeTrackRepository.find({
        relations: ['event', 'sessions', 'sessions.speakers'],
        order: { displayOrder: 'ASC', createdAt: 'ASC' },
      });

      return tracks.map(track => this.mapTrackToResponseDto(track));
    } catch (error) {
      this.errorHandler.logError(error, 'Get All Programme Tracks', '');
      throw error;
    }
  }

  async reorderTracks(orderItems: ReorderProgrammeTrackItemDto[]): Promise<void> {
    if (!orderItems || orderItems.length === 0) {
      return;
    }

    const sortedItems = [...orderItems].sort((a, b) => a.displayOrder - b.displayOrder);
    const ids = sortedItems.map(item => item.id);
    const tracks = await this.programmeTrackRepository.find({
      where: { id: In(ids) },
    });

    if (tracks.length !== ids.length) {
      const found = new Set(tracks.map(track => track.id));
      const missing = ids.filter(id => !found.has(id));
      throw new NotFoundException(`Programme track(s) not found: ${missing.join(', ')}`);
    }

    const orderMap = new Map(sortedItems.map(item => [item.id, item.displayOrder]));
    tracks.forEach(track => {
      const newOrder = orderMap.get(track.id);
      if (newOrder !== undefined) {
        track.displayOrder = newOrder;
      }
    });

    await this.programmeTrackRepository.save(tracks);
  }

  private async getNextTrackDisplayOrderValue(): Promise<number> {
    const result = await this.programmeTrackRepository
      .createQueryBuilder('track')
      .select('COALESCE(MAX(track.displayOrder), -1)', 'max')
      .getRawOne<{ max: string }>();

    const maxOrder = result?.max !== undefined ? Number(result.max) : -1;
    return Number.isFinite(maxOrder) ? maxOrder + 1 : 0;
  }

  // Session Management
  async createSession(createSessionDto: CreateProgrammeSessionDto): Promise<ProgrammeSessionResponseDto> {
    try {
      // Verify track exists
      const track = await this.programmeTrackRepository.findOne({
        where: { id: createSessionDto.trackId },
      });

      if (!track) {
        throw new NotFoundException('Programme track not found');
      }

      // Verify speakers exist if provided
      let speakers: UserEntity[] = [];
      if (createSessionDto.speakerIds && createSessionDto.speakerIds.length > 0) {
        speakers = await this.userRepository.find({
          where: { id: In(createSessionDto.speakerIds) },
        });

        if (speakers.length !== createSessionDto.speakerIds.length) {
          throw new BadRequestException('One or more speakers not found');
        }
      }

      const session = this.programmeSessionRepository.create({
        ...createSessionDto,
        sessionDate: new Date(createSessionDto.sessionDate),
        isActive: createSessionDto.isActive !== undefined ? createSessionDto.isActive : true,
        speakers,
      });

      const savedSession = await this.programmeSessionRepository.save(session);
      
      // Sync speaker timing with event speakers
      await this.syncSpeakerTimingWithEvent(savedSession);
      
      return this.mapSessionToResponseDto(savedSession);
    } catch (error) {
      this.errorHandler.logError(error, 'Create Programme Session', createSessionDto.trackId);
      throw error;
    }
  }

  async updateSession(sessionId: string, updateSessionDto: UpdateProgrammeSessionDto): Promise<ProgrammeSessionResponseDto> {
    try {
      const session = await this.programmeSessionRepository.findOne({
        where: { id: sessionId },
        relations: ['speakers'],
      });

      if (!session) {
        throw new NotFoundException('Programme session not found');
      }

      // Update speakers if provided
      if (updateSessionDto.speakerIds !== undefined) {
        let speakers: UserEntity[] = [];
        if (updateSessionDto.speakerIds.length > 0) {
          speakers = await this.userRepository.find({
            where: { id: In(updateSessionDto.speakerIds) },
          });

          if (speakers.length !== updateSessionDto.speakerIds.length) {
            throw new BadRequestException('One or more speakers not found');
          }
        }
        session.speakers = speakers;
      }

      // Update other fields
      if (updateSessionDto.sessionDate) {
        session.sessionDate = new Date(updateSessionDto.sessionDate);
      }

      Object.assign(session, updateSessionDto);
      delete (session as any).speakerIds; // Remove from assignment

      const savedSession = await this.programmeSessionRepository.save(session);
      
      // Sync speaker timing with event speakers
      await this.syncSpeakerTimingWithEvent(savedSession);
      
      return this.mapSessionToResponseDto(savedSession);
    } catch (error) {
      this.errorHandler.logError(error, 'Update Programme Session', sessionId);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const session = await this.programmeSessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException('Programme session not found');
      }

      await this.programmeSessionRepository.delete(sessionId);
    } catch (error) {
      this.errorHandler.logError(error, 'Delete Programme Session', sessionId);
      throw error;
    }
  }

  async getSessionsByTrack(trackId: string): Promise<ProgrammeSessionResponseDto[]> {
    try {
      const sessions = await this.programmeSessionRepository.find({
        where: { trackId },
        relations: ['speakers'],
        order: { sessionDate: 'ASC', startTime: 'ASC' },
      });

      return sessions.map(session => this.mapSessionToResponseDto(session));
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Sessions', trackId);
      throw error;
    }
  }

  async getSessionsByEvent(eventId: string): Promise<ProgrammeSessionResponseDto[]> {
    try {
      const sessions = await this.programmeSessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.track', 'track')
        .leftJoinAndSelect('session.speakers', 'speakers')
        .where('track.eventId = :eventId', { eventId })
        .orderBy('session.sessionDate', 'ASC')
        .addOrderBy('session.startTime', 'ASC')
        .getMany();

      return sessions.map(session => this.mapSessionToResponseDto(session));
    } catch (error) {
      this.errorHandler.logError(error, 'Get Programme Sessions by Event', eventId);
      throw error;
    }
  }

  async getAllSessions(): Promise<ProgrammeSessionResponseDto[]> {
    try {
      const sessions = await this.programmeSessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.track', 'track')
        .leftJoinAndSelect('track.event', 'event')
        .leftJoinAndSelect('session.speakers', 'speakers')
        .orderBy('session.sessionDate', 'ASC')
        .addOrderBy('session.startTime', 'ASC')
        .getMany();

      return sessions.map(session => this.mapSessionToResponseDto(session));
    } catch (error) {
      this.errorHandler.logError(error, 'Get All Programme Sessions', '');
      throw error;
    }
  }

  // Helper methods
  private async syncSpeakerTimingWithEvent(session: ProgrammeSession): Promise<void> {
    try {
      // Get the track to find the event
      const track = await this.programmeTrackRepository.findOne({
        where: { id: session.trackId },
      });

      if (!track) {
        return;
      }

      // Get all speakers currently assigned to this event
      const allEventSpeakers = await this.eventSpeakerRepository.find({
        where: { eventId: track.eventId },
      });

      // Update or create event speaker timing for each speaker in this session
      if (session.speakers && session.speakers.length > 0) {
        for (const speaker of session.speakers) {
          const eventSpeaker = allEventSpeakers.find(es => es.speakerId === speaker.id);

          if (eventSpeaker) {
            // Update the speaker's timing in the event to match the programme session
            eventSpeaker.speakingStartTime = session.startTime;
            eventSpeaker.speakingEndTime = session.endTime;
            await this.eventSpeakerRepository.save(eventSpeaker);
          } else {
            // Create new event speaker record if it doesn't exist
            const newEventSpeaker = this.eventSpeakerRepository.create({
              eventId: track.eventId,
              speakerId: speaker.id,
              speakingStartTime: session.startTime,
              speakingEndTime: session.endTime,
            });
            await this.eventSpeakerRepository.save(newEventSpeaker);
          }
        }
      }

      // If session has no speakers, we don't remove event speakers as they might be assigned to other sessions
      // This maintains the existing behavior where event speakers can exist independently
    } catch (error) {
      this.errorHandler.logError(error, 'Sync Speaker Timing with Event', session.id);
      // Don't throw error to avoid breaking the main operation
    }
  }

  private mapTrackToResponseDto(track: ProgrammeTrack): ProgrammeTrackResponseDto {
    return {
      id: track.id,
      eventId: track.eventId,
      title: track.title,
      description: track.description,
      isActive: track.isActive,
    displayOrder: track.displayOrder,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt,
      sessions: track.sessions ? track.sessions.map(session => this.mapSessionToResponseDto(session)) : undefined,
      event: track.event ? {
        id: track.event.id,
        name: track.event.name,
      } : undefined,
    };
  }

  private mapSessionToResponseDto(session: ProgrammeSession): ProgrammeSessionResponseDto {
    return {
      id: session.id,
      trackId: session.trackId,
      title: session.title,
      description: session.description,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      venue: session.venue,
      isActive: session.isActive,
      enablePolling: session.enablePolling || false,
      enableQna: session.enableQna || false,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      speakers: session.speakers ? session.speakers.map(speaker => 
        UserUtils.getBasicSpeakerInfo(speaker)
      ) : undefined,
      track: session.track ? {
        id: session.track.id,
        title: session.track.title,
        event: session.track.event ? {
          id: session.track.event.id,
          name: session.track.event.name,
        } : undefined,
      } : undefined,
    };
  }
}
