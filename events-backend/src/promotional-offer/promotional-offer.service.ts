import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
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

  async createPromotionalOffer(
    createDto: CreatePromotionalOfferDto,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<PromotionalOffer> {
    let exhibitorId: string;

    // Try to get exhibitor ID from booth ID first
    const { EventBooth } = await import('../event/event-booth.entity');
    const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);

    const eventBooth = await eventBoothRepository.findOne({
      where: { id: createDto.exhibitorBoothId },
      relations: ['exhibitor'],
    });

    if (eventBooth) {
      // If booth found, use exhibitor ID from booth
      exhibitorId = eventBooth.exhibitorId;
    } else {
      // If booth not found, treat exhibitorBoothId as exhibitor ID directly
      // (since it might be the actual company/exhibitor ID)
      exhibitorId = createDto.exhibitorBoothId;
    }

    // Check if exhibitor exists
    const exhibitor = await this.exhibitorRepository.findOne({
      where: { id: exhibitorId },
    });
    if (!exhibitor) {
      throw new NotFoundException('Exhibitor not found');
    }

    // If user is Exhibitor (not Admin), verify they can create offers for this exhibitor
    if (userRole === 'exhibitor' && userId) {
      await this.verifyUserCanManageExhibitor(exhibitorId, userId, userEmail);
    }

    // Create promotional offer with exhibitorId
    const promotionalOfferData = {
      ...createDto,
      exhibitorId: exhibitorId,
    };
    // Remove exhibitorBoothId as it's not a field in the entity
    delete (promotionalOfferData as any).exhibitorBoothId;

    const promotionalOffer = this.promotionalOfferRepository.create(promotionalOfferData);
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

  async updatePromotionalOffer(
    id: string,
    updateDto: UpdatePromotionalOfferDto,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<PromotionalOffer> {
    const promotionalOffer = await this.getPromotionalOfferById(id);

    // If user is Exhibitor (not Admin), verify they can update this offer
    if (userRole === 'exhibitor' && userId) {
      await this.verifyUserCanManageExhibitor(promotionalOffer.exhibitorId, userId, userEmail);
    }

    // Handle exhibitorBoothId if provided (convert to exhibitorId)
    if (updateDto.exhibitorBoothId) {
      let newExhibitorId: string;

      // Try to get exhibitor ID from booth ID first
      const { EventBooth } = await import('../event/event-booth.entity');
      const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);

      const eventBooth = await eventBoothRepository.findOne({
        where: { id: updateDto.exhibitorBoothId },
        relations: ['exhibitor'],
      });

      if (eventBooth) {
        // If booth found, use exhibitor ID from booth
        newExhibitorId = eventBooth.exhibitorId;
      } else {
        // If booth not found, treat exhibitorBoothId as exhibitor ID directly
        newExhibitorId = updateDto.exhibitorBoothId;
      }

      // Verify the new exhibitor exists
      const newExhibitor = await this.exhibitorRepository.findOne({
        where: { id: newExhibitorId },
      });

      if (!newExhibitor) {
        throw new NotFoundException('Exhibitor not found');
      }

      // If user is Exhibitor (not Admin), verify they can update to this exhibitor
      if (userRole === 'exhibitor' && userId) {
        await this.verifyUserCanManageExhibitor(newExhibitorId, userId, userEmail);
      }

      // Set the new exhibitorId
      (updateDto as any).exhibitorId = newExhibitorId;
    }

    // Remove exhibitorBoothId as it's not a field in the entity
    delete (updateDto as any).exhibitorBoothId;
    
    Object.assign(promotionalOffer, updateDto);
    return await this.promotionalOfferRepository.save(promotionalOffer);
  }

  async deletePromotionalOffer(
    id: string,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<void> {
    const promotionalOffer = await this.getPromotionalOfferById(id);

    // If user is Exhibitor (not Admin), verify they can delete this offer
    if (userRole === 'exhibitor' && userId) {
      await this.verifyUserCanManageExhibitor(promotionalOffer.exhibitorId, userId, userEmail);
    }
    
    // Delete image file if exists
    if (promotionalOffer.image) {
      const filePath = path.join(__dirname, '..', '..', promotionalOffer.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.promotionalOfferRepository.remove(promotionalOffer);
  }

  async togglePromotionalOfferStatus(
    id: string,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<PromotionalOffer> {
    const promotionalOffer = await this.getPromotionalOfferById(id);

    // If user is Exhibitor (not Admin), verify they can toggle status for this offer
    if (userRole === 'exhibitor' && userId) {
      await this.verifyUserCanManageExhibitor(promotionalOffer.exhibitorId, userId, userEmail);
    }

    promotionalOffer.isActive = !promotionalOffer.isActive;
    return await this.promotionalOfferRepository.save(promotionalOffer);
  }

  /**
   * Verify that a user can manage promotional offers for a specific exhibitor
   * @param exhibitorId The exhibitor ID to check
   * @param userId The user ID requesting access
   * @param userEmail The user's email address
   * @throws ForbiddenException if user cannot manage this exhibitor
   */
  private async verifyUserCanManageExhibitor(
    exhibitorId: string,
    userId: string,
    userEmail?: string,
  ): Promise<void> {
    const exhibitor = await this.exhibitorRepository.findOne({
      where: { id: exhibitorId },
    });

    if (!exhibitor) {
      throw new NotFoundException('Exhibitor not found');
    }

    let userCanManage = false;

    // Check if exhibitor email matches user email
    if (userEmail && exhibitor.email === userEmail) {
      userCanManage = true;
    }

    // If not found by email, check via EventStaff table
    if (!userCanManage && userId) {
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      const userStaffRecord = await eventStaffRepository.findOne({
        where: {
          exhibitorId: exhibitorId,
          userId: userId,
        },
      });

      if (userStaffRecord) {
        userCanManage = true;
      }
    }

    // If user cannot manage this exhibitor, throw forbidden error
    if (!userCanManage) {
      throw new ForbiddenException(
        'You do not have permission to manage promotional offers for this exhibitor. You can only manage offers for your own exhibitor.',
      );
    }
  }
} 