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

import path from 'path';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }
    
    @Get('')
    @Roles(UserRole.Admin)
    async getAllUsers(@Res() response: Response) {
        const users = await this.userService.getAll();
        return response.status(HttpStatus.OK).json({
            message:"User details retrieved successfully",
            length: users.length,
            data: users,
        });
    }

    
    @Get('get/:id')
    async getUserById(@Param('id') id: string, @Res() response: Response) {
        const user = await this.userService.getById(id);
        return response.status(HttpStatus.OK).json({
            message:"User details retrieved successfully",
            data: user,
        });
    }

    @Delete('delete/:id')
    async deleteUser(@Param('id') id: string, @Res() response: Response) {
        const result = await this.userService.delete(id);
        return response.status(HttpStatus.OK).json(result);
    }

    @Put('update/:id')
    @UseInterceptors(FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/images', // Directory to save the uploaded files
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname); // Generate a unique filename
          cb(null, uniqueSuffix);
        },
      }),
    }))
    async updateUser(
      @Param('id') id: string,
      @Body() updateData: Partial<UserEntity>,
      @UploadedFile() file: Express.Multer.File,
      @Res() response: Response
    ) {
      if (file) {
        updateData.profilePicture = file.path; // Store the file path in the update data
      }
      const result = await this.userService.update(id, updateData);
      return response.status(HttpStatus.OK).json({
        message: 'User updated successfully',
        data: result,
      });
    }
  }
