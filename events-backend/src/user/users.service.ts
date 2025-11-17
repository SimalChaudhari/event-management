//users.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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
import { AddressService } from './address.service';
import { AddressUtils } from '../utils/address.utils';
import { UserEntity, UserRole } from './users.entity';
import {
  deleteUserRelatedData,
  deleteProfilePicture,
} from '../utils/user-deletion.utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
    private readonly emailService: EmailService,
    private readonly speakerProfileService: SpeakerProfileService,
    private readonly addressService: AddressService,
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
 
  }


  async getAll(roles?: UserRole[], roleFilter?: string): Promise<Partial<UserEntity>[]> {
    try {
      let where = {};
      
      // If roleFilter is provided, override the roles parameter
      if (roleFilter) {
        if (roleFilter === 'exhibitor') {
          where = { role: UserRole.Exhibitor };
        } else if (roleFilter === 'user') {
          where = { role: UserRole.User };
        }
        // If roleFilter is provided but not 'exhibitor' or 'user', show both (no where clause)
      } else if (roles && roles.length > 0) {
        where = { role: In(roles) };
      }
      
      const users = await this.userRepository.find({
        where,
        relations: ['addresses'],
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
        relations: ['addresses'],
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
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(UserEntity, {
        where: { id },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', id);
      }

      // Delete all user-related data using utility function
      const profilePicturePath = await deleteUserRelatedData(
        queryRunner,
        id,
        {
          includePollData: false,
          errorContext: 'User deletion',
          profilePictureContext: 'User Profile Picture Deletion',
        },
      );

      await queryRunner.commitTransaction();

      // Delete profile picture from filesystem after successful transaction
      await deleteProfilePicture(
        profilePicturePath,
        id,
        this.errorHandler,
        'User Profile Picture Deletion',
      );

      return { message: 'User deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User deletion');
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    updateData: Partial<UserEntity> & {
      address?: string; // Frontend sends 'address' instead of 'street'
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      addressType?: string;
      isDefaultAddress?: boolean;
      apartment?: string;
      landmark?: string;
      addressLabel?: string;
      deliveryInstructions?: string;
    },
  ): Promise<Partial<UserEntity>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['addresses'],
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

      // Extract address data
      // Map 'address' to 'street' for frontend compatibility
      const {
        address,
        street: streetField,
        city,
        state,
        postalCode,
        country,
        addressType,
        isDefaultAddress,
        apartment,
        landmark,
        addressLabel,
        deliveryInstructions,
        password,
        id: userId,
        ...safeUpdateData
      } = updateData;
      
      // Use 'address' if provided, otherwise use 'street'
      const street = address || streetField;

      // Update the user
      Object.assign(user, safeUpdateData);
      const updatedUser = await this.userRepository.save(user);

      // Handle address update if address data is provided
      const addressData = AddressUtils.extractAddressData({
        street,
        city,
        state,
        postalCode,
        country,
        addressType,
        isDefaultAddress: isDefaultAddress !== undefined ? isDefaultAddress : true, // Default to true for profile updates
        apartment,
        landmark,
        addressLabel,
        deliveryInstructions,
      });

      if (AddressUtils.hasAnyAddressFields(addressData)) {
        await AddressUtils.updateUserAddress(
          this.addressService,
          id,
          addressData,
          this.errorHandler
        );
      }

      // Get updated user with addresses for response
      const userWithAddresses = await this.userRepository.findOne({
        where: { id },
        relations: ['addresses'],
      });

      if (!userWithAddresses) {
        throw new ResourceNotFoundException('User', id);
      }

      // Return sanitized user data with address information
      return UserUtils.sanitizeUserData(userWithAddresses);
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
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const speaker = await queryRunner.manager.findOne(UserEntity, {
        where: { id, role: UserRole.Speaker },
      });

      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', id);
      }

      // Delete all speaker-related data using utility function (including poll data)
      const profilePicturePath = await deleteUserRelatedData(
        queryRunner,
        id,
        {
          includePollData: true,
          errorContext: 'Speaker deletion',
          profilePictureContext: 'Speaker Profile Picture Deletion',
        },
      );

      await queryRunner.commitTransaction();

      // Delete profile picture from filesystem after successful transaction
      await deleteProfilePicture(
        profilePicturePath,
        id,
        this.errorHandler,
        'Speaker Profile Picture Deletion',
      );

      return { message: 'Speaker deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Speaker deletion');
    } finally {
      await queryRunner.release();
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
  }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Use user ID directly as QR code data (no URL, just the ID)
      const qrCodeId = userId;

      // Generate QR code image with just the user ID
      const qrCodeImage = await QRCodeUtils.generateQRCodeAsDataURL(qrCodeId);

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

  async getQRCodeImageFromQRCode(
    qrCodeId: string,
  ): Promise<{ qrCodeId: string; qrCodeImage: string }> {
    try {
      // Get user data directly from database using qrCodeId as userId
      const userId = qrCodeId;
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Generate QR code with just the user ID (no URL)
      // Generate and return QR code image as base64
      const qrCodeImage = await QRCodeUtils.generateQRCodeAsDataURL(qrCodeId);
      return {
        qrCodeId,
        qrCodeImage,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'QR code image generation');
    }
  }

  /**
   * Deactivate user account
   * After deactivation, user cannot login again
   * @param id User ID
   * @returns Updated user without sensitive data
   */
  async deactivateUser(id: string): Promise<Partial<UserEntity>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', id);
      }

      // Check if user is already deactivated
      if (!user.isActive) {
        throw new ConflictException('User account is already deactivated');
      }

      // Deactivate the user account
      await this.userRepository.update(id, { isActive: false });

      // Get the updated user to return
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        relations: ['addresses'],
      });

      if (!updatedUser) {
        throw new ResourceNotFoundException('User', id);
      }

      // Return sanitized user data
      return UserUtils.sanitizeUserData(updatedUser);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User deactivation');
    }
  }

  /**
   * Activate user account (for reactivation)
   * @param id User ID
   * @returns Updated user without sensitive data
   */
  async activateUser(id: string): Promise<Partial<UserEntity>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', id);
      }

      // Check if user is already activated
      if (user.isActive) {
        throw new ConflictException('User account is already active');
      }

      // Activate the user account
      await this.userRepository.update(id, { isActive: true });

      // Get the updated user to return
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        relations: ['addresses'],
      });

      if (!updatedUser) {
        throw new ResourceNotFoundException('User', id);
      }

      // Return sanitized user data
      return UserUtils.sanitizeUserData(updatedUser);
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User activation');
    }
  }
}

