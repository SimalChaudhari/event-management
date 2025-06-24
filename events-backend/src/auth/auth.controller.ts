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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDto } from './../user/users.dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { SocialAuthService } from './social-auth.service';
import { GoogleLoginDto, FacebookLoginDto, AppleLoginDto, LinkedInLoginDto } from '../user/users.dto';
import { html } from 'Data/Data';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  @Post('register')
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
  async register(
    @Res() response: Response,
    @Body() userDto: UserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      userDto.profilePicture = `uploads/images/${file.filename}`;
    }
    const result = await this.authService.register(userDto);
    return response.status(HttpStatus.OK).json({
      message: result.message,
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
  async login(@Res() response: Response, @Body() loginDto: UserDto) {
    try {
      const result = await this.authService.login(loginDto);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Login successful. Welcome back!',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      // Get the appropriate status code based on error type
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (error instanceof UnauthorizedException) {
        statusCode = HttpStatus.UNAUTHORIZED;
      } else if (error instanceof BadRequestException) {
        statusCode = HttpStatus.BAD_REQUEST;
      }
  
      return response.status(statusCode).json({
        success: false,
        message: error.message, // Use the actual error message from service
      });
    }
  }

  @Post('admin')
  async adminLogin(@Res() response: Response, @Body() loginDto: UserDto) {
    try {
      const result = await this.authService.adminLogin(loginDto); // Call the admin login method
      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Admin login successful. Welcome back!',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message:
          'Login failed. Please check your credentials and try again.',
      });
    }
  }

  @Post('refresh-token')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Res() response: Response,
  ) {
    try {
      const tokens = await this.authService.refreshToken(refreshToken);
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

  @Post('resend-otp')
  async resetOtp(@Body() body: { email: string }, @Res() response: Response) {
    if (!body.email) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await this.authService.resetOtp(body.email);
    return response.status(HttpStatus.OK).json(result);
  }

  @Post('admin/forget')
  @HttpCode(HttpStatus.OK)
  async adminForgotPassword(@Body('email') email: string) {
    return this.authService.adminForgotPassword(email);
  }

  @Post('forget')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
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

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: { email: string; otp: string; newPassword: string },
  ) {
    return this.authService.verifyOtpAndResetPassword(
      body.email,
      body.otp,
      body.newPassword,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard) // Use the JwtAuthGuard to protect this endpoint
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: Request, // Get the request object to access the user from JWT
    @Body()
    body: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
    @Res() response: Response,
  ) {
    try {
      const userId = (req as any).user.id; // Get the user ID from the JWT token
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

// Google Popup Page
  @Get('google-popup')
  async googlePopupPage(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post('google')
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto, @Res() response: Response) {
    try {
      const result = await this.socialAuthService.googleLogin(googleLoginDto.idToken);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('facebook')
  async facebookLogin(@Body() facebookLoginDto: FacebookLoginDto, @Res() response: Response) {
    try {
      const result = await this.socialAuthService.facebookLogin(facebookLoginDto.accessToken);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('apple')
  async appleLogin(@Body() appleLoginDto: AppleLoginDto, @Res() response: Response) {
    try {
      const result = await this.socialAuthService.appleLogin(appleLoginDto.identityToken);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('linkedin')
  async linkedinLogin(@Body() linkedinLoginDto: LinkedInLoginDto, @Res() response: Response) {
    try {
      const result = await this.socialAuthService.linkedinLogin(linkedinLoginDto.accessToken);
      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message,
      });
    }
  }
}
