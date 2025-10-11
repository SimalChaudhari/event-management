import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProgrammeTrack } from './programme-track.entity';
import { ProgrammeSession } from './programme-session.entity';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import {
  CreateProgrammeTrackDto,
  UpdateProgrammeTrackDto,
  CreateProgrammeSessionDto,
  UpdateProgrammeSessionDto,
  ProgrammeTrackResponseDto,
  ProgrammeSessionResponseDto,
} from './programme.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { UserUtils } from '../utils/user.utils';

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

      // Delete all sessions first (cascade should handle this, but being explicit)
      if (track.sessions && track.sessions.length > 0) {
        await this.programmeSessionRepository.delete(
          track.sessions.map(session => session.id)
        );
      }

      await this.programmeTrackRepository.delete(trackId);
    } catch (error) {
      this.errorHandler.logError(error, 'Delete Programme Track', trackId);
      throw error;
    }
  }

  async getTracksByEvent(eventId: string): Promise<ProgrammeTrackResponseDto[]> {
    try {
      const tracks = await this.programmeTrackRepository.find({
        where: { eventId },
        relations: ['sessions', 'sessions.speakers'],
        order: { createdAt: 'ASC' },
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
        order: { createdAt: 'ASC' },
      });

      return tracks.map(track => this.mapTrackToResponseDto(track));
    } catch (error) {
      this.errorHandler.logError(error, 'Get All Programme Tracks', '');
      throw error;
    }
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
  private mapTrackToResponseDto(track: ProgrammeTrack): ProgrammeTrackResponseDto {
    return {
      id: track.id,
      eventId: track.eventId,
      title: track.title,
      description: track.description,
      isActive: track.isActive,
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
