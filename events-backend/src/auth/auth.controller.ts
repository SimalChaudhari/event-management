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
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { SocialAuthService } from './social-auth.service';
import { html } from 'Data/Data';
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
  GoogleLoginDto,
  FacebookLoginDto,
  AppleLoginDto,
  LinkedInLoginDto,
} from '../validation/auth.validation';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  @Post('register')
  @UseInterceptors()
  async register(
    @Res() response: Response,
    @Body() userDto: RegisterDto, // Use RegisterDto instead of UserDto
  ) {
    const result = await this.authService.register(userDto);
    return response.status(HttpStatus.OK).json({
      message: result.message,
    });
  }

  @Post('register-admin')
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
    const result = await this.authService.register(userDto);
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
    } catch (error) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Login failed. Please check your credentials and try again.',
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

  // Google Popup Page
  @Get('social-popup')
  async googlePopupPage(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  // Social login methods
  @Post('google')
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto, // Use GoogleLoginDto
    @Res() response: Response,
  ) {
    try {
      const result = await this.socialAuthService.googleLogin(
        googleLoginDto.idToken,
      );
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
  async facebookLogin(
    @Body() facebookLoginDto: FacebookLoginDto, // Use FacebookLoginDto
    @Res() response: Response,
  ) {
    try {
      const result = await this.socialAuthService.facebookLogin(
        facebookLoginDto.accessToken,
      );
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
  async appleLogin(
    @Body() appleLoginDto: AppleLoginDto, // Use AppleLoginDto
    @Res() response: Response,
  ) {
    try {
      const result = await this.socialAuthService.appleLogin(
        appleLoginDto.identityToken,
      );
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
  async linkedinLogin(
    @Body() linkedinLoginDto: LinkedInLoginDto, // Use LinkedInLoginDto
    @Res() response: Response,
  ) {
    try {
      const result = await this.socialAuthService.linkedinLogin(
        linkedinLoginDto.accessToken,
      );
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
  
}
