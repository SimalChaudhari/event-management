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
    qrCodeUrl: string;
    qrCodeImage: string; // Base64 image
    qrCodeSVG: string; // SVG version
    qrCodePNG: { filePath: string; fileUrl: string; fileName: string; folderPath: string }; // PNG file info
    userInfo: Partial<UserEntity>;
    isExisting: boolean; // Indicates if this is an existing QR code
  }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Check if user already has a QR code
      const existingQRCode = await this.getExistingQRCode(user);
      let isExisting = false;
      let qrCodeId: string;
      let qrCodeUrl: string;
      let qrCodeImage: string;
      let qrCodeSVG: string;
      let qrCodePNG: any;

      if (existingQRCode) {
        // Use existing QR code
        isExisting = true;
        qrCodeId = existingQRCode.qrCodeId;
        qrCodeUrl = existingQRCode.qrCodeUrl;
        qrCodeImage = existingQRCode.qrCodeImage;
        qrCodeSVG = existingQRCode.qrCodeSVG;
        qrCodePNG = existingQRCode.qrCodePNG;
        
        // Re-cache the data to extend expiration
        await this.cacheQRCodeData(qrCodeId, user, qrCodeUrl);
      } else {
        // Generate new QR code
        isExisting = false;
        qrCodeId = `qr_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        qrCodeUrl = `${process.env.APP_URL}/api/users/qr-code/scan/${qrCodeId}`;
        
        // Store QR code data in cache
        await this.cacheQRCodeData(qrCodeId, user, qrCodeUrl);

        // Generate actual QR code images
        qrCodeImage = await QRCodeUtils.generateQRCodeAsDataURL(qrCodeUrl);
        qrCodeSVG = await QRCodeUtils.generateQRCodeAsSVG(qrCodeUrl);
        
        // Save QR code as PNG file with username-email structure
        qrCodePNG = await QRCodeUtils.saveQRCodeAsPNG(
          qrCodeUrl, 
          user.firstName || 'user', 
          user.email
        );
      }

      // Return sanitized user data for QR code
      const sanitizedUser = UserUtils.sanitizeUserData(user);

      return {
        qrCodeId,
        qrCodeUrl,
        qrCodeImage,
        qrCodeSVG,
        qrCodePNG,
        userInfo: sanitizedUser,
        isExisting,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'QR code generation');
    }
  }

  /**
   * Check if user already has an existing QR code
   * @param user User entity
   * @returns Existing QR code data or null
   */
  private async getExistingQRCode(user: UserEntity): Promise<{
    qrCodeId: string;
    qrCodeUrl: string;
    qrCodeImage: string;
    qrCodeSVG: string;
    qrCodePNG: any;
  } | null> {
    try {
      // Check if user has a QR code file in their folder
      const emailName = user.email.split('@')[0];
      const folderName = `${user.firstName || 'user'}-${emailName}`;
      const qrCodesDir = path.join(process.cwd(), 'uploads', 'qr-codes', folderName);
      
      if (!fs.existsSync(qrCodesDir)) {
        return null;
      }

      const files = fs.readdirSync(qrCodesDir);
      const qrCodeFile = files.find(file => file.endsWith('.png'));
      
      if (!qrCodeFile) {
        return null;
      }

      // Check if we have cached data for this user
      const cachedData = await this.getQRCodeDataByUserId(user.id);
      if (!cachedData) {
        return null;
      }

      // Generate QR code images for the existing data
      const qrCodeImage = await QRCodeUtils.generateQRCodeAsDataURL(cachedData.qrCodeUrl);
      const qrCodeSVG = await QRCodeUtils.generateQRCodeAsSVG(cachedData.qrCodeUrl);
      
      const qrCodePNG = {
        filePath: path.join(qrCodesDir, qrCodeFile),
        fileUrl: `/uploads/qr-codes/${folderName}/${qrCodeFile}`,
        fileName: qrCodeFile,
        folderPath: folderName
      };

      return {
        qrCodeId: cachedData.qrCodeId,
        qrCodeUrl: cachedData.qrCodeUrl,
        qrCodeImage,
        qrCodeSVG,
        qrCodePNG
      };
    } catch (error) {
      console.error('Error checking existing QR code:', error);
      return null;
    }
  }

  /**
   * Get user information from scanned QR code
   * @param qrCodeId QR code identifier
   * @returns User information
   */
  async getUserInfoFromQRCode(qrCodeId: string): Promise<Partial<UserEntity>> {
    try {
      // Retrieve user data from cache or database
      const userData = await this.getQRCodeData(qrCodeId);
      
      if (!userData) {
        throw new ResourceNotFoundException('QR Code', qrCodeId);
      }

      // Return sanitized user data
      return UserUtils.sanitizeUserData(userData);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'QR code scanning');
    }
  }

  /**
   * Cache QR code data for later retrieval
   * @param qrCodeId QR code identifier
   * @param userData User data to cache
   * @param qrCodeUrl QR code URL to cache
   */
  private async cacheQRCodeData(qrCodeId: string, userData: UserEntity, qrCodeUrl?: string): Promise<void> {
    try {
      // Store in cache for 24 hours (86400000 ms)
      // You can enhance this with Redis or database storage for persistence
      const cacheKey = `qr_code_${qrCodeId}`;
      const cacheData = {
        userId: userData.id,
        userData: userData,
        qrCodeUrl: qrCodeUrl || '',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // For now, we'll use a simple in-memory approach
      // In production, use Redis or database storage
      if (!this.qrCodeCache) {
        this.qrCodeCache = new Map();
      }
      
      this.qrCodeCache.set(cacheKey, cacheData);

      // Clean up expired entries
      if (this.qrCodeCache) {
        this.cleanupExpiredQRCodes();
      }

      // Clean up old QR code PNG files (older than 24 hours)
      this.cleanupOldQRCodeFiles();
    } catch (error) {
      console.error('Error caching QR code data:', error);
    }
  }

  /**
   * Retrieve QR code data from cache by user ID
   * @param userId User ID
   * @returns Cached QR code data or null
   */
  private async getQRCodeDataByUserId(userId: string): Promise<{
    qrCodeId: string;
    qrCodeUrl: string;
    userData: UserEntity;
  } | null> {
    try {
      if (!this.qrCodeCache) {
        return null;
      }

      // Find cached data by user ID
      for (const [key, value] of this.qrCodeCache.entries()) {
        if (value.userId === userId) {
          // Check if expired
          if (new Date() > value.expiresAt) {
            this.qrCodeCache.delete(key);
            return null;
          }
          
          return {
            qrCodeId: key.replace('qr_code_', ''),
            qrCodeUrl: value.qrCodeUrl,
            userData: value.userData
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving QR code data by user ID:', error);
      return null;
    }
  }

  /**
   * Retrieve QR code data from cache
   * @param qrCodeId QR code identifier
   * @returns Cached user data or null
   */
  private async getQRCodeData(qrCodeId: string): Promise<UserEntity | null> {
    try {
      const cacheKey = `qr_code_${qrCodeId}`;
      
      if (!this.qrCodeCache) {
        return null;
      }

      const cachedData = this.qrCodeCache.get(cacheKey);
      
      if (!cachedData) {
        return null;
      }

      // Check if expired
      if (new Date() > cachedData.expiresAt) {
        this.qrCodeCache.delete(cacheKey);
        return null;
      }

      return cachedData.userData;
    } catch (error) {
      console.error('Error retrieving QR code data:', error);
      return null;
    }
  }

  /**
   * Clean up expired QR code entries
   */
  private cleanupExpiredQRCodes(): void {
    try {
      if (!this.qrCodeCache) {
        return;
      }

      const now = new Date();
      const expiredKeys: string[] = [];

      if (this.qrCodeCache) {
        for (const [key, value] of this.qrCodeCache.entries()) {
          if (now > value.expiresAt) {
            expiredKeys.push(key);
          }
        }

        expiredKeys.forEach(key => this.qrCodeCache!.delete(key));
      }
    } catch (error) {
      console.error('Error cleaning up expired QR codes:', error);
    }
  }

  // Private property for QR code cache
  private qrCodeCache: Map<string, any> | null = null;

  /**
   * Clean up old QR code PNG files from server
   */
  private cleanupOldQRCodeFiles(): void {
    try {
      const qrCodesDir = path.join(process.cwd(), 'uploads', 'qr-codes');
      if (!fs.existsSync(qrCodesDir)) {
        return;
      }

      const folders = fs.readdirSync(qrCodesDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      folders.forEach(folderName => {
        const folderPath = path.join(qrCodesDir, folderName);
        const folderStats = fs.statSync(folderPath);
        
        // Only process directories
        if (folderStats.isDirectory()) {
          const files = fs.readdirSync(folderPath);
          
          files.forEach(filename => {
            if (filename.endsWith('.png')) {
              const filePath = path.join(folderPath, filename);
              const stats = fs.statSync(filePath);
              const fileAge = now - stats.mtime.getTime();

              if (fileAge > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up old QR code file: ${folderName}/${filename}`);
                
                // If folder is empty after cleanup, remove the folder too
                const remainingFiles = fs.readdirSync(folderPath);
                if (remainingFiles.length === 0) {
                  fs.rmdirSync(folderPath);
                  console.log(`Removed empty folder: ${folderName}`);
                }
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('Error cleaning up old QR code files:', error);
    }
  }
}
