// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDto } from './../user/users.dto';
import { UserEntity } from './../user/users.entity';
import { UserRole } from './../user/users.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'service/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
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

  private generateToken(user: UserEntity): string {
    try {
      return this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Register a new user
  async register(
    userDto: UserDto,
  ): Promise<{ message: string }> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [{ email: userDto.email }],
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
      if (!userDto.password) {
        throw new BadRequestException('Password is required');
      }
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userDto.password, saltRounds);

      // Create the new user with hashed password and profile picture path
      const newUser = this.userRepository.create({
        ...userDto,
        password: hashedPassword,
        role: userDto.role || UserRole.User, // Set default role if not provide
      });

      await this.userRepository.save(newUser); // Save the new user
      // Generate OTP
      const otp = this.generateOTP();

      newUser.otp = otp; // Store OTP in user entity
      newUser.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Set OTP expiry time
      await this.userRepository.save(newUser); // Save user with OTP
      // Send OTP via email
      if (!userDto.email) {
        throw new BadRequestException('Email is required');
      }
      await this.emailService.sendOTP(userDto.email, otp);

      return {
        message: 'Registration successful. Please verify your email with the OTP sent.', // Return only the message
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Login a user
  async login(
    userDto: UserDto,
  ): Promise<{ message: string; user: Partial<UserEntity>; token: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: userDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
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

      const token = this.generateToken(user);

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
        token: token,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Verify OTP
  async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (
        !user ||
        user.otp !== otp ||
        !user.otpExpiry ||
        new Date() > user.otpExpiry
      ) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      user.isVerify = true; // Set user as verified
      user.otp = undefined; // Clear OTP
      user.otpExpiry = undefined; // Clear OTP expiry
      await this.userRepository.save(user); // Save changes

      return { message: 'User verified successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Forget Password

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new BadRequestException('Email not found');
      }

      // Generate OTP
      const otp = this.generateOTP();

      // Save OTP and expiry time (5 minutes)
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await this.userRepository.save(user);

      // Send OTP via email
      await this.emailService.sendOTP(email, otp);

      return { message: 'OTP has been sent to your email' };
    } catch (error) {
      this.handleError(error);
    }
  }



async resetOtp(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if the account is already verified
    if (user.isVerify) {
      return {
        success: false,
        message: 'Account is already verified. No need to reset OTP.',
      };
    }

    // Generate a new OTP
    const otp = this.generateOTP();
    user.otp = otp; // Store new OTP in user entity
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Set new OTP expiry time

    await this.userRepository.save(user); // Save user with new OTP

    // Send new OTP via email
    await this.emailService.sendOTP(user.email, otp);

    return {
      success: true,
      message: 'New OTP has been sent to your email.',
    };
  } catch (error) {
    this.handleError(error);
  }
}

async checkUserExists(email: string): Promise<{ success: boolean; message: string; data?:Partial<UserEntity> }> {
  const user = await this.userRepository.findOne({
    where: { email },
  });

  if (user) {
    return {
      success: true,
      message: "User exists.",
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
      message: "User does not exist.",
    };
  }
}
  async verifyOtpAndResetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user || !user.otp || !user.otpExpiry) {
        throw new BadRequestException('Invalid reset request');
      }

      if (new Date() > user.otpExpiry) {
        throw new BadRequestException('OTP has expired');
      }

      if (user.otp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear OTP data
      user.password = hashedPassword;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await this.userRepository.save(user);

      return { message: 'Password reset successful' };
    } catch (error) {
      this.handleError(error);
    }
  }
}
