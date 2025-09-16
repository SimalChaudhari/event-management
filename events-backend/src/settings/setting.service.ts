// src/faq/faq.service.ts

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Banner,
  BannerEvent,
  PrivacyPolicy,
  TermsConditions,
  UserPermissions,
  PermissionTemplate,
  PushNotification,
  NotificationHistory,
  AdvertNotification,
  AdvertNotificationRead,
} from './setting.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import {
  EventNotification,
  EventNotificationRead,
} from './event-notification.entity';
import {
  CreateBannerDto,
  CreateBannerEventDto,
  CreatePrivacyPolicyDto,
  CreateTermsConditionsDto,
  CreatePermissionTemplateDto,
  UpdateUserPermissionDto,
  UserPermissionWithTemplate,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  NotificationHistoryDto,
  EventNotificationDto,
  MarkEventNotificationReadDto,
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
import { FirebaseUtil } from '../utils/firebase.util';
import { ErrorHandlerUtil } from '../utils/error-handler.util';
import { NotificationUtil } from '../utils/notification.util';
import * as fs from 'fs';
import * as path from 'path';

// Privacy policy

@Injectable()
export class PrivacyPolicyService {
  constructor(
    @InjectRepository(PrivacyPolicy)
    private privacyPolicyRepository: Repository<PrivacyPolicy>,
  ) {}

  async getOrShow(): Promise<PrivacyPolicy | { message: string }> {
    try {
      const [privacyPolicy] = await this.privacyPolicyRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!privacyPolicy) {
        return { message: 'No privacy policy found' };
      }
      return privacyPolicy;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving privacy policy',
        error.message,
      );
    }
  }

  async createOrUpdate(
    createPrivacyPolicyDto: CreatePrivacyPolicyDto,
  ): Promise<{ message: string; data: PrivacyPolicy }> {
    try {
      // Use `find` with `take: 1` to get the first Terms and Conditions entry
      const [privacyPolicy] = await this.privacyPolicyRepository.find({
        take: 1,
        order: { id: 'ASC' }, // Adjust ordering if necessary
      });

      if (privacyPolicy) {
        // Update existing Terms and Conditions
        const updatedTerms = this.privacyPolicyRepository.merge(
          privacyPolicy,
          createPrivacyPolicyDto,
        );
        const result = await this.privacyPolicyRepository.save(updatedTerms);
        return {
          message: 'Terms and Conditions updated successfully',
          data: result,
        };
      } else {
        // Create new Terms and Conditions if none exists
        const newTerms = this.privacyPolicyRepository.create(
          createPrivacyPolicyDto,
        );
        const result = await this.privacyPolicyRepository.save(newTerms);
        return { message: 'Privacy Policy created successfully', data: result };
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error creating or updating privacy policy',
        error.message,
      );
    }
  }
}

// term And Condition

@Injectable()
export class TermsConditionsService {
  constructor(
    @InjectRepository(TermsConditions)
    private termsConditionsRepository: Repository<TermsConditions>,
  ) {}

  async getOrShow(): Promise<TermsConditions | { message: string }> {
    try {
      const [termsConditions] = await this.termsConditionsRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!termsConditions) {
        return { message: 'No terms and conditions found' };
      }
      return termsConditions;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving terms and conditions',
        error.message,
      );
    }
  }

  async createOrUpdate(
    createTermsConditionsDto: CreateTermsConditionsDto,
  ): Promise<{ message: string; data: TermsConditions }> {
    try {
      // Use `find` with `take: 1` to get the first Terms and Conditions entry
      const [termsConditions] = await this.termsConditionsRepository.find({
        take: 1,
        order: { id: 'ASC' }, // Adjust ordering if necessary
      });

      if (termsConditions) {
        // Update existing Terms and Conditions
        const updatedTerms = this.termsConditionsRepository.merge(
          termsConditions,
          createTermsConditionsDto,
        );
        const result = await this.termsConditionsRepository.save(updatedTerms);
        return {
          message: 'Terms and Conditions updated successfully',
          data: result,
        };
      } else {
        // Create new Terms and Conditions if none exists
        const newTerms = this.termsConditionsRepository.create(
          createTermsConditionsDto,
        );
        const result = await this.termsConditionsRepository.save(newTerms);
        return {
          message: 'Terms and Conditions created successfully',
          data: result,
        };
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error creating or updating terms and conditions',
        error.message,
      );
    }
  }
}

// Banner

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
  ) {}

  async getOrShow(): Promise<Banner | { message: string }> {
    try {
      const [banner] = await this.bannerRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!banner) {
        return { message: 'No banners found' };
      }
      return banner;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving banners',
        error.message,
      );
    }
  }

  async createOrUpdate(
    createBannerDto: CreateBannerDto,
  ): Promise<{ message: string; data: Banner }> {
    try {
      const [banner] = await this.bannerRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (banner) {
        // Delete previous file from upload folder
        await this.deleteFileFromFolder(banner.imageUrl);

        // Update existing banner
        const updatedBanner = this.bannerRepository.merge(
          banner,
          createBannerDto,
        );
        const result = await this.bannerRepository.save(updatedBanner);
        return { message: 'Banner updated successfully', data: result };
      } else {
        // Create new banner if none exists
        const newBanner = this.bannerRepository.create(createBannerDto);
        const result = await this.bannerRepository.save(newBanner);
        return { message: 'Banner created successfully', data: result };
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error creating or updating banner',
        error.message,
      );
    }
  }

  // New method to clear banner
  async clearBanner(): Promise<{ message: string }> {
    try {
      const [banner] = await this.bannerRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!banner) {
        throw new NotFoundException('No banner found');
      }

      // Delete file from upload folder
      await this.deleteFileFromFolder(banner.imageUrl);

      // Clear the imageUrl and hyperlink with empty strings instead of null
      banner.imageUrl = '';
      banner.hyperlink = '';
      await this.bannerRepository.save(banner);

      return { message: 'Banner cleared successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error clearing banner',
        error.message,
      );
    }
  }

  // New method to delete banner image
  async deleteBannerImage(): Promise<{ message: string; data: Banner }> {
    try {
      const [banner] = await this.bannerRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!banner) {
        throw new NotFoundException('No banner found');
      }

      // Delete the file from upload folder
      await this.deleteFileFromFolder(banner.imageUrl);

      // Clear the imageUrl with empty string instead of null
      banner.imageUrl = '';
      const result = await this.bannerRepository.save(banner);

      return { message: 'Banner image deleted successfully', data: result };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error deleting banner image',
        error.message,
      );
    }
  }

  // Helper method to delete a single file from folder
  private async deleteFileFromFolder(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl) return;
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      
      }
    } catch (error) {
      console.error(`Error deleting file ${imageUrl}:`, error);
    }
  }
}

// Banner Event

@Injectable()
export class BannerEventService {
  constructor(
    @InjectRepository(BannerEvent)
    private bannerEventRepository: Repository<BannerEvent>,
  ) {}

  async getOrShow(): Promise<BannerEvent | { message: string }> {
    try {
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!bannerEvent) {
        return { message: 'No banner events found' };
      }
      return bannerEvent;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving banner events',
        error.message,
      );
    }
  }

  async createOrUpdate(
    createBannerEventDto: CreateBannerEventDto,
  ): Promise<{ message: string; data: BannerEvent }> {
    try {
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (bannerEvent) {
        // Delete previous files from upload folder
        await this.deleteFilesFromFolder(bannerEvent.imageUrls);

        // Update existing banner
        const updatedBannerEvent = this.bannerEventRepository.merge(
          bannerEvent,
          createBannerEventDto,
        );
        const result =
          await this.bannerEventRepository.save(updatedBannerEvent);
        return { message: 'Banner events updated successfully', data: result };
      } else {
        // Create new banner if none exists
        const newBannerEvent =
          this.bannerEventRepository.create(createBannerEventDto);
        const result = await this.bannerEventRepository.save(newBannerEvent);
        return { message: 'Banner events created successfully', data: result };
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error creating or updating banners',
        error.message,
      );
    }
  }

  async deleteImage(
    imageUrl: string,
  ): Promise<{ message: string; data: BannerEvent }> {
    try {
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!bannerEvent) {
        throw new NotFoundException('No banner events found');
      }

      const updatedImageUrls = bannerEvent.imageUrls.filter(
        (url) => url !== imageUrl,
      );

      if (updatedImageUrls.length === bannerEvent.imageUrls.length) {
        throw new NotFoundException('Image not found in banner events');
      }

      // Delete the specific file from upload folder
      await this.deleteFileFromFolder(imageUrl);

      bannerEvent.imageUrls = updatedImageUrls;
      const result = await this.bannerEventRepository.save(bannerEvent);

      return { message: 'Banner image deleted successfully', data: result };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error deleting banner image',
        error.message,
      );
    }
  }

  async deleteImageByIndex(
    index: number,
  ): Promise<{ message: string; data: BannerEvent }> {
    try {
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!bannerEvent) {
        throw new NotFoundException('No banner events found');
      }

      if (index < 0 || index >= bannerEvent.imageUrls.length) {
        throw new BadRequestException('Invalid image index');
      }

      // Get the image URL to delete from folder
      const imageUrlToDelete = bannerEvent.imageUrls[index];

      // Remove the image at the specified index
      bannerEvent.imageUrls.splice(index, 1);
      const result = await this.bannerEventRepository.save(bannerEvent);

      // Delete the file from upload folder
      await this.deleteFileFromFolder(imageUrlToDelete);

      return { message: 'Banner image deleted successfully', data: result };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error deleting banner image',
        error.message,
      );
    }
  }

  // New method to clear all banner events
  async clearAllBannerEvents(): Promise<{ message: string }> {
    try {
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!bannerEvent) {
        throw new NotFoundException('No banner events found');
      }

      // Delete all files from upload folder
      await this.deleteFilesFromFolder(bannerEvent.imageUrls);

      // Clear the imageUrls array and hyperlink with empty values instead of null
      bannerEvent.imageUrls = [];
      bannerEvent.hyperlink = '';
      await this.bannerEventRepository.save(bannerEvent);

      return { message: 'All banner events cleared successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error clearing all banner events',
        error.message,
      );
    }
  }

  // New method to delete a specific image by URL
  async deleteSpecificImage(
    imageUrl: string,
  ): Promise<{ message: string; data: BannerEvent }> {
    try {
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!bannerEvent) {
        throw new NotFoundException('No banner events found');
      }

      const updatedImageUrls = bannerEvent.imageUrls.filter(
        (url) => url !== imageUrl,
      );

      if (updatedImageUrls.length === bannerEvent.imageUrls.length) {
        throw new NotFoundException('Image not found in banner events');
      }

      // Delete the specific file from upload folder
      await this.deleteFileFromFolder(imageUrl);

      bannerEvent.imageUrls = updatedImageUrls;
      const result = await this.bannerEventRepository.save(bannerEvent);

      return {
        message: 'Specific banner event image deleted successfully',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error deleting specific banner event image',
        error.message,
      );
    }
  }

  // Helper method to delete a single file from folder
  private async deleteFileFromFolder(imageUrl: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
       
      }
    } catch (error) {
      console.error(`Error deleting file ${imageUrl}:`, error);
    }
  }

  // Helper method to delete multiple files from folder
  private async deleteFilesFromFolder(imageUrls: string[]): Promise<void> {
    try {
      for (const imageUrl of imageUrls) {
        await this.deleteFileFromFolder(imageUrl);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  }
}

// Permission Templates Service (Admin creates default permissions)

@Injectable()
export class PermissionTemplateService {
  constructor(
    @InjectRepository(PermissionTemplate)
    private permissionTemplateRepository: Repository<PermissionTemplate>,
  ) {}

  // Create permission template (admin only)
  async createTemplate(
    templateData: CreatePermissionTemplateDto,
  ): Promise<{ message: string; data: PermissionTemplate }> {
    try {
      const newTemplate = this.permissionTemplateRepository.create({
        title: templateData.title,
        code: templateData.code,
        description: templateData.description,
        defaultEnabled: templateData.defaultEnabled ?? false,
      });

      const result = await this.permissionTemplateRepository.save(newTemplate);
      return {
        message: 'Permission template created successfully',
        data: result,
      };
    } catch (error: any) {
    
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error creating permission template',
        error.message,
      );
    }
  }

  // Get all permission templates
  async getAllTemplates(): Promise<PermissionTemplate[]> {
    try {
      const templates = await this.permissionTemplateRepository.find({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      });
      return templates;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving permission templates',
        error.message,
      );
    }
  }

  // Delete permission template
  async deleteTemplate(templateId: string): Promise<{ message: string }> {
    try {
      const result = await this.permissionTemplateRepository.delete({
        id: templateId,
      });

      if (result.affected === 0) {
        throw new NotFoundException('Permission template not found');
      }

      return { message: 'Permission template deleted successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error deleting permission template',
        error.message,
      );
    }
  }

  // Seed default permission templates
  async seedDefaultTemplates(): Promise<{ message: string; count: number }> {
    try {
      // Check if templates already exist
      const existingTemplates = await this.permissionTemplateRepository.count();
      if (existingTemplates > 0) {
        return {
          message: 'Default templates already exist',
          count: existingTemplates,
        };
      }

      // Define the 6 default templates based on the image
      const defaultTemplates = [
        {
          title: 'Biometric Sign in',
          code: 'biometric_signin',
          description:
            'Use biometric authentication for secure and quick access to your account',
          defaultEnabled: true,
        },
        {
          title: 'Event Notifications',
          code: 'event_notifications',
          description:
            'Get notified about important updates for your registered events—such as changes in time or location—and receive reminders to download event materials.',
          defaultEnabled: false,
        },
        {
          title: 'Networking Notifications',
          code: 'networking_notifications',
          description:
            'Be notified when other attendees reach out, receive messages from event chatrooms, and get reminders for your scheduled meet-ups.',
          defaultEnabled: false,
        },
        {
          title: 'Contact',
          code: 'contact',
          description:
            'Allow other attendees to contact you and share your contact information for networking opportunities.',
          defaultEnabled: false,
        },
        {
          title: 'Email Address',
          code: 'email_address',
          description:
            'Share your email address with other attendees for direct communication and follow-ups.',
          defaultEnabled: false,
        },
        {
          title: 'LinkedIn',
          code: 'linkedin',
          description:
            'Share your LinkedIn profile with other attendees for professional networking and connections.',
          defaultEnabled: false,
        },
        {
          title: 'Advert Notifications',
          code: 'advert_notifications',
          description:
            'Receive promotional notifications and advertisements from the platform. You can opt out at any time.',
          defaultEnabled: true, // Default enabled for advert notifications
        },
      ];

      // Create and save all templates
      const createdTemplates = [];
      for (const templateData of defaultTemplates) {
        const newTemplate =
          this.permissionTemplateRepository.create(templateData);
        const savedTemplate =
          await this.permissionTemplateRepository.save(newTemplate);
        createdTemplates.push(savedTemplate);
      }

      return {
        message: 'Default permission templates created successfully',
        count: createdTemplates.length,
      };
    } catch (error: any) {
      console.error('Error seeding default templates:', error);
      throw new InternalServerErrorException(
        'Error creating default permission templates',
        error.message,
      );
    }
  }
}

// User Permissions Service (User-specific settings)

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(UserPermissions)
    private userPermissionsRepository: Repository<UserPermissions>,
    @InjectRepository(PermissionTemplate)
    private permissionTemplateRepository: Repository<PermissionTemplate>,
  ) {}

  // Get user permissions with template info (shows defaults + user customizations)
  async getUserPermissionsWithTemplates(
    userId: string,
  ): Promise<UserPermissionWithTemplate[]> {
    try {
      // Get all active permission templates
      const templates = await this.permissionTemplateRepository.find({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      });

      // Get user's custom permissions
      const userPermissions = await this.userPermissionsRepository.find({
        where: { userId },
      });

      // Create a map of user permissions for quick lookup
      const userPermissionMap = new Map();
      userPermissions.forEach((up) => {
        userPermissionMap.set(up.templateId, up.enabled);
      });

      // Combine templates with user customizations
      const result: UserPermissionWithTemplate[] = templates.map((template) => {
        // Get user's custom setting, or use template default if not customized
        const userEnabled = userPermissionMap.get(template.id);
        const enabled =
          userEnabled !== undefined ? userEnabled : template.defaultEnabled;

        return {
          id: template.id,
          title: template.title,
          description: template.description,
          defaultEnabled: enabled, // This will be the user's actual setting (default or customized)
        };
      });

      return result;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving user permissions with templates',
        error.message,
      );
    }
  }

  // Update user's specific permission
  async updateUserPermission(
    userId: string,
    templateId: string,
    permissionData: UpdateUserPermissionDto,
  ): Promise<{ message: string }> {
    try {
      // Check if permission template exists
      const template = await this.permissionTemplateRepository.findOne({
        where: {
          id: templateId,
          isActive: true,
        },
      });

      if (!template) {
        throw new NotFoundException('Permission template not found');
      }

      // Check if user already has this permission customized
      let userPermission = await this.userPermissionsRepository.findOne({
        where: {
          userId: userId,
          templateId: templateId,
        },
      });

      if (userPermission) {
        // Update existing user permission
        userPermission.enabled = permissionData.enabled;
        await this.userPermissionsRepository.save(userPermission);
      } else {
        // Create new user permission
        const newUserPermission = this.userPermissionsRepository.create({
          userId: userId,
          templateId: templateId,
          enabled: permissionData.enabled,
        });
        await this.userPermissionsRepository.save(newUserPermission);
      }

      return { message: 'User permission updated successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating user permission',
        error.message,
      );
    }
  }

  // Reset user permission to default (delete user customization)
  async resetUserPermission(
    userId: string,
    templateId: string,
  ): Promise<{ message: string }> {
    try {
      const result = await this.userPermissionsRepository.delete({
        userId: userId,
        templateId: templateId,
      });

      if (result.affected === 0) {
        throw new NotFoundException('User permission not found');
      }

      return { message: 'User permission reset to default successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error resetting user permission',
        error.message,
      );
    }
  }

  // Reset all user permissions to defaults
  async resetAllUserPermissions(userId: string): Promise<{ message: string }> {
    try {
      const result = await this.userPermissionsRepository.delete({ userId });

      if (result.affected === 0) {
        throw new NotFoundException('No user permissions found');
      }

      return { message: 'All user permissions reset to defaults successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error resetting all user permissions',
        error.message,
      );
    }
  }
}

// Push Notification Service
@Injectable()
export class PushNotificationService {
  private notificationGateway: any = null;

  constructor(
    @InjectRepository(PushNotification)
    private pushNotificationRepository: Repository<PushNotification>,
    @InjectRepository(NotificationHistory)
    private notificationHistoryRepository: Repository<NotificationHistory>,
    @InjectRepository(UserPermissions)
    private userPermissionsRepository: Repository<UserPermissions>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(EventNotification)
    private eventNotificationRepository: Repository<EventNotification>,
    @InjectRepository(EventNotificationRead)
    private eventNotificationReadRepository: Repository<EventNotificationRead>,
    private readonly notificationUtil: NotificationUtil,
  ) {
    // Initialize Firebase using utility
    FirebaseUtil.initializeFirebase();
  }

  // Register device token for push notifications
  async registerDeviceToken(
    userId: string,
    deviceData: RegisterDeviceTokenDto,
  ): Promise<{ message: string }> {
    try {
      // Check if device token already exists for this user
      const existingToken = await this.pushNotificationRepository.findOne({
        where: { userId, deviceToken: deviceData.deviceToken },
      });

      if (existingToken) {
        // Update existing token
        existingToken.platform = deviceData.platform || 'android';
        existingToken.isActive = true;
        await this.pushNotificationRepository.save(existingToken);
        return { message: 'Device token updated successfully' };
      } else {
        // Create new token
        const newToken = this.pushNotificationRepository.create({
          userId,
          deviceToken: deviceData.deviceToken,
          platform: deviceData.platform || 'android',
          isActive: true,
        });
        await this.pushNotificationRepository.save(newToken);
        return { message: 'Device token registered successfully' };
      }
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Send event notification to registered users (NEW EFFICIENT METHOD)
  // REMOVED - Notifications now sent automatically from event controllers

  // Get event notification history for user (USING UTILITY)
  async getEventNotificationHistory(
    userId: string,
    filters: GetEventNotificationHistoryDto,
  ): Promise<{ notifications: EventNotificationResponseDto[]; total: number }> {
    try {
      return await this.notificationUtil.getUserNotificationHistory(
        userId,
        filters,
      );
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // OLD METHOD - REPLACED WITH UTILITY
  async getEventNotificationHistoryOld(
    userId: string,
    filters: GetEventNotificationHistoryDto,
  ): Promise<{ notifications: EventNotificationResponseDto[]; total: number }> {
    try {
      // First, get all event notifications for user's registered events
      const queryBuilder = this.eventNotificationRepository
        .createQueryBuilder('eventNotification')
        .where(
          'eventNotification.eventId IN (SELECT re."eventId" FROM "registerEvents" re WHERE re."userId" = :userId AND re."isRegister" = true)',
          { userId },
        )
        .orderBy('eventNotification.createdAt', 'DESC');

      // Apply filters
      if (filters.type) {
        queryBuilder.andWhere('eventNotification.type = :type', {
          type: filters.type,
        });
      }

      if (filters.eventId) {
        queryBuilder.andWhere('eventNotification.eventId = :eventId', {
          eventId: filters.eventId,
        });
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      queryBuilder.skip(skip).take(limit);

      const [eventNotifications, total] = await queryBuilder.getManyAndCount();

      // Map to response DTO
      const notifications: EventNotificationResponseDto[] =
        eventNotifications.map((notification) => ({
          id: notification.id,
          eventId: notification.eventId,
          title: notification.title,
          description: notification.description,
          type: notification.type,
          isRead: false, // Will be updated below
          readAt: undefined,
          createdAt: notification.createdAt,
        }));

      // Get read status for each notification
      if (notifications.length > 0) {
        const notificationIds = notifications.map((n) => n.id);
        const readStatuses = await this.eventNotificationReadRepository
          .createQueryBuilder('read')
          .where('read.eventNotificationId IN (:...notificationIds)', {
            notificationIds,
          })
          .andWhere('read.userId = :userId', { userId })
          .getMany();

        // Update read status
        notifications.forEach((notification) => {
          const readStatus = readStatuses.find(
            (rs) => rs.eventNotificationId === notification.id,
          );
          if (readStatus) {
            notification.isRead = readStatus.isRead;
            notification.readAt = readStatus.readAt;
          }
        });

        // Apply read filter if specified
        if (filters.isRead !== undefined) {
          const filteredNotifications = notifications.filter((notification) =>
            filters.isRead ? notification.isRead : !notification.isRead,
          );
          return {
            notifications: filteredNotifications,
            total: filteredNotifications.length,
          };
        }
      }

      return { notifications, total };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Mark event notification as read (NEW EFFICIENT METHOD)
  async markEventNotificationAsRead(
    userId: string,
    eventNotificationId: string,
  ): Promise<{ message: string }> {
    try {
      // Check if user is registered for the event
      const eventNotification = await this.eventNotificationRepository.findOne({
        where: { id: eventNotificationId },
      });

      if (!eventNotification) {
        throw new NotFoundException('Event notification not found');
      }

      // Check if user is registered for this event
      const isRegistered = await this.registerEventRepository.findOne({
        where: {
          eventId: eventNotification.eventId,
          userId,
          isRegister: true,
        },
      });

      if (!isRegistered) {
        throw new NotFoundException('User not registered for this event');
      }

      // Check if read record already exists
      let readRecord = await this.eventNotificationReadRepository.findOne({
        where: {
          eventNotificationId,
          userId,
        },
      });

      if (readRecord) {
        // Update existing record
        readRecord.isRead = true;
        readRecord.readAt = new Date();
        await this.eventNotificationReadRepository.save(readRecord);
      } else {
        // Create new read record
        readRecord = this.eventNotificationReadRepository.create({
          eventNotificationId,
          userId,
          isRead: true,
          readAt: new Date(),
        });
        await this.eventNotificationReadRepository.save(readRecord);
      }

      return { message: 'Event notification marked as read' };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Get unread event notification count - only notifications specifically sent to this user
  async getUnreadEventNotificationCount(
    userId: string,
  ): Promise<{ count: number }> {
    try {
      // Get only notifications that were specifically sent to this user
      const unreadCount = await this.eventNotificationReadRepository
        .createQueryBuilder('read')
        .innerJoin('read.eventNotification', 'eventNotification')
        .where('read.userId = :userId', { userId })
        .andWhere('read.isRead = false')
        .getCount();

      return { count: unreadCount };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Mark all event notifications as read for a user - only notifications specifically sent to this user
  async markAllEventNotificationsAsRead(
    userId: string,
  ): Promise<{ message: string }> {
    try {
      // Get count of unread notifications for this user
      const unreadCount = await this.eventNotificationReadRepository
        .createQueryBuilder('read')
        .where('read.userId = :userId', { userId })
        .andWhere('read.isRead = false')
        .getCount();

      if (unreadCount === 0) {
        return { message: 'No unread notifications found' };
      }

      // Mark all unread notifications as read for this user
      await this.eventNotificationReadRepository
        .createQueryBuilder()
        .update(EventNotificationRead)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where('userId = :userId', { userId })
        .andWhere('isRead = false')
        .execute();

      return {
        message: `Successfully marked ${unreadCount} notification(s) as read`,
      };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Set notification gateway reference
  setNotificationGateway(gateway: any) {
    this.notificationGateway = gateway;
  }
}

// Advert Notification Service
@Injectable()
export class AdvertNotificationService {
  constructor(
    @InjectRepository(AdvertNotification)
    private advertNotificationRepository: Repository<AdvertNotification>,
    @InjectRepository(AdvertNotificationRead)
    private advertNotificationReadRepository: Repository<AdvertNotificationRead>,
    @InjectRepository(UserPermissions)
    private userPermissionsRepository: Repository<UserPermissions>,
    @InjectRepository(PermissionTemplate)
    private permissionTemplateRepository: Repository<PermissionTemplate>,
    @InjectRepository(PushNotification)
    private pushNotificationRepository: Repository<PushNotification>,
    private readonly notificationUtil: NotificationUtil,
  ) {}

  private notificationGateway: any = null;

  setNotificationGateway(gateway: any) {
    this.notificationGateway = gateway;
  }

  // Create advert notification (admin only) - supports both JSON and form data
  async createAdvertNotification(
    createDto: CreateAdvertNotificationDto | CreateAdvertNotificationFormDto,
  ): Promise<{ message: string; data: AdvertNotificationResponseDto }> {
    try {
      const newAdvert = this.advertNotificationRepository.create({
        title: createDto.title,
        content: createDto.content,
        imageUrl: 'imageUrl' in createDto ? createDto.imageUrl : undefined,
        actionUrl: createDto.actionUrl,
        actionText: createDto.actionText,
        isActive: createDto.isActive ?? false,
        scheduledAt: createDto.scheduledAt,
      });

      const savedAdvert = await this.advertNotificationRepository.save(newAdvert);

      const response: AdvertNotificationResponseDto = {
        id: savedAdvert.id,
        title: savedAdvert.title,
        content: savedAdvert.content,
        imageUrl: savedAdvert.imageUrl,
        actionUrl: savedAdvert.actionUrl,
        actionText: savedAdvert.actionText,
        isActive: savedAdvert.isActive,
        isSent: savedAdvert.isSent,
        scheduledAt: savedAdvert.scheduledAt,
        sentAt: savedAdvert.sentAt,
        sentCount: savedAdvert.sentCount,
        createdAt: savedAdvert.createdAt,
        updatedAt: savedAdvert.updatedAt,
      };

      return {
        message: 'Advert notification created successfully',
        data: response,
      };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Get all advert notifications (admin only)
  async getAllAdvertNotifications(): Promise<AdvertNotificationResponseDto[]> {
    try {
      const adverts = await this.advertNotificationRepository.find({
        order: { createdAt: 'DESC' },
      });

      return adverts.map((advert) => ({
        id: advert.id,
        title: advert.title,
        content: advert.content,
        imageUrl: advert.imageUrl,
        actionUrl: advert.actionUrl,
        actionText: advert.actionText,
        isActive: advert.isActive,
        isSent: advert.isSent,
        scheduledAt: advert.scheduledAt,
        sentAt: advert.sentAt,
        sentCount: advert.sentCount,
        createdAt: advert.createdAt,
        updatedAt: advert.updatedAt,
      }));
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Get advert notification by ID
  async getAdvertNotificationById(id: string): Promise<AdvertNotificationResponseDto> {
    try {
      const advert = await this.advertNotificationRepository.findOne({
        where: { id },
      });

      if (!advert) {
        throw new NotFoundException('Advert notification not found');
      }

      return {
        id: advert.id,
        title: advert.title,
        content: advert.content,
        imageUrl: advert.imageUrl,
        actionUrl: advert.actionUrl,
        actionText: advert.actionText,
        isActive: advert.isActive,
        isSent: advert.isSent,
        scheduledAt: advert.scheduledAt,
        sentAt: advert.sentAt,
        sentCount: advert.sentCount,
        createdAt: advert.createdAt,
        updatedAt: advert.updatedAt,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Update advert notification (admin only) - supports both JSON and form data
  async updateAdvertNotification(
    id: string,
    updateDto: UpdateAdvertNotificationDto | UpdateAdvertNotificationFormDto,
  ): Promise<{ message: string; data: AdvertNotificationResponseDto }> {
    try {
      const advert = await this.advertNotificationRepository.findOne({
        where: { id },
      });

      if (!advert) {
        throw new NotFoundException('Advert notification not found');
      }

      // Handle image update if new image provided
      if ('imageUrl' in updateDto && updateDto.imageUrl !== undefined) {
        // Delete old image if exists and new image is different
        if (advert.imageUrl && advert.imageUrl !== updateDto.imageUrl) {
          await this.deleteAdvertImage(advert.imageUrl);
        }
        advert.imageUrl = updateDto.imageUrl;
      }

      // Update other fields
      Object.assign(advert, updateDto);
      const updatedAdvert = await this.advertNotificationRepository.save(advert);

      const response: AdvertNotificationResponseDto = {
        id: updatedAdvert.id,
        title: updatedAdvert.title,
        content: updatedAdvert.content,
        imageUrl: updatedAdvert.imageUrl,
        actionUrl: updatedAdvert.actionUrl,
        actionText: updatedAdvert.actionText,
        isActive: updatedAdvert.isActive,
        isSent: updatedAdvert.isSent,
        scheduledAt: updatedAdvert.scheduledAt,
        sentAt: updatedAdvert.sentAt,
        sentCount: updatedAdvert.sentCount,
        createdAt: updatedAdvert.createdAt,
        updatedAt: updatedAdvert.updatedAt,
      };

      return {
        message: 'Advert notification updated successfully',
        data: response,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Delete advert notification (admin only)
  async deleteAdvertNotification(id: string): Promise<{ message: string }> {
    try {
      const result = await this.advertNotificationRepository.delete({ id });

      if (result.affected === 0) {
        throw new NotFoundException('Advert notification not found');
      }

      // Also delete all related read records
      await this.advertNotificationReadRepository.delete({
        advertNotificationId: id,
      });

      return { message: 'Advert notification deleted successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Send advert notification to all users who have advert notifications enabled
  async sendAdvertNotification(advertId: string): Promise<{ 
    message: string; 
    sentCount: number; 
    statistics?: {
      totalUsers: number;
      eligibleUsers: number;
      notificationsSent: number;
      usersSkipped: number;
    }
  }> {
    try {
      const advert = await this.advertNotificationRepository.findOne({
        where: { id: advertId },
      });

      if (!advert) {
        throw new NotFoundException('Advert notification not found');
      }

      if (!advert.isActive) {
        throw new BadRequestException('Advert notification is not active');
      }

      if (advert.isSent) {
        throw new BadRequestException('Advert notification has already been sent');
      }

      // Get advert notification permission template
      const advertTemplate = await this.permissionTemplateRepository.findOne({
        where: { code: 'advert_notifications' },
      });

      if (!advertTemplate) {
        throw new NotFoundException('Advert notification permission template not found');
      }

      // Get all custom permissions for advert notifications
      const customPermissions = await this.userPermissionsRepository.find({
        where: { templateId: advertTemplate.id },
      });

      // Create a map of user permissions for quick lookup
      const userPermissionMap = new Map();
      customPermissions.forEach(permission => {
        userPermissionMap.set(permission.userId, permission.enabled);
      });

      // Get all users for socket notifications
      let users = [];
      try {
        users = await this.pushNotificationRepository.manager
          .createQueryBuilder()
          .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
          .from('users', 'user')
          .getRawMany();
      } catch (queryError: any) {
        throw new Error(`Database query error: ${queryError.message}`);
      }

      // Filter users based on their advert notification preference
      const eligibleUsers = users.filter(user => {
        const userPreference = userPermissionMap.get(user.user_id);
        const isEligible = userPreference !== undefined ? userPreference : advertTemplate.defaultEnabled;
        return isEligible;
      });

      // Check if we have eligible users
      if (eligibleUsers.length === 0) {
        return {
          message: `No eligible users found. Total users in database: ${users.length}, Eligible users: 0`,
          sentCount: 0,
        };
      }

      const uniqueUsers = eligibleUsers;

      // Send socket notifications to all eligible users
      const userIds = uniqueUsers.map(user => user.user_id);
      
      let sentCount = 0;
      if (userIds.length > 0) {
        try {
          // Send socket notifications directly to all eligible users
          for (const userId of userIds) {
            try {
              this.sendSocketNotificationToUser(userId, {
                id: advert.id,
                title: advert.title,
                content: advert.content,
                imageUrl: advert.imageUrl,
                actionUrl: advert.actionUrl,
                actionText: advert.actionText,
                type: 'advert',
                createdAt: new Date()
              });
              sentCount++;
            } catch (socketError) {
              // Silent fail for individual users
            }
          }
        } catch (notificationError) {
          sentCount = 0;
        }
      }

      // Create read records for tracking (same as event notifications)
      for (const user of uniqueUsers) {
        try {
          const readRecord = this.advertNotificationReadRepository.create({
            advertNotificationId: advert.id,
            userId: user.user_id,
            isRead: false,
          });
          await this.advertNotificationReadRepository.save(readRecord);
        } catch (readError) {
          // Silent fail for read records
        }
      }

      // Mark advert as sent
      advert.isSent = true;
      advert.sentAt = new Date();
      advert.sentCount = sentCount;
      await this.advertNotificationRepository.save(advert);

      return {
        message: `Socket notifications sent to ${sentCount} users. Total users in database: ${users.length}, Eligible users: ${eligibleUsers.length}`,
        sentCount,
        statistics: {
          totalUsers: users.length,
          eligibleUsers: eligibleUsers.length,
          notificationsSent: sentCount,
          usersSkipped: users.length - eligibleUsers.length
        }
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Send socket notification to user
  private sendSocketNotificationToUser(userId: string, notification: any): void {
    try {
      if (this.notificationGateway) {
        this.notificationGateway.sendAdvertNotificationToUser(userId, notification);
      }
    } catch (error: any) {
      // Silent fail for socket notifications
    }
  }


  // Get user's advert notification history
  async getUserAdvertNotificationHistory(
    userId: string,
    filters: GetAdvertNotificationHistoryDto,
  ): Promise<{ notifications: any[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Get all read records for this user first
      const userReadRecords = await this.advertNotificationReadRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      // Get advert IDs that this user has received (filter out null values)
      const advertIds = userReadRecords
        .map(record => record.advertNotificationId)
        .filter(id => id !== null && id !== undefined);

      if (advertIds.length === 0) {
        return { notifications: [], total: 0 };
      }

      // Get all adverts that were sent to this user
      const allAdverts = await this.advertNotificationRepository.find({
        where: {
          id: In(advertIds),
          isSent: true,
        },
        order: { createdAt: 'DESC' },
      });

      // Apply pagination
      const total = allAdverts.length;
      const adverts = allAdverts.slice(skip, skip + limit);

      // Create read status map (filter out records with null advertNotificationId)
      const readStatusMap = new Map(
        userReadRecords
          .filter(rs => rs.advertNotificationId !== null && rs.advertNotificationId !== undefined)
          .map(rs => [rs.advertNotificationId, rs])
      );

      const notifications = adverts.map(advert => {
        const readStatus = readStatusMap.get(advert.id);
        return {
          id: advert.id,
          title: advert.title,
          content: advert.content,
          imageUrl: advert.imageUrl,
          actionUrl: advert.actionUrl,
          actionText: advert.actionText,
          isRead: readStatus?.isRead || false,
          readAt: readStatus?.readAt,
          sentAt: advert.sentAt,
          createdAt: advert.createdAt,
        };
      });

      return { notifications, total };
    } catch (error: any) {
      console.error('Error getting user advert notification history:', error);
      return { notifications: [], total: 0 };
    }
  }

  // Mark advert notification as read
  async markAdvertNotificationAsRead(
    userId: string,
    advertNotificationId: string,
  ): Promise<{ message: string }> {
    try {
      let readRecord = await this.advertNotificationReadRepository.findOne({
        where: { advertNotificationId, userId },
      });

      if (readRecord) {
        readRecord.isRead = true;
        readRecord.readAt = new Date();
        await this.advertNotificationReadRepository.save(readRecord);
      } else {
        readRecord = this.advertNotificationReadRepository.create({
          advertNotificationId,
          userId,
          isRead: true,
          readAt: new Date(),
        });
        await this.advertNotificationReadRepository.save(readRecord);
      }

      return { message: 'Advert notification marked as read' };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Get unread advert notification count for user
  async getUnreadAdvertNotificationCount(userId: string): Promise<{ count: number }> {
    try {
      const unreadCount = await this.advertNotificationReadRepository
        .createQueryBuilder('read')
        .where('read.userId = :userId', { userId })
        .andWhere('read.isRead = false')
        .getCount();

      return { count: unreadCount };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Mark all advert notifications as read for a user
  async markAllAdvertNotificationsAsRead(userId: string): Promise<{ message: string }> {
    try {
      const unreadCount = await this.advertNotificationReadRepository
        .createQueryBuilder('read')
        .where('read.userId = :userId', { userId })
        .andWhere('read.isRead = false')
        .getCount();

      if (unreadCount === 0) {
        return { message: 'No unread advert notifications found' };
      }

      await this.advertNotificationReadRepository
        .createQueryBuilder()
        .update(AdvertNotificationRead)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where('userId = :userId', { userId })
        .andWhere('isRead = false')
        .execute();

      return {
        message: `Successfully marked ${unreadCount} advert notification(s) as read`,
      };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Helper method to send push notification to user
  private async sendPushNotificationToUser(userId: string, notification: any): Promise<void> {
    try {
      const deviceTokens = await this.pushNotificationRepository.find({
        where: { userId, isActive: true },
      });

      if (deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId} - notification will not be sent`);
        return;
      }

      for (const deviceToken of deviceTokens) {
        await FirebaseUtil.sendPushNotification(deviceToken.deviceToken, notification, deviceToken.platform);
      }
    } catch (error: any) {
      console.error(`Failed to send advert push notification to user ${userId}:`, error);
    }
  }

  // Helper method to extract plain text from HTML content
  private extractTextFromContent(content: string): string {
    // Simple HTML tag removal - in production, you might want to use a proper HTML parser
    return content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  }


  // Upload advert image
  private async uploadAdvertImage(file: Express.Multer.File): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'advert-notifications');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Write file
      fs.writeFileSync(filePath, file.buffer);

      // Return relative URL
      return `/uploads/advert-notifications/${fileName}`;
    } catch (error: any) {
      console.error('Error uploading advert image:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  // Delete advert image
  private async deleteAdvertImage(imageUrl: string): Promise<void> {
    try {
      if (imageUrl && imageUrl.startsWith('/uploads/advert-notifications/')) {
        const filePath = path.join(process.cwd(), imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error: any) {
      console.error('Error deleting advert image:', error);
      // Don't throw error for image deletion failures
    }
  }

  // Cleanup method to remove orphaned read records (admin only)
  async cleanupOrphanedReadRecords(): Promise<{ message: string; deletedCount: number }> {
    try {
      // Delete records with null advertNotificationId
      const nullRecordsResult = await this.advertNotificationReadRepository
        .createQueryBuilder()
        .delete()
        .where('advertNotificationId IS NULL')
        .execute();

      // Delete records that reference non-existent advert notifications
      const orphanedRecordsResult = await this.advertNotificationReadRepository
        .createQueryBuilder()
        .delete()
        .where('advertNotificationId NOT IN (SELECT id FROM advert_notifications)')
        .execute();

      const totalDeleted = (nullRecordsResult.affected || 0) + (orphanedRecordsResult.affected || 0);

      return {
        message: `Cleanup completed. Deleted ${totalDeleted} orphaned records.`,
        deletedCount: totalDeleted,
      };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }
}
