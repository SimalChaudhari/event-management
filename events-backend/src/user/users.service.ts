//users.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity, UserRole } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { EmailService } from '../service/email.service';
import { PasswordUtils } from '../utils/password.utils';
import {
  EmailTemplateUtils,
  SpeakerCredentialsData,
  RoleSwitchCodeData,
} from '../utils/email-templates.utils';
import { SpeakerProfileService } from './speaker-profile.service';
import { CreateSpeakerDto } from './users.dto';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ForeignKeyConstraintException,
} from '../utils/exceptions/custom-exceptions';
import { UserUtils } from 'utils';
import { QRCodeUtils } from '../utils/qr-code.utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
    private readonly emailService: EmailService,
    private readonly speakerProfileService: SpeakerProfileService,
  ) {}

  // Helper function to send speaker credentials via email
  private async sendSpeakerCredentials(
    email: string,
    firstName: string,
    lastName: string,
    password: string,
  ): Promise<void> {
    const credentialsData: SpeakerCredentialsData = {
      email,
      firstName,
      lastName,
      password,
    };

    const mailOptions =
      EmailTemplateUtils.getSpeakerCredentialsEmailOptions(credentialsData);

    // Use the existing email service transporter
    await this.emailService['transporter'].sendMail(mailOptions);
    console.log(
      `Speaker credentials sent to ${email}: ${firstName} ${lastName}`,
    );
  }

  async getAll(roles?: UserRole[]): Promise<Partial<UserEntity>[]> {
    try {
      let where = {};
      if (roles && roles.length > 0) {
        where = { role: In(roles) };
      }
      const users = await this.userRepository.find({
        where,
        order: { updatedAt: 'DESC' },
      });
      return users.map((user) => UserUtils.sanitizeUserData(user));
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

      return UserUtils.sanitizeUserData(user);
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
      const relatedRegistrationsCount =
        await this.errorHandler.getRelatedDataCount(
          this.userRepository.manager.getRepository('RegisterEvent'),
          { userId: id },
          'User Registrations',
        );

      const relatedOrdersCount = await this.errorHandler.getRelatedDataCount(
        this.userRepository.manager.getRepository('Order'),
        { userId: id },
        'User Orders',
      );

      if (relatedRegistrationsCount > 0) {
        throw new ForeignKeyConstraintException(
          'User',
          'Registration',
          relatedRegistrationsCount,
          'delete',
        );
      }

      if (relatedOrdersCount > 0) {
        throw new ForeignKeyConstraintException(
          'User',
          'Order',
          relatedOrdersCount,
          'delete',
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
          this.errorHandler.logError(
            fileError,
            'User Profile Picture Deletion',
            id,
          );
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
      const { password, id: userId, ...safeUpdateData } = updateData;

      // Update the user
      Object.assign(user, safeUpdateData);
      const updatedUser = await this.userRepository.save(user);

      // Remove sensitive fields from response
      const { password: _, ...result } = updatedUser;

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
  async getAllSpeakers(): Promise<any[]> {
    try {
      // Use SpeakerProfileService to get speakers with their profiles
      return await this.speakerProfileService.getAllSpeakersWithProfiles();
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Speakers retrieval');
    }
  }

  async createSpeaker(
    speakerData: CreateSpeakerDto,
  ): Promise<Partial<UserEntity>> {
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

      // Generate random password if not provided
      const rawPassword =
        speakerData.password || PasswordUtils.generateRandomPassword();

      // Hash the password
      const hashedPassword = await PasswordUtils.hashPassword(rawPassword);

      // Set role to Speaker and create user
      const speakerUser = this.userRepository.create({
        ...speakerData,
        role: UserRole.Speaker,
        password: hashedPassword,
        isVerify: true,
      });

      const savedSpeaker = await this.userRepository.save(speakerUser);

      // Create speaker profile if companyName, position, or description is provided
      if (
        speakerData.companyName ||
        speakerData.position ||
        speakerData.description
      ) {
        try {
          await this.speakerProfileService.createProfile({
            userId: savedSpeaker.id,
            companyName: speakerData.companyName,
            position: speakerData.position,
            description: speakerData.description,
          });
        } catch (profileError) {
          this.errorHandler.logError(
            profileError,
            'Speaker Profile Creation',
            savedSpeaker.id,
          );
          // Continue without throwing error - speaker was created successfully
        }
      }

      // Send password to speaker's email
      if (speakerData.email && speakerData.firstName && speakerData.lastName) {
        try {
          await this.sendSpeakerCredentials(
            speakerData.email,
            speakerData.firstName,
            speakerData.lastName,
            rawPassword,
          );
        } catch (emailError) {
          this.errorHandler.logError(
            emailError,
            'Speaker Email Notification',
            savedSpeaker.id,
          );
          // Continue without throwing error - speaker was created successfully
        }
      }

      const { password, ...result } = savedSpeaker;
      return result;
    } catch (error) {
      if (error instanceof DuplicateResourceException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker creation');
    }
  }

  async getSpeakerById(id: string): Promise<any> {
    try {
      // Use SpeakerProfileService to get speaker with profile
      return await this.speakerProfileService.getSpeakerWithProfileById(id);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker retrieval by ID');
    }
  }

  async updateSpeaker(
    id: string,
    updateData: Partial<UserEntity> & {
      companyName?: string;
      position?: string;
      description?: string;
    },
  ): Promise<Partial<UserEntity>> {
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

      // Extract profile data
      const { companyName, position, description, ...userUpdateData } =
        updateData;

      // Remove sensitive fields from userUpdateData
      const {
        password,
        id: userId,
        role, // Don't allow role change through this method
        ...safeUpdateData
      } = userUpdateData;

      // Update the speaker user data
      Object.assign(speaker, safeUpdateData);
      const updatedSpeaker = await this.userRepository.save(speaker);

      // Update speaker profile if profile data is provided
      if (
        companyName !== undefined ||
        position !== undefined ||
        description !== undefined
      ) {
        try {
          const existingProfile =
            await this.speakerProfileService.getSpeakerProfileByUserId(id);
          if (existingProfile) {
            // Update existing profile
            await this.speakerProfileService.updateProfile(id, {
              companyName,
              position,
              description,
            });
          } else {
            // Create new profile
            await this.speakerProfileService.createProfile({
              userId: id,
              companyName,
              position,
              description,
            });
          }
        } catch (profileError) {
          this.errorHandler.logError(
            profileError,
            'Speaker Profile Update',
            id,
          );
          // Continue without throwing error - speaker was updated successfully
        }
      }

      // Remove sensitive fields from response
      const { password: _, ...result } = updatedSpeaker;

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
        where: { id, role: UserRole.Speaker },
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      // Check if speaker is associated with any events
      const relatedEventsCount = await this.errorHandler.getRelatedDataCount(
        this.userRepository.manager.getRepository('EventSpeaker'),
        { speakerId: id },
        'Speaker Events',
      );

      if (relatedEventsCount > 0) {
        throw new ForeignKeyConstraintException(
          'Speaker',
          'Event',
          relatedEventsCount,
          'delete',
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
          this.errorHandler.logError(
            fileError,
            'Speaker Profile Picture Deletion',
            id,
          );
          // Continue with speaker deletion even if file deletion fails
        }
      }

      // Delete speaker profile if exists (CASCADE should handle this, but explicit deletion for better error handling)
      try {
        await this.speakerProfileService.deleteProfile(id);
      } catch (profileError) {
        this.errorHandler.logError(
          profileError,
          'Speaker Profile Deletion',
          id,
        );
        // Continue with speaker deletion even if profile deletion fails
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

  // Role Switch Methods
  /**
   * Switch user role directly
   * @param userId User ID
   * @param newRole Role to switch to
   * @param boothCode Booth code (required only when switching TO exhibitor role)
   * @returns Updated user without sensitive data
   */
  async switchRole(
    userId: string,
    newRole: UserRole,
    boothCode?: string,
  ): Promise<Partial<UserEntity>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user is already in the requested role
      if (user.role === newRole) {
        throw new ConflictException(`You are already in the ${newRole} role`);
      }

      // If switching TO exhibitor role, booth code verification is required
      if (newRole === UserRole.Exhibitor) {
        if (!boothCode) {
          throw new ConflictException(
            'Booth code is required when switching to exhibitor role',
          );
        }

        // Import EventBooth repository to verify booth code
        const { EventBooth } = await import('../event/event-booth.entity');
        const eventBoothRepository =
          this.userRepository.manager.getRepository(EventBooth);

        // Verify the booth code exists and is active
        const eventBooth = await eventBoothRepository.findOne({
          where: {
            uniqueCode: boothCode,
            isActive: true,
          },
          relations: ['exhibitor'],
        });

        if (!eventBooth) {
          throw new ConflictException(
            'Invalid booth code. Please check your code and try again.',
          );
        }

        // Check if code is already used by another user
        if (eventBooth.usedBy && eventBooth.usedBy !== userId) {
          throw new ConflictException(
            'This booth code has already been used by another user. Each code can only be used once.',
          );
        }

        // If code is used by this user, allow reuse (reactivation case)
        if (eventBooth.usedBy === userId) {
          // Allow reuse - this is the same user reactivating their code
          console.log(
            `User ${userId} reusing their own booth code: ${boothCode}`,
          );
        }

        // Mark the booth code as used by this user
        await eventBoothRepository.update(
          { id: eventBooth.id },
          {
            usedBy: userId,
            usedAt: new Date(),
            isActive: false, // Deactivate the code after use
          },
        );
      }

      // If switching FROM exhibitor role TO user role, reactivate their booth code
      if (user.role === UserRole.Exhibitor && newRole === UserRole.User) {
        // Find and reactivate the user's booth code
        const { EventBooth } = await import('../event/event-booth.entity');
        const eventBoothRepository =
          this.userRepository.manager.getRepository(EventBooth);

        // Find the booth code used by this user
        const userBooth = await eventBoothRepository.findOne({
          where: { usedBy: userId },
        });

        if (userBooth) {
          // Reactivate the booth code for future use by the same user
          await eventBoothRepository.update(
            { id: userBooth.id },
            {
              isActive: true,
              usedBy: userId, // Keep the same user ID
              usedAt: new Date(), // Update timestamp
            },
          );
        }
      }

      // Update the role
      await this.userRepository.update(userId, { role: newRole });

      // Get the updated user to return
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!updatedUser) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Remove sensitive fields from response
      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Role switch');
    }
  }

  // QR Code Methods
  /**
   * Generate QR code for user
   * @param userId User ID
   * @returns QR code data with user information
   */
  async generateUserQRCode(userId: string): Promise<{
    qrCodeId: string;
    qrCodeImage: string; // Base64 image
    userInfo: Partial<UserEntity>;
  }> 
  {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Use user ID directly as QR code data
      const qrCodeId = userId;
      const qrCodeUrl = `${process.env.APP_URL}/api/users/qr-code/scan/${qrCodeId}`;
      
      // Generate QR code image
      const qrCodeImage = await QRCodeUtils.generateQRCodeAsDataURL(qrCodeUrl);

      // Return sanitized user data for QR code
      const sanitizedUser = UserUtils.sanitizeUserData(user);

      return {
        qrCodeId,
        qrCodeImage,
        userInfo: sanitizedUser,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'QR code generation');
    }
  }

  /**
   * Get user information from scanned QR code
   * @param qrCodeId QR code identifier (user ID)
   * @returns User information
   */
  async getUserInfoFromQRCode(qrCodeId: string): Promise<Partial<UserEntity>> {
    try {
      // Use qrCodeId directly as user ID
      const userId = qrCodeId;
      
      // Get user data directly from database
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Return sanitized user data
      return UserUtils.sanitizeUserData(user);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'QR code scanning');
    }
  }
}
