// src/faq/faq.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Put,
  Patch,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Query,
  Request,
} from '@nestjs/common';
import {
  PrivacyPolicyService,
  TermsConditionsService,
  BannerService,
  BannerEventService,
  LogoService,
  UserPermissionsService,
  PermissionTemplateService,
  PushNotificationService,
  AdvertNotificationService,
} from './setting.service';
import {
  CreatePrivacyPolicyDto,
  CreateTermsConditionsDto,
  CreateBannerDto,
  CreateBannerEventDto,
  CreateLogoDto,
  CreatePermissionTemplateDto,
  UpdateUserPermissionDto,
  UserPermissionWithTemplate,
  RegisterDeviceTokenDto,
  GetEventNotificationHistoryDto,
  EventNotificationResponseDto,
  CreateAdvertNotificationDto,
  UpdateAdvertNotificationDto,
  AdvertNotificationResponseDto,
  GetAdvertNotificationHistoryDto,
  MarkAdvertNotificationReadDto,
  SendAdvertNotificationDto,
  CreateAdvertNotificationFormDto,
  UpdateAdvertNotificationFormDto,
} from './setting.dto';
import { PrivacyPolicy, TermsConditions, Banner, BannerEvent, Logo, UserPermissions, PermissionTemplate, NotificationHistory } from './setting.entity';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { FileUploadUtils, FileUploadConfig } from '../utils/filesUploadFormat/file-upload.utils';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { GetUser } from '../jwt/get-user.decorator';
import { UserEntity } from '../user/users.entity';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';

@Controller('api/privacy-policies')
export class PrivacyPolicyController {
  constructor(private readonly privacyPolicyService: PrivacyPolicyService) {}
  
  @Get()
  async getOrShow(): Promise<PrivacyPolicy | { message: string }> {
    const privacyPolicy = await this.privacyPolicyService.getOrShow();
    if (!privacyPolicy) {
      return { message: 'No privacy policy found' };
    }
    return privacyPolicy;
  }

  @Post()
  async createOrUpdate(
    @Body() createPrivacyPolicyDto: CreatePrivacyPolicyDto,
  ): Promise<{ message: string; data: PrivacyPolicy }> {
    return this.privacyPolicyService.createOrUpdate(createPrivacyPolicyDto);
  }
}

//terms-conditions

@Controller('api/terms-conditions')
export class TermsConditionsController {
  constructor(
    private readonly termsConditionsService: TermsConditionsService,
  ) {}

  @Get()
  async getOrShow(): Promise<TermsConditions | { message: string }> {
    const termsConditions = await this.termsConditionsService.getOrShow();
    if (!termsConditions) {
      return { message: 'No terms and conditions found' };
    }
    return termsConditions;
  }

  @Post()
  async createOrUpdate(
    @Body() createTermsConditionsDto: CreateTermsConditionsDto,
  ): Promise<{ message: string; data: TermsConditions }> {
    return this.termsConditionsService.createOrUpdate(createTermsConditionsDto);
  }
}

@Controller('api/auth/banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) { }

  @Get()
  async getOrShow(): Promise<Banner | { message: string }> {
    const banner = await this.bannerService.getOrShow();
    if (!banner) {
      return { message: 'No banners found' };
    }
    return banner;
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', { // Single image for banners
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/banners';
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
    }),
  )
  async createOrUpdate(
    @UploadedFile() file: Express.Multer.File,
    @Body('hyperlink') hyperlink?: string,
  ): Promise<{ message: string; data: Banner }> {
    const imageUrl = `uploads/banners/${file.filename}`;
    
    const createBannerDto: CreateBannerDto = {
      imageUrl: imageUrl,
      hyperlink: hyperlink
    };
    return this.bannerService.createOrUpdate(createBannerDto);
  }

  // New API to clear all banners
  @Delete('clear-all')
  async clearAllBanners(): Promise<{ message: string }> {
    return this.bannerService.clearBanner();
  }

  // New API to delete specific image
  @Delete('delete-image')
  async deleteSpecificImage(@Body('imageUrl') imageUrl: string): Promise<{ message: string; data: Banner }> {
    return this.bannerService.deleteBannerImage();
  }
}

@Controller('api/banner-events')
export class BannerEventController {
  constructor(private readonly bannerEventService: BannerEventService) { }

  @Get()
  async getOrShow(): Promise<BannerEvent | { message: string }> {
    const bannerEvent = await this.bannerEventService.getOrShow();
    if (!bannerEvent) {
      return { message: 'No banner events found' };
    }
    return bannerEvent;
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, { // Multiple images for banner events
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/banner-events';
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
    }),
  )
  async createOrUpdate(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('hyperlinks') hyperlinks?: string | string[],
  ): Promise<{ message: string; data: BannerEvent }> {
    const imageUrls = files.map(file => `uploads/banner-events/${file.filename}`);
    
    // Parse hyperlinks - can be string (single) or array (multiple)
    let hyperlinksArray: string[] | undefined;
    if (hyperlinks) {
      if (typeof hyperlinks === 'string') {
        // If single string, try to parse as JSON array, otherwise make array with one element
        try {
          hyperlinksArray = JSON.parse(hyperlinks);
        } catch {
          // If not JSON, treat as single hyperlink and repeat for all images
          hyperlinksArray = new Array(imageUrls.length).fill(hyperlinks);
        }
      } else if (Array.isArray(hyperlinks)) {
        hyperlinksArray = hyperlinks;
      }
      // Ensure hyperlinks array matches imageUrls length
      if (hyperlinksArray && hyperlinksArray.length !== imageUrls.length) {
        // Pad with empty strings if shorter, trim if longer
        while (hyperlinksArray.length < imageUrls.length) {
          hyperlinksArray.push('');
        }
        hyperlinksArray = hyperlinksArray.slice(0, imageUrls.length);
      }
    }
    
    const createBannerEventDto: CreateBannerEventDto = {
      imageUrls: imageUrls,
      hyperlinks: hyperlinksArray
    };
    return this.bannerEventService.createOrUpdate(createBannerEventDto);
  }

  // New API to clear all banner events
  @Delete('clear-all')
  async clearAllBannerEvents(): Promise<{ message: string }> {
    return this.bannerEventService.clearAllBannerEvents();
  }

  // New API to delete specific image
  @Delete('delete-image')
  async deleteSpecificImage(@Body('imageUrl') imageUrl: string): Promise<{ message: string; data: BannerEvent }> {
    return this.bannerEventService.deleteSpecificImage(imageUrl);
  }

  // New API to update hyperlink for a specific banner
  @Put('update-hyperlink')
  async updateHyperlink(
    @Body('imageUrl') imageUrl: string,
    @Body('hyperlink') hyperlink?: string,
  ): Promise<{ message: string; data: BannerEvent }> {
    try {
      return await this.bannerEventService.updateHyperlink(imageUrl, hyperlink || '');
    } catch (error) {
      console.error('Controller error updating hyperlink:', error);
      throw error;
    }
  }
}

@Controller('api/logos')
export class LogoController {
  constructor(private readonly logoService: LogoService) { }

  // Public endpoint - anyone can view the logo
  @Get()
  async getOrShow(): Promise<Logo | { message: string }> {
    const logo = await this.logoService.getOrShow();
    if (!logo) {
      return { message: 'No logo found' };
    }
    return logo;
  }

  // Admin only - Create/Update logo
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('image', { // Single image for logo
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = './uploads/logos';
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
    }),
  )
  async createOrUpdate(
    @UploadedFile() file: Express.Multer.File,
    @Body('hyperlink') hyperlink?: string,
  ): Promise<{ message: string; data: Logo }> {
    const imageUrl = `uploads/logos/${file.filename}`;
    
    const createLogoDto: CreateLogoDto = {
      imageUrl: imageUrl,
      hyperlink: hyperlink
    };
    return this.logoService.createOrUpdate(createLogoDto);
  }

  // Admin only - Clear logo
  @Delete('delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async clearLogo(): Promise<{ message: string }> {
    return this.logoService.clearLogo();
  }

}

// Permission Templates Controller (Admin creates default permissions)
@Controller('api/permission-templates')
export class PermissionTemplateController {
  constructor(private readonly permissionTemplateService: PermissionTemplateService) { }

  // Create permission template (admin only - no user ID needed)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createTemplate(
    @Body() templateData: CreatePermissionTemplateDto,
  ): Promise<{ message: string; data: PermissionTemplate }> {
    return this.permissionTemplateService.createTemplate(templateData);
  }

  // Get all permission templates (public - no authentication needed)
  @Get()
  async getAllTemplates(): Promise<PermissionTemplate[]> {
    return this.permissionTemplateService.getAllTemplates();
  }

  // Delete permission template (admin only)
  @Delete(':templateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteTemplate(@Param('templateId') templateId: string): Promise<{ message: string }> {
    return this.permissionTemplateService.deleteTemplate(templateId);
  }

  // Seed default permission templates (admin only)
  @Post('seed-defaults')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async seedDefaultTemplates(): Promise<{ message: string; count: number }> {
    return this.permissionTemplateService.seedDefaultTemplates();
  }
}

// User Permissions Controller (User-specific settings)
@Controller('api/user-permissions')
@UseGuards(JwtAuthGuard)
export class UserPermissionsController {
  constructor(private readonly userPermissionsService: UserPermissionsService) { }

  // Get user permissions with template info (shows defaults + user customizations)
  @Get()
  async getUserPermissionsWithTemplates(
    @GetUser() user: UserEntity
  ): Promise<UserPermissionWithTemplate[]> {
    return this.userPermissionsService.getUserPermissionsWithTemplates(user.id);
  }

  // Update user's specific permission
  @Put(':templateId')
  async updateUserPermission(
    @Param('templateId') templateId: string,
    @Body() permissionData: UpdateUserPermissionDto,
    @GetUser() user: UserEntity
  ): Promise<{ message: string }> {
    return this.userPermissionsService.updateUserPermission(user.id, templateId, permissionData);
  }

  // Reset specific user permission to default
  @Delete(':templateId')
  async resetUserPermission(
    @Param('templateId') templateId: string,
    @GetUser() user: UserEntity
  ): Promise<{ message: string }> {
    return this.userPermissionsService.resetUserPermission(user.id, templateId);
  }

  // Reset all user permissions to defaults
  @Delete()
  async resetAllUserPermissions(
    @GetUser() user: UserEntity
  ): Promise<{ message: string }> {
    return this.userPermissionsService.resetAllUserPermissions(user.id);
  }
}

// Push Notification Controller
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) { }

  // Register device token for push notifications
  @Post('register-device')
  async registerDeviceToken(
    @Body() deviceData: RegisterDeviceTokenDto,
    @GetUser() user: UserEntity
  ): Promise<{ message: string }> {
    return this.pushNotificationService.registerDeviceToken(user.id, deviceData);
  }

  // Send event notification to registered users
  // REMOVED - Notifications now sent automatically from event controllers

  // Get event notification history for user
  @Get('event-history')
  async getEventNotificationHistory(
    @Query() filters: GetEventNotificationHistoryDto,
    @GetUser() user: UserEntity
  ): Promise<{ notifications: EventNotificationResponseDto[]; total: number }> {
    return this.pushNotificationService.getEventNotificationHistory(user.id, filters);
  }

  // Get user's notifications (simple endpoint)
  @Get('my-notifications')
  async getMyNotifications(

    @GetUser() user: UserEntity,    
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('eventId') eventId?: string,
    @Query('isRead') isRead?: boolean,
  ): Promise<{ notifications: EventNotificationResponseDto[]; total: number; unreadCount: number }> {
    const filters = { page, limit, type, eventId, isRead };
    const result = await this.pushNotificationService.getEventNotificationHistory(user.id, filters);
    
    const unreadCount = await this.pushNotificationService.getUnreadEventNotificationCount(user.id);
    
    return {
      ...result,
      unreadCount: unreadCount.count
    };
  }

  // Mark event notification as read
  @Put('mark-event-read/:eventNotificationId')
  async markEventNotificationAsRead(
    @Param('eventNotificationId') eventNotificationId: string,
    @GetUser() user: UserEntity
  ): Promise<{ message: string }> {
    return this.pushNotificationService.markEventNotificationAsRead(user.id, eventNotificationId);
  }

  // Mark all notifications as read
  @Put('mark-all-read')
  async markAllNotificationsAsRead(
    @GetUser() user: UserEntity
  ): Promise<{ message: string }> {
    return this.pushNotificationService.markAllEventNotificationsAsRead(user.id);
  }
}

// Advert Notification Controller (Admin Management)
@Controller('api/admin/advert-notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdvertNotificationController {
  constructor(private readonly advertNotificationService: AdvertNotificationService) { }

  // Create advert notification (admin only) - supports both JSON and form data
  @Post()
  @UseInterceptors(FileUploadUtils.createAdvertFileInterceptor())
  async createAdvertNotification(
    @Body() createDto: CreateAdvertNotificationDto | CreateAdvertNotificationFormDto,
    @UploadedFiles() files: FileUploadConfig,
    @Request() req: any,
  ): Promise<{ message: string; data: AdvertNotificationResponseDto }> {
    try {
      // First validate and process files safely
      const fileProcessing = FileUploadUtils.processAdvertFilesSafely(files);
      if (!fileProcessing.success) {
        // Files are invalid, they've already been cleaned up
        throw new BadRequestException(`File validation failed: ${fileProcessing.errors?.join(', ')}`);
      }

      // Process files safely
      let imageUrl: string | undefined;
      if (fileProcessing.processedFiles?.advertImage) {
        imageUrl = fileProcessing.processedFiles.advertImage;
      }

      // Create the advert with processed image
      const advertData = {
        ...createDto,
        imageUrl,
      };

      return this.advertNotificationService.createAdvertNotification(advertData);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      FileUploadUtils.cleanupAdvertFiles(files);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        throw new BadRequestException('File size too large. Maximum size is 10MB.');
      }
      
      throw error;
    }
  }

  // Get all advert notifications (admin only)
  @Get()
  async getAllAdvertNotifications(): Promise<AdvertNotificationResponseDto[]> {
    return this.advertNotificationService.getAllAdvertNotifications();
  }

  // Get advert notification by ID (admin only)
  @Get(':id')
  async getAdvertNotificationById(
    @Param('id') id: string,
  ): Promise<AdvertNotificationResponseDto> {
    return this.advertNotificationService.getAdvertNotificationById(id);
  }

  // Update advert notification (admin only) - supports both JSON and form data
  @Put(':id')
  @UseInterceptors(FileUploadUtils.createAdvertFileInterceptor())
  async updateAdvertNotification(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdvertNotificationDto | UpdateAdvertNotificationFormDto,
    @UploadedFiles() files: FileUploadConfig,
    @Request() req: any,
  ): Promise<{ message: string; data: AdvertNotificationResponseDto }> {
    try {
      // First validate and process files safely
      const fileProcessing = FileUploadUtils.processAdvertFilesSafely(files);
      if (!fileProcessing.success) {
        // Files are invalid, they've already been cleaned up
        throw new BadRequestException(`File validation failed: ${fileProcessing.errors?.join(', ')}`);
      }

      // Process files safely
      let imageUrl: string | undefined;
      if (fileProcessing.processedFiles?.advertImage) {
        imageUrl = fileProcessing.processedFiles.advertImage;
      }

      // Update the advert with processed image
      const advertData = {
        ...updateDto,
        imageUrl,
      };

      return this.advertNotificationService.updateAdvertNotification(id, advertData);
    } catch (error: any) {
      // Clean up uploaded files if error occurs
      FileUploadUtils.cleanupAdvertFiles(files);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        throw new BadRequestException('File size too large. Maximum size is 10MB.');
      }
      
      throw error;
    }
  }

  // Delete advert notification (admin only)
  @Delete(':id')
  async deleteAdvertNotification(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.advertNotificationService.deleteAdvertNotification(id);
  }

  // Send advert notification to all users (admin only)
  @Post(':id/send')
  async sendAdvertNotification(
    @Param('id') id: string,
  ): Promise<{ message: string; sentCount: number }> {
    return this.advertNotificationService.sendAdvertNotification(id);
  }

  // Cleanup orphaned read records (admin only)
  @Post('cleanup-orphaned-records')
  async cleanupOrphanedRecords(): Promise<{ message: string; deletedCount: number }> {
    return this.advertNotificationService.cleanupOrphanedReadRecords();
  }

}

// Advert Notification User Controller (User-facing endpoints)
@Controller('api/notifications/advert')
@UseGuards(JwtAuthGuard)
export class AdvertNotificationUserController {
  constructor(private readonly advertNotificationService: AdvertNotificationService) { }

  // Get user's advert notification history
  @Get('history')
  async getMyAdvertNotificationHistory(
    @Query() filters: GetAdvertNotificationHistoryDto,
    @GetUser() user: UserEntity,
  ): Promise<{ notifications: any[]; total: number; unreadCount: number }> {
    const result = await this.advertNotificationService.getUserAdvertNotificationHistory(user.id, filters);
    const unreadCount = await this.advertNotificationService.getUnreadAdvertNotificationCount(user.id);
    
    return {
      ...result,
      unreadCount: unreadCount.count
    };
  }

  // Mark advert notification as read
  @Put('mark-read/:advertNotificationId')
  async markAdvertNotificationAsRead(
    @Param('advertNotificationId') advertNotificationId: string,
    @GetUser() user: UserEntity,
  ): Promise<{ message: string }> {
    return this.advertNotificationService.markAdvertNotificationAsRead(user.id, advertNotificationId);
  }

  // Mark all advert notifications as read
  @Put('mark-all-read')
  async markAllAdvertNotificationsAsRead(
    @GetUser() user: UserEntity,
  ): Promise<{ message: string }> {
    return this.advertNotificationService.markAllAdvertNotificationsAsRead(user.id);
  }

  // Get unread advert notification count
  @Get('unread-count')
  async getUnreadAdvertNotificationCount(
    @GetUser() user: UserEntity,
  ): Promise<{ count: number }> {
    return this.advertNotificationService.getUnreadAdvertNotificationCount(user.id);
  }
}
