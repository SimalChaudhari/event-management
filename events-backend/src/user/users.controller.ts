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

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Get('')
  @Roles(UserRole.Admin)
  async getAllUsers(@Res() response: Response, @Request() req: any) {
    try {
      const users = await this.userService.getAll(UserRole.User);
      
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
}
