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
  NotFoundException,
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

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  @Roles(UserRole.Admin)
  async getAllUsers(@Res() response: Response) {
    const users = await this.userService.getAll(UserRole.User);
    return response.status(HttpStatus.OK).json({
      message: 'User details retrieved successfully',
      length: users.length,
      data: users,
    });
  }

  @Get('get/:id')
  async getUserById(@Param('id') id: string, @Res() response: Response) {
    const user = await this.userService.getById(id);
    return response.status(HttpStatus.OK).json({
      message: 'User details retrieved successfully',
      data: user,
    });
  }

  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string, @Res() response: Response) {
    const result = await this.userService.delete(id);
    return response.status(HttpStatus.OK).json(result);
  }

  @Put('update/:id')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/images', // Directory to save the uploaded files
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname); // Generate a unique filename
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Partial<UserEntity>,
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
  ) {
    const existingUser = await this.userService.getById(id).catch(() => null);

    // ❌ If speaker not found, delete newly uploaded file
    if (!existingUser) {
      if (file) {
        const uploadedPath = path.join(
          __dirname,
          '..',
          '..',
          'uploads',
          'images',
          file.filename,
        );
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
      }
      throw new NotFoundException('User not found');
    }
    if (file) {
      // Delete old file if it exists
      if (existingUser.profilePicture) {
        const oldPath = path.join(
          __dirname,
          '..',
          '..',
          existingUser.profilePicture,
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      updateData.profilePicture = `uploads/images/${file.filename}`;
    }

    try {
      const result = await this.userService.update(id, updateData);

      // ✅ Delete old image only after successful validation & update
      if (file && existingUser.profilePicture) {
        const oldPath = path.join(
          __dirname,
          '..',
          '..',
          existingUser.profilePicture,
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'User updated successfully',
        data: result,
      });
    } catch (error) {
      // ❌ If any error occurs, delete the newly uploaded file
      if (file) {
        const uploadedPath = path.join(
          __dirname,
          '..',
          '..',
          'uploads',
          'images',
          file.filename,
        );
        if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
      }
      throw error; // Re-throw the error for global handler or client
    }
  }
}
