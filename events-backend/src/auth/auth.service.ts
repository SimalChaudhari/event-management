// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserDto } from './../user/users.dto';
import { UserEntity, AuthProvider } from './../user/users.entity';
import { UserRole } from './../user/users.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { Event } from '../event/event.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'service/email.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AddressService } from '../user/address.service';
import { AddressUtils } from '../utils/address.utils';
import { PasswordUtils } from '../utils/password.utils';
import { normalizeEmail } from '../utils/auth.utils';
import { 
  EmailTemplateUtils, 
  UserCredentialsData,
  UserQRCodeEmailData,
  EmailTemplatePayload,
} from '../utils/email-templates.utils';
import { CsvUserDto, CsvUploadResponseDto } from '../validation/auth.validation';
import { CsvUploadLogService } from '../logs/csv-upload-log.service';
import { EmailLogDetails, EmailRecipientLog } from '../logs/csv-upload-log.types';
import { EmailBatchService } from '../utils/email-batch.service';
import { CsvProcessorService } from '../utils/csv-processor.service';
import { csvUploadConfig } from '../utils/csv-upload.config';
import { QRCodeUtils } from '../utils/qr-code.utils';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OAuthAuthService } from './oauth-auth.service';
import { Type as RegisterEventType } from '../registerEvent/registerEvent.dto';

@Injectable()
export class AuthService {
  private oauthAuthService: OAuthAuthService | null = null; // Will be injected via setter to avoid circular dependency

  constructor(
    @InjectRepository(UserEntity)
    public userRepository: Repository<UserEntity>,
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly addressService: AddressService,
    private dataSource: DataSource,
    private readonly csvUploadLogService: CsvUploadLogService,
    private readonly emailBatchService: EmailBatchService,
    private readonly csvProcessorService: CsvProcessorService,
  ) {}

  // Setter for OAuthAuthService to avoid circular dependency
  setOAuthAuthService(oauthAuthService: any) {
    this.oauthAuthService = oauthAuthService;
  }

  private handleError(error: any): never {
    if (
      error instanceof BadRequestException ||
      error instanceof UnauthorizedException
    ) {
      throw error;
    }
    throw new InternalServerErrorException(
      'An unexpected error occurred. Please try again later.',
    );
  }

  private generateAccessToken(user: UserEntity): string {
    try {
      return this.jwtService.sign(
        {
          sub: user.id,
          id: user.id,
          firstName: user.firstName, // Include firstName
          lastName: user.lastName, // Include firstName
          email: user.email,
          role: user.role,
          // type: 'access' // Add a type claim
        },
        { expiresIn: '100d', secret: process.env.JWT_SECRET }, // Use a specific secret for access tokens
      ); // Access token expires in 15 minutes
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateRefreshToken(user: UserEntity): string {
    try {
      return this.jwtService.sign(
        {
          sub: user.id,
          id: user.id,
          firstName: user.firstName, // Include firstName
          lastName: user.lastName, // Include firstName
          email: user.email,
          role: user.role,
          // type: 'refresh' // Add a type claim
        },
        { expiresIn: '7d', secret: process.env.REFRESH_TOKEN_SECRET }, // Use a specific secret for refresh tokens
      ); // Refresh token expires in 7 days
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  /**
   * Sanitize user data: convert empty strings to null for optional fields
   * This prevents enum errors when empty strings are passed to enum fields
   */
  private sanitizeUserData(userData: any): any {
    const sanitized: any = { ...userData };
    
    // Convert empty strings to null for enum fields (industry)
    if (sanitized.industry === '' || sanitized.industry === undefined) {
      sanitized.industry = null;
    }
    
    // Convert empty strings to null for all optional string fields
    const optionalStringFields = [
      'salutation',
      'company',
      'designation',
      'linkedinProfile',
      'countryCurrency',
      'profilePicture',
    ];
    
    optionalStringFields.forEach(field => {
      if (sanitized[field] === '') {
        sanitized[field] = null;
      }
    });
    
    return sanitized;
  }

  // Register a new user
  async register(userDto: UserDto): Promise<{ message: string }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(userDto.email || '');
      const existingUser = await this.userRepository.findOne({
        where: [{ email: normalizedEmail }],
      });

      if (existingUser) {
        throw new BadRequestException(
          'Email address already taken. Try logging in or using another email.',
        );
      }

      if (!userDto.mobile) {
        throw new BadRequestException('Mobile is required');
      }

      // Check if this is admin creating a user vs user self-registration
      const isAdminCreatedUser =  userDto.role === UserRole.User;
      let plainPassword: string;
      
      if (isAdminCreatedUser && !userDto.password) {
        // Admin is creating user without password - auto-generate
        plainPassword = PasswordUtils.generateRandomPassword(12);
      } else if (!isAdminCreatedUser && !userDto.password) {
        // User self-registration requires password
        throw new BadRequestException('Password is required for user registration');
      } else {
        // Use provided password
        plainPassword = userDto.password!;
      }

      // Hash the password
      const hashedPassword = await PasswordUtils.hashPassword(plainPassword);

      // Generate OTP for email verification
      const otp = this.generateOTP();
      // const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create the new user with hashed password
      // Extract address data before creating user
      const {
        street,
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
        ...userData
      } = userDto;

      // Sanitize user data: convert empty strings to null for optional/enum fields
      const sanitizedUserData = this.sanitizeUserData(userData);

      const newUser = this.userRepository.create({
        ...sanitizedUserData,
        email: normalizedEmail, // Store normalized email
        password: hashedPassword,
        role: userDto.role || UserRole.User,
        acceptTerms: Boolean(userDto.acceptTerms),
        otp: otp,
        // otpExpiry: otpExpiry,
        isVerify: isAdminCreatedUser ? true : false, // Admin-created users are verified by default
      });

      const savedUser = (await this.userRepository.save(newUser) as unknown) as UserEntity;

      // Create address if address data is provided
      const addressData = AddressUtils.extractAddressData({
        street,
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
      });

      await AddressUtils.createUserAddress(
        this.addressService,
        savedUser.id,
        addressData
      );

      // Send appropriate email based on registration type
      if (!userDto.email || !userDto.firstName || !userDto.lastName) {
        throw new BadRequestException('Email, firstName and lastName are required');
      }

      if (isAdminCreatedUser && !userDto.password) {
        // Send credentials email for admin-created users (when password was auto-generated)
        try {
          const credentialsData: UserCredentialsData = {
            email: userDto.email,
            firstName: userDto.firstName,
            lastName: userDto.lastName,
            password: plainPassword,
          };

          const mailOptions = EmailTemplateUtils.getUserCredentialsEmailOptions(credentialsData);
          await this.emailService['transporter'].sendMail(mailOptions);
          
 
        } catch (emailError) {
          console.error('Error sending credentials email:', emailError);
          // Continue without throwing error - user was created successfully
        }

        return {
          message: "User account created successfully. Login credentials have been sent to the user's email address.",
        };
      } else if (isAdminCreatedUser && userDto.password) {
        // Admin created user with provided password - just confirm creation
        return {
          message: "User account created successfully with the provided password.",
        };
      } else {
        // Send OTP email for user self-registration
        await this.emailService.sendWelcomeEmail(userDto.email, userDto.firstName, userDto.lastName, otp);

        return {
          message:
            "We've sent a One-Time Password (OTP) to your registered email address. Please check your inbox and enter the OTP to verify your account. Once your account is verified, you can proceed to the login page.",
        };
      }
    } catch (error) {
      console.log(error);
      this.handleError(error);
    }
  }

  // Login a user
  async login(userDto: UserDto): Promise<{
    message: string;
    user?: Partial<UserEntity>;
    accessToken?: string;
    refreshToken?: string;
    requiresVerification?: boolean;
    verificationCode?: string;
  }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(userDto.email || '');
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new UnauthorizedException(
          'Email or password not recognized. Create an account to get started.',
        );
      }

      if (!userDto.password) {
        throw new BadRequestException('Password is required');
      }

      const isPasswordValid = await bcrypt.compare(
        userDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException(
          'The email or password you entered is incorrect. Please try again.',
        );
      }

      // Check if user account is deactivated
      if (user.isActive === false) {
        throw new UnauthorizedException(
          'Your account has been deactivated. Please contact the administrator for assistance.',
        );
      }

      // Check if user is not verified
      if (!user.isVerify) {
        // Generate new OTP for verification
        const otp = this.generateOTP();
        
        // Update user with new OTP
        user.otp = otp;
        await this.userRepository.save(user);

        // Send OTP via email
        await this.emailService.sendWelcomeEmail(
          user.email, 
          user.firstName, 
          user.lastName, 
          otp
        );

        // Return special response for non-verified users
        return {
          message: 'Please verify your email address to continue. We have sent a new OTP to your email.',
          requiresVerification: true,
          verificationCode: 'EMAIL_VERIFICATION_REQUIRED',
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            isVerify: user.isVerify,
          },
        };
      }

      // User is verified, proceed with normal login
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Save the refresh token in the database
      user.refreshToken = refreshToken;
      await this.userRepository.save(user);

      // Only return specific user fields
      const sanitizedUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        isVerify: user.isVerify,
      };

      return {
        message: 'Login successful',
        user: sanitizedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // events-backend/src/auth/auth.service.ts

  async refreshToken(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Decode the refresh token to get the user ID
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      // Find the user by ID and verify the refresh token
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, refreshToken: oldRefreshToken },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update the refresh token in the database
      user.refreshToken = newRefreshToken;
      await this.userRepository.save(user);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async checkUserExists(email: string): Promise<{
    success: boolean;
    message: string;
    data?: Partial<UserEntity>;
  }> {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = normalizeEmail(email);
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (user) {
      return {
        success: true,
        message: 'Email address already taken. Try logging in or using another email.',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } else {
      return {
        success: false,
        message: 'User does not exist.',
      };
    }
  }

  // admin
  async adminLogin(userDto: UserDto): Promise<{
    message: string;
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(userDto.email || '');
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

   
      if (!user || user.role !== 'admin') {
        // Check if user is an admin
        throw new UnauthorizedException('Invalid admin credentials');
      }

      // Check if user account is deactivated
      if (user.isActive === false) {
        throw new UnauthorizedException(
          'Your account has been deactivated. Please contact the administrator for assistance.',
        );
      }

      if (!user.isVerify) {
        throw new UnauthorizedException(
          'User is not verified. Please verify your email.',
        );
      }

      if (!userDto.password) {
        throw new BadRequestException('Password is required');
      }

      const isPasswordValid = await bcrypt.compare(
        userDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      user.refreshToken = refreshToken;
      const savedUser = await this.userRepository.save(user);

      return {
        message: 'Admin login successful',
        user: savedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
     throw this.handleError(error);
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          'New password and confirm password do not match',
        );
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password = hashedPassword;
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async signout(
    userId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // 🔄 AUTO SSO LOGOUT: If user logged in via OAuth/SSO, revoke their Salesforce token
      if (user.authProvider === AuthProvider.OAUTH && user.socialAccessToken) {
        console.log(`🔐 SSO User detected - Revoking Salesforce token for: ${user.email}`);
        
        try {
          if (this.oauthAuthService) {
            const revokeResult = await this.oauthAuthService.revokeSalesforceToken(user.socialAccessToken);
            
            if (revokeResult.success) {
              console.log(`✅ SSO token revoked successfully for: ${user.email}`);
            } else {
              console.log(`⚠️ SSO token revocation failed for: ${user.email}, proceeding with local logout`);
            }
          }
          
          // Clear SSO tokens from database
          user.socialAccessToken = null as any;
          user.socialRefreshToken = null as any;
        } catch (ssoError) {
          console.error('SSO logout error:', ssoError);
          // Don't fail the entire logout if SSO revocation fails
        }
      }

      // Extract token info to get expiration time
      const decodedToken = this.jwtService.decode(token);
      if (decodedToken && typeof decodedToken === 'object') {
        const exp = decodedToken.exp as number;

        // Calculate how long until token expires (in seconds)
        const ttl = exp - Math.floor(Date.now() / 1000);

        if (ttl > 0) {
          // Add token to blacklist with TTL equal to remaining time until expiration
          await this.cacheManager.set(`blacklisted_${token}`, true, ttl * 1000);
        }
      }

      // Auto-change role from exhibitor to user when logging out
      if (user.role === UserRole.Exhibitor) {
        // Change role back to user
        user.role = UserRole.User;
        
        // Reactivate the user's booth code if they had one
        try {
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
        } catch (boothError) {
          // Log error but don't fail the logout process
          console.error('Error reactivating booth code during logout:', boothError);
        }
      }

      // Clear refresh token
      user.refreshToken = null as any;
      await this.userRepository.save(user);

      const logoutMessage = user.authProvider === AuthProvider.OAUTH 
        ? 'Logged out successfully from both app and SSO'
        : 'Logged out successfully';

      return {
        success: true,
        message: logoutMessage,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Add a method to check if a token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return !!(await this.cacheManager.get(`blacklisted_${token}`));
  }

  // Verify OTP
  async verifyOTP(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(email);
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user is already verified
      if (user.isVerify) {
        return {
          success: true,
          message:
            'Your account is already verified. You can proceed to login.',
        };
      }

      if (!user.otp || user.otp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }

      // if (!user.otpExpiry || new Date() > user.otpExpiry) {
      //   throw new BadRequestException('OTP has expired');
      // }

      // Mark user as verified and clear OTP after successful verification
      user.isVerify = true;
      user.otp = null as any;
      // user.otpExpiry = null as any;
      await this.userRepository.save(user);

      return {
        success: true,
        message:
          'OTP verified successfully. Your account is now verified. You can now login.',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // OTP-based forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(email);
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new BadRequestException('Email not found');
      }
  
      // Generate OTP
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP and expiry time
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await this.userRepository.save(user);

      try {
        await this.emailService.sendOTP(email,user.firstName,user.lastName, otp);
        return {
          message:
            "We've successfully sent an OTP to your email. Please check your inbox and enter the 6-digit code.",
        };
      } catch (emailError) {
        throw new BadRequestException(
          'Failed to send OTP. Please try again later.',
        );
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async resendOTP(email: string): Promise<{ message: string }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(email);
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new BadRequestException('Email not found');
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save new OTP and expiry time
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await this.userRepository.save(user);

      try {
        await this.emailService.sendOTP(email, user.firstName, user.lastName, otp);
        return {
          message:
            "We've successfully resent the OTP to your email. Please check your inbox and enter the 6-digit code.",
        };
      } catch (emailError) {
        throw new BadRequestException(
          'Failed to send OTP. Please try again later.',
        );
      }
    } catch (error) {
      this.handleError(error);
    }
  }


  // Reset password with OTP verification
  async resetPasswordWithOTP(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(email);
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.otp || user.otp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }

      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        throw new BadRequestException('OTP has expired');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear OTP data
      user.password = hashedPassword;
      user.otp = null as any;
      user.otpExpiry = null as any;
      await this.userRepository.save(user);

      return {
        message:
          'Password reset successful. You can now login with your new password.',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Method to resend OTP for non-verified users during login
  async resendLoginOTP(email: string): Promise<{ message: string }> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = normalizeEmail(email);
      const user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.isVerify) {
        throw new BadRequestException('User is already verified');
      }

      // Generate new OTP
      const otp = this.generateOTP();
      
      // Update user with new OTP
      user.otp = otp;
      await this.userRepository.save(user);

      // Send OTP via email
      await this.emailService.sendWelcomeEmail(
        user.email, 
        user.firstName, 
        user.lastName, 
        otp
      );

      return {
        message: 'A new OTP has been sent to your email address. Please check your inbox and enter the code to verify your account.',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * PROFESSIONAL CSV Upload method with advanced batch processing
   * 
   * Key Features:
   * 1. Professional CSV validation and processing
   * 2. Advanced email batch service with retry logic
   * 3. Comprehensive logging and monitoring
   * 4. Configurable email provider settings
   * 5. Real-time progress tracking
   * 6. Professional error handling and recovery
   */
  async uploadCsvUsers(
    csvData: CsvUserDto[],
    adminId: string = 'system',
    fileName: string = 'upload.csv',
    eventId?: string,
  
  ): Promise<CsvUploadResponseDto> {
    try {
      const startTime = Date.now();
      const sessionId = uuidv4();

      console.log(`🚀 PROFESSIONAL CSV UPLOAD: Processing ${csvData.length} users...`);

      // Event is optional - if provided, associate users with event and send QR codes
      let event = null;
      if (eventId) {
        event = await this.eventRepository.findOne({
          where: { id: eventId },
          select: ['id', 'name', 'startDate'],
        });

        if (!event) {
          throw new BadRequestException('Selected event could not be found');
        }
      }

      // Create initial log entry
      await this.csvUploadLogService.createLogEntry({
        sessionId,
        adminId,
        fileName,
        originalFileName: fileName,
    
        totalRecords: csvData.length,
        status: 'processing',
        emailSendingEnabled: csvUploadConfig.isEmailSendingEnabled(),
      });

      // Step 1: Process users (create/update)
      const userProcessingResult = await this.processUsersFromCsv(csvData);

      const processingTime = Date.now() - startTime;
      const existingUsersSkipped = userProcessingResult.existingUsersCount - userProcessingResult.usersToUpdate.length;

      const normalizedEmails = Array.from(
        new Set(csvData.map((user) => normalizeEmail(user.email))),
      );

      const usersForAssociation = await this.userRepository.find({
        where: normalizedEmails.map((email) => ({ email })),
        select: ['id', 'email', 'firstName', 'lastName', 'salutation'],
      });

      // Associate users with event if eventId is provided
      let eventAssociationResult = { registrationsCreated: 0, registrationsSkipped: 0 };
      if (eventId && event) {
        eventAssociationResult = await this.associateUsersWithEvent(
          usersForAssociation.map((user) => user.id),
          eventId,
        );
      }

      // Prepare email payloads based on scenario
      let emailPayloads: EmailTemplatePayload[] = [];
      
      if (eventId && event) {
        // Scenario 2: With event registration
        // - New users: credentials + QR code (showCredentials = true)
        // - Existing users: QR code only (showCredentials = false)
        const qrEmailPayloads = await this.prepareQrEmailPayloads(
          usersForAssociation,
          userProcessingResult.emailsToNotify,
          event.name,
          userProcessingResult.newUserPasswords,
          userProcessingResult.existingUserEmails,
          event.startDate,
        );
        emailPayloads = qrEmailPayloads;
      } else {
        // Scenario 1: Without event registration
        // - New users: credentials only
        // - Existing users: no email
        const credentialsPayloads: UserCredentialsData[] = [];
        for (const user of usersForAssociation) {
          const normalizedEmail = normalizeEmail(user.email);
          const password = userProcessingResult.newUserPasswords.get(normalizedEmail);
          
          // Only send credentials to new users
          if (password) {
            const emailEntry = userProcessingResult.emailsToNotify.find(
              e => normalizeEmail(e.email) === normalizedEmail
            );
            
            credentialsPayloads.push({
              email: user.email,
              firstName: user.firstName || emailEntry?.firstName || '',
              lastName: user.lastName || emailEntry?.lastName || '',
              password: password,
            });
          }
        }
        emailPayloads = credentialsPayloads;
      }

      let recipientSnapshot: EmailRecipientLog[] = [];
      if (emailPayloads.length > 0) {
        recipientSnapshot = emailPayloads.map((payload) => ({
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          salutation: 'salutation' in payload ? payload.salutation : undefined,
          status: 'pending',
          success: false,
          attempts: [],
          retried: false,
        }));
      }

      // Step 2: Send emails in BACKGROUND (don't wait for them)
      let emailsToSendCount = 0;
      if (csvUploadConfig.isEmailSendingEnabled() && emailPayloads.length > 0) {
        emailsToSendCount = emailPayloads.length;
        const emailType = eventId ? 'QR code' : 'credentials';
        console.log(`📧 Scheduling ${emailsToSendCount} ${emailType} emails to be sent in background...`);
        
        // Get email configuration based on provider
        const emailConfig = csvUploadConfig.getEmailBatchConfig();
        
        // Send emails asynchronously in background (NO AWAIT - don't wait for completion)
        this.sendEmailsInBackground(
          emailPayloads,
          sessionId,
          emailConfig
        ).then(() => {
          console.log(`✅ Background ${emailType} email sending completed for session ${sessionId}`);
        }).catch((error) => {
          console.error(`❌ Background ${emailType} email sending failed for session ${sessionId}:`, error);
        });
      }

      if (userProcessingResult.skippedUsers.length > 0) {
        console.log(`\n--- SKIPPED USERS ---`);
        userProcessingResult.skippedUsers.forEach(skipped => {
          console.log(`  ⚠️  ${skipped}`);
        });
      }
    

      // Update CSV upload log entry with user creation completion
      // Status: 'users_created' if emails pending, 'completed' if no emails to send
      const uploadStatus = emailsToSendCount > 0 ? 'processing' : 'completed';
      
      const initialEmailDetails: EmailLogDetails | undefined = emailsToSendCount > 0 ? {
        totals: {
          total: emailsToSendCount,
          sent: 0,
          failed: 0,
          pending: emailsToSendCount,
          retried: 0,
        },
        processingTimeMs: processingTime,
        emailSendingEnabled: csvUploadConfig.isEmailSendingEnabled(),
        recipients: recipientSnapshot,
      } : undefined;

      await this.csvUploadLogService.updateLogEntry(sessionId, {
        status: uploadStatus,
      
        recordsProcessed: csvData.length,
        newUsersCreated: userProcessingResult.newUsersCreated,
        existingUsersUpdated: userProcessingResult.usersToUpdate.length,
        recordsSkipped: existingUsersSkipped,
        passwordsGenerated: userProcessingResult.passwordsGenerated,
        emailsTotal: emailsToSendCount,
        emailsPending: emailsToSendCount,
        emailsSent: 0, // Will be updated by background process
        emailsFailed: 0,
        processingTimeMs: processingTime,
        skippedRecords: userProcessingResult.skippedUsers,
        emailDetails: initialEmailDetails,
        summary: `${emailsToSendCount > 0 
          ? `Users Created: ${userProcessingResult.newUsersCreated}, Updated: ${userProcessingResult.usersToUpdate.length}, Skipped: ${existingUsersSkipped} | Emails: ${emailsToSendCount} pending (${eventId ? 'QR' : 'credentials'} processing in background)` 
          : `Users Created: ${userProcessingResult.newUsersCreated}, Updated: ${userProcessingResult.usersToUpdate.length}, Skipped: ${existingUsersSkipped} | No emails to send`
        }${event ? ` | Event: ${event.name} (${eventAssociationResult.registrationsCreated} registrations, ${eventAssociationResult.registrationsSkipped} already registered)` : ' | No event association'}`
      });

 

      // Prepare final response - return immediately without waiting for emails
      const emailMessage = emailsToSendCount > 0 
        ? `${emailsToSendCount} ${eventId ? 'QR code' : 'credentials'} emails are being sent in background.`
        : '';
      const eventMessage = event 
        ? ` Users associated with ${event.name}.`
        : '';
      
      const response: CsvUploadResponseDto = {
        message: `CSV upload completed successfully! ${userProcessingResult.newUsersCreated} users created, ${userProcessingResult.usersToUpdate.length} users updated. ${emailMessage}${eventMessage}`,
        totalProcessed: csvData.length.toString(),
        newUsersCreated: userProcessingResult.newUsersCreated.toString(),
        existingUsersSkipped: existingUsersSkipped.toString(),
        passwordsGenerated: userProcessingResult.passwordsGenerated.toString(),
        emailsSent: '0', // Emails are being sent in background
        emailsFailed: '0',
        details: `Processing time: ${processingTime}ms`,
        skippedUsers: userProcessingResult.skippedUsers,
        emailStatus: emailsToSendCount > 0 ? {
          totalEmails: emailsToSendCount,
          emailsSent: 0,
          emailsFailed: 0,
          emailsProcessing: emailsToSendCount,
          status: 'background_processing'
        } : {
          totalEmails: 0,
          emailsSent: 0,
          emailsFailed: 0,
          emailsProcessing: 0,
          status: 'disabled'
        },
        sessionId: sessionId,
        eventAssociation: event ? {
          eventId: event.id,
          eventName: event.name,
          registrationsCreated: eventAssociationResult.registrationsCreated,
          registrationsSkipped: eventAssociationResult.registrationsSkipped,
        } : undefined,
      };

      return response;

    } catch (error) {
      console.error('❌ Professional CSV upload failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send emails in background without blocking the response
   */
  private async sendEmailsInBackground(
    emailsToSend: EmailTemplatePayload[],
    sessionId: string,
    emailConfig: any
  ): Promise<void> {
    try {
      console.log(`📧 Starting email batch processing for ${emailsToSend.length} emails...`);
      
      const emailResult = await this.emailBatchService.sendEmailsInBatches(
        emailsToSend,
        sessionId,
        emailConfig
      );
      
      console.log(`\n📧 Email Sending Complete - ${emailResult.emailsSent}/${emailResult.totalEmails} sent (${((emailResult.emailsSent / emailResult.totalEmails) * 100).toFixed(1)}% success)`);
      
      // Update CSV upload log entry with email completion status - NOW STATUS BECOMES 'COMPLETED'
      const finalStatus = emailResult.success
        ? 'completed'
        : emailResult.emailsPending > 0
          ? 'processing'
          : emailResult.emailsSent > 0
            ? 'partial'
            : 'failed';
      
      await this.csvUploadLogService.updateLogEntry(sessionId, {
        emailsSent: emailResult.emailsSent,
        emailsFailed: emailResult.emailsFailed,
        emailsPending: emailResult.emailsPending,
        processingTimeMs: emailResult.processingTimeMs,
        status: finalStatus, // NOW COMPLETED!
        emailDetails: emailResult.logDetails,
        summary: emailResult.message,
      });
      
      console.log(`🎉 Status: ${finalStatus.toUpperCase()} - Background processing finished\n`);
      
    } catch (error) {
      console.error(`❌ Email sending failed:`, error instanceof Error ? error.message : error);
      
      // Update log entry with error status
      try {
        const failureTimestamp = new Date().toISOString();
        const failureMessage = error instanceof Error ? error.message : 'Unknown error';
        const failureRecipients: EmailRecipientLog[] = emailsToSend.map((payload) => ({
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
              status: 'failed',
          success: false,
          attempts: [
            {
              attempt: 1,
              status: 'failed',
              timestamp: failureTimestamp,
              errorMessage: failureMessage,
            },
          ],
          retried: false,
          lastUpdatedAt: failureTimestamp,
          notes: 'Email batch aborted due to error',
        }));

        const failureDetails: EmailLogDetails = {
          totals: {
            total: emailsToSend.length,
            sent: 0,
            failed: emailsToSend.length,
            pending: 0,
            retried: 0,
          },
          processingTimeMs: 0,
          emailSendingEnabled: csvUploadConfig.isEmailSendingEnabled(),
          completedAt: failureTimestamp,
          recipients: failureRecipients,
        };

        await this.csvUploadLogService.updateLogEntry(sessionId, {
          status: 'failed',
          emailsFailed: emailsToSend.length,
          emailsPending: 0,
          emailDetails: failureDetails,
          summary: `Email batch failed: ${failureMessage}`,
          errorDetails: {
            type: 'email_sending_failed',
            message: failureMessage,
            failedAt: failureTimestamp
          }
        });
      } catch (updateError) {
        console.error(`❌ Failed to update error status:`, updateError);
      }
    }
  }

  /**
   * Process users from CSV data with professional error handling
   */
  private async processUsersFromCsv(csvData: CsvUserDto[]): Promise<{
    newUsersCreated: number;
    usersToUpdate: Array<{id: string, password: string}>;
    emailsToNotify: Array<{ email: string; firstName: string; lastName: string; salutation?: string }>;
    skippedUsers: string[];
    passwordsGenerated: number;
    existingUsersCount: number;
    newUserPasswords: Map<string, string>; // Map of normalized email to plain text password for new users
    existingUserEmails: Set<string>; // Set of normalized emails for existing users
  }> {
    // Bulk query for existing users - normalize emails for case-insensitive comparison
    const csvEmails = csvData.map(user => normalizeEmail(user.email));
    const existingUsers = await this.userRepository.find({
      where: csvEmails.map(email => ({ email })),
      select: ['id', 'email', 'firstName', 'lastName', 'password']
    });

    // Create lookup map for O(1) performance - use normalized emails
    const existingUsersMap = new Map();
    existingUsers.forEach(user => {
      existingUsersMap.set(normalizeEmail(user.email), user);
    });

    // Prepare bulk operations data
    const usersToCreate: any[] = [];
    const usersToUpdate: Array<{id: string, password: string, company?: string, designation?: string, salutation?: string}> = [];
    const emailsToNotify: Array<{ email: string; firstName: string; lastName: string; salutation?: string }> = [];
    const skippedUsers: string[] = [];
    let passwordsGenerated = 0;
    const newUserPasswords = new Map<string, string>(); // Track plain text passwords for new users
    const existingUserEmails = new Set<string>(); // Track existing user emails

    // Process each user
    for (const userData of csvData) {
      const normalizedEmail = normalizeEmail(userData.email);
      const existingUser = existingUsersMap.get(normalizedEmail);

      if (userData.email) {
        emailsToNotify.push({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
         
        });
      }

      if (existingUser) {
        // Track existing user email
        existingUserEmails.add(normalizedEmail);
        
        // Existing user - update password if needed, and also update company/designation
        if (!existingUser.password || existingUser.password.trim() === '') {
          const randomPassword = PasswordUtils.generateRandomPassword(12);
          usersToUpdate.push({
            id: existingUser.id,
            password: await PasswordUtils.hashPassword(randomPassword),
            company: userData.company,
            designation: userData.designation,
         
          });
          passwordsGenerated++;
        } else {
          // User exists and has password - still update company/designation/salutation if provided
          if (userData.company || userData.designation || userData.salutation) {
            usersToUpdate.push({
              id: existingUser.id,
              password: existingUser.password, // Keep existing password
              company: userData.company,
              designation: userData.designation,
              salutation: userData.salutation,
            });
          } else {
            // User exists and has password - skip
            skippedUsers.push(`${existingUser.email} (already has password)`);
          }
        }
      } else {
        // New user - prepare for bulk creation
        const randomPassword = PasswordUtils.generateRandomPassword(12);
        // Store plain text password for email sending
        newUserPasswords.set(normalizedEmail, randomPassword);
        const userDataToSanitize: any = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          mobile: userData.mobile,
          salutation: userData.salutation,
          company: userData.company,
          designation: userData.designation,
        };
        // Only include industry if it exists in userData
        if ('industry' in userData) {
          userDataToSanitize.industry = (userData as any).industry;
        }
        
        const sanitizedData = this.sanitizeUserData(userDataToSanitize);
        
        usersToCreate.push({
          ...sanitizedData,
          email: normalizedEmail, // Store normalized email
          password: await PasswordUtils.hashPassword(randomPassword),
          role: UserRole.User,
          isVerify: true,
          authProvider: AuthProvider.LOCAL,
        });
        passwordsGenerated++;
      }
    }

    // Execute bulk database operations
    let newUsersCreated = 0;
    
    // Bulk create new users
    if (usersToCreate.length > 0) {
      try {
        await this.userRepository.insert(usersToCreate);
        newUsersCreated = usersToCreate.length;
      } catch (createError: any) {
        console.error('❌ Bulk creation failed, using fallback:', createError?.message);
        
        // Fallback to individual creation
        for (const userData of usersToCreate) {
          try {
            const sanitizedData = this.sanitizeUserData(userData);
            const newUser = this.userRepository.create(sanitizedData);
            await this.userRepository.save(newUser);
            newUsersCreated++;
          } catch (error: any) {
            console.error(`❌ Failed to create user ${userData.email}:`, error?.message);
          }
        }
      }
    }

    // Bulk update existing users
    if (usersToUpdate.length > 0) {
      try {
        const updatePromises = usersToUpdate.map(updateData => {
          const existingUser = existingUsers.find(u => u.id === updateData.id);
          const updateFields: any = {};
          
          // Only update password if it's a new hashed password (different from existing)
          if (updateData.password && existingUser && updateData.password !== existingUser.password) {
            updateFields.password = updateData.password;
          }
          
          // Update company and designation if provided
          if (updateData.company !== undefined) updateFields.company = updateData.company;
          if (updateData.designation !== undefined) updateFields.designation = updateData.designation;
          if (updateData.salutation !== undefined) updateFields.salutation = updateData.salutation;
          
          return this.userRepository.update({ id: updateData.id }, updateFields);
        });
        await Promise.all(updatePromises);
      } catch (updateError) {
        console.error('❌ Bulk update failed:', updateError);
      }
    }

    return {
      newUsersCreated,
      usersToUpdate,
      emailsToNotify,
      skippedUsers,
      passwordsGenerated,
      existingUsersCount: existingUsers.length,
      newUserPasswords,
      existingUserEmails
    };
  }

  private async prepareQrEmailPayloads(
    users: Array<{ id: string; email: string; firstName: string; lastName: string; salutation?: string }>,
    emailsToNotify: Array<{ email: string; firstName: string; lastName: string; salutation?: string }>,
    eventName: string,
    newUserPasswords?: Map<string, string>,
    existingUserEmails?: Set<string>,
    eventStartDate?: Date | string,
  ): Promise<UserQRCodeEmailData[]> {
    const userMap = new Map<string, { id: string; email: string; firstName: string; lastName: string; salutation?: string }>();
    users.forEach((user) => {
      userMap.set(normalizeEmail(user.email), user);
    });

    const uniqueEmailMap = new Map<string, { email: string; firstName: string; lastName: string; salutation?: string }>();
    emailsToNotify.forEach((entry) => {
      if (!entry.email) {
        return;
      }
      const normalized = normalizeEmail(entry.email);
      if (!uniqueEmailMap.has(normalized)) {
        uniqueEmailMap.set(normalized, entry);
      }
    });

    const payloads: UserQRCodeEmailData[] = [];

    for (const [normalizedEmail, entry] of uniqueEmailMap.entries()) {
      const user = userMap.get(normalizedEmail);
      if (!user) {
        console.warn(`⚠️ No user found for QR email: ${entry.email}`);
        continue;
      }

      try {
        const qrCodeBuffer = await QRCodeUtils.generateQRCodeBuffer(user.id);
        const qrCodeCid = `user-qr-${user.id}@events`;
        const normalizedEmail = normalizeEmail(user.email);
        
        // Determine if this is a new user (has password) or existing user
        const isNewUser = newUserPasswords && newUserPasswords.has(normalizedEmail);
        const password = isNewUser ? newUserPasswords.get(normalizedEmail) : undefined;
        const showCredentials = isNewUser && password !== undefined;
        
        payloads.push({
          email: user.email,
          firstName: user.firstName || entry.firstName || '',
          lastName: user.lastName || entry.lastName || '',
          salutation: user.salutation || entry.salutation,
          eventName,
          eventStartDate: eventStartDate,
          qrCodeCid,
          qrCodeBuffer,
          qrCodeFilename: `qr-${user.id}.png`,
          password,
          showCredentials,
        });
      } catch (error) {
        console.error(`❌ Failed to generate QR code for ${entry.email}:`, error);
      }
    }

    return payloads;
  }

  private async associateUsersWithEvent(
    userIds: string[],
    eventId: string,
  ): Promise<{ registrationsCreated: number; registrationsSkipped: number }> {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

    if (uniqueUserIds.length === 0) {
      return { registrationsCreated: 0, registrationsSkipped: 0 };
    }

    const existingRegistrations = await this.registerEventRepository.find({
      where: uniqueUserIds.map((userId) => ({ userId, eventId })),
      select: ['userId'],
    });

    const alreadyRegisteredIds = new Set(
      existingRegistrations.map((registration) => registration.userId),
    );

    const registrationsToCreate = uniqueUserIds
      .filter((userId) => !alreadyRegisteredIds.has(userId))
      .map((userId) =>
        this.registerEventRepository.create({
          userId,
          eventId,
          type: RegisterEventType.Attendee,
          isCreatedByAdmin: true,
          isRegister: true,
        }),
      );

    let registrationsCreated = 0;

    if (registrationsToCreate.length > 0) {
      try {
        await this.registerEventRepository.insert(registrationsToCreate);
        registrationsCreated = registrationsToCreate.length;
      } catch (error:any) {
        console.error(
          '⚠️  Failed bulk registration insert, attempting individual inserts:',
          error?.message,
        );

        for (const registration of registrationsToCreate) {
          try {
            await this.registerEventRepository.save(registration);
            registrationsCreated++;
          } catch (individualError:any) {
            console.error(
              `⚠️  Failed to register user ${registration.userId} for event ${eventId}:`,
              individualError?.message,
            );
          }
        }
      }
    }

    return {
      registrationsCreated,
      registrationsSkipped: alreadyRegisteredIds.size,
    };
  }

  /**
   * Bulk delete users with proper foreign key handling
   * Deletes all related data before deleting users
   */
  async bulkDeleteUsers(userIds: string[]): Promise<{message: string, deletedCount: number, skippedUsers: string[]}> {
    try {
      console.log(`🗑️ Starting bulk delete for ${userIds.length} users...`);
      console.log(`📊 ================================================`);

      if (!userIds || userIds.length === 0) {
        throw new BadRequestException('No user IDs provided for deletion');
      }

      // Step 1: Verify all users exist
      const existingUsers = await this.userRepository.find({
        where: userIds.map(id => ({ id })),
        select: ['id', 'email', 'role']
      });

      console.log(`🔍 Found ${existingUsers.length} existing users out of ${userIds.length} requested`);

      if (existingUsers.length === 0) {
        throw new BadRequestException('No valid users found to delete');
      }

      const existingUserIds = existingUsers.map(user => user.id);
      const skippedUsers = userIds.filter(id => !existingUserIds.includes(id));

      console.log(`📝 Users to delete: ${existingUserIds.length}`);
      console.log(`⚠️ Skipped invalid IDs: ${skippedUsers.length}`);

      // Step 2: Delete foreign key relationships first
      console.log(`🔄 Step 1: Deleting foreign key relationships...`);

      // Order relationships (user_id foreign key)
      try {
        const ordersDeleted = await this.dataSource
          .createQueryBuilder()
          .delete()
          .from('orders')
          .where('userId IN (:...userIds)', { userIds: existingUserIds })
          .execute();
        console.log(`   ✅ Orders deleted: ${ordersDeleted.affected}`);
      } catch (error: any) {
        console.log(`   ⚠️ Orders deletion error: ${error.message}`);
      }

      // Favorite Events (user_id foreign key)
      try {
        const favoritesDeleted = await this.dataSource
          .createQueryBuilder()
          .delete()
          .from('favorite_events')
          .where('userId IN (:...userIds)', { userIds: existingUserIds })
          .execute();
        console.log(`   ✅ Favorite events deleted: ${favoritesDeleted.affected}`);
      } catch (error: any) {
        console.log(`   ⚠️ Favorite events deletion error: ${error.message}`);
      }

      // Event Speakers (speaker_id foreign key)
      try {
        const speakersDeleted = await this.dataSource
          .createQueryBuilder()
          .delete()
          .from('event_speakers')
          .where('speakerId IN (:...userIds)', { userIds: existingUserIds })
          .execute();
        console.log(`   ✅ Event speakers deleted: ${speakersDeleted.affected}`);
      } catch (error: any) {
        console.log(`   ⚠️ Event speakers deletion error: ${error.message}`);
      }

      // Exhibitor Profiles (user_id foreign key)
      try {
        const exhibitorsDeleted = await this.dataSource
          .createQueryBuilder()
          .delete()
          .from('exhibitors')
          .where('userId IN (:...userIds)', { userIds: existingUserIds })
          .execute();
        console.log(`   ✅ Exhibitor profiles deleted: ${exhibitorsDeleted.affected}`);
      } catch (error: any) {
        console.log(`   ⚠️ Exhibitor profiles deletion error: ${error.message}`);
      }

      // Speaker Profiles (user_id foreign key)
      try {
        const speakerProfilesDeleted = await this.dataSource
          .createQueryBuilder()
          .delete()
          .from('speaker_profiles')
          .where('userId IN (:...userIds)', { userIds: existingUserIds })
          .execute();
        console.log(`   ✅ Speaker profiles deleted: ${speakerProfilesDeleted.affected}`);
      } catch (error: any) {
        console.log(`   ⚠️ Speaker profiles deletion error: ${error.message}`);
      }

      // Event Agendas (user_id foreign key)
      try {
        const agendasDeleted = await this.dataSource
          .createQueryBuilder()
          .delete()
          .from('agendas')
          .where('userId IN (:...userIds)', { userIds: existingUserIds })
          .execute();
        console.log(`   ✅ Event agendas deleted: ${agendasDeleted.affected}`);
      } catch (error: any) {
        console.log(`   ⚠️ Event agendas deletion error: ${error.message}`);
      }

      // User Addresses (user_id foreign key)
      try {
        const addressesDeleted = await this.dataSource
          .createQueryBuilder()
          .delete()
          .from('addresses')
          .where('userId IN (:...userIds)', { userIds: existingUserIds })
          .execute();
        console.log(`   ✅ User addresses deleted: ${addressesDeleted.affected}`);
      } catch (error: any) {
        console.log(`   ⚠️ User addresses deletion error: ${error.message}`);
      }

      // Step 3: Delete the users themselves
      console.log(`🔄 Step 2: Deleting users...`);
      
      try {
        const usersDeleted = await this.userRepository.delete(existingUserIds);
        console.log(`✅ Users deleted successfully: ${usersDeleted.affected}`);
        console.log(`📊 ================================================`);
        console.log(`✅ BULK DELETE COMPLETED:`);
        console.log(`   🗑️ Users Deleted: ${usersDeleted.affected}`);
        console.log(`   ⚠️ Skipped (Invalid IDs): ${skippedUsers.length}`);
        console.log(`📊 ================================================`);

        return {
          message: `Successfully deleted ${usersDeleted.affected} users. ${skippedUsers.length} invalid IDs skipped.`,
          deletedCount: usersDeleted.affected || 0,
          skippedUsers: skippedUsers
        };

      } catch (error: any) {
        console.error(`❌ Users deletion failed:`, error);
        throw new InternalServerErrorException(`Failed to delete users: ${error.message}`);
      }

    } catch (error) {
      console.error(`❌ Bulk delete failed:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Simple delete all users - handles foreign key constraints gracefully
   */
  async deleteAllUsers(): Promise<{message: string, deletedCount: number, skippedCount: number}> {
    try {
      console.log(`🗑️ Starting DELETE ALL users operation...`);
      console.log(`📊 ================================================`);

      // Step 1: Get all users first
      const allUsers = await this.userRepository.find({
        select: ['id', 'email', 'firstName', 'lastName', 'role']
      });

      console.log(`🔍 Found ${allUsers.length} total users in system`);

      if (allUsers.length === 0) {
        return {
          message: 'No users found to delete',
          deletedCount: 0,
          skippedCount: 0
        };
      }

      // Step 2: Smart dependency checker
      console.log(`🔍 Step 1: Checking foreign key dependencies...`);
      
      const skippedUsers: any[] = [];
      const usersToDelete: string[] = [];

      const checkUserDependencies = async (userId: string): Promise<string[]> => {
        const reasons: string[] = [];
        
        const checks = [
          { query: 'SELECT id FROM orders WHERE userId = $1', reason: 'has orders' },
          { query: 'SELECT id FROM polls WHERE userId = $1', reason: 'has polls' },
          { query: 'SELECT id FROM favorite_events WHERE userId = $1', reason: 'has favorite events' },
          { query: 'SELECT id FROM speaker_profiles WHERE userId = $1', reason: 'has speaker_profile' },
          { query: 'SELECT id FROM addresses WHERE userId = $1', reason: 'has addresses' },
          { query: 'SELECT id FROM polls WHERE createdById = $1', reason: 'created polls' }
        ];

        for (const check of checks) {
          try {
            const result = await this.dataSource.query(check.query, [userId]);
            if (result.length > 0) {
              reasons.push(check.reason);
            }
          } catch (error) {
            // Silent fail - table/field doesn't exist
          }
        }

        return reasons;
      };

      for (const user of allUsers) {
        let hasDependencies = false;
        let dependencyReasons: string[] = [];

        // Check Orders
        try {
          const hasOrders = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('orders', 'o')
            .where('o.userId = :userId', { userId: user.id })
            .getRawOne();
          
          if (hasOrders) {
            hasDependencies = true;
            dependencyReasons.push('has orders');
          }
        } catch (error: any) {
          // Table might not exist, ignore error
        }

        // Check Polls (new table found in error)
        try {
          const hasPolls = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('polls', 'p')
            .where('p.userId = :userId', { userId: user.id })
            .getRawOne();
          
          if (hasPolls) {
            hasDependencies = true;
            dependencyReasons.push('has polls');
          }
        } catch (error: any) {
          // Table might not exist, ignore error
        }

        // Check Favorite Events
        try {
          const hasFavorites = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('favorite_events', 'fe')
            .where('fe.userId = :userId', { userId: user.id })
            .getRawOne();
          
          if (hasFavorites) {
            hasDependencies = true;
            dependencyReasons.push('has favorite events');
          }
        } catch (error: any) {
          console.log(`   ⚠️ Favorites check failed for ${user.email}: ${error.message}`);
        }

        // Check Event Speakers
        try {
          const isSpeaker = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('event_speakers', 'es')
            .where('es.speakerId = :userId', { userId: user.id })
            .getRawOne();
          
          if (isSpeaker) {
            hasDependencies = true;
            dependencyReasons.push('is event speaker');
          }
        } catch (error: any) {
          console.log(`   ⚠️ Speakers check failed for ${user.email}: ${error.message}`);
        }

        // Check Exhibitor Profiles
        try {
          const isExhibitor = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('exhibitors', 'e')
            .where('e.userId = :userId', { userId: user.id })
            .getRawOne();
          
          if (isExhibitor) {
            hasDependencies = true;
            dependencyReasons.push('is exhibitor');
          }
        } catch (error: any) {
          console.log(`   ⚠️ Exhibitors check failed for ${user.email}: ${error.message}`);
        }

        // Check Speaker Profiles
        try {
          const hasSpeakerProfile = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('speaker_profiles', 'sp')
            .where('sp.userId = :userId', { userId: user.id })
            .getRawOne();
          
          if (hasSpeakerProfile) {
            hasDependencies = true;
            dependencyReasons.push('has speaker profile');
          }
        } catch (error: any) {
          console.log(`   ⚠️ Speaker profiles check failed for ${user.email}: ${error.message}`);
        }

        // Check Event Agendas
        try {
          const hasAgendas = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('agendas', 'a')
            .where('a.userId = :userId', { userId: user.id })
            .getRawOne();
          
          if (hasAgendas) {
            hasDependencies = true;
            dependencyReasons.push('has event agendas');
          }
        } catch (error: any) {
          console.log(`   ⚠️ Agendas check failed for ${user.email}: ${error.message}`);
        }

        // Check User Addresses
        try {
          const hasAddresses = await this.dataSource
            .createQueryBuilder()
            .select('id')
            .from('addresses', 'addr')
            .where('addr.userId = :userId', { userId: user.id })
            .getRawOne();
          
          if (hasAddresses) {
            hasDependencies = true;
            dependencyReasons.push('has addresses');
          }
        } catch (error: any) {
          console.log(`   ⚠️ Addresses check failed for ${user.email}: ${error.message}`);
        }

        if (hasDependencies) {
          skippedUsers.push({
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            reasons: dependencyReasons
          });
          console.log(`   ⏭️ Skipping ${user.email} - ${dependencyReasons.join(', ')}`);
        } else {
          usersToDelete.push(user.id);
        }
      }

      console.log(`📝 Processing Summary:`);
      console.log(`   • Total users: ${allUsers.length}`);
      console.log(`   • Users to delete: ${usersToDelete.length}`);
      console.log(`   • Users skipped (has dependencies): ${skippedUsers.length}`);
      console.log(`📊 ================================================`);

      // Step 3: Delete users without dependencies
      let deletedCount = 0;
      if (usersToDelete.length > 0) {
        console.log(`🗑️ Step 2: Deleting ${usersToDelete.length} users...`);
        
        try {
          const deleteResult = await this.userRepository.delete(usersToDelete);
          deletedCount = deleteResult.affected || 0;
          console.log(`✅ Successfully deleted ${deletedCount} users`);
        } catch (error: any) {
          console.error(`❌ Users deletion failed:`, error.message);
          throw new InternalServerErrorException(`Failed to delete users: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ No users to delete - all users have dependencies`);
      }

      console.log(`📊 ================================================`);
      console.log(`✅ DELETE ALL OPERATION COMPLETED:`);
      console.log(`   🗑️ Users Deleted: ${deletedCount}`);
      console.log(`   ⏭️ Users Skipped: ${skippedUsers.length}`);
      console.log(`📊 ================================================`);

      return {
        message: `Operation completed. ${deletedCount} users deleted, ${skippedUsers.length} users skipped due to dependencies.`,
        deletedCount,
        skippedCount: skippedUsers.length,
      };

    } catch (error) {
      console.error(`❌ Delete all users failed:`, error);
      throw this.handleError(error);
    }
  }

  // ORIGINAL CSV Upload method (for backup/reference - SLOWER)
  async uploadCsvUsersOriginal(csvData: CsvUserDto[]): Promise<CsvUploadResponseDto> {
    try {
      let totalProcessed = 0;
      let newUsersCreated = 0;
      let existingUsersSkipped = 0;
      let passwordsGenerated = 0;
      let emailsSent = 0;
      let emailsFailed = 0;
      const details: string[] = [];

      for (const userData of csvData) {
        totalProcessed++;
        
        try {
          // Check if user already exists - normalize email for case-insensitive comparison
          const normalizedEmail = normalizeEmail(userData.email);
          const existingUser = await this.userRepository.findOne({
            where: { email: normalizedEmail },
          });

          if (existingUser) {
            // User exists - check if password is empty
            if (!existingUser.password || existingUser.password.trim() === '') {
              // Generate random password for existing user without password
              const randomPassword = PasswordUtils.generateRandomPassword(12);
              const hashedPassword = await PasswordUtils.hashPassword(randomPassword);
              
              existingUser.password = hashedPassword;
              await this.userRepository.save(existingUser);
              
              passwordsGenerated++;
              
              // Send credentials email
              try {
                const credentialsData: UserCredentialsData = {
                  email: existingUser.email,
                  firstName: existingUser.firstName,
                  lastName: existingUser.lastName,
                  password: randomPassword,
                };

                const mailOptions = EmailTemplateUtils.getUserCredentialsEmailOptions(credentialsData);
                await this.emailService['transporter'].sendMail(mailOptions);
                emailsSent++;
                details.push(`Password generated and sent to existing user: ${existingUser.email}`);
              } catch (emailError) {
                emailsFailed++;
                details.push(`Failed to send email to existing user: ${existingUser.email}`);
                console.error('Error sending credentials email:', emailError);
              }
            } else {
              // User exists and has password - skip
              existingUsersSkipped++;
              details.push(`Skipped existing user with password: ${existingUser.email}`);
            }
          } else {
            // User doesn't exist - create new user
            const randomPassword = PasswordUtils.generateRandomPassword(12);
            const hashedPassword = await PasswordUtils.hashPassword(randomPassword);

            const userDataToSanitize: any = {
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              mobile: userData.mobile,
              company: userData.company,
              designation: userData.designation,
            };
            // Only include industry if it exists in userData
            if ('industry' in userData) {
              userDataToSanitize.industry = (userData as any).industry;
            }
            
            const sanitizedData = this.sanitizeUserData(userDataToSanitize);

            const newUser = this.userRepository.create({
              ...sanitizedData,
              email: normalizedEmail, // Store normalized email
              password: hashedPassword,
              role: UserRole.User,
              isVerify: true, // Auto-verify CSV uploaded users
              authProvider: AuthProvider.LOCAL,
            });

            const savedUser = (await this.userRepository.save(newUser) as unknown) as UserEntity;
            newUsersCreated++;
            passwordsGenerated++;

            // Send credentials email
            try {
              const credentialsData: UserCredentialsData = {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                password: randomPassword,
              };

              const mailOptions = EmailTemplateUtils.getUserCredentialsEmailOptions(credentialsData);
              await this.emailService['transporter'].sendMail(mailOptions);
              emailsSent++;
              details.push(`New user created and credentials sent: ${userData.email}`);
            } catch (emailError) {
              emailsFailed++;
              details.push(`New user created but failed to send email: ${userData.email}`);
              console.error('Error sending credentials email:', emailError);
            }
          }
        } catch (userError: any) {
          details.push(`Error processing user ${userData.email}: ${userError.message}`);
          console.error(`Error processing user ${userData.email}:`, userError);
        }
      }

      return {
        message: 'CSV upload processing completed',
        totalProcessed: totalProcessed.toString(),
        newUsersCreated: newUsersCreated.toString(),
        existingUsersSkipped: existingUsersSkipped.toString(),
        passwordsGenerated: passwordsGenerated.toString(),
        emailsSent: emailsSent.toString(),
        emailsFailed: emailsFailed.toString(),
        details: details.join('; '),
      };
    } catch (error) {
      this.handleError(error);
    }
  }


  async validateSampleCsv(csvContent: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const errors: string[] = [];
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        errors.push('CSV must contain at least a header row and one data row');
        return { isValid: false, errors };
      }

      // Validate header row
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['firstname', 'lastname', 'email', 'mobile'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Validate data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Number of values doesn't match headers`);
        }

        // Check for empty required fields
        const emptyFields: string[] = [];
        if (!values[headers.indexOf('firstname')] || values[headers.indexOf('firstname')].trim() === '') {
          emptyFields.push('firstName');
        }
        if (!values[headers.indexOf('lastname')] || values[headers.indexOf('lastname')].trim() === '') {
          emptyFields.push('lastName');
        }
        if (!values[headers.indexOf('email')] || values[headers.indexOf('email')].trim() === '') {
          emptyFields.push('email');
        }
        if (!values[headers.indexOf('mobile')] || values[headers.indexOf('mobile')].trim() === '') {
          emptyFields.push('mobile');
        }

        if (emptyFields.length > 0) {
          errors.push(`Row ${i + 1}: Empty required fields: ${emptyFields.join(', ')}`);
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      return { isValid: false, errors: ['Invalid CSV format'] };
    }
  }

  async updateSampleCsv(csvContent: string): Promise<{ message: string; updatedAt: string }> {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const sampleFilePath = path.join(uploadsDir, 'sample_users.csv');
      
      // Write the new sample content
      fs.writeFileSync(sampleFilePath, csvContent, 'utf-8');
      
      return {
        message: 'Sample CSV updated successfully',
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get email status from CSV upload logs
   */
  async getEmailStatusFromLogs(sessionId: string): Promise<any> {
    try {
      const logEntry = await this.csvUploadLogService.getLogBySessionId(sessionId);
      return logEntry;
    } catch (error) {
      console.error('Error getting email status from logs:', error);
      return null;
    }
  }

  /**
   * Process CSV file using professional CSV processor
   */
  async processCsvFile(filePath: string): Promise<any> {
    return await this.csvProcessorService.processCsvFile(filePath);
  }

  /**
   * Clean up temporary CSV file
   */
  async cleanupTempFile(filePath: string): Promise<void> {
    return await this.csvProcessorService.cleanupTempFile(filePath);
  }

  // Generate sample CSV based on fields with header and values
  async generateSampleCsv(fields: { header: string; values: string[] }[]): Promise<{
    csvContent: string;
    fieldMapping: { [key: string]: string };
  }> {
    try {
      // Create field mapping
      const fieldMapping: { [key: string]: string } = {};
      const csvHeaders: string[] = [];
      
      fields.forEach((field) => {
        const header = field.header;
        csvHeaders.push(header);
        
        // Map to standard field names based on header content
        const headerLower = header.toLowerCase();
        if (headerLower.includes('first') && !headerLower.includes('last')) {
          fieldMapping[header] = 'firstName';
        } else if (headerLower.includes('last') || headerLower.includes('surname')) {
          fieldMapping[header] = 'lastName';
        } else if (headerLower.includes('email') || headerLower.includes('mail')) {
          fieldMapping[header] = 'email';
        } else if (headerLower.includes('mobile') || headerLower.includes('phone')) {
          fieldMapping[header] = 'mobile';
        } else if (headerLower.includes('company') || headerLower.includes('organization') || headerLower.includes('org')) {
          fieldMapping[header] = 'company';
        } else if (headerLower.includes('designation') || headerLower.includes('job') || headerLower.includes('position') || headerLower.includes('title')) {
          fieldMapping[header] = 'designation';
        } else {
          fieldMapping[header] = header;
        }
      });

      // Generate CSV content
      const csvRows: string[] = [];
      
      // Add header row
      csvRows.push(csvHeaders.join(','));
      
      // Add data rows based on provided values
      const maxRows = Math.max(...fields.map(field => field.values.length), 0);
      
      for (let i = 0; i < maxRows; i++) {
        const rowData: string[] = [];
        
        fields.forEach((field) => {
          const value = field.values[i] || ''; // Use provided value or empty string
          // Escape values that contain commas, quotes, or newlines
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            rowData.push(`"${value.replace(/"/g, '""')}"`);
          } else {
            rowData.push(value);
          }
        });
        
        csvRows.push(rowData.join(','));
      }

      const csvContent = csvRows.join('\n');

      return {
        csvContent,
        fieldMapping,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

}

