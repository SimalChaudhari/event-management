import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorDto } from './exhibitor.dto';
import { UserEntity, UserRole } from '../user/users.entity';
import path from 'path';
import * as fs from 'fs';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { EmailService } from '../service/email.service';
import { generateRandomPassword } from '../utils/auth.utils';
import { UserUtils } from '../utils/user.utils';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException,
  ForeignKeyConstraintException,
} from '../utils/exceptions/custom-exceptions';

@Injectable()
export class ExhibitorService {
  constructor(
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
    private readonly emailService: EmailService,
  ) {}

  async createExhibitorWithUser(
    exhibitorDto: ExhibitorDto | Partial<ExhibitorDto>, 
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      mobile: string;
      password?: string;
      address?: string;
      profilePicture?: string;
    }
  ): Promise<Exhibitor> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });
      if (existingUser) {
        throw new DuplicateResourceException(`User ${userData.email}`);
      }

      // Create user first with Exhibitor role
      const userToCreate = {
        ...userData,
        role: UserRole.Exhibitor,
        password: userData.password || 'defaultPassword123', // Set default password if not provided
      };

      // Create user
      const newUser = this.userRepository.create(userToCreate);
      const savedUser = await this.userRepository.save(newUser);

      // Create exhibitor with the new user's ID
      const exhibitorData = {
        ...exhibitorDto,
        userId: savedUser.id,
      };

      const exhibitor = this.exhibitorRepository.create(exhibitorData);
      const savedExhibitor = await this.exhibitorRepository.save(exhibitor);
      
      // Return exhibitor with relations including user data
      return await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['promotionalOffers', 'user']
      }) || savedExhibitor;
    } catch (error) {
      if (error instanceof DuplicateResourceException || error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor and User creation');
    }
  }

  async createExhibitor(exhibitorDto: ExhibitorDto | Partial<ExhibitorDto>): Promise<Exhibitor> {
    try {
      // Check if user exists and validate they can be an exhibitor
      const user = await this.userRepository.findOne({
        where: { id: exhibitorDto.userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', exhibitorDto.userId);
      }

      // Check if user already has an exhibitor profile
      const existingExhibitor = await this.exhibitorRepository.findOne({
        where: { userId: exhibitorDto.userId },
      });
      if (existingExhibitor) {
        throw new DuplicateResourceException(`Exhibitor profile for user ${user.email}`);
      }

      const exhibitor = this.exhibitorRepository.create(exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(exhibitor);
      
      // Return exhibitor with relations including user data
      return await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['promotionalOffers', 'user']
      }) || savedExhibitor;
    } catch (error) {
      if (error instanceof DuplicateResourceException || error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor creation');
    }
  }

  async getAllExhibitors(): Promise<any[]> {
    try {
      const exhibitors = await this.exhibitorRepository.find({
        relations: ['promotionalOffers', 'user'],
      });
      
      // Use UserUtils to format each exhibitor with sanitized user data
      return exhibitors.map(exhibitor => UserUtils.formatExhibitorDocuments(exhibitor));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Exhibitors retrieval');
    }
  }

  async getExhibitorById(id: string): Promise<any> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ 
        where: { id },
        relations: ['promotionalOffers', 'user'],
      });
      
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Use UserUtils to format the exhibitor with sanitized user data
      return UserUtils.formatExhibitorDocuments(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor retrieval by ID');
    }
  }

  async getExhibitorEntityById(id: string): Promise<Exhibitor> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }
      return exhibitor;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor entity retrieval by ID');
    }
  }

  async updateExhibitor(id: string, exhibitorDto: Partial<ExhibitorDto>): Promise<Exhibitor> {
    try {
      const exhibitor = await this.getExhibitorEntityById(id);
      
      // If userId is being changed, validate the new user exists
      if (exhibitorDto.userId && exhibitorDto.userId !== exhibitor.userId) {
        const user = await this.userRepository.findOne({
          where: { id: exhibitorDto.userId },
        });
        if (!user) {
          throw new ResourceNotFoundException('User', exhibitorDto.userId);
        }

        // Check if new user already has an exhibitor profile
        const existingExhibitor = await this.exhibitorRepository.findOne({
          where: { userId: exhibitorDto.userId },
        });
        if (existingExhibitor && existingExhibitor.id !== id) {
          throw new DuplicateResourceException(`Exhibitor profile for user ${user.email}`);
        }
      }

      // If profile picture is being updated, also update the User table
      if (exhibitorDto.profilePicture) {
        await this.userRepository.update(exhibitor.userId, {
          profilePicture: exhibitorDto.profilePicture
        });
      }

      Object.assign(exhibitor, exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(exhibitor);
      
      // Return exhibitor with relations including user data
      return await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['promotionalOffers', 'user']
      }) || savedExhibitor;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor update');
    }
  }

  async deleteExhibitor(id: string): Promise<{ message: string }> {
    try {
      const exhibitor = await this.getExhibitorEntityById(id);
      
      // Delete associated files
      this.deleteExhibitorFiles(exhibitor);

      await this.exhibitorRepository.remove(exhibitor);
      return { message: 'Exhibitor deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor deletion');
    }
  }

  async updateExhibitorFiles(
    id: string,
    fileType: 'flyers' | 'documents' | 'eventImages',
    files: string[],
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      exhibitor[fileType] = files;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, `Exhibitor ${fileType} update`);
    }
  }

  async updateExhibitorDocuments(
    id: string,
    documents: string[],
    documentNames: string[],
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      exhibitor.documents = documents;
      exhibitor.documentNames = documentNames;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor documents update');
    }
  }

  // Helper method to delete exhibitor files
  private deleteExhibitorFiles(exhibitor: Exhibitor) {
    try {
      // Delete flyers if they exist
      if (exhibitor.flyers && exhibitor.flyers.length > 0) {
        exhibitor.flyers.forEach((flyerPath) => {
          const filePath = path.resolve(flyerPath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete documents if they exist
      if (exhibitor.documents && exhibitor.documents.length > 0) {
        exhibitor.documents.forEach((docPath) => {
          const filePath = path.resolve(docPath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Delete event images if they exist
      if (exhibitor.eventImages && exhibitor.eventImages.length > 0) {
        exhibitor.eventImages.forEach((imagePath) => {
          const filePath = path.resolve(imagePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    } catch (fileError) {
      this.errorHandler.logError(fileError, 'Exhibitor file deletion', exhibitor.id);
      // Continue with exhibitor deletion even if file deletion fails
    }
  }
}