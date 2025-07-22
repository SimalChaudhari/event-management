// src/speaker/speaker.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Speaker } from './speaker.entity';
import { SpeakerDto } from './speaker.dto';
import path from 'path';
import * as fs from 'fs';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ResourceNotFoundException, DuplicateResourceException, ForeignKeyConstraintException } from '../utils/exceptions/custom-exceptions';


@Injectable()
export class SpeakerService {
  constructor(
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
    private errorHandler: ErrorHandlerService,
  ) {}

  async createSpeaker(speakerDto: SpeakerDto) {
    try {
      // Check if speaker with same email already exists (if email field exists)
      if (speakerDto.email) {
        const existingSpeaker = await this.speakerRepository.findOne({
          where: { email: speakerDto.email },
        });

        if (existingSpeaker) {
          throw new DuplicateResourceException(
            'Speaker',
            'email',
            speakerDto.email,
          );
        }
      }

      const speaker = await this.speakerRepository.create(speakerDto);
      const savedSpeaker = await this.speakerRepository.save(speaker);
      return savedSpeaker;
    } catch (error) {
      if (error instanceof DuplicateResourceException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker creation');
    }
  }

  async getAllSpeakers() {
    try {
      const speakers = await this.speakerRepository.find({
        order: { createdAt: 'DESC' },
      });
      return speakers;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Speaker retrieval');
    }
  }

  async getSpeakerById(id: string) {
    try {
      const speaker = await this.speakerRepository.findOne({ where: { id } });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }
      return speaker;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker retrieval by ID');
    }
  }

  async updateSpeaker(id: string, speakerDto: Partial<SpeakerDto>) {
    try {
      const speaker = await this.speakerRepository.findOne({ where: { id } });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      // Check if email is being updated and if it conflicts with existing speaker
      if (speakerDto.email && speakerDto.email !== speaker.email) {
        const existingSpeaker = await this.speakerRepository.findOne({
          where: { email: speakerDto.email },
        });

        if (existingSpeaker) {
          throw new DuplicateResourceException(
            'Speaker',
            'email',
            speakerDto.email,
          );
        }
      }

      const updatedSpeaker = await this.speakerRepository.save({
        ...speaker,
        ...speakerDto,
      });
      return updatedSpeaker;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker update');
    }
  }

  async deleteSpeaker(id: string) {
    try {
      const speaker = await this.speakerRepository.findOne({ where: { id } });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      // Check if speaker is associated with any events
      const relatedEventsCount = await this.errorHandler.getRelatedDataCount(
        this.speakerRepository.manager.getRepository('Event'),
        { speaker: { id } },
        'Speaker Events'
      );

      if (relatedEventsCount > 0) {
        throw new ForeignKeyConstraintException(
          'Speaker',
          'Event',
          relatedEventsCount,
          'delete'
        );
      }

      // Delete profile picture from filesystem if exists
      if (speaker.speakerProfile) {
        try {
          const filePath = path.resolve(speaker.speakerProfile);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          this.errorHandler.logError(fileError, 'Speaker Profile File Deletion', id);
          // Continue with speaker deletion even if file deletion fails
        }
      }

      await this.speakerRepository.remove(speaker);
      return {
        success: true,
        message: 'Speaker deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForeignKeyConstraintException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker deletion');
    }
  }
}
