// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Query,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
  BadRequestException,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/users.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Roles } from './../jwt/roles.decorator';
import { RolesGuard } from './../jwt/roles.guard';
import { UserRole } from './../user/users.entity';
// Import validation DTOs
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResendOTPDto,
  VerifyOTPDto,
  ResetPasswordDto,
  RefreshTokenDto,
  CsvUserDto,
  CsvUploadResponseDto,
} from '../validation/auth.validation';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @UseInterceptors()
  async register(
    @Res() response: Response,
    @Body() userDto: RegisterDto, // Use RegisterDto instead of UserDto
  ) {
    const result = await this.authService.register(userDto, false); // false = self-registration
    return response.status(HttpStatus.OK).json({
      message: result.message,
    });
  }

  @Post('register-admin')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/images';
          // Create directory if it doesn't exist
          if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true });
          }
          cb(null, destinationPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Only images are allowed for profile pictures.'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async registerAdmin(
    @Res() response: Response,
    @Body() userDto: RegisterDto, // Use RegisterDto
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      userDto.profilePicture = `uploads/images/${file.filename}`;
    }
    const result = await this.authService.register(userDto, true); // true = admin registration
    return response.status(HttpStatus.OK).json({
      message: result.message,
    });
  }

  @Post('login')
  async login(@Res() response: Response, @Body() loginDto: LoginDto) { // Use LoginDto
    try {
      const result = await this.authService.login(loginDto);
      
      // Check if user requires verification
      if (result.requiresVerification) {
        return response.status(HttpStatus.TEMPORARY_REDIRECT).json({
          success: false,
          message: result.message,
          user: result.user,
          errorCode: "EMAIL_VERIFICATION_REQUIRED",
          requiresVerification: true,
        });
      }

      // Normal login response
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Login successful. Welcome back!',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      if (error instanceof UnauthorizedException) {
        statusCode = HttpStatus.UNAUTHORIZED;
      } else if (error instanceof BadRequestException) {
        statusCode = HttpStatus.BAD_REQUEST;
      }

      return response.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('admin')
  async adminLogin(@Res() response: Response, @Body() loginDto: LoginDto) { // Use LoginDto
    try {
      const result = await this.authService.adminLogin(loginDto);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Admin login successful. Welcome back!',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error:any) {
      // Return the actual error message from the service
      const status = error.status || HttpStatus.UNAUTHORIZED;
      const message = error.message || 'Login failed. Please check your credentials and try again.';
      
      return response.status(status).json({
        success: false,
        message: message,
      });
    }
  }

  @Post('refresh-token')
  async refreshToken(
    @Body() body: RefreshTokenDto, // Use RefreshTokenDto
    @Res() response: Response,
  ) {
    try {
      const tokens = await this.authService.refreshToken(body.refreshToken);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Token refreshed successfully.',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid refresh token. Please log in again.',
      });
    }
  }

  @Get('check-user')
  async checkUser(@Query('email') email: string, @Res() response: Response) {
    if (!email) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await this.authService.checkUserExists(email);
    return response.status(HttpStatus.OK).json(result);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: Request,
    @Body() body: ChangePasswordDto, // Use ChangePasswordDto
    @Res() response: Response,
  ) {
    try {
      const userId = (req as any).user.id;
      const result = await this.authService.changePassword(
        userId,
        body.currentPassword,
        body.newPassword,
        body.confirmPassword,
      );

      return response.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signout(@Req() req: Request, @Res() response: Response) {
    try {
      const userId = (req as any).user.id;
      // Extract token from authorization header
      // Extract token from authorization header
      const authHeader = (req.headers as any).authorization;
      const token = authHeader?.split(' ')[1]; // Get the token part after "Bearer "

      if (!token) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'No token provided',
        });
      }

      const result = await this.authService.signout(userId, token);

      return response.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }


  @Post('verify-otp')
  async verifyOTP(
    @Body() body: VerifyOTPDto, // Use VerifyOTPDto
    @Res() response: Response,
  ) {
    try {
      const result = await this.authService.verifyOTP(body.email, body.otp);
      return response.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() body: ForgotPasswordDto, // Use ForgotPasswordDto
    @Res() response: Response,
  ) {
    const result = await this.authService.forgotPassword(body.email);
    return response.status(HttpStatus.OK).json(result);
  }

  @Post('resend-otp')
  async resendOTP(
    @Body() body: ResendOTPDto, // Use ResendOTPDto
    @Res() response: Response,
  ) {
    try {
      const result = await this.authService.resendOTP(body.email);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: ResetPasswordDto, // Use ResetPasswordDto
    @Res() response: Response,
  ) {
    try {
      const result = await this.authService.resetPasswordWithOTP(
        body.email,
        body.otp,
        body.newPassword,
      );
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('resend-login-otp')
  async resendLoginOTP(
    @Body() body: { email: string },
    @Res() response: Response,
  ) {
    try {
      const result = await this.authService.resendLoginOTP(body.email);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('upload-csv-users')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('csvFile', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/temp';
          // Create directory if it doesn't exist
          if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true });
          }
          cb(null, destinationPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV files are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadCsvUsers(
    @Res() response: Response,
    @Body() body: { users?: CsvUserDto[]; eventId?: string; fileName?: string },
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: any,
  ) {
    try {
      let csvData: CsvUserDto[] = [];
      const eventId = body.eventId;

      // Handle CSV file upload using professional CSV processor
      if (file) {
        try {
          const csvProcessingResult = await this.authService.processCsvFile(file.path);
          
          if (!csvProcessingResult.success) {
            return response.status(HttpStatus.BAD_REQUEST).json({
              success: false,
              message: 'CSV file processing failed',
              errors: csvProcessingResult.errors,
              warnings: csvProcessingResult.warnings,
              statistics: csvProcessingResult.statistics
            });
          }
          
          csvData = csvProcessingResult.data;
          
          // Clean up temp file
          await this.authService.cleanupTempFile(file.path);
          
        } catch (parseError: any) {
          console.error('❌ Failed to parse CSV file:', parseError);
          return response.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Failed to parse CSV file',
            error: parseError.message,
          });
        }
      } 
      // Handle JSON data
      else if (body.users && Array.isArray(body.users) && body.users.length > 0) {
        csvData = body.users;
      } 
      else {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Either CSV file or JSON data is required',
        });
      }

      // Filter out invalid users and log them
      const validUsers: CsvUserDto[] = [];
      const skippedUsers: string[] = [];
      
      csvData.forEach((user, index) => {
        const missingFields: string[] = [];
        
        if (!user.firstName || user.firstName.trim() === '') missingFields.push('firstName');
        if (!user.lastName || user.lastName.trim() === '') missingFields.push('lastName');
        if (!user.email || user.email.trim() === '') missingFields.push('email');
        if (!user.mobile || user.mobile.trim() === '') missingFields.push('mobile');
        
        if (missingFields.length > 0) {
          skippedUsers.push(`Row ${index + 1}: Skipped due to missing fields (${missingFields.join(', ')})`);
        } else {
          validUsers.push(user);
        }
      });

      if (validUsers.length === 0) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'No valid users found in CSV data',
          skippedUsers: skippedUsers,
        });
      }

      const adminId = req?.user?.id || 'system';
      const fileName = file?.originalname || body?.fileName || 'csv-upload.json';
  
      const result = await this.authService.uploadCsvUsers(
        validUsers,
        adminId,
        fileName,
        eventId,
   
      );
      
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        data: {
          totalProcessed: result.totalProcessed,
          newUsersCreated: result.newUsersCreated,
          existingUsersSkipped: result.existingUsersSkipped,
          passwordsGenerated: result.passwordsGenerated,
          emailsSent: result.emailsSent,
          emailsFailed: result.emailsFailed,
          details: result.details,
          skippedUsers: skippedUsers.length > 0 ? skippedUsers : undefined,
          emailStatus: result.emailStatus,
          sessionId: result.sessionId,
          eventAssociation: result.eventAssociation,
        },
      });
    } catch (error: any) {
      console.error('❌ Failed to process CSV upload:', error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to process CSV upload',
      });
    }
  }

  /**
   * Bulk delete users with foreign key handling
   * DELETE /auth/bulk-delete-users
   */
  @Delete('bulk-delete-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async bulkDeleteUsers(@Body() body: { userIds: string[] }) {
    try {
      const { userIds } = body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return {
          success: false,
          message: 'User IDs array is required',
          statusCode: 400,
        };
      }

      console.log(`🗑️ Bulk delete API called for ${userIds.length} users`);
      
      const result = await this.authService.bulkDeleteUsers(userIds);
      
      return {
        success: true,
        message: result.message,
        deletedCount: result.deletedCount,
        skippedUsers: result.skippedUsers,
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('❌ Bulk delete API error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete users',
        statusCode: error.status || 500,
      };
    }
  }

  /**
   * Simple delete all users - handles foreign key constraints gracefully  
   * DELETE /auth/delete-all-users
   */
  @Get('email-status/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getEmailStatus(@Param('sessionId') sessionId: string, @Res() response: Response) {
    try {
      if (!sessionId) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Session ID is required',
        });
      }

      const logEntry = await this.authService.getEmailStatusFromLogs(sessionId);
      
      if (!logEntry) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Log entry not found',
        });
      }

      return response.status(HttpStatus.OK).json({
        success: true,
        data: {
          sessionId: logEntry.sessionId,
          emailsSent: logEntry.emailsSent,
          emailsFailed: logEntry.emailsFailed,
          emailsPending: logEntry.emailsPending,
          emailsTotal: logEntry.emailsTotal,
          status: logEntry.status,
          emailDetails: logEntry.emailDetails ? JSON.parse(logEntry.emailDetails) : null,
          summary: logEntry.summary,
          updatedAt: logEntry.updatedAt,
        },
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get email status',
      });
    }
  }

  @Delete('delete-all-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  async deleteAllUsers() {
    try {
      console.log(`🗑️ DELETE ALL USERS API called`);
      
      // Step 1: Get all users
      const allUsers = await this.authService.userRepository.find({
        select: ['id', 'email', 'firstName', 'lastName', 'role']
      });

      console.log(`🔍 Found ${allUsers.length} total users`);

      if (allUsers.length === 0) {
        return {
          success: true,
          message: 'No users found to delete',
          deletedCount: 0,
          skippedCount: 0,
          statusCode: 200,
        };
      }

      // Step 2: Delete users individually using UserService to handle related data cleanup
      console.log(`🗑️ Deleting ${allUsers.length} users with dependency cleanup...`);

      let deletedCount = 0;
      const failedUsers: {
        id: string;
        email: string;
        reason: string;
      }[] = [];

      for (const user of allUsers) {
        try {
          await this.userService.delete(user.id);
          deletedCount++;
          console.log(`✅ Deleted user: ${user.email}`);
        } catch (deleteError: any) {
          const reason =
            deleteError?.message || 'Deletion failed due to unexpected error';
          failedUsers.push({
            id: user.id,
            email: user.email,
            reason,
          });
          console.log(
            `⏭️ Skipped ${user.email} - ${reason}`,
          );
        }
      }

      return {
        success: failedUsers.length === 0,
        message:
          failedUsers.length === 0
            ? `Deleted all ${deletedCount} users successfully`
            : `Deleted ${deletedCount} users, failed to delete ${failedUsers.length}`,
        deletedCount,
        skippedCount: failedUsers.length,
        failedUsers,
        statusCode: failedUsers.length === 0 ? 200 : 207,
      };

    } catch (error: any) {
      console.error('❌ Delete all users API error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete all users',
        statusCode: error.status || 500,
      };
    }
  }

  /**
   * Download sample CSV file for user upload
   * POST /auth/download-csv
   */
  @Post('download-csv')
  async downloadSampleCsv(
    @Body() body: { fields?: Array<{ header: string; values: string[] }> },
    @Res() response: Response,
  ) {
    try {
      // Default fields if not provided
      const fields = body.fields || [
        {
          header: 'firstName',
          values: ['John', 'Jane', 'Mike']
        },
        {
          header: 'lastName',
          values: ['Doe', 'Smith', 'Johnson']
        },
        {
          header: 'email',
          values: ['john.doe@example.com', 'jane.smith@example.com', 'mike.johnson@example.com']
        },
        {
          header: 'mobile',
          values: ['81234567', '91234567', '82345678']
        },
        {
          header: 'company',
          values: ['Tech Corp', 'Design Studio', 'Marketing Agency']
        },
        {
          header: 'designation',
          values: ['Software Engineer', 'UI/UX Designer', 'Marketing Manager']
        }
      ];

      const result = await this.authService.generateSampleCsv(fields);
      const csvContent = result.csvContent;

      response.setHeader('Content-Type', 'text/csv');
      response.setHeader(
        'Content-Disposition',
        'attachment; filename="sample_users.csv"',
      );
      response.send(csvContent);
    } catch (error: any) {
      console.error('❌ Failed to generate sample CSV:', error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to generate sample CSV',
      });
    }
  }

  
}
