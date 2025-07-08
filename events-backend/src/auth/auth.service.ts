// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDto } from './../user/users.dto';
import { UserEntity } from './../user/users.entity';
import { UserRole } from './../user/users.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'service/email.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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
        { expiresIn: '10d', secret: process.env.JWT_SECRET }, // Use a specific secret for access tokens
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
        { expiresIn: '30d', secret: process.env.REFRESH_TOKEN_SECRET }, // Use a specific secret for refresh tokens
      ); // Refresh token expires in 7 days
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateVerificationToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private generateResetToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  // Register a new user
  async register(userDto: UserDto): Promise<{ message: string }> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [{ email: userDto.email }],
      });

      if (existingUser) {
        throw new BadRequestException(
          'Email address already taken. Try logging in or using another email.',
        );
      }
      if (!userDto.password) {
        throw new BadRequestException('Password is required');
      }
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userDto.password, saltRounds);

      // Generate verification token
      const verificationToken = this.generateVerificationToken();

      // Create the new user with hashed password
      const newUser = this.userRepository.create({
        ...userDto,
        password: hashedPassword,
        role: userDto.role || UserRole.User,
        acceptTerms: Boolean(userDto.acceptTerms),
        verificationToken: verificationToken,
        isVerify: false, // Ensure user is not verified initially
      });

      await this.userRepository.save(newUser);

      // Send verification link via email
      if (!userDto.email) {
        throw new BadRequestException('Email is required');
      }
      await this.emailService.sendVerificationLink(userDto.email, verificationToken);

      return {
        message:
          "We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account. Once your account is activated, you can proceed to the login page.",
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Login a user
  async login(userDto: UserDto): Promise<{
    message: string;
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: userDto.email },
      });

      if (!user) {
        throw new UnauthorizedException(
          'Email or password not recognized. Create an account to get started.',
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
        throw new UnauthorizedException(
          'The email or password you entered is incorrect. Please try again.',
        );
      }

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
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      return {
        success: true,
        message: 'User exists.',
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
      const user = await this.userRepository.findOne({
        where: { email: userDto.email },
      });

      if (!user || user.role !== 'admin') {
        // Check if user is an admin
        throw new UnauthorizedException('Invalid admin credentials');
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
      this.handleError(error);
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

      // Clear refresh token
      user.refreshToken = null as any;
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Add a method to check if a token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return !!(await this.cacheManager.get(`blacklisted_${token}`));
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      
      const user = await this.userRepository.findOne({
        where: { verificationToken: token },
      });

      console.log({user});
      if (!user) {
        throw new BadRequestException('Invalid verification token');
      }


      if (user.isVerify) {
        throw new BadRequestException('Email is already verified');
      }

      // Mark user as verified and clear verification token
      user.isVerify = true;
      user.verificationToken = null as any;
      await this.userRepository.save(user);

      return { message: 'Email verified successfully. You can now log in to your account.' };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Resend verification email
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.isVerify) {
        return {
          success: false,
          message: 'Account is already verified. No need to resend verification.',
        };
      }

      // Generate new verification token
      const verificationToken = this.generateVerificationToken();
      user.verificationToken = verificationToken;
  
      await this.userRepository.save(user);

      // Send new verification link via email
      await this.emailService.sendVerificationLink(user.email, verificationToken);

      return {
        success: true,
        message: 'New verification link has been sent to your email.',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new BadRequestException('Email not found');
      }

      // Generate reset token
      const resetToken = this.generateResetToken();

      // Save reset token and expiry time (1 hour)
      user.verificationTokenForResetPassword = resetToken;
      user.verificationTokenExpiryForResetPassword = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await this.userRepository.save(user);

      try {
        await this.emailService.sendPasswordResetLink(email, resetToken);
        return { message: 'Password reset link has been sent to your email' };
      } catch (emailError) {
        throw new BadRequestException(
          'Failed to send reset link. Please try again later.',
        );
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async resetPasswordWithToken(
    token: string,
    email: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email, verificationTokenForResetPassword: token },
      });
  
      if (!user) {
        throw new BadRequestException('Invalid reset token or email');
      }
  
      if (!user.verificationTokenExpiryForResetPassword || new Date() > user.verificationTokenExpiryForResetPassword) {
        throw new BadRequestException('Reset token has expired');
      }
  
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update password and clear reset token data
      user.password = hashedPassword;
      user.verificationTokenForResetPassword = null as any;
      user.verificationTokenExpiryForResetPassword = null as any;
      await this.userRepository.save(user);
  
      return { message: 'Password reset successful. You can now login with your new password.' };
    } catch (error) {
      this.handleError(error);
    }
  }
}
