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
} from '@nestjs/common';
import {
  PrivacyPolicyService,
  TermsConditionsService,
  BannerService,
  BannerEventService,
} from './setting.service';
import {
  CreatePrivacyPolicyDto,
  CreateTermsConditionsDto,
  CreateBannerDto,
  CreateBannerEventDto,
} from './setting.dto';
import { PrivacyPolicy, TermsConditions, Banner, BannerEvent } from './setting.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

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

@Controller('api/banners')
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
    FilesInterceptor('images', 10, { // Allow up to 10 images
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
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ message: string; data: Banner }> {
    const imageUrls = files.map(file => `uploads/banners/${file.filename}`);
    const createBannerDto: CreateBannerDto = {
      imageUrls: imageUrls
    };
    return this.bannerService.createOrUpdate(createBannerDto);
  }

  // New API to clear all banners
  @Delete('clear-all')
  async clearAllBanners(): Promise<{ message: string }> {
    return this.bannerService.clearAllBanners();
  }

  // New API to delete specific image
  @Delete('delete-image')
  async deleteSpecificImage(@Body('imageUrl') imageUrl: string): Promise<{ message: string; data: Banner }> {
    return this.bannerService.deleteSpecificImage(imageUrl);
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
    FilesInterceptor('images', 10, { // Allow up to 10 images
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
  ): Promise<{ message: string; data: BannerEvent }> {
    const imageUrls = files.map(file => `uploads/banner-events/${file.filename}`);
    const createBannerEventDto: CreateBannerEventDto = {
      imageUrls: imageUrls
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
