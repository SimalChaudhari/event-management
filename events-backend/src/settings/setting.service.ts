// src/faq/faq.service.ts

import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {  Banner, BannerEvent, PrivacyPolicy, TermsConditions } from './setting.entity';
import { CreateBannerDto, CreateBannerEventDto, CreatePrivacyPolicyDto, CreateTermsConditionsDto,} from './setting.dto';
import * as fs from 'fs';
import * as path from 'path';

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