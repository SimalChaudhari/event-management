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
  AppVersionSetting,
  Banner,
  BannerEvent,
  Logo,
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
  AppVersionResponseDto,
  CreateBannerDto,
  CreateBannerEventDto,
  CreateLogoDto,
  CreatePrivacyPolicyDto,
  CreateTermsConditionsDto,
  CreatePermissionTemplateDto,
  UpdateAppVersionDto,
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

const DEFAULT_ANDROID_VERSION =
  process.env.DEFAULT_APP_VERSION_ANDROID || '1.0.0';
const DEFAULT_IOS_VERSION =
  process.env.DEFAULT_APP_VERSION_IOS || '1.0.0';
const DEFAULT_FORCE_UPDATE =
  (process.env.DEFAULT_ENABLE_FORCE_UPDATE || 'false').toLowerCase() === 'true';

// App version

@Injectable()
export class AppVersionService {
  constructor(
    @InjectRepository(AppVersionSetting)
    private readonly appVersionRepository: Repository<AppVersionSetting>,
  ) {}

  private async getOrCreateSetting(): Promise<AppVersionSetting> {
    const existingSettings = await this.appVersionRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    let setting = existingSettings[0];

    if (!setting) {
      setting = this.appVersionRepository.create({
        appVersionAndroid: DEFAULT_ANDROID_VERSION,
        appVersionIOS: DEFAULT_IOS_VERSION,
        enableForceUpdate: DEFAULT_FORCE_UPDATE,
      });
      setting = await this.appVersionRepository.save(setting);
    }

    return setting;
  }

  private toResponse(setting: AppVersionSetting): AppVersionResponseDto {
    return {
      appVersionAndroid: setting.appVersionAndroid,
      appVersionIOS: setting.appVersionIOS,
      enableForceUpdate: setting.enableForceUpdate,
    };
  }

  async getLatestVersion(): Promise<AppVersionResponseDto> {
    try {
      const setting = await this.getOrCreateSetting();
      return this.toResponse(setting);
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving app version details',
        error.message,
      );
    }
  }

  async updateAppVersion(
    updateAppVersionDto: UpdateAppVersionDto,
  ): Promise<{ message: string; data: AppVersionResponseDto }> {
    try {
      const setting = await this.getOrCreateSetting();

      if (updateAppVersionDto.appVersionAndroid !== undefined) {
        setting.appVersionAndroid = updateAppVersionDto.appVersionAndroid;
      }

      if (updateAppVersionDto.appVersionIOS !== undefined) {
        setting.appVersionIOS = updateAppVersionDto.appVersionIOS;
      }

      if (updateAppVersionDto.enableForceUpdate !== undefined) {
        setting.enableForceUpdate = updateAppVersionDto.enableForceUpdate;
      }

      const savedSetting = await this.appVersionRepository.save(setting);

      return {
        message: 'App version updated successfully',
        data: this.toResponse(savedSetting),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating app version details',
        error.message,
      );
    }
  }
}

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

function normalizeBannerStorageUrl(url: string): string {
  return url.replace(/^.*\/uploads\//, 'uploads/');
}

function sequentialBannerOrder(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
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
        // Append new images and hyperlinks to existing ones
        const updatedImageUrls = [
          ...banner.imageUrls,
          ...createBannerDto.imageUrls,
        ];
        
        // Merge hyperlinks arrays - pad existing hyperlinks if needed
        let updatedHyperlinks: string[] = [];
        if (banner.hyperlinks && banner.hyperlinks.length > 0) {
          updatedHyperlinks = [...banner.hyperlinks];
        } else {
          // Initialize with empty strings if no existing hyperlinks
          updatedHyperlinks = new Array(banner.imageUrls.length).fill('');
        }
        
        // Add new hyperlinks
        if (createBannerDto.hyperlinks && createBannerDto.hyperlinks.length > 0) {
          updatedHyperlinks = [...updatedHyperlinks, ...createBannerDto.hyperlinks];
        } else {
          // If no hyperlinks provided for new images, add empty strings
          updatedHyperlinks = [
            ...updatedHyperlinks,
            ...new Array(createBannerDto.imageUrls.length).fill(''),
          ];
        }
        
        // Ensure hyperlinks array matches imageUrls length
        while (updatedHyperlinks.length < updatedImageUrls.length) {
          updatedHyperlinks.push('');
        }
        updatedHyperlinks = updatedHyperlinks.slice(0, updatedImageUrls.length);

        banner.imageUrls = updatedImageUrls;
        banner.hyperlinks = updatedHyperlinks;
        banner.bannerOrder = sequentialBannerOrder(updatedImageUrls.length);
        const result = await this.bannerRepository.save(banner);
        return { message: 'Banner added successfully', data: result };
      } else {
        // Create new banner if none exists
        // Ensure hyperlinks array matches imageUrls length
        let hyperlinksArray = createBannerDto.hyperlinks || [];
        if (hyperlinksArray.length < createBannerDto.imageUrls.length) {
          while (hyperlinksArray.length < createBannerDto.imageUrls.length) {
            hyperlinksArray.push('');
          }
        }
        hyperlinksArray = hyperlinksArray.slice(0, createBannerDto.imageUrls.length);

        const newBanner = this.bannerRepository.create({
          imageUrls: createBannerDto.imageUrls,
          hyperlinks: hyperlinksArray,
          bannerOrder: sequentialBannerOrder(createBannerDto.imageUrls.length),
        });
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

  async reorderImageUrls(
    orderedImageUrls: string[],
  ): Promise<{ message: string; data: Banner }> {
    try {
      if (!orderedImageUrls?.length) {
        throw new BadRequestException('imageUrls must be a non-empty array');
      }
      const [banner] = await this.bannerRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });
      if (!banner) {
        throw new NotFoundException('No banners found');
      }
      const oldUrls = [...banner.imageUrls];
      const normOld = oldUrls.map((u) => normalizeBannerStorageUrl(u));
      const normNew = orderedImageUrls.map((u) => normalizeBannerStorageUrl(u));
      if (normOld.length !== normNew.length) {
        throw new BadRequestException(
          'Ordered list must contain every current banner image exactly once',
        );
      }
      const a = [...normOld].sort();
      const b = [...normNew].sort();
      if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
        throw new BadRequestException(
          'Ordered list must match the current set of banner images',
        );
      }
      let oldHyperlinks = [...(banner.hyperlinks || [])];
      while (oldHyperlinks.length < oldUrls.length) {
        oldHyperlinks.push('');
      }
      oldHyperlinks = oldHyperlinks.slice(0, oldUrls.length);
      const urlToHyperlink = new Map<string, string>();
      oldUrls.forEach((url, i) => {
        urlToHyperlink.set(normalizeBannerStorageUrl(url), oldHyperlinks[i]);
      });
      banner.imageUrls = normNew.map((n) => {
        const idx = normOld.indexOf(n);
        if (idx === -1) {
          throw new BadRequestException('Invalid banner URL in order payload');
        }
        return oldUrls[idx];
      });
      banner.hyperlinks = banner.imageUrls.map(
        (url) => urlToHyperlink.get(normalizeBannerStorageUrl(url)) ?? '',
      );
      banner.bannerOrder = sequentialBannerOrder(banner.imageUrls.length);
      const result = await this.bannerRepository.save(banner);
      return { message: 'Banner order updated successfully', data: result };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error reordering banners',
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

      // Delete all files from upload folder
      await this.deleteFilesFromFolder(banner.imageUrls);

      // Clear the imageUrls array and hyperlinks array with empty values instead of null
      banner.imageUrls = [];
      banner.hyperlinks = [];
      banner.bannerOrder = [];
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
  async deleteBannerImage(imageUrl: string): Promise<{ message: string; data: Banner }> {
    try {
      const [banner] = await this.bannerRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!banner) {
        throw new NotFoundException('No banner found');
      }

      const imageIndex = banner.imageUrls.findIndex(
        (url) => url === imageUrl,
      );

      if (imageIndex === -1) {
        throw new NotFoundException('Image not found in banners');
      }

      // Delete the file from upload folder
      await this.deleteFileFromFolder(imageUrl);

      // Remove image and corresponding hyperlink
      banner.imageUrls.splice(imageIndex, 1);
      if (banner.hyperlinks && banner.hyperlinks.length > imageIndex) {
        banner.hyperlinks.splice(imageIndex, 1);
      }
      banner.bannerOrder = sequentialBannerOrder(banner.imageUrls.length);
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

  // New method to update hyperlink for a specific banner
  async updateHyperlink(
    imageUrl: string,
    hyperlink: string,
  ): Promise<{ message: string; data: Banner }> {
    try {
      if (!imageUrl) {
        throw new BadRequestException('Image URL is required');
      }

      const [banner] = await this.bannerRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!banner) {
        throw new NotFoundException('No banners found');
      }

      // Normalize imageUrl - remove any API URL prefix if present
      const normalizedImageUrl = imageUrl.replace(/^.*\/uploads\//, 'uploads/');
      
      const imageIndex = banner.imageUrls.findIndex(
        (url) => {
          // Compare normalized URLs
          const normalizedUrl = url.replace(/^.*\/uploads\//, 'uploads/');
          return normalizedUrl === normalizedImageUrl || url === imageUrl;
        },
      );

      if (imageIndex === -1) {
        throw new NotFoundException(`Image not found in banners. Looking for: ${normalizedImageUrl}`);
      }

      // Initialize hyperlinks array if it doesn't exist or is too short
      if (!banner.hyperlinks) {
        banner.hyperlinks = new Array(banner.imageUrls.length).fill('');
      }
      while (banner.hyperlinks.length < banner.imageUrls.length) {
        banner.hyperlinks.push('');
      }

      // Update the hyperlink at the specific index
      banner.hyperlinks[imageIndex] = hyperlink || '';
      const result = await this.bannerRepository.save(banner);

      return {
        message: 'Banner hyperlink updated successfully',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        console.error('Error updating banner hyperlink:', error);
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating banner hyperlink',
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
        const updatedImageUrls = [
          ...bannerEvent.imageUrls,
          ...createBannerEventDto.imageUrls,
        ];
        
        let updatedHyperlinks: string[] = [];
        if (bannerEvent.hyperlinks && bannerEvent.hyperlinks.length > 0) {
          updatedHyperlinks = [...bannerEvent.hyperlinks];
        } else {
          updatedHyperlinks = new Array(bannerEvent.imageUrls.length).fill('');
        }
        
        if (createBannerEventDto.hyperlinks && createBannerEventDto.hyperlinks.length > 0) {
          updatedHyperlinks = [...updatedHyperlinks, ...createBannerEventDto.hyperlinks];
        } else {
          updatedHyperlinks = [
            ...updatedHyperlinks,
            ...new Array(createBannerEventDto.imageUrls.length).fill(''),
          ];
        }
        
        while (updatedHyperlinks.length < updatedImageUrls.length) {
          updatedHyperlinks.push('');
        }
        updatedHyperlinks = updatedHyperlinks.slice(0, updatedImageUrls.length);

        bannerEvent.imageUrls = updatedImageUrls;
        bannerEvent.hyperlinks = updatedHyperlinks;
        bannerEvent.bannerOrder = sequentialBannerOrder(updatedImageUrls.length);
        const result = await this.bannerEventRepository.save(bannerEvent);
        return { message: 'Banner events added successfully', data: result };
      } else {
        let hyperlinksArray = createBannerEventDto.hyperlinks || [];
        if (hyperlinksArray.length < createBannerEventDto.imageUrls.length) {
          while (hyperlinksArray.length < createBannerEventDto.imageUrls.length) {
            hyperlinksArray.push('');
          }
        }
        hyperlinksArray = hyperlinksArray.slice(0, createBannerEventDto.imageUrls.length);

        const newBannerEvent = this.bannerEventRepository.create({
          imageUrls: createBannerEventDto.imageUrls,
          hyperlinks: hyperlinksArray,
          bannerOrder: sequentialBannerOrder(
            createBannerEventDto.imageUrls.length,
          ),
        });
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

  async reorderImageUrls(
    orderedImageUrls: string[],
  ): Promise<{ message: string; data: BannerEvent }> {
    try {
      if (!orderedImageUrls?.length) {
        throw new BadRequestException('imageUrls must be a non-empty array');
      }
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });
      if (!bannerEvent) {
        throw new NotFoundException('No banner events found');
      }
      const oldUrls = [...bannerEvent.imageUrls];
      const normOld = oldUrls.map((u) => normalizeBannerStorageUrl(u));
      const normNew = orderedImageUrls.map((u) => normalizeBannerStorageUrl(u));
      if (normOld.length !== normNew.length) {
        throw new BadRequestException(
          'Ordered list must contain every current banner image exactly once',
        );
      }
      const a = [...normOld].sort();
      const b = [...normNew].sort();
      if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
        throw new BadRequestException(
          'Ordered list must match the current set of banner images',
        );
      }
      let oldHyperlinks = [...(bannerEvent.hyperlinks || [])];
      while (oldHyperlinks.length < oldUrls.length) {
        oldHyperlinks.push('');
      }
      oldHyperlinks = oldHyperlinks.slice(0, oldUrls.length);
      const urlToHyperlink = new Map<string, string>();
      oldUrls.forEach((url, i) => {
        urlToHyperlink.set(normalizeBannerStorageUrl(url), oldHyperlinks[i]);
      });
      bannerEvent.imageUrls = normNew.map((n) => {
        const idx = normOld.indexOf(n);
        if (idx === -1) {
          throw new BadRequestException('Invalid banner URL in order payload');
        }
        return oldUrls[idx];
      });
      bannerEvent.hyperlinks = bannerEvent.imageUrls.map(
        (url) => urlToHyperlink.get(normalizeBannerStorageUrl(url)) ?? '',
      );
      bannerEvent.bannerOrder = sequentialBannerOrder(
        bannerEvent.imageUrls.length,
      );
      const result = await this.bannerEventRepository.save(bannerEvent);
      return { message: 'Banner order updated successfully', data: result };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error reordering banner events',
        error.message,
      );
    }
  }

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

      const imageIndex = bannerEvent.imageUrls.findIndex(
        (url) => url === imageUrl,
      );

      if (imageIndex === -1) {
        throw new NotFoundException('Image not found in banner events');
      }

      await this.deleteFileFromFolder(imageUrl);

      bannerEvent.imageUrls.splice(imageIndex, 1);
      if (bannerEvent.hyperlinks && bannerEvent.hyperlinks.length > imageIndex) {
        bannerEvent.hyperlinks.splice(imageIndex, 1);
      }
      bannerEvent.bannerOrder = sequentialBannerOrder(
        bannerEvent.imageUrls.length,
      );
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

  async updateHyperlink(
    imageUrl: string,
    hyperlink: string,
  ): Promise<{ message: string; data: BannerEvent }> {
    try {
      if (!imageUrl) {
        throw new BadRequestException('Image URL is required');
      }

      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!bannerEvent) {
        throw new NotFoundException('No banner events found');
      }

      const normalizedImageUrl = imageUrl.replace(/^.*\/uploads\//, 'uploads/');
      
      const imageIndex = bannerEvent.imageUrls.findIndex(
        (url) => {
          const normalizedUrl = url.replace(/^.*\/uploads\//, 'uploads/');
          return normalizedUrl === normalizedImageUrl || url === imageUrl;
        },
      );

      if (imageIndex === -1) {
        throw new NotFoundException(`Image not found in banner events. Looking for: ${normalizedImageUrl}`);
      }

      if (!bannerEvent.hyperlinks) {
        bannerEvent.hyperlinks = new Array(bannerEvent.imageUrls.length).fill('');
      }
      while (bannerEvent.hyperlinks.length < bannerEvent.imageUrls.length) {
        bannerEvent.hyperlinks.push('');
      }

      bannerEvent.hyperlinks[imageIndex] = hyperlink || '';
      const result = await this.bannerEventRepository.save(bannerEvent);

      return {
        message: 'Banner hyperlink updated successfully',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        console.error('Error updating banner hyperlink:', error);
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating banner hyperlink',
        error.message,
      );
    }
  }

  async clearAllBannerEvents(): Promise<{ message: string }> {
    try {
      const [bannerEvent] = await this.bannerEventRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!bannerEvent) {
        throw new NotFoundException('No banner events found');
      }

      await this.deleteFilesFromFolder(bannerEvent.imageUrls);

      bannerEvent.imageUrls = [];
      bannerEvent.hyperlinks = [];
      bannerEvent.bannerOrder = [];
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


// Logo Service

@Injectable()
export class LogoService {
  constructor(
    @InjectRepository(Logo)
    private logoRepository: Repository<Logo>,
  ) {}

  async getOrShow(): Promise<Logo | { message: string }> {
    try {
      const [logo] = await this.logoRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!logo) {
        return { message: 'No logo found' };
      }
      return logo;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error retrieving logo',
        error.message,
      );
    }
  }

  async createOrUpdate(
    createLogoDto: CreateLogoDto,
  ): Promise<{ message: string; data: Logo }> {
    try {
      const [logo] = await this.logoRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (logo) {
        // Delete previous file from upload folder
        await this.deleteFileFromFolder(logo.imageUrl);

        // Update existing logo
        const updatedLogo = this.logoRepository.merge(
          logo,
          createLogoDto,
        );
        const result = await this.logoRepository.save(updatedLogo);
        return { message: 'Logo updated successfully', data: result };
      } else {
        // Create new logo if none exists
        const newLogo = this.logoRepository.create(createLogoDto);
        const result = await this.logoRepository.save(newLogo);
        return { message: 'Logo created successfully', data: result };
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error creating or updating logo',
        error.message,
      );
    }
  }

  // Method to clear logo
  async clearLogo(): Promise<{ message: string }> {
    try {
      const [logo] = await this.logoRepository.find({
        take: 1,
        order: { id: 'ASC' },
      });

      if (!logo) {
        throw new NotFoundException('No logo found');
      }

      // Delete file from upload folder
      await this.deleteFileFromFolder(logo.imageUrl);

      // Clear the imageUrl and hyperlink with empty strings instead of null
      logo.imageUrl = '';
      logo.hyperlink = '';
      await this.logoRepository.save(logo);

      return { message: 'Logo cleared successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error clearing logo',
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
      // When clientId is provided (e.g. web), treat each browser as a separate device so Edge and Firefox don't overwrite each other
      if (deviceData.clientId) {
        const existingByClient = await this.pushNotificationRepository.findOne({
          where: { userId, clientId: deviceData.clientId },
        });
        if (existingByClient) {
          existingByClient.deviceToken = deviceData.deviceToken;
          existingByClient.platform = deviceData.platform || 'web';
          existingByClient.isActive = true;
          await this.pushNotificationRepository.save(existingByClient);
          return { message: 'Device token updated successfully' };
        }
        const newToken = this.pushNotificationRepository.create({
          userId,
          deviceToken: deviceData.deviceToken,
          platform: deviceData.platform || 'web',
          clientId: deviceData.clientId,
          isActive: true,
        });
        await this.pushNotificationRepository.save(newToken);
        return { message: 'Device token registered successfully' };
      }

      // Legacy: key by (userId, deviceToken) so same token from same user updates one row
                    const existingToken = await this.pushNotificationRepository.findOne({
        where: { userId, deviceToken: deviceData.deviceToken },
      });

      if (existingToken) {
        existingToken.platform = deviceData.platform || 'android';
        existingToken.isActive = true;
        await this.pushNotificationRepository.save(existingToken);
        return { message: 'Device token updated successfully' };
      }
      const newToken = this.pushNotificationRepository.create({
        userId,
        deviceToken: deviceData.deviceToken,
        platform: deviceData.platform || 'android',
        isActive: true,
      });
      await this.pushNotificationRepository.save(newToken);
      return { message: 'Device token registered successfully' };
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Get all device tokens for current user
  async getMyDeviceTokens(
    userId: string,
  ): Promise<{ deviceToken: string; platform: string }[]> {
    try {
      const tokens = await this.pushNotificationRepository.find({
        where: { userId },
        select: ['deviceToken', 'platform'],
      });

      return tokens
        .filter((t) => t.deviceToken != null && String(t.deviceToken).trim() !== '')
        .map((t) => ({
          deviceToken: t.deviceToken,
          platform: t.platform,
        }));
    } catch (error: any) {
      ErrorHandlerUtil.handleError(error);
    }
  }

  // Remove all device tokens for the user (e.g. on logout)
  async cleanupMyTokens(userId: string): Promise<{ message: string; deleted: number }> {
    try {
      const tokens = await this.pushNotificationRepository.find({
        where: { userId },
      });

      if (!tokens.length) {
        return { message: 'No tokens to cleanup', deleted: 0 };
      }

      await this.pushNotificationRepository.remove(tokens);

      return {
        message: 'All device tokens removed successfully',
        deleted: tokens.length,
      };
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
      const pageRaw = Number(filters.page);
      const limitRaw = Number(filters.limit);
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 20;
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
      usersWithDeviceTokens: number;
      pushNotificationsSent: number;
      socketNotificationsSent: number;
      pendingUsers: number;
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

      // Get all users for notifications
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

      // Get users with device tokens for push notifications
      const usersWithDeviceTokens = await this.pushNotificationRepository.find({
        where: { isActive: true },
      });

      const userIdsWithTokens = [...new Set(usersWithDeviceTokens.map(pn => pn.userId))];
      const eligibleUsersWithTokens = eligibleUsers.filter(user => 
        userIdsWithTokens.includes(user.user_id)
      );
      const eligibleUsersWithoutTokens = eligibleUsers.filter(user => 
        !userIdsWithTokens.includes(user.user_id)
      );

      let sentCount = 0;
      let pendingCount = 0;

      // Send push notifications to users with device tokens
      if (eligibleUsersWithTokens.length > 0) {
        try {
          const pushUserIds = eligibleUsersWithTokens.map(user => user.user_id);
          const pushResult = await this.notificationUtil.sendAdvertNotification({
            id: advert.id,
            title: advert.title,
            content: advert.content,
            imageUrl: advert.imageUrl,
            actionUrl: advert.actionUrl,
            actionText: advert.actionText,
            userIds: pushUserIds
          });
          sentCount += pushResult.sentCount;
        } catch (pushError) {
          // Silent fail for push notifications
        }
      }

      // Send socket notifications to ALL eligible users (with and without device tokens)
      for (const user of eligibleUsers) {
        try {
          this.sendSocketNotificationToUser(user.user_id, {
            id: advert.id,
            title: advert.title,
            content: advert.content,
            imageUrl: advert.imageUrl,
            actionUrl: advert.actionUrl,
            actionText: advert.actionText,
            type: 'advert',
            createdAt: new Date()
          });
        } catch (socketError) {
          // Silent fail for socket notifications
        }
      }

      // Count users without device tokens as pending
      pendingCount = eligibleUsersWithoutTokens.length;

      // Create read records for tracking (only for users who received notifications)
      for (const user of eligibleUsers) {
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
        message: `Push notifications sent to ${sentCount} users with device tokens. Socket notifications sent to ${eligibleUsers.length} users. ${pendingCount} users pending (no device tokens).`,
        sentCount,
        statistics: {
          totalUsers: users.length,
          eligibleUsers: eligibleUsers.length,
          usersWithDeviceTokens: eligibleUsersWithTokens.length,
          pushNotificationsSent: sentCount,
          socketNotificationsSent: eligibleUsers.length,
          pendingUsers: pendingCount,
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

  // Helper method to send push notification to user (dedupe by token so same token from multiple rows sends once)
  private async sendPushNotificationToUser(userId: string, notification: any): Promise<void> {
    try {
      const deviceTokens = await this.pushNotificationRepository.find({
        where: { userId, isActive: true },
      });

      if (deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId} - notification will not be sent`);
        return;
      }

      const seen = new Set<string>();
      for (const row of deviceTokens) {
        const token = row.deviceToken?.trim();
        if (!token || seen.has(token)) continue;
        seen.add(token);
        await FirebaseUtil.sendPushNotification(row.deviceToken, notification, row.platform);
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
