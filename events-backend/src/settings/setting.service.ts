// src/faq/faq.service.ts

import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {  Banner, BannerEvent, PrivacyPolicy, TermsConditions, UserPermissions, PermissionTemplate, PushNotification, NotificationHistory } from './setting.entity';
import { CreateBannerDto, CreateBannerEventDto, CreatePrivacyPolicyDto, CreateTermsConditionsDto, CreatePermissionTemplateDto, UpdateUserPermissionDto, UserPermissionWithTemplate, RegisterDeviceTokenDto, SendNotificationDto, NotificationHistoryDto } from './setting.dto';
import * as fs from 'fs';
import * as path from 'path';
import { FirebaseUtil } from '../utils/firebase.util';

// Privacy policy

@Injectable()
export class PrivacyPolicyService {
    constructor(
        @InjectRepository(PrivacyPolicy)
        private privacyPolicyRepository: Repository<PrivacyPolicy>
    ) { }

    async getOrShow(): Promise<PrivacyPolicy | { message: string }> {
        try {
            const [privacyPolicy] = await this.privacyPolicyRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!privacyPolicy) {
                return { message: 'No privacy policy found' };
            }
            return privacyPolicy;
        } catch (error: any) {
            throw new InternalServerErrorException('Error retrieving privacy policy', error.message);
        }
    }


    async createOrUpdate(createPrivacyPolicyDto: CreatePrivacyPolicyDto): Promise<{ message: string; data: PrivacyPolicy }> {
        try {
            // Use `find` with `take: 1` to get the first Terms and Conditions entry
            const [privacyPolicy] = await this.privacyPolicyRepository.find({
                take: 1,
                order: { id: 'ASC' } // Adjust ordering if necessary
            });

            if (privacyPolicy) {
                // Update existing Terms and Conditions
                const updatedTerms = this.privacyPolicyRepository.merge(privacyPolicy, createPrivacyPolicyDto);
                const result = await this.privacyPolicyRepository.save(updatedTerms);
                return { message: 'Terms and Conditions updated successfully', data: result };
            } else {
                // Create new Terms and Conditions if none exists
                const newTerms = this.privacyPolicyRepository.create(createPrivacyPolicyDto);
                const result = await this.privacyPolicyRepository.save(newTerms);
                return { message: 'Privacy Policy created successfully', data: result };
            }
        } catch (error: any) {
            throw new InternalServerErrorException('Error creating or updating privacy policy', error.message);
        }
    }

}

// term And Condition

@Injectable()
export class TermsConditionsService {
    constructor(
        @InjectRepository(TermsConditions)
        private termsConditionsRepository: Repository<TermsConditions>
    ) { }

    async getOrShow(): Promise<TermsConditions | { message: string }> {
        try {
            const [termsConditions] = await this.termsConditionsRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!termsConditions) {
                return { message: 'No terms and conditions found' };
            }
            return termsConditions;
        } catch (error: any) {
            throw new InternalServerErrorException('Error retrieving terms and conditions', error.message);
        }
    }


    async createOrUpdate(createTermsConditionsDto: CreateTermsConditionsDto): Promise<{ message: string; data: TermsConditions }> {
        try {
            // Use `find` with `take: 1` to get the first Terms and Conditions entry
            const [termsConditions] = await this.termsConditionsRepository.find({
                take: 1,
                order: { id: 'ASC' } // Adjust ordering if necessary
            });

            if (termsConditions) {
                // Update existing Terms and Conditions
                const updatedTerms = this.termsConditionsRepository.merge(termsConditions, createTermsConditionsDto);
                const result = await this.termsConditionsRepository.save(updatedTerms);
                return { message: 'Terms and Conditions updated successfully', data: result };
            } else {
                // Create new Terms and Conditions if none exists
                const newTerms = this.termsConditionsRepository.create(createTermsConditionsDto);
                const result = await this.termsConditionsRepository.save(newTerms);
                return { message: 'Terms and Conditions created successfully', data: result };
            }
        } catch (error: any) {
            throw new InternalServerErrorException('Error creating or updating terms and conditions', error.message);
        }
    }
}


// Banner

@Injectable()
export class BannerService {
    constructor(
        @InjectRepository(Banner)
        private bannerRepository: Repository<Banner>
    ) { }

    async getOrShow(): Promise<Banner | { message: string }> {
        try {
            const [banner] = await this.bannerRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!banner) {
                return { message: 'No banners found' };
            }
            return banner;
        } catch (error: any) {
            throw new InternalServerErrorException('Error retrieving banners', error.message);
        }
    }

    async createOrUpdate(createBannerDto: CreateBannerDto): Promise<{ message: string; data: Banner }> {
        try {
            const [banner] = await this.bannerRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (banner) {
                // Delete previous file from upload folder
                await this.deleteFileFromFolder(banner.imageUrl);
                
                // Update existing banner
                const updatedBanner = this.bannerRepository.merge(banner, createBannerDto);
                const result = await this.bannerRepository.save(updatedBanner);
                return { message: 'Banner updated successfully', data: result };
            } else {
                // Create new banner if none exists
                const newBanner = this.bannerRepository.create(createBannerDto);
                const result = await this.bannerRepository.save(newBanner);
                return { message: 'Banner created successfully', data: result };
            }
        } catch (error: any) {
            throw new InternalServerErrorException('Error creating or updating banner', error.message);
        }
    }

    // New method to clear banner
    async clearBanner(): Promise<{ message: string }> {
        try {
            const [banner] = await this.bannerRepository.find({
                take: 1,
                order: { id: 'ASC' }
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
            throw new InternalServerErrorException('Error clearing banner', error.message);
        }
    }

    // New method to delete banner image
    async deleteBannerImage(): Promise<{ message: string; data: Banner }> {
        try {
            const [banner] = await this.bannerRepository.find({
                take: 1,
                order: { id: 'ASC' }
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
            throw new InternalServerErrorException('Error deleting banner image', error.message);
        }
    }

    // Helper method to delete a single file from folder
    private async deleteFileFromFolder(imageUrl: string): Promise<void> {
        try {
            if (!imageUrl) return;
            const filePath = path.join(process.cwd(), imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`File deleted: ${filePath}`);
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
        private bannerEventRepository: Repository<BannerEvent>
    ) { }

    async getOrShow(): Promise<BannerEvent | { message: string }> {
        try {
            const [bannerEvent] = await this.bannerEventRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!bannerEvent) {
                return { message: 'No banner events found' };
            }
            return bannerEvent;
        } catch (error: any) {
            throw new InternalServerErrorException('Error retrieving banner events', error.message);
        }
    }

    async createOrUpdate(createBannerEventDto: CreateBannerEventDto): Promise<{ message: string; data: BannerEvent }> {
        try {
            const [bannerEvent] = await this.bannerEventRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (bannerEvent) {
                // Delete previous files from upload folder
                await this.deleteFilesFromFolder(bannerEvent.imageUrls);
                
                // Update existing banner
                const updatedBannerEvent = this.bannerEventRepository.merge(bannerEvent, createBannerEventDto);
                const result = await this.bannerEventRepository.save(updatedBannerEvent);
                return { message: 'Banner events updated successfully', data: result };
            } else {
                // Create new banner if none exists
                const newBannerEvent = this.bannerEventRepository.create(createBannerEventDto);
                const result = await this.bannerEventRepository.save(newBannerEvent);
                return { message: 'Banner events created successfully', data: result };
            }
        } catch (error: any) {
            throw new InternalServerErrorException('Error creating or updating banners', error.message);
        }
    }

    async deleteImage(imageUrl: string): Promise<{ message: string; data: BannerEvent }> {
        try {
            const [bannerEvent] = await this.bannerEventRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!bannerEvent) {
                throw new NotFoundException('No banner events found');
            }

            const updatedImageUrls = bannerEvent.imageUrls.filter(url => url !== imageUrl);
            
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
            throw new InternalServerErrorException('Error deleting banner image', error.message);
        }
    }

    async deleteImageByIndex(index: number): Promise<{ message: string; data: BannerEvent }> {
        try {
            const [bannerEvent] = await this.bannerEventRepository.find({
                take: 1,
                order: { id: 'ASC' }
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
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error deleting banner image', error.message);
        }
    }

    // New method to clear all banner events
    async clearAllBannerEvents(): Promise<{ message: string }> {
        try {
            const [bannerEvent] = await this.bannerEventRepository.find({
                take: 1,
                order: { id: 'ASC' }
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
            throw new InternalServerErrorException('Error clearing all banner events', error.message);
        }
    }

    // New method to delete a specific image by URL
    async deleteSpecificImage(imageUrl: string): Promise<{ message: string; data: BannerEvent }> {
        try {
            const [bannerEvent] = await this.bannerEventRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!bannerEvent) {
                throw new NotFoundException('No banner events found');
            }

            const updatedImageUrls = bannerEvent.imageUrls.filter(url => url !== imageUrl);
            
            if (updatedImageUrls.length === bannerEvent.imageUrls.length) {
                throw new NotFoundException('Image not found in banner events');
            }

            // Delete the specific file from upload folder
            await this.deleteFileFromFolder(imageUrl);

            bannerEvent.imageUrls = updatedImageUrls;
            const result = await this.bannerEventRepository.save(bannerEvent);
            
            return { message: 'Specific banner event image deleted successfully', data: result };
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error deleting specific banner event image', error.message);
        }
    }

    // Helper method to delete a single file from folder
    private async deleteFileFromFolder(imageUrl: string): Promise<void> {
        try {
            const filePath = path.join(process.cwd(), imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`File deleted: ${filePath}`);
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
        private permissionTemplateRepository: Repository<PermissionTemplate>
    ) { }

    // Create permission template (admin only)
    async createTemplate(templateData: CreatePermissionTemplateDto): Promise<{ message: string; data: PermissionTemplate }> {
        try {
            const newTemplate = this.permissionTemplateRepository.create({
                title: templateData.title,
                description: templateData.description,
                defaultEnabled: templateData.defaultEnabled ?? false
            });

            const result = await this.permissionTemplateRepository.save(newTemplate);
            return { message: 'Permission template created successfully', data: result };
        } catch (error: any) {
            console.log(error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error creating permission template', error.message);
        }
    }

    // Get all permission templates
    async getAllTemplates(): Promise<PermissionTemplate[]> {
        try {
            const templates = await this.permissionTemplateRepository.find({
                where: { isActive: true },
                order: { createdAt: 'ASC' }
            });
            return templates;
        } catch (error: any) {
            throw new InternalServerErrorException('Error retrieving permission templates', error.message);
        }
    }

    // Delete permission template
    async deleteTemplate(templateId: string): Promise<{ message: string }> {
        try {
            const result = await this.permissionTemplateRepository.delete({ id: templateId });
            
            if (result.affected === 0) {
                throw new NotFoundException('Permission template not found');
            }

            return { message: 'Permission template deleted successfully' };
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error deleting permission template', error.message);
        }
    }

    // Seed default permission templates
    async seedDefaultTemplates(): Promise<{ message: string; count: number }> {
        try {
            // Check if templates already exist
            const existingTemplates = await this.permissionTemplateRepository.count();
            if (existingTemplates > 0) {
                return { message: 'Default templates already exist', count: existingTemplates };
            }

            // Define the 6 default templates based on the image
            const defaultTemplates = [
                {
                    title: 'Biometric Sign in',
                    description: 'Use biometric authentication for secure and quick access to your account',
                    defaultEnabled: true
                },
                {
                    title: 'Event Notifications',
                    description: 'Get notified about important updates for your registered events—such as changes in time or location—and receive reminders to download event materials.',
                    defaultEnabled: false
                },
                {
                    title: 'Networking Notifications',
                    description: 'Be notified when other attendees reach out, receive messages from event chatrooms, and get reminders for your scheduled meet-ups.',
                    defaultEnabled: false
                },
                {
                    title: 'Contact',
                    description: 'Allow other attendees to contact you and share your contact information for networking opportunities.',
                    defaultEnabled: false
                },
                {
                    title: 'Email Address',
                    description: 'Share your email address with other attendees for direct communication and follow-ups.',
                    defaultEnabled: false
                },
                {
                    title: 'LinkedIn',
                    description: 'Share your LinkedIn profile with other attendees for professional networking and connections.',
                    defaultEnabled: false
                }
            ];

            // Create and save all templates
            const createdTemplates = [];
            for (const templateData of defaultTemplates) {
                const newTemplate = this.permissionTemplateRepository.create(templateData);
                const savedTemplate = await this.permissionTemplateRepository.save(newTemplate);
                createdTemplates.push(savedTemplate);
            }

            return { 
                message: 'Default permission templates created successfully', 
                count: createdTemplates.length 
            };
        } catch (error: any) {
            console.error('Error seeding default templates:', error);
            throw new InternalServerErrorException('Error creating default permission templates', error.message);
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
        private permissionTemplateRepository: Repository<PermissionTemplate>
    ) { }

    // Get user permissions with template info (shows defaults + user customizations)
    async getUserPermissionsWithTemplates(userId: string): Promise<UserPermissionWithTemplate[]> {
        try {
            // Get all active permission templates
            const templates = await this.permissionTemplateRepository.find({
                where: { isActive: true },
                order: { createdAt: 'ASC' }
            });

            // Get user's custom permissions
            const userPermissions = await this.userPermissionsRepository.find({
                where: { userId }
            });

            // Create a map of user permissions for quick lookup
            const userPermissionMap = new Map();
            userPermissions.forEach(up => {
                userPermissionMap.set(up.templateId, up.enabled);
            });

            // Combine templates with user customizations
            const result: UserPermissionWithTemplate[] = templates.map(template => {
                // Get user's custom setting, or use template default if not customized
                const userEnabled = userPermissionMap.get(template.id);
                const enabled = userEnabled !== undefined ? userEnabled : template.defaultEnabled;

                return {
                    id: template.id,
                    title: template.title,
                    description: template.description,
                    defaultEnabled: enabled  // This will be the user's actual setting (default or customized)
                };
            });

            return result;
        } catch (error: any) {
            throw new InternalServerErrorException('Error retrieving user permissions with templates', error.message);
        }
    }

    // Update user's specific permission
    async updateUserPermission(userId: string, templateId: string, permissionData: UpdateUserPermissionDto): Promise<{ message: string }> {
        try {
            // Check if permission template exists
            const template = await this.permissionTemplateRepository.findOne({
                where: { 
                    id: templateId,
                    isActive: true 
                }
            });

            if (!template) {
                throw new NotFoundException('Permission template not found');
            }

            // Check if user already has this permission customized
            let userPermission = await this.userPermissionsRepository.findOne({
                where: { 
                    userId: userId,
                    templateId: templateId 
                }
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
                    enabled: permissionData.enabled
                });
                await this.userPermissionsRepository.save(newUserPermission);
            }

            return { message: 'User permission updated successfully' };
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error updating user permission', error.message);
        }
    }

    // Reset user permission to default (delete user customization)
    async resetUserPermission(userId: string, templateId: string): Promise<{ message: string }> {
        try {
            const result = await this.userPermissionsRepository.delete({ 
                userId: userId,
                templateId: templateId 
            });
            
            if (result.affected === 0) {
                throw new NotFoundException('User permission not found');
            }

            return { message: 'User permission reset to default successfully' };
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error resetting user permission', error.message);
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
            throw new InternalServerErrorException('Error resetting all user permissions', error.message);
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
    private userPermissionsRepository: Repository<UserPermissions>
  ) {
    // Initialize Firebase using utility
    FirebaseUtil.initializeFirebase();
  }

  // Register device token for push notifications
  async registerDeviceToken(userId: string, deviceData: RegisterDeviceTokenDto): Promise<{ message: string }> {
    try {
      // Check if device token already exists for this user
      const existingToken = await this.pushNotificationRepository.findOne({
        where: { userId, deviceToken: deviceData.deviceToken }
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
          isActive: true
        });
        await this.pushNotificationRepository.save(newToken);
        return { message: 'Device token registered successfully' };
      }
    } catch (error: any) {
      throw new InternalServerErrorException('Error registering device token', error.message);
    }
  }

}