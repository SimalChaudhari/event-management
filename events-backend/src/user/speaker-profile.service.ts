import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpeakerProfile } from './speaker-profile.entity';
import { UserEntity, UserRole } from './users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ResourceNotFoundException } from '../utils/exceptions/custom-exceptions';
import { CreateSpeakerProfileDto, UpdateSpeakerProfileDto } from './speaker-profile.dto';

@Injectable()
export class SpeakerProfileService {
  constructor(
    @InjectRepository(SpeakerProfile)
    private speakerProfileRepository: Repository<SpeakerProfile>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async createProfile(createProfileDto: CreateSpeakerProfileDto): Promise<SpeakerProfile> {
    try {
      // Check if user exists and is a speaker
      const user = await this.userRepository.findOne({
        where: { id: createProfileDto.userId, role: UserRole.Speaker },
      });

      if (!user) {
        throw new ResourceNotFoundException('Speaker', createProfileDto.userId);
      }

      // Check if profile already exists
      const existingProfile = await this.speakerProfileRepository.findOne({
        where: { userId: createProfileDto.userId },
      });

      if (existingProfile) {
        throw new Error('Speaker profile already exists for this user');
      }

      const profile = this.speakerProfileRepository.create(createProfileDto);
      return await this.speakerProfileRepository.save(profile);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker profile creation');
    }
  }

  async getProfileByUserId(userId: string): Promise<SpeakerProfile> {
    try {
      const profile = await this.speakerProfileRepository.findOne({
        where: { userId },
        relations: ['user'],
      });

      if (!profile) {
        throw new ResourceNotFoundException('Speaker profile', userId);
      }

      return profile;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker profile retrieval');
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateSpeakerProfileDto): Promise<SpeakerProfile> {
    try {
      const profile = await this.speakerProfileRepository.findOne({
        where: { userId },
      });

      if (!profile) {
        throw new ResourceNotFoundException('Speaker profile', userId);
      }

      Object.assign(profile, updateProfileDto);
      return await this.speakerProfileRepository.save(profile);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker profile update');
    }
  }

  async deleteProfile(userId: string): Promise<{ message: string }> {
    try {
      const profile = await this.speakerProfileRepository.findOne({
        where: { userId },
      });

      if (!profile) {
        throw new ResourceNotFoundException('Speaker profile', userId);
      }

      await this.speakerProfileRepository.remove(profile);
      return { message: 'Speaker profile deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker profile deletion');
    }
  }

  async getAllSpeakersWithProfiles(): Promise<any[]> {
    try {
      const speakers = await this.userRepository.find({
        where: { role: UserRole.Speaker },
        relations: ['speakerProfile'],
        order: { updatedAt: 'DESC' },
        select: [
          'id', 'firstName', 'lastName', 'email', 'mobile', 'address', 'city', 
          'state', 'postalCode', 'countryCurrency', 'profilePicture', 
          'linkedinProfile', 'isVerify', 'role', 'createdAt', 'updatedAt'
        ]
      });

      return speakers.map(({ password, ...speaker }) => ({
        ...speaker,
        speakerProfile: speaker.speakerProfile || null,
      
      }));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Speakers with profiles retrieval');
    }
  }

  async getSpeakerWithProfileById(id: string): Promise<any> {
    try {
      const speaker = await this.userRepository.findOne({
        where: { id, role: UserRole.Speaker },
        relations: ['speakerProfile'],
        select: [
          'id', 'firstName', 'lastName', 'email', 'mobile', 'address', 'city', 
          'state', 'postalCode', 'countryCurrency', 'profilePicture', 
          'linkedinProfile', 'isVerify', 'role', 'createdAt', 'updatedAt'
        ]
      });

      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      const { password, ...speakerWithoutPassword } = speaker;
      return {
        ...speakerWithoutPassword,
        speakerProfile: speaker.speakerProfile || null,
      
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker with profile retrieval');
    }
  }

  async getSpeakerProfileByUserId(userId: string): Promise<SpeakerProfile | null> {
    try {
      return await this.speakerProfileRepository.findOne({
        where: { userId },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Speaker profile retrieval by user ID');
    }
  }


}
