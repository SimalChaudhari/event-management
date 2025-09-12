// src/faq/faq.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Put,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  PrivacyPolicyService,
  TermsConditionsService,
  BannerService,
  BannerEventService,
  UserPermissionsService,
  PermissionTemplateService,
  PushNotificationService,
} from './setting.service';
import {
  CreatePrivacyPolicyDto,
  CreateTermsConditionsDto,
  CreateBannerDto,
  CreateBannerEventDto,
  CreatePermissionTemplateDto,
  UpdateUserPermissionDto,
  UserPermissionWithTemplate,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  NotificationHistoryDto,
} from './setting.dto';
import { PrivacyPolicy, TermsConditions, Banner, BannerEvent, UserPermissions, PermissionTemplate } from './setting.entity';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
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
        destination: './uploads/banners',
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
        destination: './uploads/banner-events',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + path.extname(file.originalname);
          cb(null, uniqueSuffix);
        },
       
      }),
    }),
  )
  async createOrUpdate(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('hyperlink') hyperlink?: string,
  ): Promise<{ message: string; data: BannerEvent }> {
    const imageUrls = files.map(file => `uploads/banner-events/${file.filename}`);
    
    const createBannerEventDto: CreateBannerEventDto = {
      imageUrls: imageUrls,
      hyperlink: hyperlink
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

}
