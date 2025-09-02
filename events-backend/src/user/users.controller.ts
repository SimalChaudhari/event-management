//users.controller.ts
import {
  Controller,
  HttpStatus,
  Param,
  Get,
  Delete,
  Res,
  UseGuards,
  Put,
  Body,
  UseInterceptors,
  UploadedFile,
  Request,
  Post,
} from '@nestjs/common';

import { Response } from 'express';
import { UserService } from './users.service';
import { JwtAuthGuard } from './../jwt/jwt-auth.guard';
import { RolesGuard } from './../jwt/roles.guard';
import { Roles } from './../jwt/roles.decorator';
import { UserEntity, UserRole } from './users.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import path from 'path';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { UserUtils } from '../utils/user.utils';
import { RoleSwitchDto, CreateSpeakerDto } from './users.dto';

@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Get('')
  @Roles(UserRole.Admin)
  async getAllUsers(@Res() response: Response, @Request() req: any) {
    try {
      // const users = await this.userService.getAll(UserRole.User);
      const users = await this.userService.getAll([UserRole.User, UserRole.Exhibitor]);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'User details retrieved successfully',
        data: users,
        metadata: {
          total: users.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Users retrieval', req.user?.id);
      throw error;
    }
  }

  @Get('get/:id')
  async getUserById(@Param('id') id: string, @Res() response: Response, @Request() req: any) {
    try {
      const user = await this.userService.getById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'User details retrieved successfully',
        data: user,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'User retrieval by ID', req.user?.id);
      throw error;
    }
  }

  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string, @Res() response: Response, @Request() req: any) {
    try {
      const result = await this.userService.delete(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'User deletion', req.user?.id);
      throw error;
    }
  }

  @Put('update/:id')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Partial<UserEntity>,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
    @Request() req: any,
  ) {
    let existingUser = null;
    
    try {
      // Get existing user first
      existingUser = await this.userService.getById(id);

      if (file) {
        // Delete old file if it exists
        if (existingUser.profilePicture) {
          const oldPath = path.join(__dirname, '..', '..', existingUser.profilePicture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        updateData.profilePicture = `uploads/images/${file.filename}`;
      }

      const result = await this.userService.update(id, updateData);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User updated successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error:any) {
      // If user not found or update failed, delete newly uploaded file
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'images', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'User Profile Picture Upload');
      }
      
      this.errorHandler.logError(error, 'User update', req.user?.id);
      throw error;
    }
  }

  // Speaker-specific endpoints
  @Get('speakers/get')
  async getAllSpeakers(@Res() response: Response, @Request() req: any) {
    try {
      const speakers = await this.userService.getAllSpeakers();
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speakers retrieved successfully',
        data: speakers,
        metadata: {
          total: speakers.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Speakers retrieval', req.user?.id);
      throw error;
    }
  }

  @Post('speakers/create')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async createSpeaker(
    @Body() speakerData: CreateSpeakerDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (file) {
        speakerData.profilePicture = `uploads/images/${file.filename}`;
      }

      const speaker = await this.userService.createSpeaker(speakerData);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speaker created successfully',
        data: speaker,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      // Delete uploaded file if speaker creation fails
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'images', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Speaker Profile Upload');
      }
      
      this.errorHandler.logError(error, 'Speaker creation', req.user?.id);
      throw error;
    }
  }

  @Get('speakers/:id')
  async getSpeakerById(@Param('id') id: string, @Res() response: Response, @Request() req: any) {
    try {
      const speaker = await this.userService.getSpeakerById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speaker retrieved successfully',
        data: speaker,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Speaker retrieval by ID', req.user?.id);
      throw error;
    }
  }



  @Put('speakers/update/:id')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async updateSpeaker(
    @Param('id') id: string,
    @Body() updateData: Partial<UserEntity>,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
    @Request() req: any,
  ) {
    let existingSpeaker = null;
    
    try {
      // Get existing speaker first
      existingSpeaker = await this.userService.getSpeakerById(id);

      if (file) {
        // Delete old file if it exists
        if (existingSpeaker.profilePicture) {
          const oldPath = path.join(__dirname, '..', '..', existingSpeaker.profilePicture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        updateData.profilePicture = `uploads/images/${file.filename}`;
      }

      const result = await this.userService.updateSpeaker(id, updateData);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Speaker updated successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      // If speaker not found or update failed, delete newly uploaded file
      if (file) {
        const uploadedPath = path.join(__dirname, '..', '..', 'uploads', 'images', file.filename);
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        this.errorHandler.handleFileUploadError(error, 'Speaker Profile Upload');
      }
      
      this.errorHandler.logError(error, 'Speaker update', req.user?.id);
      throw error;
    }
  }

  @Delete('speakers/delete/:id')
  @Roles(UserRole.Admin)
  async deleteSpeaker(@Param('id') id: string, @Res() response: Response, @Request() req: any) {
    try {
      const result = await this.userService.deleteSpeaker(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Speaker deletion', req.user?.id);
      throw error;
    }
  }

  // Role Switch Endpoint
  /**
   * Switch user role directly
   * - If switching TO exhibitor role: booth code is required
   * - If switching FROM exhibitor role: no booth code needed
   */
  @Post('role-switch')
  @UseGuards(JwtAuthGuard)
  async switchRole(
    @Body() roleSwitchDto: RoleSwitchDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const updatedUser = await this.userService.switchRole(
        userId, 
        roleSwitchDto.newRole, 
        roleSwitchDto.boothCode
      );
      
      const successResponse = {
        success: true,
        message: 'Role switched successfully',
        data: updatedUser,
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Role switch', req.user?.id);
      throw error;
    }
  }

  /**
   * Get user information by scanning QR code
   * - Public endpoint that doesn't require authentication
   * - Returns user information when QR code is scanned
   */
  @Get('qr-code/scan/:qrCodeId')
  async scanQRCode(
    @Param('qrCodeId') qrCodeId: string,
    @Res() response: Response,
  ) {
    try {
      const userInfo = await this.userService.getUserInfoFromQRCode(qrCodeId);
      
      const successResponse = {
        success: true,
        message: 'User information retrieved successfully',
        data: userInfo,
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'QR code scanning', undefined);
      throw error;
    }
  }

  /**
   * Generate QR code for any user (Admin only)
   * - Admin can generate QR codes for any user
   */
  @Get('qr-code/generate/:userId')
  @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.Admin)
  async generateQRCodeForUser(
    @Param('userId') userId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const qrCodeData = await this.userService.generateUserQRCode(userId);
      
      const successResponse = {
        success: true,
        message: 'QR code generated successfully',
        data: qrCodeData,
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'QR code generation for user', req.user?.id);
      throw error;
    }
  }

  /**
   * Generate QR code for attendance purposes
   * - This generates a QR code that can be scanned for attendance check-in
   * - The QR code contains user information and can be used with external scanners
   */
  @Get('qr-code/attendance/:userId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.Admin)
  async generateAttendanceQRCode(
    @Param('userId') userId: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const qrCodeData = await this.userService.generateUserQRCode(userId);
      
      const successResponse = {
        success: true,
        message: 'Attendance QR code generated successfully',
        data: {
          ...qrCodeData,
          purpose: 'attendance',
          scanInstructions: 'Scan this QR code to check in the user for event attendance',
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Attendance QR code generation', req.user?.id);
      throw error;
    }
  }

}
