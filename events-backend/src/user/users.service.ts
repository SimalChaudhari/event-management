//users.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity, UserRole } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { 
  ResourceNotFoundException, 
  DuplicateResourceException, 
  ForeignKeyConstraintException 
} from '../utils/exceptions/custom-exceptions';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async getAll(role?: UserRole): Promise<Partial<UserEntity>[]> {
    try {
      const where = role ? { role } : {};
      const users = await this.userRepository.find({ 
        where,
        order: { updatedAt: 'DESC' },
      });
      return users.map(({ password, ...rest }) => rest);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Users retrieval');
    }
  }
  async getById(id: string): Promise<Partial<UserEntity>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', id);
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User retrieval by ID');
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new ResourceNotFoundException('User', id);
      }

      // Check if user has registrations, orders, or other related data
      const relatedRegistrationsCount = await this.errorHandler.getRelatedDataCount(
        this.userRepository.manager.getRepository('RegisterEvent'),
        { userId: id },
        'User Registrations'
      );

      const relatedOrdersCount = await this.errorHandler.getRelatedDataCount(
        this.userRepository.manager.getRepository('Order'),
        { userId: id },
        'User Orders'
      );

      if (relatedRegistrationsCount > 0) {
        throw new ForeignKeyConstraintException(
          'User',
          'Registration',
          relatedRegistrationsCount,
          'delete'
        );
      }

      if (relatedOrdersCount > 0) {
        throw new ForeignKeyConstraintException(
          'User',
          'Order',
          relatedOrdersCount,
          'delete'
        );
      }

      // Delete profile picture from filesystem if exists
      if (user.profilePicture) {
        try {
          const filePath = path.resolve(user.profilePicture);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          this.errorHandler.logError(fileError, 'User Profile Picture Deletion', id);
          // Continue with user deletion even if file deletion fails
        }
      }

      await this.userRepository.remove(user);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForeignKeyConstraintException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User deletion');
    }
  }




async update(
  id: string,
  updateData: Partial<UserEntity>,
): Promise<Partial<UserEntity>> {
  try {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new ResourceNotFoundException('User', id);
    }

    // Check if email is being updated and already exists for another user
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email, id: Not(id) },
      });
      if (existingUser) {
        throw new DuplicateResourceException(`User ${updateData.email}`);
      }
    }

  // Remove sensitive fields from updateData
  const {
    password,
    id: userId,
    ...safeUpdateData
  } = updateData;

  // Update the user
  Object.assign(user, safeUpdateData);
  const updatedUser = await this.userRepository.save(user);

  // Remove sensitive fields from response
  const {
    password: _,
    ...result
  } = updatedUser;

  return result;
} catch (error) {
  if (
    error instanceof ResourceNotFoundException ||
    error instanceof DuplicateResourceException
  ) {
    throw error;
  }
  this.errorHandler.handleDatabaseError(error, 'User update');
}
}

  // Speaker-specific methods
  async getAllSpeakers(): Promise<Partial<UserEntity>[]> {
    try {
      const speakers = await this.userRepository.find({ 
        where: { role: UserRole.Speaker },
        order: { updatedAt: 'DESC' },
      });
      return speakers.map(({ password, ...rest }) => rest);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Speakers retrieval');
    }
  }

  async createSpeaker(speakerData: Partial<UserEntity>): Promise<Partial<UserEntity>> {
    try {
      // Check if speaker with same email already exists
      if (speakerData.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: speakerData.email },
        });

        if (existingUser) {
          throw new DuplicateResourceException(`User ${speakerData.email}`);
        }
      }

      // Set role to Speaker and create user
      const speakerUser = this.userRepository.create({
        ...speakerData,
        role: UserRole.Speaker,
        password: speakerData.password || 'temp123', // Set temporary password if not provided
      });

      const savedSpeaker = await this.userRepository.save(speakerUser);
      const { password, ...result } = savedSpeaker;
      return result;
    } catch (error) {
      if (error instanceof DuplicateResourceException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker creation');
    }
  }

  async getSpeakerById(id: string): Promise<Partial<UserEntity>> {
    try {
      const speaker = await this.userRepository.findOne({
        where: { id, role: UserRole.Speaker },
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      const { password, ...speakerWithoutPassword } = speaker;
      return speakerWithoutPassword;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker retrieval by ID');
    }
  }

  async updateSpeaker(id: string, updateData: Partial<UserEntity>): Promise<Partial<UserEntity>> {
    try {
      const speaker = await this.userRepository.findOne({
        where: { id, role: UserRole.Speaker },
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      // Check if email is being updated and already exists for another user
      if (updateData.email && updateData.email !== speaker.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateData.email, id: Not(id) },
        });
        if (existingUser) {
          throw new DuplicateResourceException(`User ${updateData.email}`);
        }
      }

      // Remove sensitive fields from updateData
      const {
        password,
        id: userId,
        role, // Don't allow role change through this method
        ...safeUpdateData
      } = updateData;

      // Update the speaker
      Object.assign(speaker, safeUpdateData);
      const updatedSpeaker = await this.userRepository.save(speaker);

      // Remove sensitive fields from response
      const {
        password: _,
        ...result
      } = updatedSpeaker;

      return result;
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

  async deleteSpeaker(id: string): Promise<{ message: string }> {
    try {
      const speaker = await this.userRepository.findOne({ 
        where: { id, role: UserRole.Speaker } 
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      // Check if speaker is associated with any events
      const relatedEventsCount = await this.errorHandler.getRelatedDataCount(
        this.userRepository.manager.getRepository('EventSpeaker'),
        { speakerId: id },
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
      if (speaker.profilePicture) {
        try {
          const filePath = path.resolve(speaker.profilePicture);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          this.errorHandler.logError(fileError, 'Speaker Profile Picture Deletion', id);
          // Continue with speaker deletion even if file deletion fails
        }
      }

      await this.userRepository.remove(speaker);
      return { message: 'Speaker deleted successfully' };
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

