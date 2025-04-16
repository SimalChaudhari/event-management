// src/auth/auth.controller.ts
import { Controller, Post, Body, Res, HttpStatus, HttpCode, UseInterceptors, UploadedFile, Query, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDto } from './../user/users.dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('profilePicture', {
    storage: diskStorage({
      destination: './uploads/images', // Directory to save the uploaded files
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname); // Generate a unique filename
        cb(null, uniqueSuffix);
      },
    }),
  }))
  async register(
    @Res() response: Response, 
    @Body() userDto: UserDto, 
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      userDto.profilePicture = file.path; // Store the file path in the DTO
    }
    const result = await this.authService.register(userDto);
    return response.status(HttpStatus.OK).json({
      message: result.message
    });
  
  }

  @Post('verify-otp')
  async verifyOtp(
    @Res() response: Response,
    @Body() body: { email: string; otp: string },
  ) {
    const result = await this.authService.verifyOtp(body.email, body.otp);
    return response.status(HttpStatus.OK).json({
      message: result.message,
    });
  }

  @Post('login')
  async login(
    @Res() response: Response,
    @Body() loginDto: UserDto,
  ) {
    const result = await this.authService.login(loginDto);
    return response.status(HttpStatus.OK).json({
      message: result.message,
      user: result.user,
      token: result.token,
    });
  }


  @Post('resend-otp')
  async resetOtp(
    @Body() body: { email: string },
    @Res() response: Response,
  ) {
    if (!body.email) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await this.authService.resetOtp(body.email);
    return response.status(HttpStatus.OK).json(result);
  }

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body('email') email: string
  ) {
    return this.authService.forgotPassword(email);
  }

  @Get('check-user')
  async checkUser(
    @Query('email') email: string,
    @Res() response: Response,
  ) {
    if (!email) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await this.authService.checkUserExists(email);
    return response.status(HttpStatus.OK).json(result);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: { email: string; otp: string; newPassword: string }
  ) {
    return this.authService.verifyOtpAndResetPassword(
      body.email,
      body.otp,
      body.newPassword
    );
  }
}
