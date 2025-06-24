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

    async getOrShow(): Promise<TermsConditions | null> {
        try {
            // Use `find` with `take: 1` to get the first Terms and Conditions entry
            const [privacyPolicy] = await this.privacyPolicyRepository.find({
                take: 1,
                order: { id: 'ASC' } // Adjust ordering if necessary
            });

            return privacyPolicy || null; // Return null if no entry is found
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

    async getOrShow(): Promise<TermsConditions | null> {
        try {
            // Use `find` with `take: 1` to get the first Terms and Conditions entry
            const [termsConditions] = await this.termsConditionsRepository.find({
                take: 1,
                order: { id: 'ASC' } // Adjust ordering if necessary
            });

            return termsConditions || null; // Return null if no entry is found
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

    async getOrShow(): Promise<Banner | null> {
        try {
            const [banner] = await this.bannerRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            return banner || null;
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
                // Delete previous files from upload folder
                await this.deleteFilesFromFolder(banner.imageUrls);
                
                // Update existing banner
                const updatedBanner = this.bannerRepository.merge(banner, createBannerDto);
                const result = await this.bannerRepository.save(updatedBanner);
                return { message: 'Banners updated successfully', data: result };
            } else {
                // Create new banner if none exists
                const newBanner = this.bannerRepository.create(createBannerDto);
                const result = await this.bannerRepository.save(newBanner);
                return { message: 'Banners created successfully', data: result };
            }
        } catch (error: any) {
            throw new InternalServerErrorException('Error creating or updating banners', error.message);
        }
    }

    async deleteImage(imageUrl: string): Promise<{ message: string; data: Banner }> {
        try {
            const [banner] = await this.bannerRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!banner) {
                throw new NotFoundException('No banners found');
            }

            const updatedImageUrls = banner.imageUrls.filter(url => url !== imageUrl);
            
            if (updatedImageUrls.length === banner.imageUrls.length) {
                throw new NotFoundException('Image not found in banners');
            }

            // Delete the specific file from upload folder
            await this.deleteFileFromFolder(imageUrl);

            banner.imageUrls = updatedImageUrls;
            const result = await this.bannerRepository.save(banner);
            
            return { message: 'Banner image deleted successfully', data: result };
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error deleting banner image', error.message);
        }
    }

    async deleteImageByIndex(index: number): Promise<{ message: string; data: Banner }> {
        try {
            const [banner] = await this.bannerRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            if (!banner) {
                throw new NotFoundException('No banners found');
            }

            if (index < 0 || index >= banner.imageUrls.length) {
                throw new BadRequestException('Invalid image index');
            }

            // Get the image URL to delete from folder
            const imageUrlToDelete = banner.imageUrls[index];

            // Remove the image at the specified index
            banner.imageUrls.splice(index, 1);
            const result = await this.bannerRepository.save(banner);

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

// Banner Event

@Injectable()
export class BannerEventService {
    constructor(
        @InjectRepository(BannerEvent)
        private bannerEventRepository: Repository<BannerEvent>
    ) { }

    async getOrShow(): Promise<BannerEvent | null> {
        try {
            const [bannerEvent] = await this.bannerEventRepository.find({
                take: 1,
                order: { id: 'ASC' }
            });

            return bannerEvent || null;
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

    async deleteImage(imageUrl: string): Promise<{ message: string; data: Banner }> {
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

    async deleteImageByIndex(index: number): Promise<{ message: string; data: Banner }> {
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