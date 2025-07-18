import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PromotionalOffer } from './promotional-offer.entity';
import { CreatePromotionalOfferDto, UpdatePromotionalOfferDto } from './promotional-offer.dto';
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class PromotionalOfferService {
  constructor(
    @InjectRepository(PromotionalOffer)
    private promotionalOfferRepository: Repository<PromotionalOffer>,
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
  ) {}

  async createPromotionalOffer(createDto: CreatePromotionalOfferDto): Promise<PromotionalOffer> {
    // Check if exhibitor exists
    const exhibitor = await this.exhibitorRepository.findOne({
      where: { id: createDto.exhibitorId },
    });
    if (!exhibitor) {
      throw new NotFoundException('Exhibitor not found');
    }

    const promotionalOffer = this.promotionalOfferRepository.create(createDto);
    return await this.promotionalOfferRepository.save(promotionalOffer);
  }

  async getAllPromotionalOffers(): Promise<PromotionalOffer[]> {
    return await this.promotionalOfferRepository.find({
      relations: ['exhibitor'],
    });
  }

  async getPromotionalOfferById(id: string): Promise<PromotionalOffer> {
    const promotionalOffer = await this.promotionalOfferRepository.findOne({
      where: { id },
      relations: ['exhibitor'],
    });
    if (!promotionalOffer) {
      throw new NotFoundException('Promotional offer not found');
    }
    return promotionalOffer;
  }

  async getPromotionalOffersByExhibitor(exhibitorId: string): Promise<PromotionalOffer[]> {
    return await this.promotionalOfferRepository.find({
      where: { exhibitorId },
      relations: ['exhibitor'],
    });
  }

  async updatePromotionalOffer(id: string, updateDto: UpdatePromotionalOfferDto): Promise<PromotionalOffer> {
    const promotionalOffer = await this.getPromotionalOfferById(id);
    
    Object.assign(promotionalOffer, updateDto);
    return await this.promotionalOfferRepository.save(promotionalOffer);
  }

  async deletePromotionalOffer(id: string): Promise<void> {
    const promotionalOffer = await this.getPromotionalOfferById(id);
    
    // Delete image file if exists
    if (promotionalOffer.image) {
      const filePath = path.join(__dirname, '..', '..', promotionalOffer.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.promotionalOfferRepository.remove(promotionalOffer);
  }

  async togglePromotionalOfferStatus(id: string): Promise<PromotionalOffer> {
    const promotionalOffer = await this.getPromotionalOfferById(id);
    promotionalOffer.isActive = !promotionalOffer.isActive;
    return await this.promotionalOfferRepository.save(promotionalOffer);
  }
} 