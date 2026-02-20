import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SpeakerProfile } from './speaker-profile.entity';
import { UserEntity, UserRole } from './users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ResourceNotFoundException } from '../utils/exceptions/custom-exceptions';
import { CreateSpeakerProfileDto, UpdateSpeakerProfileDto } from './speaker-profile.dto';
import { UserUtils } from '../utils/user.utils';
import { FilterService } from '../service/filter.service';

@Injectable()
export class SpeakerProfileService {
  constructor(
    @InjectRepository(SpeakerProfile)
    private speakerProfileRepository: Repository<SpeakerProfile>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
    private readonly filterService: FilterService,
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

  async getAllSpeakersWithProfiles(
    filters?: {
      page?: number;
      limit?: number;
      keyword?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit;
      const usePagination = limit != null && limit > 0;
      const effectiveLimit = usePagination ? limit : 99999;
      const search = filters?.keyword;
      const sortBy = filters?.sortBy || 'firstName';
      const sortOrder = filters?.sortOrder || 'ASC';

      // Build query builder
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.speakerProfile', 'speakerProfile')
        .leftJoinAndSelect('user.addresses', 'addresses')
        .where('user.role = :role', { role: UserRole.Speaker })
        .select([
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.email',
          'user.mobile',
          'user.countryCurrency',
          'user.profilePicture',
          'user.linkedinProfile',
          'user.isVerify',
          'user.role',
          'user.createdAt',
          'user.updatedAt',
          'speakerProfile',
          'addresses',
        ]);

      // Apply search filter
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        queryBuilder.andWhere(
          '(LOWER(user.firstName) LIKE :searchTerm OR ' +
          'LOWER(user.lastName) LIKE :searchTerm OR ' +
          'LOWER(user.email) LIKE :searchTerm OR ' +
          'LOWER(user.mobile) LIKE :searchTerm)',
          { searchTerm },
        );
      }

      // Apply sorting
      // Handle fields that are in speakerProfile vs user table
      let orderBy: string;
      if (sortBy === 'position' || sortBy === 'companyName') {
        // These fields are in speakerProfile table
        orderBy = `speakerProfile.${sortBy}`;
      } else if (sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'email' || sortBy === 'mobile' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        // These fields are in user table
        orderBy = `user.${sortBy}`;
      } else {
        // Default to user table
        orderBy = `user.${sortBy}`;
      }
      queryBuilder.orderBy(orderBy, sortOrder);

      // Get total count before pagination
      const total = await queryBuilder.getCount();

      // Apply pagination only when limit is provided; otherwise return all
      const skip = usePagination ? (page - 1) * effectiveLimit : 0;
      const take = usePagination ? effectiveLimit : undefined;
      const speakers = take != null
        ? await queryBuilder.skip(skip).take(take).getMany()
        : await queryBuilder.getMany();

      // Format speakers data
      const formattedSpeakers = speakers.map((speaker) =>
        UserUtils.getAdminSpeakerInfo(speaker),
      );

      // Calculate pagination metadata
      const totalPages = usePagination ? Math.ceil(total / effectiveLimit) : 1;
      const hasNext = usePagination && page < totalPages;
      const hasPrev = usePagination && page > 1;

      return {
        data: formattedSpeakers,
        pagination: {
          page,
          limit: usePagination ? effectiveLimit : total,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Speakers with profiles retrieval');
    }
  }

  async getSpeakerWithProfileById(id: string): Promise<any> {
    try {
      const speaker = await this.userRepository.findOne({
        where: { id, role: UserRole.Speaker },
        relations: ['speakerProfile', 'addresses'],
        select: [
          'id', 'firstName', 'lastName', 'email', 'mobile', 'countryCurrency', 'profilePicture', 
          'linkedinProfile', 'isVerify', 'role', 'createdAt', 'updatedAt'
        ]
      });

      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      return UserUtils.getAdminSpeakerInfo(speaker);
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
