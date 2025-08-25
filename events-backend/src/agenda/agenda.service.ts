import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventAgenda, AgendaCategory } from './agenda.entity';
import { CreateEventAgendaDto, UpdateEventAgendaDto } from './agenda.dto';
import { Event } from '../event/event.entity';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
} from '../utils/exceptions/custom-exceptions';
import { UserEntity } from 'user/users.entity';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(EventAgenda)
    private agendaRepository: Repository<EventAgenda>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async createAgenda(createAgendaDto: CreateEventAgendaDto) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: createAgendaDto.eventId },
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', createAgendaDto.eventId);
      }

      // Validate exhibitor exists
      const user = await this.userRepository.findOne({
        where: { id: createAgendaDto.userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', createAgendaDto.userId);
      }

      // Check for time conflicts within the same event
      await this.checkTimeConflicts(
        createAgendaDto.eventId,
        createAgendaDto.time,
        createAgendaDto.duration,
        undefined,
      );

      // Set order index if not provided


      const agenda = this.agendaRepository.create(createAgendaDto);
      const savedAgenda = await this.agendaRepository.save(agenda);

      return await this.getAgendaWithRelations(savedAgenda.id);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda creation');
    }
  }

  async getAllAgendas(eventId?: string, userId?: string) {
    try {
      const queryBuilder = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('agenda.isActive = :isActive', { isActive: true });

      if (eventId) {
        queryBuilder.andWhere('agenda.eventId = :eventId', { eventId });
      }

      if (userId) {
        queryBuilder.andWhere('agenda.userId = :userId', { userId });
      }

   
      const agendas = await queryBuilder.getMany();

      return agendas.map(agenda => this.formatAgendaResponse(agenda));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Agendas retrieval');
    }
  }

  async getAgendaById(id: string) {
    try {
      const agenda = await this.getAgendaWithRelations(id);
      if (!agenda) {
        throw new ResourceNotFoundException('Agenda', id);
      }
      return agenda;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda retrieval by ID');
    }
  }

  async updateAgenda(id: string, updateAgendaDto: UpdateEventAgendaDto) {
    try {
      const agenda = await this.agendaRepository.findOne({ where: { id } });
      if (!agenda) {
        throw new ResourceNotFoundException('Agenda', id);
      }

      // Check for time conflicts if time or duration is being updated
      if (updateAgendaDto.time || updateAgendaDto.duration) {
        await this.checkTimeConflicts(
          agenda.eventId,
          updateAgendaDto.time || agenda.time,
          updateAgendaDto.duration || agenda.duration,
          id,
        );
      }

      Object.assign(agenda, updateAgendaDto);
      const updatedAgenda = await this.agendaRepository.save(agenda);

      return await this.getAgendaWithRelations(updatedAgenda.id);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda update');
    }
  }

  async deleteAgenda(id: string) {
    try {
      const agenda = await this.agendaRepository.findOne({ where: { id } });
      if (!agenda) {
        throw new ResourceNotFoundException('Agenda', id);
      }

      // Soft delete by setting isActive to false
      agenda.isActive = false;
      await this.agendaRepository.save(agenda);

      return { message: 'Agenda deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Agenda deletion');
    }
  }

  async getAgendasByCategory(eventId: string, category: AgendaCategory) {
    try {
      const agendas = await this.agendaRepository.find({
        where: { eventId, category, isActive: true }
      });

      return agendas.map(agenda => this.formatAgendaResponse(agenda));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Agendas retrieval by category');
    }
  }

  // Helper methods
  private async getAgendaWithRelations(id: string) {
    return await this.agendaRepository.findOne({
      where: { id },
      // No need to fetch relations since we only need IDs
    });
  }

  private async checkTimeConflicts(
    eventId: string,
    time: string,
    duration: number,
    excludeId?: string,
  ) {
    const startTime = this.parseTimeToMinutes(time);
    const endTime = startTime + duration;

    const queryBuilder = this.agendaRepository
      .createQueryBuilder('agenda')
      .where('agenda.eventId = :eventId', { eventId })
      .andWhere('agenda.isActive = :isActive', { isActive: true });

    if (excludeId) {
      queryBuilder.andWhere('agenda.id != :excludeId', { excludeId });
    }

    const conflictingAgendas = await queryBuilder.getMany();

    for (const agenda of conflictingAgendas) {
      const agendaStartTime = this.parseTimeToMinutes(agenda.time);
      const agendaEndTime = agendaStartTime + agenda.duration;

      if (
        (startTime >= agendaStartTime && startTime < agendaEndTime) ||
        (endTime > agendaStartTime && endTime <= agendaEndTime) ||
        (startTime <= agendaStartTime && endTime >= agendaEndTime)
      ) {
        throw new ValidationException(
          `Time conflict detected. This time slot overlaps with "${agenda.title}" (${agenda.time} - ${this.formatDuration(agenda.duration)})`,
        );
      }
    }
  }



  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatDuration(duration: number): string {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }

  private formatAgendaResponse(agenda: any) {
    // Since we're not fetching relations, just return the agenda data with IDs
    return {
      id: agenda.id,
      eventId: agenda.eventId,
      exhibitorId: agenda.exhibitorId,
      title: agenda.title,
      time: agenda.time,
      duration: agenda.duration,
      location: agenda.location,
      details: agenda.details,
      category: agenda.category,
      isActive: agenda.isActive,
      createdBy: agenda.createdBy,
      createdAt: agenda.createdAt,
      updatedAt: agenda.updatedAt,
    };
  }
}
